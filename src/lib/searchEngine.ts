/**
 * Hybrid search engine with fuzzy matching, symptom/condition expansion,
 * and typo tolerance.
 *
 * Pipeline:
 *  1. Normalize the raw query (lowercase, strip punctuation)
 *  2. Extract zip codes
 *  3. Expand synonyms, typos, and symptom→category mappings
 *  4. Fuzzy token-match against resource corpus with tiered scoring:
 *     exact name > symptom/category > specialty/service > location > corpus
 *  5. Apply boolean attribute filters
 *
 * Fuzzy matching uses Levenshtein distance + trigram similarity (see fuzzy.ts)
 * so the search tolerates typos, variant spellings, and different word forms.
 */

import { isOpenNow } from './format';
import type { ResourceWithCategory } from './supabase';
import {
  fuzzyMatch, bestFuzzyMatch, stem, stemTokens,
  similarity, fuzzyScore,
} from './fuzzy';

// ─── Zip extraction ───────────────────────────────────────────────────────────

/** Extract a 5-digit US zip code from an arbitrary query string. */
export function extractZip(query: string): string | null {
  const m = query.match(/\b(\d{5})\b/);
  return m ? m[1] : null;
}

// ─── Filters interface ────────────────────────────────────────────────────────

export interface HybridFilters {
  zip?: string;
  text?: string;
  categorySlug?: string;
  city?: string;
  county?: string;
  acceptsMedicaid?: boolean;
  medicare?: boolean;
  acceptsUninsured?: boolean;
  slidingScale?: boolean;
  freeOptions?: boolean;
  free?: boolean;
  telehealth?: boolean;
  walkIns?: boolean;
  appointmentsAvailable?: boolean;
  openNow?: boolean;
  wheelchairAccessible?: boolean;
  language?: string;
}

// ─── Normalization ────────────────────────────────────────────────────────────

/** Lowercase, strip punctuation, collapse whitespace. */
export function normalizeQuery(s: string): string {
  return s
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Token helpers ────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'in', 'at', 'for', 'the', 'and', 'or', 'near', 'a', 'an', 'is', 'my',
  'with', 'of', 'to', 'do', 'have', 'i', 'me', 'need', 'help', 'find',
  'get', 'looking', 'want', 'see', 'who', 'can', 'where', 'that', 'this',
  'im', 'ive', 'got', 'some', 'any', 'all', 'but', 'not', 'about',
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function isSignificant(token: string): boolean {
  return token.length >= 2 && !STOP_WORDS.has(token);
}

// ─── Typo dictionary ──────────────────────────────────────────────────────────
// Common misspellings → canonical term. Applied BEFORE synonym expansion so
// that the synonym dictionary only needs to handle the canonical forms.

const TYPOS: Record<string, string> = {
  // Dental
  'dentis': 'dentist', 'dentits': 'dentist', 'dentsit': 'dentist',
  'dentalcare': 'dental', 'teethh': 'teeth', 'toothh': 'tooth',
  'toothach': 'toothache', 'toothake': 'toothache', 'tooth ache': 'toothache',
  'cavitie': 'cavity', 'cavities': 'cavity', 'caviti': 'cavity',
  'orthodontic': 'orthodontics', 'orthodonthic': 'orthodontics',
  'braces': 'braces', 'brace': 'braces',
  // Mental health
  'anxity': 'anxiety', 'anxieties': 'anxiety', 'anxiey': 'anxiety',
  'deppression': 'depression', 'depreession': 'depression', 'depressin': 'depression',
  'depresion': 'depression', 'depressedd': 'depressed', 'depress': 'depression',
  'phsychiatrist': 'psychiatrist', 'psyciatrist': 'psychiatrist',
  'psycologist': 'psychologist', 'pschologist': 'psychologist',
  'therpist': 'therapist', 'therapis': 'therapist', 'therapst': 'therapist',
  'counceling': 'counseling', 'counselling': 'counseling', 'couseling': 'counseling',
  'counselor': 'counseling', 'counseling': 'counseling',
  'therapy': 'therapy', 'therapi': 'therapy',
  'ptsd': 'ptsd', 'posttraumatic': 'ptsd',
  'adhdd': 'adhd', 'addh': 'adhd', 'add': 'adhd',
  'ocdd': 'ocd',
  'bipola': 'bipolar', 'bipolarr': 'bipolar',
  'panick': 'panic', 'panik': 'panic',
  // Substance use
  'addicition': 'addiction', 'adiction': 'addiction', 'addict': 'addiction',
  'rehab': 'rehab', 'rehabilitation': 'rehab',
  'alcoholism': 'alcoholism', 'alcholism': 'alcoholism', 'alcohol': 'alcoholism',
  'alcoholic': 'alcoholism', 'alchohol': 'alcoholism',
  'sober': 'sober', 'sobor': 'sober',
  'narcan': 'narcan', 'narcann': 'narcan', 'naloxon': 'naloxone',
  'opioid': 'opioid', 'opiod': 'opioid', 'opiate': 'opioid',
  'overdose': 'overdose', 'overdoes': 'overdose', 'overdos': 'overdose',
  // Cardiac
  'cardiac': 'cardiac', 'cardic': 'cardiac', 'cardialogy': 'cardiology',
  'cardiolog': 'cardiology', 'heartattack': 'heart attack',
  'heartatack': 'heart attack', 'hartattack': 'heart attack',
  'chestpain': 'chest pain', 'chestpane': 'chest pain',
  'palpitation': 'palpitations', 'palpitationn': 'palpitations',
  // Respiratory
  'asthma': 'asthma', 'astma': 'asthma', 'asthmaa': 'asthma',
  'respiratory': 'respiratory', 'respiratry': 'respiratory',
  'pulmonary': 'pulmonary', 'pulmonry': 'pulmonary',
  'wheezing': 'wheezing', 'whezing': 'wheezing', 'weezing': 'wheezing',
  'breathing': 'breathing', 'brethless': 'shortness of breath',
  'breathless': 'shortness of breath', 'breathlessness': 'shortness of breath',
  'shortofbreath': 'shortness of breath',
  // Skin
  'dermatology': 'dermatology', 'dermatolgy': 'dermatology',
  'dermatologist': 'dermatology', 'dermotology': 'dermatology',
  'eczema': 'eczema', 'exema': 'eczema', 'excema': 'eczema',
  'rash': 'rash', 'rashh': 'rash',
  // Vision
  'ophthalmology': 'ophthalmology', 'opthalmology': 'ophthalmology',
  'optometry': 'optometry', 'optomitry': 'optometry',
  'optometrist': 'optometry', 'optomitrist': 'optometry',
  // Pregnancy / women's health
  'pregnancy': 'pregnancy', 'pregnacy': 'pregnancy', 'preganancy': 'pregnancy',
  'pregnant': 'pregnant', 'pregnan': 'pregnant', 'pregnent': 'pregnant',
  'prenatal': 'prenatal', 'prenatel': 'prenatal',
  'obstetrics': 'obstetrics', 'obstetric': 'obstetrics', 'obgyn': 'obstetrics',
  'mammogram': 'mammogram', 'mammogramm': 'mammogram', 'mamogram': 'mammogram',
  'contraception': 'contraception', 'contracept': 'contraception',
  // Children
  'pediatric': 'pediatric', 'pediatrics': 'pediatric', 'pediatrc': 'pediatric',
  'pediatryc': 'pediatric', 'pediatirc': 'pediatric', 'ped': 'pediatric',
  // General / primary care
  'doctor': 'doctor', 'docter': 'doctor', 'doctr': 'doctor',
  'physician': 'physician', 'physician': 'physician', 'physcian': 'physician',
  'clinic': 'clinic', 'clinik': 'clinic', 'clinc': 'clinic',
  'checkup': 'checkup', 'checkupp': 'checkup',
  'vaccination': 'vaccination', 'vaccinaton': 'vaccination',
  'vaccine': 'vaccine', 'vaccinne': 'vaccine', 'vaccene': 'vaccine',
  'immunization': 'vaccination', 'immunizaton': 'vaccination',
  // Pharmacy
  'pharmacy': 'pharmacy', 'pharmcy': 'pharmacy', 'pharmacy': 'pharmacy',
  'pharmacist': 'pharmacy', 'pharmacists': 'pharmacy',
  'prescription': 'prescription', 'prescripton': 'prescription',
  'perscription': 'prescription', 'presription': 'prescription',
  'medication': 'medication', 'medicaton': 'medication',
  'medecine': 'medicine', 'medicin': 'medicine',
  // Legal
  'lawyer': 'lawyer', 'lawer': 'lawyer', 'lawyerr': 'lawyer',
  'attorney': 'attorney', 'atorney': 'attorney', 'atty': 'attorney',
  // Housing
  'homeless': 'homeless', 'homless': 'homeless', 'homeles': 'homeless',
  'shelter': 'shelter', 'sheltar': 'shelter',
  'eviction': 'eviction', 'evict': 'eviction', 'evicton': 'eviction',
  // Insurance
  'medicaid': 'medicaid', 'medicade': 'medicaid', 'medicad': 'medicaid',
  'medicare': 'medicare', 'medicar': 'medicare', 'medicre': 'medicare',
  // Crisis
  'suicide': 'suicide', 'suiced': 'suicide', 'suicde': 'suicide',
  'suicidal': 'suicidal', 'suicedal': 'suicidal',
  'crisis': 'crisis', 'crissis': 'crisis', 'crises': 'crisis',
  'emergency': 'emergency', 'emergancy': 'emergency', 'emergeny': 'emergency',
  'urgent': 'urgent', 'urgnt': 'urgent', 'urgentcare': 'urgent care',
  // Food
  'foodbank': 'food bank', 'foodstamps': 'food stamps', 'foodstamp': 'food stamps',
  // Transportation
  'transportation': 'transportation', 'transportaton': 'transportation',
  'transport': 'transportation', 'transit': 'transportation',
  // Veterans
  'veteran': 'veteran', 'veteren': 'veteran', 'vetern': 'veteran',
  'veterans': 'veterans', 'veterens': 'veterans',
  // Misc
  'wheelchair': 'wheelchair', 'wheelchar': 'wheelchair',
  'disability': 'disability', 'disabilty': 'disability', 'disablity': 'disability',
  'senior': 'senior', 'senoir': 'senior', 'seniors': 'senior',
  'elderly': 'elderly', 'elderley': 'elderly',
  'domesticviolence': 'domestic violence', 'domesticviolenc': 'domestic violence',
  'dialysis': 'dialysis', 'dialiss': 'dialysis', 'dyalysis': 'dialysis',
};

// ─── Synonym dictionary ───────────────────────────────────────────────────────
// Maps canonical terms to related terms that appear in resource data.

const SYNONYMS: Record<string, string[]> = {
  // Dental
  'toothache': ['tooth', 'dental'],
  'toothpain': ['tooth', 'dental'],
  'cavity': ['dental', 'cavity'],
  'teeth': ['dental'],
  'dentist': ['dental'],
  'orthodontics': ['dental', 'orthodontics'],
  'braces': ['dental', 'orthodontics'],
  'rootcanal': ['dental', 'endodontics'],
  'wisdomteeth': ['dental', 'oral surgery'],
  // Mental health
  'anxious': ['anxiety', 'mental health'],
  'anxiety': ['anxiety', 'mental health'],
  'depressed': ['depression', 'mental health'],
  'depression': ['depression', 'mental health'],
  'panic': ['panic', 'anxiety', 'mental health'],
  'ptsd': ['ptsd', 'trauma', 'mental health'],
  'trauma': ['trauma', 'mental health'],
  'stress': ['stress', 'mental health'],
  'grief': ['grief', 'mental health', 'counseling'],
  'bipolar': ['bipolar', 'mental health'],
  'adhd': ['adhd', 'mental health'],
  'ocd': ['ocd', 'mental health'],
  'eatingdisorder': ['eating disorder', 'mental health'],
  'counseling': ['counseling', 'mental health', 'therapy'],
  'therapy': ['therapy', 'mental health', 'counseling'],
  'therapist': ['therapy', 'mental health', 'counseling'],
  'psychiatrist': ['psychiatry', 'mental health'],
  'psychologist': ['psychology', 'mental health'],
  'shrink': ['psychiatry', 'mental health'],
  // Substance use
  'addiction': ['substance use', 'addiction'],
  'alcoholic': ['substance use', 'alcohol'],
  'alcoholism': ['substance use', 'alcohol'],
  'drugs': ['substance use', 'addiction'],
  'sober': ['substance use', 'recovery'],
  'rehab': ['substance use', 'rehabilitation'],
  'meth': ['substance use', 'methamphetamine'],
  'opioid': ['substance use', 'opioid'],
  'overdose': ['substance use', 'overdose', 'crisis'],
  'naloxone': ['substance use', 'naloxone', 'narcan'],
  'narcan': ['substance use', 'naloxone', 'narcan'],
  // Cardiac / emergency
  'chestpain': ['chest pain', 'cardiac', 'cardiology', 'emergency'],
  'chesttightness': ['chest pain', 'cardiac', 'cardiology', 'emergency'],
  'chestpressure': ['chest pain', 'cardiac', 'cardiology', 'emergency'],
  'heartattack': ['heart attack', 'cardiac', 'cardiology', 'emergency'],
  'heartpalpitations': ['palpitations', 'cardiac', 'cardiology'],
  'palpitations': ['palpitations', 'cardiac', 'cardiology'],
  'heart': ['cardiac', 'cardiology'],
  // Respiratory
  'cough': ['respiratory', 'pulmonary'],
  'shortnessofbreath': ['shortness of breath', 'respiratory', 'pulmonary', 'emergency'],
  'breathing': ['respiratory', 'pulmonary'],
  'wheezing': ['respiratory', 'pulmonary', 'asthma'],
  'asthma': ['asthma', 'respiratory', 'pulmonary'],
  // Skin
  'rash': ['dermatology', 'skin'],
  'skin': ['dermatology', 'skin'],
  'acne': ['dermatology', 'skin'],
  'eczema': ['dermatology', 'skin'],
  'hives': ['dermatology', 'skin'],
  // Vision
  'eye': ['vision', 'ophthalmology', 'optometry'],
  'eyes': ['vision', 'ophthalmology', 'optometry'],
  'vision': ['vision', 'ophthalmology', 'optometry'],
  'glasses': ['vision', 'optometry'],
  // Pregnancy / women's health
  'pregnant': ['obstetrics', 'prenatal', 'womens health'],
  'pregnancy': ['obstetrics', 'prenatal', 'womens health'],
  'prenatal': ['prenatal', 'obstetrics', 'womens health'],
  'birthcontrol': ['family planning', 'womens health'],
  'contraception': ['family planning', 'womens health'],
  'abortion': ['family planning', 'womens health'],
  'mammogram': ['mammography', 'womens health', 'cancer'],
  // Children
  'kid': ['pediatric', 'pediatrics', 'children'],
  'kids': ['pediatric', 'pediatrics', 'children'],
  'child': ['pediatric', 'pediatrics', 'children'],
  'baby': ['pediatric', 'pediatrics', 'newborn'],
  'infant': ['pediatric', 'pediatrics', 'newborn'],
  // Food
  'hungry': ['food bank', 'food'],
  'food': ['food bank', 'food'],
  'groceries': ['corpus', 'food'],
  'meals': ['food bank', 'food', 'meals'],
  'snap': ['food bank', 'snap', 'food stamps'],
  'foodstamps': ['food bank', 'snap', 'food stamps'],
  // Transportation
  'ride': ['transportation'],
  'bus': ['transportation'],
  'transport': ['transportation'],
  // Veterans
  'veteran': ['veterans', 'va'],
  'veterans': ['veterans', 'va'],
  'va': ['veterans', 'va'],
  'military': ['veterans', 'military'],
  // Crisis
  'suicidal': ['crisis', 'suicide', 'mental health'],
  'suicide': ['crisis', 'suicide', 'mental health'],
  'crisis': ['crisis', 'crisis line'],
  'emergency': ['emergency', 'urgent care', 'hospital'],
  'urgent': ['urgent care'],
  // General / primary care
  'doctor': ['primary care', 'physician'],
  'physician': ['primary care', 'physician'],
  'clinic': ['primary care', 'clinic', 'fqhc'],
  'checkup': ['primary care', 'preventive'],
  'physical': ['primary care', 'preventive'],
  'sick': ['primary care', 'urgent care'],
  'flu': ['primary care', 'urgent care', 'flu'],
  'cold': ['primary care', 'urgent care'],
  'fever': ['primary care', 'urgent care'],
  'infection': ['primary care', 'urgent care'],
  'vaccination': ['primary care', 'pharmacy', 'vaccine'],
  'vaccine': ['primary care', 'pharmacy', 'vaccine'],
  'shot': ['pharmacy', 'vaccine'],
  // Pharmacy
  'prescription': ['pharmacy', 'prescription'],
  'medication': ['pharmacy', 'medication'],
  'medicine': ['pharmacy', 'medication'],
  'pills': ['pharmacy', 'medication'],
  'pharmacist': ['pharmacy'],
  // Legal
  'lawyer': ['legal aid', 'legal'],
  'attorney': ['legal aid', 'legal'],
  'legalhelp': ['legal aid', 'legal'],
  'eviction': ['legal aid', 'legal', 'housing'],
  // Housing / shelter
  'homeless': ['homeless', 'shelter', 'housing'],
  'shelter': ['shelter', 'homeless', 'housing'],
  'housing': ['housing', 'homeless'],
  'evicted': ['legal aid', 'legal', 'housing'],
  // Insurance
  'medicaid': ['medicaid', 'apple health'],
  'applehealth': ['medicaid', 'apple health'],
  'medicare': ['medicare'],
  'uninsured': ['uninsured', 'sliding scale'],
  'nopinsurance': ['uninsured', 'sliding scale'],
  // Misc
  'wheelchair': ['wheelchair', 'accessibility'],
  'disabled': ['disability', 'accessibility'],
  'disability': ['disability', 'accessibility'],
  'senior': ['senior', 'aging', 'elderly'],
  'elderly': ['senior', 'aging', 'elderly'],
  'aging': ['senior', 'aging'],
  'domesticviolence': ['domestic violence', 'dv'],
  'dv': ['domestic violence', 'dv'],
  'dialysis': ['dialysis', 'kidney'],
  'physicaltherapy': ['physical therapy', 'rehabilitation'],
  'pt': ['physical therapy', 'rehabilitation'],
  'rehabilitation': ['rehabilitation', 'physical therapy'],
};

// ─── Symptom → category mapping ──────────────────────────────────────────────

interface SymptomMapping {
  match: string;
  categories: string[];
  keywords: string[];
  redFlag?: boolean;
}

const SYMPTOM_MAPPINGS: SymptomMapping[] = [
  // Cardiac — emergency
  { match: 'chest pain', categories: ['hospital'], keywords: ['cardiac', 'cardiology', 'emergency'], redFlag: true },
  { match: 'chest tightness', categories: ['hospital'], keywords: ['cardiac', 'cardiology', 'emergency'], redFlag: true },
  { match: 'chest pressure', categories: ['hospital'], keywords: ['cardiac', 'cardiology', 'emergency'], redFlag: true },
  { match: 'heart attack', categories: ['hospital'], keywords: ['cardiac', 'cardiology', 'emergency'], redFlag: true },
  { match: 'palpitations', categories: ['hospital', 'primary-care'], keywords: ['cardiac', 'cardiology'] },
  // Respiratory
  { match: 'shortness of breath', categories: ['hospital', 'primary-care'], keywords: ['respiratory', 'pulmonary'], redFlag: true },
  { match: 'breathing problem', categories: ['hospital', 'primary-care'], keywords: ['respiratory', 'pulmonary'] },
  { match: 'wheezing', categories: ['primary-care'], keywords: ['respiratory', 'pulmonary', 'asthma'] },
  { match: 'asthma', categories: ['primary-care'], keywords: ['respiratory', 'pulmonary', 'asthma'] },
  { match: 'cough', categories: ['primary-care'], keywords: ['respiratory', 'pulmonary'] },
  // Mental health
  { match: 'anxiety', categories: ['mental-health'], keywords: ['anxiety', 'counseling', 'therapy'] },
  { match: 'depression', categories: ['mental-health'], keywords: ['depression', 'counseling', 'therapy'] },
  { match: 'panic attack', categories: ['mental-health'], keywords: ['panic', 'anxiety', 'counseling'] },
  { match: 'ptsd', categories: ['mental-health', 'veterans'], keywords: ['trauma', 'counseling', 'therapy'] },
  { match: 'trauma', categories: ['mental-health'], keywords: ['trauma', 'counseling', 'therapy'] },
  { match: 'stress', categories: ['mental-health'], keywords: ['stress', 'counseling'] },
  { match: 'grief', categories: ['mental-health'], keywords: ['grief', 'counseling'] },
  { match: 'bipolar', categories: ['mental-health'], keywords: ['bipolar', 'psychiatry'] },
  { match: 'adhd', categories: ['mental-health', 'pediatrics'], keywords: ['adhd', 'psychiatry'] },
  { match: 'ocd', categories: ['mental-health'], keywords: ['ocd', 'psychiatry'] },
  { match: 'eating disorder', categories: ['mental-health'], keywords: ['eating disorder', 'counseling'] },
  // Crisis
  { match: 'suicidal', categories: ['crisis-line', 'mental-health'], keywords: ['crisis', 'suicide', 'mental health'], redFlag: true },
  { match: 'suicide', categories: ['crisis-line', 'mental-health'], keywords: ['crisis', 'suicide', 'mental health'], redFlag: true },
  { match: 'overdose', categories: ['crisis-line', 'substance-use'], keywords: ['crisis', 'overdose', 'substance use'], redFlag: true },
  { match: 'self harm', categories: ['crisis-line', 'mental-health'], keywords: ['crisis', 'self harm', 'mental health'], redFlag: true },
  // Substance use
  { match: 'addiction', categories: ['substance-use', 'mental-health'], keywords: ['substance use', 'addiction', 'recovery'] },
  { match: 'alcoholism', categories: ['substance-use', 'mental-health'], keywords: ['substance use', 'alcohol', 'recovery'] },
  { match: 'drug problem', categories: ['substance-use', 'mental-health'], keywords: ['substance use', 'addiction'] },
  { match: 'opioid', categories: ['substance-use'], keywords: ['substance use', 'opioid', 'naloxone'] },
  // Dental
  { match: 'tooth pain', categories: ['dental'], keywords: ['dental', 'tooth', 'dentist'] },
  { match: 'toothache', categories: ['dental'], keywords: ['dental', 'tooth', 'dentist'] },
  { match: 'cavity', categories: ['dental'], keywords: ['dental', 'cavity'] },
  { match: 'broken tooth', categories: ['dental'], keywords: ['dental', 'oral surgery'] },
  { match: 'gum pain', categories: ['dental'], keywords: ['dental', 'periodontal'] },
  // Skin
  { match: 'rash', categories: ['primary-care'], keywords: ['dermatology', 'skin'] },
  { match: 'skin problem', categories: ['primary-care'], keywords: ['dermatology', 'skin'] },
  { match: 'acne', categories: ['primary-care'], keywords: ['dermatology', 'skin'] },
  { match: 'eczema', categories: ['primary-care'], keywords: ['dermatology', 'skin'] },
  // Vision
  { match: 'eye pain', categories: ['primary-care'], keywords: ['ophthalmology', 'vision'] },
  { match: 'vision problem', categories: ['primary-care'], keywords: ['ophthalmology', 'optometry', 'vision'] },
  // Pregnancy
  { match: 'pregnant', categories: ['primary-care', 'fqhc'], keywords: ['obstetrics', 'prenatal', 'womens health'] },
  { match: 'pregnancy', categories: ['primary-care', 'fqhc'], keywords: ['obstetrics', 'prenatal', 'womens health'] },
  { match: 'prenatal', categories: ['primary-care', 'fqhc'], keywords: ['prenatal', 'obstetrics'] },
  // Children
  { match: 'sick child', categories: ['pediatrics', 'primary-care'], keywords: ['pediatric', 'children'] },
  { match: 'baby fever', categories: ['pediatrics', 'primary-care'], keywords: ['pediatric', 'fever'], redFlag: true },
  // General
  { match: 'fever', categories: ['primary-care'], keywords: ['urgent care', 'primary care'] },
  { match: 'flu', categories: ['primary-care'], keywords: ['flu', 'urgent care'] },
  { match: 'cold', categories: ['primary-care'], keywords: ['urgent care', 'primary care'] },
  { match: 'infection', categories: ['primary-care'], keywords: ['urgent care', 'primary care'] },
  { match: 'vaccination', categories: ['primary-care', 'pharmacy'], keywords: ['vaccine', 'imunization'] },
  // Food
  { match: 'hungry', categories: ['food-bank'], keywords: ['food bank', 'food'] },
  { match: 'no food', categories: ['food-bank'], keywords: ['food bank', 'food'] },
  // Housing
  { match: 'homeless', categories: ['community-org'], keywords: ['homeless', 'shelter', 'housing'] },
  { match: 'eviction', categories: ['legal-aid', 'community-org'], keywords: ['legal aid', 'eviction', 'housing'] },
  // Veterans
  { match: 'veteran', categories: ['veterans', 'mental-health'], keywords: ['veterans', 'va'] },
];

// ─── Query expansion ──────────────────────────────────────────────────────────

export interface ExpandedQuery {
  normalized: string;
  tokens: string[];
  stemmedTokens: Set<string>;
  matchedCategories: string[];
  matchedKeywords: string[];
  redFlag: boolean;
  isCrisisQuery: boolean;
}

/**
 * Normalize, correct typos, expand synonyms, and apply symptom mappings.
 */
export function expandQuery(rawText: string): ExpandedQuery {
  const normalized = normalizeQuery(rawText);
  let baseTokens = tokenize(normalized);

  // Typo correction — replace misspelled tokens with canonical forms
  baseTokens = baseTokens.map((t) => TYPOS[t] ?? t);

  // Also try fuzzy typo correction for tokens not in the dictionary
  baseTokens = baseTokens.map((t) => {
    if (SYNONYMS[t] || TYPOS[t]) return t;
    // Check if token is a fuzzy match for any known typo key
    for (const typoKey of Object.keys(TYPOS)) {
      if (fuzzyMatch(t, typoKey, 0.85)) return TYPOS[typoKey];
    }
    return t;
  });

  // Single-word synonym expansion
  const expandedTokens = new Set<string>();
  for (const token of baseTokens) {
    expandedTokens.add(token);
    const syn = SYNONYMS[token];
    if (syn) {
      for (const s of syn) {
        for (const sub of s.split(' ')) expandedTokens.add(sub);
      }
    }
  }

  // Multi-word symptom mapping (check the normalized string for phrases)
  const matchedCategories = new Set<string>();
  const matchedKeywords = new Set<string>();
  let redFlag = false;

  for (const mapping of SYMPTOM_MAPPINGS) {
    const matchNorm = normalizeQuery(mapping.match);
    if (normalized.includes(matchNorm)) {
      for (const cat of mapping.categories) matchedCategories.add(cat);
      for (const kw of mapping.keywords) {
        matchedKeywords.add(kw);
        for (const sub of kw.split(' ')) expandedTokens.add(sub);
      }
      if (mapping.redFlag) redFlag = true;
    }
    // Also try fuzzy phrase matching for multi-word symptoms
    if (normalized.split(' ').length >= matchNorm.split(' ').length) {
      const fuzzyPhraseScore = fuzzyScore(normalized, matchNorm);
      if (fuzzyPhraseScore >= 0.85 && !normalized.includes(matchNorm)) {
        for (const cat of mapping.categories) matchedCategories.add(cat);
        for (const kw of mapping.keywords) {
          matchedKeywords.add(kw);
          for (const sub of kw.split(' ')) expandedTokens.add(sub);
        }
        if (mapping.redFlag) redFlag = true;
      }
    }
  }

  // Also check single-word symptom mappings via the synonym table
  for (const token of baseTokens) {
    const syn = SYNONYMS[token];
    if (syn) {
      for (const s of syn) {
        const lower = s.toLowerCase();
        if (lower.includes('emergency') || lower.includes('hospital')) matchedCategories.add('hospital');
        if (lower.includes('mental health')) matchedCategories.add('mental-health');
        if (lower.includes('dental')) matchedCategories.add('dental');
        if (lower.includes('substance use')) matchedCategories.add('substance-use');
        if (lower.includes('food')) matchedCategories.add('food-bank');
        if (lower.includes('transportation')) matchedCategories.add('transportation');
        if (lower.includes('veterans') || lower.includes('va')) matchedCategories.add('veterans');
        if (lower.includes('legal')) matchedCategories.add('legal-aid');
        if (lower.includes('pharmacy')) matchedCategories.add('pharmacy');
        if (lower.includes('pediatric')) matchedCategories.add('pediatrics');
        if (lower.includes('crisis')) matchedCategories.add('crisis-line');
      }
    }
  }

  // Determine if this is a genuine crisis query — only true crisis queries
  // should surface crisis lines prominently. Searching "anxiety" or "depression"
  // is NOT a crisis query even though those symptoms used to map to crisis-line.
  const crisisTokens = new Set(['crisis', 'suicidal', 'suicide', 'overdose', 'self harm', 'selfharm', 'self-harm']);
  const isCrisisQuery = redFlag && matchedCategories.includes('crisis-line') &&
    [...crisisTokens].some((t) => normalized.includes(t));

  const significantTokens = [...expandedTokens].filter(isSignificant);
  const stemmedTokens = new Set<string>();
  for (const t of significantTokens) stemmedTokens.add(stem(t));

  return {
    normalized,
    tokens: significantTokens,
    stemmedTokens,
    matchedCategories: [...matchedCategories],
    matchedKeywords: [...matchedKeywords],
    redFlag,
    isCrisisQuery,
  };
}

// ─── Tiered scoring with fuzzy matching ──────────────────────────────────────

const TIER_NAME = 100;
const TIER_SYMPTOM_CATEGORY = 60;
const TIER_SPECIALTY_SERVICE = 40;
const TIER_TAG = 20;
const TIER_LOCATION = 10;
const TIER_CORPUS = 5;

// Fuzzy threshold for token matching (0-1). Lower = more tolerant.
const FUZZY_THRESHOLD = 0.75;

interface ScoredResource {
  r: ResourceWithCategory;
  score: number;
}

function scoreResource(
  resource: ResourceWithCategory,
  expanded: ExpandedQuery,
): number {
  const tokens = expanded.tokens;
  if (tokens.length === 0) return 1;

  const name = (resource.name ?? '').toLowerCase();
  const searchCorpus = (resource.search_text ?? '').toLowerCase();
  const services = (resource.services ?? []).map((s) => s.toLowerCase());
  const specialties = (resource.specialties ?? []).map((s) => s.toLowerCase());
  const tags = (resource.tags ?? []).map((t) => t.toLowerCase());
  const city = (resource.city ?? '').toLowerCase();
  const county = (resource.county ?? '').toLowerCase();
  const catSlug = resource.resource_categories?.slug ?? '';
  const catName = (resource.resource_categories?.name ?? '').toLowerCase();

  // Pre-stem the resource fields for stem-level matching
  const nameStems = stemTokens(name);
  const serviceStems = new Set<string>();
  for (const s of services) for (const t of stemTokens(s)) serviceStems.add(t);
  const specialtyStems = new Set<string>();
  for (const s of specialties) for (const t of stemTokens(s)) specialtyStems.add(t);
  const tagStems = new Set<string>();
  for (const t of tags) tagStems.add(stem(t));
  const corpusStems = stemTokens(searchCorpus);

  let score = 0;
  let matchedAny = false;

  for (const token of tokens) {
    if (!isSignificant(token)) continue;
    const tokenStem = stem(token);

    let tokenMatched = false;
    let tokenScore = 0;

    // Tier 1: exact name match (highest priority)
    if (name.includes(token)) {
      tokenScore = Math.max(tokenScore, TIER_NAME);
      tokenMatched = true;
    } else if (nameStems.has(tokenStem)) {
      tokenScore = Math.max(tokenScore, TIER_NAME * 0.9);
      tokenMatched = true;
    } else {
      // Fuzzy name match — check similarity against name words
      const nameWords = name.split(/\s+/);
      const nameBest = bestFuzzyMatch(token, nameWords, FUZZY_THRESHOLD);
      if (nameBest > 0) {
        tokenScore = Math.max(tokenScore, TIER_NAME * nameBest);
        tokenMatched = true;
      }
    }

    // Tier 2: symptom/category match
    if (expanded.matchedCategories.includes(catSlug)) {
      tokenScore = Math.max(tokenScore, TIER_SYMPTOM_CATEGORY);
      tokenMatched = true;
    }
    if (catName.includes(token) || stemTokens(catName).has(tokenStem)) {
      tokenScore = Math.max(tokenScore, TIER_SYMPTOM_CATEGORY);
      tokenMatched = true;
    }

    // Tier 3: specialty / service match (exact + stem + fuzzy)
    for (const sp of specialties) {
      if (sp.includes(token) || token.includes(sp)) {
        tokenScore = Math.max(tokenScore, TIER_SPECIALTY_SERVICE);
        tokenMatched = true;
        break;
      }
    }
    if (!tokenMatched && specialtyStems.has(tokenStem)) {
      tokenScore = Math.max(tokenScore, TIER_SPECIALTY_SERVICE * 0.9);
      tokenMatched = true;
    }
    if (!tokenMatched) {
      const specBest = bestFuzzyMatch(token, specialties, FUZZY_THRESHOLD);
      if (specBest > 0) {
        tokenScore = Math.max(tokenScore, TIER_SPECIALTY_SERVICE * specBest);
        tokenMatched = true;
      }
    }

    for (const sv of services) {
      if (sv.includes(token) || token.includes(sv)) {
        tokenScore = Math.max(tokenScore, TIER_SPECIALTY_SERVICE);
        tokenMatched = true;
        break;
      }
    }
    if (!tokenMatched && serviceStems.has(tokenStem)) {
      tokenScore = Math.max(tokenScore, TIER_SPECIALTY_SERVICE * 0.9);
      tokenMatched = true;
    }
    if (!tokenMatched) {
      const svcBest = bestFuzzyMatch(token, services, FUZZY_THRESHOLD);
      if (svcBest > 0) {
        tokenScore = Math.max(tokenScore, TIER_SPECIALTY_SERVICE * svcBest);
        tokenMatched = true;
      }
    }

    // Tier 4: tag match (exact + stem + fuzzy)
    for (const tg of tags) {
      if (tg.includes(token) || token.includes(tg)) {
        tokenScore = Math.max(tokenScore, TIER_TAG);
        tokenMatched = true;
        break;
      }
    }
    if (!tokenMatched && tagStems.has(tokenStem)) {
      tokenScore = Math.max(tokenScore, TIER_TAG * 0.9);
      tokenMatched = true;
    }
    if (!tokenMatched) {
      const tagBest = bestFuzzyMatch(token, tags, FUZZY_THRESHOLD);
      if (tagBest > 0) {
        tokenScore = Math.max(tokenScore, TIER_TAG * tagBest);
        tokenMatched = true;
      }
    }

    // Tier 5: location match (exact + fuzzy)
    if (city === token || city.includes(token)) {
      tokenScore = Math.max(tokenScore, TIER_LOCATION);
      tokenMatched = true;
    } else if (fuzzyMatch(token, city, FUZZY_THRESHOLD)) {
      tokenScore = Math.max(tokenScore, TIER_LOCATION * 0.9);
      tokenMatched = true;
    }
    if (county.includes(token)) {
      tokenScore = Math.max(tokenScore, TIER_LOCATION);
      tokenMatched = true;
    } else if (fuzzyMatch(token, county, FUZZY_THRESHOLD)) {
      tokenScore = Math.max(tokenScore, TIER_LOCATION * 0.9);
      tokenMatched = true;
    }

    // Tier 6: general corpus match (exact + stem + fuzzy)
    if (searchCorpus.includes(token)) {
      tokenScore = Math.max(tokenScore, TIER_CORPUS);
      tokenMatched = true;
    } else if (corpusStems.has(tokenStem)) {
      tokenScore = Math.max(tokenScore, TIER_CORPUS * 0.9);
      tokenMatched = true;
    } else {
      // Fuzzy corpus match — check against corpus words
      const corpusWords = searchCorpus.split(/\s+/).filter((w) => w.length >= 4);
      const corpusBest = bestFuzzyMatch(token, corpusWords, FUZZY_THRESHOLD + 0.05);
      if (corpusBest > 0) {
        tokenScore = Math.max(tokenScore, TIER_CORPUS * corpusBest);
        tokenMatched = true;
      }
    }

    if (tokenMatched) {
      matchedAny = true;
      score += tokenScore;
    }
  }

  // Symptom-mapped category boost
  if (expanded.matchedCategories.length > 0 && expanded.matchedCategories.includes(catSlug)) {
    score += TIER_SYMPTOM_CATEGORY;
    matchedAny = true;
  }

  if (!matchedAny) return 0;

  // Deprioritize crisis lines for non-crisis queries. Crisis lines match on
  // the word "crisis" in their name (Tier 1 = 100pts) even when the user
  // searched for "anxiety" or "depression". Only surface them prominently
  // when the query is a genuine crisis query.
  if (catSlug === 'crisis-line' && !expanded.isCrisisQuery) {
    score *= 0.15;
  }

  return score;
}

// ─── Main hybrid search ───────────────────────────────────────────────────────

export function hybridSearch(
  resources: ResourceWithCategory[],
  filters: HybridFilters,
): ResourceWithCategory[] {
  let result = resources;

  // a) Zip code filter
  if (filters.zip) {
    const zip = filters.zip;
    result = result.filter((r) => r.zip_code === zip);
    if (result.length === 0) result = resources;
  }

  // b) Category filter
  if (filters.categorySlug) {
    result = result.filter(
      (r) => r.resource_categories?.slug === filters.categorySlug
    );
  }

  // c) Geographic filters
  if (filters.county) {
    const c = filters.county.toLowerCase();
    result = result.filter((r) =>
      r.county.toLowerCase().includes(c) ||
      fuzzyMatch(c, r.county.toLowerCase(), FUZZY_THRESHOLD)
    );
  }
  if (filters.city) {
    const c = filters.city.toLowerCase();
    result = result.filter((r) =>
      r.city.toLowerCase().includes(c) ||
      fuzzyMatch(c, r.city.toLowerCase(), FUZZY_THRESHOLD)
    );
  }

  // d) Boolean attribute filters
  if (filters.acceptsMedicaid) result = result.filter((r) => r.medicaid);
  if (filters.medicare) result = result.filter((r) => r.medicare);
  if (filters.acceptsUninsured) result = result.filter((r) => r.accepts_uninsured);
  if (filters.slidingScale) result = result.filter((r) => r.sliding_scale);
  if (filters.telehealth) result = result.filter((r) => r.telehealth);
  if (filters.walkIns) result = result.filter((r) => r.walk_ins_welcome);
  if (filters.appointmentsAvailable) result = result.filter((r) => r.appointments);
  if (filters.free) result = result.filter((r) => r.cost_free);
  if (filters.freeOptions) result = result.filter((r) => r.cost_free || r.sliding_scale);
  if (filters.openNow) result = result.filter((r) => isOpenNow(r.hours));
  if (filters.wheelchairAccessible) result = result.filter((r) =>
    r.accessibility.some((a) => a.toLowerCase().includes('wheelchair'))
  );
  if (filters.language) {
    const lang = filters.language.toLowerCase();
    result = result.filter((r) =>
      r.languages.some((l) => l.toLowerCase().includes(lang))
    );
  }

  // e) Text search with expansion + tiered scoring
  if (filters.text) {
    const textWithoutZip = filters.text.replace(/\b\d{5}\b/g, '').trim();
    if (textWithoutZip) {
      const expanded = expandQuery(textWithoutZip);
      if (expanded.tokens.length > 0 || expanded.matchedCategories.length > 0) {
        const scored: ScoredResource[] = result
          .map((r) => ({ r, score: scoreResource(r, expanded) }))
          .filter((x) => x.score > 0);

        if (scored.length > 0) {
          scored.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.r.rating - a.r.rating;
          });
          result = scored.map((x) => x.r);
        } else {
          result = [];
        }
      }
    }
  }

  return result;
}

// ─── Featured services for homepage ──────────────────────────────────────────

export function featuredServices(
  resources: ResourceWithCategory[],
  limit = 6
): ResourceWithCategory[] {
  const FEATURED_SLUGS = ['fqhc', 'primary-care', 'mental-health', 'food-bank', 'community-org'];
  const now = isOpenNow;
  return [...resources]
    .filter((r) => FEATURED_SLUGS.includes(r.resource_categories?.slug ?? ''))
    .sort((a, b) => {
      const aOpen = now(a.hours) ? 1 : 0;
      const bOpen = now(b.hours) ? 1 : 0;
      if (aOpen !== bOpen) return bOpen - aOpen;
      const aLang = a.languages.length;
      const bLang = b.languages.length;
      if (aLang !== bLang) return bLang - aLang;
      return b.rating - a.rating;
    })
    .slice(0, limit);
}

// ─── Legacy stub ──────────────────────────────────────────────────────────────

export interface ParsedQuery {
  explanation: string[];
  filters: Partial<HybridFilters>;
}

export function parseSearchQuery(
  _query: string,
  _categories: { slug: string; name: string }[]
): ParsedQuery {
  return { explanation: [], filters: {} };
}
