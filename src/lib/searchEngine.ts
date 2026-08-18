/**
 * Search engine for FindCare WA — a hybrid keyword + semantic search that
 * ranks resources by a tiered scoring system.
 *
 * Pipeline:
 *  1. Extract zip codes / city names from the query
 *  2. Expand tokens via typo + synonym dictionaries
 *  3. Score each resource across tiers:
 *     exact name > symptom/category > specialty/service > location > corpus
 *  4. Sort by score, then open-now, then rating
 */

import type { ResourceWithCategory } from './supabase';
import type { Symptom } from './symptoms';
import { fuzzyMatch, fuzzyScore, stem } from './fuzzy';
import { isOpenNow } from './format';
import { searchSymptoms } from './symptoms';

// ─── Query extraction helpers ─────────────────────────────────────────────────

/** Extract a 5-digit US zip code from an arbitrary query string. */
export function extractZip(query: string): string | null {
  const m = query.match(/\b(\d{5})\b/);
  return m ? m[1] : null;
}

/** Escape special regex characters in a string so it can be used in a RegExp. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, (ch) => '\\' + ch);
}

/**
 * Extract a city name from a query string by matching against a known list
 * of cities present in the resource data. Handles patterns like
 * "urgent care in bellevue", "dentist near seattle", "clinic spokane".
 * Returns the matched city name (original casing) or null.
 */
export function extractCity(query: string, knownCities: string[]): string | null {
  const q = query.toLowerCase();
  const matched = knownCities.find((city) => {
    const c = city.toLowerCase();
    return new RegExp('\\b' + escapeRegex(c) + '\\b').test(q);
  });
  return matched ?? null;
}

/**
 * Remove the city name from a query string so it doesn't participate in
 * text scoring (it's already been applied as a hard filter).
 */
export function stripCityFromQuery(query: string, city: string): string {
  const re = new RegExp('\\b' + escapeRegex(city) + '\\b', 'gi');
  return query.replace(re, '').replace(/\s+/g, ' ').trim();
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
  'physician': 'physician', 'physcian': 'physician',
  'clinic': 'clinic', 'clinik': 'clinic', 'clinc': 'clinic',
  'checkup': 'checkup', 'checkupp': 'checkup',
  'vaccination': 'vaccination', 'vaccinaton': 'vaccination',
  'vaccine': 'vaccine', 'vaccinne': 'vaccine', 'vaccene': 'vaccine',
  'immunization': 'vaccination', 'immunizaton': 'vaccination',
  // Pharmacy
  'pharmacy': 'pharmacy', 'pharmcy': 'pharmacy',
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
  // Insurance / cost
  'medicaid': ['medicaid', 'apple health'],
  'applehealth': ['medicaid', 'apple health'],
  'medicare': ['medicare'],
  'free': ['free', 'sliding scale'],
  'slidingscale': ['sliding scale'],
  // Accessibility
  'wheelchair': ['wheelchair accessible'],
  'disability': ['disability'],
  // Specialty
  'chiropractic': ['chiropractic', 'back pain', 'primary care'],
  'chiropractor': ['chiropractic', 'back pain', 'primary care'],
  'orthopedic': ['orthopedic', 'primary care'],
  'podiatry': ['podiatry', 'foot pain', 'primary care'],
  'physicaltherapy': ['physical therapy', 'rehabilitation'],
  'rehabilitation': ['rehabilitation', 'physical therapy'],
  // Pain / body
  'back': ['back pain', 'primary care', 'physical therapy'],
  'backpain': ['back pain', 'primary care', 'physical therapy'],
  'neck': ['neck pain', 'primary care', 'physical therapy'],
  'joint': ['joint pain', 'arthritis', 'primary care'],
  'knee': ['knee pain', 'orthopedic', 'primary care'],
  'shoulder': ['shoulder pain', 'orthopedic', 'primary care'],
  'headache': ['headache', 'migraine', 'primary care'],
  'migraine': ['migraine', 'headache', 'neurology', 'primary care'],
  'arthritis': ['arthritis', 'rheumatology', 'primary care'],
  'sciatica': ['sciatica', 'back pain', 'nerve pain', 'primary care'],
  'fibromyalgia': ['fibromyalgia', 'pain', 'primary care'],
  'sprain': ['sprain', 'orthopedic', 'primary care', 'physical therapy'],
  'fracture': ['fracture', 'orthopedic', 'urgent care'],
  'pain': ['pain', 'primary care', 'urgent care'],
  'ache': ['pain', 'primary care'],
  'hurts': ['pain', 'primary care', 'urgent care'],
  'sore': ['pain', 'primary care'],
};

// ─── Symptom → category mapping ───────────────────────────────────────────────
// Maps symptom phrases to resource category slugs and keywords so that
// natural-language symptom searches surface the right provider types.

interface SymptomMapping {
  match: string;
  categories: string[];
  keywords: string[];
}

const SYMPTOM_MAPPINGS: SymptomMapping[] = [
  // Mental health
  { match: 'anxiety', categories: ['mental-health'], keywords: ['anxiety', 'mental health', 'counseling', 'therapy'] },
  { match: 'depression', categories: ['mental-health'], keywords: ['depression', 'mental health', 'counseling', 'therapy'] },
  { match: 'panic', categories: ['mental-health', 'crisis-line'], keywords: ['panic', 'anxiety', 'mental health', 'crisis'] },
  { match: 'ptsd', categories: ['mental-health'], keywords: ['ptsd', 'trauma', 'mental health', 'counseling'] },
  { match: 'trauma', categories: ['mental-health'], keywords: ['trauma', 'mental health', 'counseling'] },
  { match: 'stress', categories: ['mental-health'], keywords: ['stress', 'mental health', 'counseling'] },
  { match: 'bipolar', categories: ['mental-health'], keywords: ['bipolar', 'mental health', 'psychiatry'] },
  { match: 'adhd', categories: ['mental-health', 'pediatrics'], keywords: ['adhd', 'mental health', 'pediatric'] },
  { match: 'ocd', categories: ['mental-health'], keywords: ['ocd', 'mental health', 'psychiatry'] },
  { match: 'eating disorder', categories: ['mental-health'], keywords: ['eating disorder', 'mental health', 'counseling'] },
  { match: 'grief', categories: ['mental-health'], keywords: ['grief', 'mental health', 'counseling'] },
  // Substance use
  { match: 'addiction', categories: ['substance-use'], keywords: ['substance use', 'addiction', 'rehabilitation'] },
  { match: 'alcohol', categories: ['substance-use'], keywords: ['substance use', 'alcohol', 'rehabilitation'] },
  { match: 'opioid', categories: ['substance-use'], keywords: ['substance use', 'opioid', 'naloxone'] },
  { match: 'overdose', categories: ['substance-use', 'crisis-line'], keywords: ['substance use', 'overdose', 'naloxone', 'crisis'] },
  { match: 'naloxone', categories: ['substance-use'], keywords: ['substance use', 'naloxone', 'narcan'] },
  { match: 'narcan', categories: ['substance-use'], keywords: ['substance use', 'naloxone', 'narcan'] },
  // Crisis
  { match: 'suicide', categories: ['crisis-line', 'mental-health'], keywords: ['crisis', 'suicide', 'mental health'] },
  { match: 'suicidal', categories: ['crisis-line', 'mental-health'], keywords: ['crisis', 'suicide', 'mental health'] },
  { match: 'crisis', categories: ['crisis-line'], keywords: ['crisis', 'crisis line'] },
  { match: 'emergency', categories: ['urgent-care', 'hospital', 'crisis-line'], keywords: ['emergency', 'urgent care', 'hospital'] },
  // Dental
  { match: 'toothache', categories: ['dental', 'urgent-care'], keywords: ['toothache', 'dental', 'tooth pain'] },
  { match: 'tooth pain', categories: ['dental', 'urgent-care'], keywords: ['toothache', 'dental', 'tooth pain'] },
  { match: 'cavity', categories: ['dental'], keywords: ['cavity', 'dental'] },
  { match: 'broken tooth', categories: ['dental', 'urgent-care'], keywords: ['broken tooth', 'dental', 'emergency'] },
  { match: 'wisdom teeth', categories: ['dental'], keywords: ['wisdom teeth', 'oral surgery', 'dental'] },
  // Respiratory
  { match: 'cough', categories: ['primary-care', 'urgent-care'], keywords: ['cough', 'respiratory', 'primary care'] },
  { match: 'shortness of breath', categories: ['urgent-care', 'hospital'], keywords: ['shortness of breath', 'respiratory', 'emergency'] },
  { match: 'asthma', categories: ['primary-care', 'urgent-care'], keywords: ['asthma', 'respiratory', 'primary care'] },
  { match: 'wheezing', categories: ['primary-care', 'urgent-care'], keywords: ['wheezing', 'asthma', 'respiratory'] },
  { match: 'flu', categories: ['primary-care', 'urgent-care'], keywords: ['flu', 'influenza', 'primary care'] },
  { match: 'cold', categories: ['primary-care', 'urgent-care'], keywords: ['cold', 'primary care', 'urgent care'] },
  // Cardiac
  { match: 'chest pain', categories: ['urgent-care', 'hospital'], keywords: ['chest pain', 'cardiac', 'emergency', 'cardiology'] },
  { match: 'heart attack', categories: ['hospital', 'urgent-care'], keywords: ['heart attack', 'cardiac', 'emergency'] },
  { match: 'palpitations', categories: ['primary-care', 'urgent-care'], keywords: ['palpitations', 'cardiac', 'cardiology'] },
  // Skin
  { match: 'rash', categories: ['primary-care', 'urgent-care'], keywords: ['rash', 'dermatology', 'skin', 'primary care'] },
  { match: 'eczema', categories: ['primary-care'], keywords: ['eczema', 'dermatology', 'skin'] },
  { match: 'acne', categories: ['primary-care'], keywords: ['acne', 'dermatology', 'skin'] },
  { match: 'hives', categories: ['primary-care', 'urgent-care'], keywords: ['hives', 'dermatology', 'skin'] },
  // Vision
  { match: 'eye pain', categories: ['primary-care', 'urgent-care'], keywords: ['eye pain', 'vision', 'ophthalmology'] },
  { match: 'blurred vision', categories: ['primary-care'], keywords: ['blurred vision', 'vision', 'ophthalmology'] },
  { match: 'pink eye', categories: ['primary-care', 'urgent-care'], keywords: ['pink eye', 'conjunctivitis', 'vision'] },
  // Pregnancy / women's health
  { match: 'pregnant', categories: ['fqhc', 'primary-care'], keywords: ['pregnancy', 'prenatal', 'obstetrics', 'womens health'] },
  { match: 'pregnancy', categories: ['fqhc', 'primary-care'], keywords: ['pregnancy', 'prenatal', 'obstetrics', 'womens health'] },
  { match: 'prenatal', categories: ['fqhc', 'primary-care'], keywords: ['prenatal', 'obstetrics', 'womens health'] },
  // Children
  { match: 'child fever', categories: ['pediatrics', 'urgent-care'], keywords: ['fever', 'pediatric', 'children'] },
  { match: 'baby fever', categories: ['pediatrics', 'urgent-care'], keywords: ['fever', 'pediatric', 'infant'] },
  { match: 'kid sick', categories: ['pediatrics', 'urgent-care'], keywords: ['sick', 'pediatric', 'children'] },
  // General symptoms
  { match: 'fever', categories: ['primary-care', 'urgent-care'], keywords: ['fever', 'primary care', 'urgent care'] },
  { match: 'nausea', categories: ['primary-care', 'urgent-care'], keywords: ['nausea', 'primary care', 'urgent care'] },
  { match: 'vomiting', categories: ['primary-care', 'urgent-care'], keywords: ['vomiting', 'primary care', 'urgent care'] },
  { match: 'dizziness', categories: ['primary-care', 'urgent-care'], keywords: ['dizziness', 'dizzy', 'primary care'] },
  { match: 'fatigue', categories: ['primary-care'], keywords: ['fatigue', 'tired', 'primary care'] },
  { match: 'infection', categories: ['primary-care', 'urgent-care'], keywords: ['infection', 'primary care', 'urgent care'] },
  { match: 'swollen', categories: ['primary-care', 'urgent-care'], keywords: ['swollen', 'swelling', 'primary care'] },
  // Veterans
  { match: 'veteran', categories: ['veterans', 'mental-health'], keywords: ['veterans', 'va'] },
  // Pain / musculoskeletal
  { match: 'back pain', categories: ['primary-care', 'fqhc'], keywords: ['back pain', 'primary care', 'chiropractic', 'physical therapy'] },
  { match: 'back hurts', categories: ['primary-care', 'fqhc'], keywords: ['back pain', 'primary care', 'chiropractic', 'physical therapy'] },
  { match: 'lower back', categories: ['primary-care', 'fqhc'], keywords: ['back pain', 'primary care', 'physical therapy'] },
  { match: 'neck pain', categories: ['primary-care', 'fqhc'], keywords: ['neck pain', 'primary care', 'chiropractic', 'physical therapy'] },
  { match: 'neck hurts', categories: ['primary-care', 'fqhc'], keywords: ['neck pain', 'primary care', 'physical therapy'] },
  { match: 'joint pain', categories: ['primary-care', 'fqhc'], keywords: ['joint pain', 'arthritis', 'primary care', 'physical therapy'] },
  { match: 'knee pain', categories: ['primary-care', 'fqhc'], keywords: ['knee pain', 'orthopedic', 'primary care', 'physical therapy'] },
  { match: 'knee hurts', categories: ['primary-care', 'fqhc'], keywords: ['knee pain', 'orthopedic', 'primary care'] },
  { match: 'shoulder pain', categories: ['primary-care', 'fqhc'], keywords: ['shoulder pain', 'orthopedic', 'primary care', 'physical therapy'] },
  { match: 'arm pain', categories: ['primary-care', 'fqhc'], keywords: ['arm pain', 'primary care', 'physical therapy'] },
  { match: 'leg pain', categories: ['primary-care', 'fqhc'], keywords: ['leg pain', 'primary care', 'physical therapy'] },
  { match: 'hip pain', categories: ['primary-care', 'fqhc'], keywords: ['hip pain', 'orthopedic', 'primary care'] },
  { match: 'arthritis', categories: ['primary-care', 'fqhc'], keywords: ['arthritis', 'rheumatology', 'primary care'] },
  { match: 'muscle pain', categories: ['primary-care', 'fqhc'], keywords: ['muscle pain', 'primary care', 'physical therapy'] },
  { match: 'muscle ache', categories: ['primary-care', 'fqhc'], keywords: ['muscle pain', 'primary care'] },
  { match: 'body pain', categories: ['primary-care', 'fqhc'], keywords: ['pain', 'primary care'] },
  { match: 'body aches', categories: ['primary-care', 'fqhc'], keywords: ['pain', 'primary care', 'flu'] },
  { match: 'headache', categories: ['primary-care', 'urgent-care'], keywords: ['headache', 'migraine', 'primary care'] },
  { match: 'head pain', categories: ['primary-care', 'urgent-care'], keywords: ['headache', 'head pain', 'primary care'] },
  { match: 'migraine', categories: ['primary-care', 'urgent-care'], keywords: ['migraine', 'headache', 'neurology', 'primary care'] },
  { match: 'stomach pain', categories: ['primary-care', 'urgent-care'], keywords: ['abdominal pain', 'stomach pain', 'primary care'] },
  { match: 'stomach ache', categories: ['primary-care', 'urgent-care'], keywords: ['abdominal pain', 'stomach pain', 'primary care'] },
  { match: 'stomach hurts', categories: ['primary-care', 'urgent-care'], keywords: ['abdominal pain', 'stomach pain', 'primary care'] },
  { match: 'abdominal pain', categories: ['primary-care', 'urgent-care'], keywords: ['abdominal pain', 'primary care'] },
  { match: 'ear pain', categories: ['primary-care', 'urgent-care'], keywords: ['ear pain', 'ear infection', 'primary care'] },
  { match: 'ear ache', categories: ['primary-care', 'urgent-care'], keywords: ['ear pain', 'ear infection', 'primary care'] },
  { match: 'ear hurts', categories: ['primary-care', 'urgent-care'], keywords: ['ear pain', 'ear infection', 'primary care'] },
  { match: 'throat pain', categories: ['primary-care', 'urgent-care'], keywords: ['throat pain', 'sore throat', 'primary care'] },
  { match: 'sore throat', categories: ['primary-care', 'urgent-care'], keywords: ['sore throat', 'throat pain', 'primary care'] },
  { match: 'throat hurts', categories: ['primary-care', 'urgent-care'], keywords: ['sore throat', 'primary care'] },
  { match: 'foot pain', categories: ['primary-care', 'fqhc'], keywords: ['foot pain', 'podiatry', 'primary care'] },
  { match: 'hand pain', categories: ['primary-care', 'fqhc'], keywords: ['hand pain', 'primary care', 'orthopedic'] },
  { match: 'nerve pain', categories: ['primary-care', 'fqhc'], keywords: ['nerve pain', 'neurology', 'primary care'] },
  { match: 'sciatica', categories: ['primary-care', 'fqhc'], keywords: ['sciatica', 'back pain', 'nerve pain', 'primary care'] },
  { match: 'fibromyalgia', categories: ['primary-care', 'fqhc'], keywords: ['fibromyalgia', 'pain', 'primary care'] },
  { match: 'sprain', categories: ['primary-care', 'urgent-care'], keywords: ['sprain', 'orthopedic', 'primary care', 'physical therapy'] },
  { match: 'strain', categories: ['primary-care', 'urgent-care'], keywords: ['strain', 'primary care', 'physical therapy'] },
  { match: 'broken bone', categories: ['urgent-care', 'hospital'], keywords: ['fracture', 'orthopedic', 'urgent care'] },
  { match: 'fracture', categories: ['urgent-care', 'hospital'], keywords: ['fracture', 'orthopedic', 'urgent care'] },
  // General pain / "hurts" catch-all — maps to primary care so any body part
  // pain search returns primary care, FQHC, and urgent care clinics instead of
  // only niche specialists like chiropractors.
  { match: 'hurts', categories: ['primary-care', 'fqhc', 'urgent-care'], keywords: ['pain', 'primary care', 'urgent care'] },
  { match: 'pain', categories: ['primary-care', 'fqhc', 'urgent-care'], keywords: ['pain', 'primary care', 'urgent care'] },
  { match: 'ache', categories: ['primary-care', 'fqhc'], keywords: ['pain', 'primary care'] },
  { match: 'sore', categories: ['primary-care', 'fqhc'], keywords: ['pain', 'primary care'] },
];

// ─── Crisis keywords ──────────────────────────────────────────────────────────

const CRISIS_KEYWORDS = new Set([
  'suicide', 'suicidal', 'kill myself', 'end my life', 'overdose', 'overdosing',
  'self harm', 'self-harm', 'cutting', 'crisis', 'mental health crisis',
  'panic attack', 'cant breathe', "can't breathe", 'dying', 'hopeless',
  'help me', 'emergency', 'raped', 'assaulted', 'domestic violence',
]);

function detectCrisisKeywords(query: string): boolean {
  const q = query.toLowerCase();
  for (const kw of CRISIS_KEYWORDS) {
    if (q.includes(kw)) return true;
  }
  return false;
}

// ─── Query expansion ──────────────────────────────────────────────────────────

const FUZZY_THRESHOLD = 0.75;

interface ExpandedQuery {
  tokens: string[];
  stemmedTokens: Set<string>;
  matchedCategories: string[];
  isCrisisQuery: boolean;
}

function stemTokens(s: string): string[] {
  return tokenize(s).filter(isSignificant).map(stem);
}

function bestFuzzyMatch(query: string, candidates: string[], threshold: number): number {
  let best = 0;
  for (const c of candidates) {
    const score = fuzzyScore(query, c);
    if (score > best) best = score;
  }
  return best >= threshold ? best : 0;
}

function expandQuery(raw: string): ExpandedQuery {
  const normalized = normalizeQuery(raw);
  const isCrisisQuery = detectCrisisKeywords(normalized);
  const rawTokens = tokenize(normalized);
  const tokens: string[] = [];
  const stemmedTokens = new Set<string>();
  const matchedCategories = new Set<string>();

  for (const token of rawTokens) {
    if (!isSignificant(token)) continue;

    // Apply typo correction
    const corrected = TYPOS[token] ?? token;

    // Apply synonym expansion
    const synonyms = SYNONYMS[corrected];
    if (synonyms) {
      for (const syn of synonyms) {
        for (const sub of syn.split(' ')) {
          if (isSignificant(sub)) {
            tokens.push(sub);
            stemmedTokens.add(stem(sub));
          }
        }
      }
    }

    tokens.push(corrected);
    stemmedTokens.add(stem(corrected));
  }

  // Check symptom mappings for multi-word phrases
  const lowerQuery = normalized;
  for (const mapping of SYMPTOM_MAPPINGS) {
    if (lowerQuery.includes(mapping.match)) {
      for (const cat of mapping.categories) matchedCategories.add(cat);
      for (const kw of mapping.keywords) {
        for (const sub of kw.split(' ')) {
          if (isSignificant(sub)) {
            tokens.push(sub);
            stemmedTokens.add(stem(sub));
          }
        }
      }
    }
  }

  return {
    tokens: [...new Set(tokens)],
    stemmedTokens,
    matchedCategories: [...matchedCategories],
    isCrisisQuery,
  };
}

// ─── Resource indexing ────────────────────────────────────────────────────────

const TIER_NAME = 100;
const TIER_SYMPTOM_CATEGORY = 60;
const TIER_SPECIALTY_SERVICE = 40;
const TIER_TAG = 25;
const TIER_LOCATION = 20;
const TIER_CORPUS = 10;

interface ResourceIndex {
  name: string;
  nameWords: string[];
  nameStems: Set<string>;
  searchCorpus: string;
  corpusWords: string[];
  corpusStems: Set<string>;
  services: string[];
  serviceStems: Set<string>;
  specialties: string[];
  specialtyStems: Set<string>;
  tags: string[];
  tagStems: Set<string>;
  city: string;
  county: string;
  catSlug: string;
  catName: string;
  catNameStems: Set<string>;
  haystack: string;
}

let indexCacheKey: ResourceWithCategory[] | null = null;
let indexCache: ResourceIndex[] = [];

function getResourceIndex(resources: ResourceWithCategory[]): ResourceIndex[] {
  if (resources === indexCacheKey && indexCache.length === resources.length) {
    return indexCache;
  }
  indexCacheKey = resources;
  indexCache = resources.map((r) => {
    const name = (r.name ?? '').toLowerCase();
    const searchCorpus = (r.search_text ?? '').toLowerCase();
    const services = (r.services ?? []).map((s) => s.toLowerCase());
    const specialties = (r.specialties ?? []).map((s) => s.toLowerCase());
    const tags = (r.tags ?? []).map((t) => t.toLowerCase());
    const city = (r.city ?? '').toLowerCase();
    const county = (r.county ?? '').toLowerCase();
    const catSlug = r.resource_categories?.slug ?? '';
    const catName = (r.resource_categories?.name ?? '').toLowerCase();

    const serviceStems = new Set<string>();
    for (const s of services) for (const t of stemTokens(s)) serviceStems.add(t);
    const specialtyStems = new Set<string>();
    for (const s of specialties) for (const t of stemTokens(s)) specialtyStems.add(t);
    const tagStems = new Set<string>();
    for (const t of tags) tagStems.add(stem(t));

    const haystack = [
      name, searchCorpus, services.join(' '), specialties.join(' '),
      tags.join(' '), city, county, catName,
    ].join(' ');

    return {
      name,
      nameWords: name.split(/\s+/).filter(Boolean),
      nameStems: stemTokens(name),
      searchCorpus,
      corpusWords: searchCorpus.split(/\s+/).filter((w) => w.length >= 4),
      corpusStems: stemTokens(searchCorpus),
      services,
      serviceStems,
      specialties,
      specialtyStems,
      tags,
      tagStems,
      city,
      county,
      catSlug,
      catName,
      catNameStems: stemTokens(catName),
      haystack,
    };
  });
  return indexCache;
}

function scoreResourceWithIndex(
  idx: ResourceIndex,
  expanded: ExpandedQuery,
): number {
  const tokens = expanded.tokens;
  if (tokens.length === 0) return 1;

  // Cheap substring pre-filter: if none of the query tokens appear as a
  // substring in the resource haystack AND no symptom category matched,
  // skip the resource entirely. This avoids running expensive Levenshtein
  // fuzzy matching on resources that have zero chance of matching.
  if (expanded.matchedCategories.length === 0 || !expanded.matchedCategories.includes(idx.catSlug)) {
    let anySubstring = false;
    for (const token of tokens) {
      if (idx.haystack.includes(token)) { anySubstring = true; break; }
    }
    if (!anySubstring) {
      // Still allow fuzzy-only matches but only for short token lists
      // (single-token typo searches). For multi-token queries, require at
      // least one substring hit to avoid O(n*tokens*fields) fuzzy work.
      if (tokens.length > 1) return 0;
    }
  }

  let score = 0;
  let matchedAny = false;

  for (const token of tokens) {
    if (!isSignificant(token)) continue;
    const tokenStem = stem(token);

    let tokenMatched = false;
    let tokenScore = 0;

    // Tier 1: exact name match (highest priority)
    if (idx.name.includes(token)) {
      tokenScore = Math.max(tokenScore, TIER_NAME);
      tokenMatched = true;
    } else if (idx.nameStems.has(tokenStem)) {
      tokenScore = Math.max(tokenScore, TIER_NAME * 0.9);
      tokenMatched = true;
    } else {
      const nameBest = bestFuzzyMatch(token, idx.nameWords, FUZZY_THRESHOLD);
      if (nameBest > 0) {
        tokenScore = Math.max(tokenScore, TIER_NAME * nameBest);
        tokenMatched = true;
      }
    }

    // Tier 2: symptom/category match
    if (expanded.matchedCategories.includes(idx.catSlug)) {
      tokenScore = Math.max(tokenScore, TIER_SYMPTOM_CATEGORY);
      tokenMatched = true;
    }
    if (idx.catName.includes(token) || idx.catNameStems.has(tokenStem)) {
      tokenScore = Math.max(tokenScore, TIER_SYMPTOM_CATEGORY);
      tokenMatched = true;
    }

    // Tier 3: specialty / service match (exact + stem + fuzzy)
    for (const sp of idx.specialties) {
      if (sp.includes(token) || token.includes(sp)) {
        tokenScore = Math.max(tokenScore, TIER_SPECIALTY_SERVICE);
        tokenMatched = true;
        break;
      }
    }
    if (!tokenMatched && idx.specialtyStems.has(tokenStem)) {
      tokenScore = Math.max(tokenScore, TIER_SPECIALTY_SERVICE * 0.9);
      tokenMatched = true;
    }
    if (!tokenMatched) {
      const specBest = bestFuzzyMatch(token, idx.specialties, FUZZY_THRESHOLD);
      if (specBest > 0) {
        tokenScore = Math.max(tokenScore, TIER_SPECIALTY_SERVICE * specBest);
        tokenMatched = true;
      }
    }

    for (const sv of idx.services) {
      if (sv.includes(token) || token.includes(sv)) {
        tokenScore = Math.max(tokenScore, TIER_SPECIALTY_SERVICE);
        tokenMatched = true;
        break;
      }
    }
    if (!tokenMatched && idx.serviceStems.has(tokenStem)) {
      tokenScore = Math.max(tokenScore, TIER_SPECIALTY_SERVICE * 0.9);
      tokenMatched = true;
    }
    if (!tokenMatched) {
      const svcBest = bestFuzzyMatch(token, idx.services, FUZZY_THRESHOLD);
      if (svcBest > 0) {
        tokenScore = Math.max(tokenScore, TIER_SPECIALTY_SERVICE * svcBest);
        tokenMatched = true;
      }
    }

    // Tier 4: tag match (exact + stem + fuzzy)
    for (const tg of idx.tags) {
      if (tg.includes(token) || token.includes(tg)) {
        tokenScore = Math.max(tokenScore, TIER_TAG);
        tokenMatched = true;
        break;
      }
    }
    if (!tokenMatched && idx.tagStems.has(tokenStem)) {
      tokenScore = Math.max(tokenScore, TIER_TAG * 0.9);
      tokenMatched = true;
    }
    if (!tokenMatched) {
      const tagBest = bestFuzzyMatch(token, idx.tags, FUZZY_THRESHOLD);
      if (tagBest > 0) {
        tokenScore = Math.max(tokenScore, TIER_TAG * tagBest);
        tokenMatched = true;
      }
    }

    // Tier 5: location match (exact + fuzzy)
    if (idx.city === token || idx.city.includes(token)) {
      tokenScore = Math.max(tokenScore, TIER_LOCATION);
      tokenMatched = true;
    } else if (fuzzyMatch(token, idx.city, FUZZY_THRESHOLD)) {
      tokenScore = Math.max(tokenScore, TIER_LOCATION * 0.9);
      tokenMatched = true;
    }
    if (idx.county.includes(token)) {
      tokenScore = Math.max(tokenScore, TIER_LOCATION);
      tokenMatched = true;
    } else if (fuzzyMatch(token, idx.county, FUZZY_THRESHOLD)) {
      tokenScore = Math.max(tokenScore, TIER_LOCATION * 0.9);
      tokenMatched = true;
    }

    // Tier 6: general corpus match (exact + stem + fuzzy)
    if (idx.searchCorpus.includes(token)) {
      tokenScore = Math.max(tokenScore, TIER_CORPUS);
      tokenMatched = true;
    } else if (idx.corpusStems.has(tokenStem)) {
      tokenScore = Math.max(tokenScore, TIER_CORPUS * 0.9);
      tokenMatched = true;
    } else {
      const corpusBest = bestFuzzyMatch(token, idx.corpusWords, FUZZY_THRESHOLD + 0.05);
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
  if (expanded.matchedCategories.length > 0 && expanded.matchedCategories.includes(idx.catSlug)) {
    score += TIER_SYMPTOM_CATEGORY;
    matchedAny = true;
  }

  if (!matchedAny) return 0;

  // Deprioritize crisis lines for non-crisis queries.
  if (idx.catSlug === 'crisis-line' && !expanded.isCrisisQuery) {
    score *= 0.15;
  }

  return score;
}

// ─── Main hybrid search ───────────────────────────────────────────────────────

interface ScoredResource {
  r: ResourceWithCategory;
  score: number;
}

export function hybridSearch(
  resources: ResourceWithCategory[],
  filters: HybridFilters,
  symptoms?: Symptom[],
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
    const before = result;
    result = result.filter((r) =>
      r.city.toLowerCase().includes(c) ||
      fuzzyMatch(c, r.city.toLowerCase(), FUZZY_THRESHOLD)
    );
    if (result.length === 0) result = before;
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

      // Merge symptom category mappings from the database so that search
      // results include the same resources the symptom detail page
      // recommends (e.g. "back pain" → primary-care).
      if (symptoms && symptoms.length > 0) {
        const dbMatches = searchSymptoms(symptoms, textWithoutZip);
        if (dbMatches.length > 0) {
          const dbCats = new Set(expanded.matchedCategories);
          for (const s of dbMatches) {
            for (const cat of s.category_slugs ?? []) dbCats.add(cat);
            for (const kw of s.keywords ?? []) {
              for (const sub of kw.split(' ')) {
                if (isSignificant(sub)) expanded.stemmedTokens.add(stem(sub));
              }
            }
          }
          expanded.matchedCategories = [...dbCats];
        }
      }

      if (expanded.tokens.length > 0 || expanded.matchedCategories.length > 0) {
        const index = getResourceIndex(result);
        const scored: ScoredResource[] = result
          .map((r, i) => ({ r, score: scoreResourceWithIndex(index[i], expanded) }))
          .filter((x) => x.score > 0);

        if (scored.length > 0) {
          scored.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            const aOpen = isOpenNow(a.r.hours) ? 1 : 0;
            const bOpen = isOpenNow(b.r.hours) ? 1 : 0;
            if (aOpen !== bOpen) return bOpen - aOpen;
            return (b.r.rating ?? 0) - (a.r.rating ?? 0);
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
      return (b.rating ?? 0) - (a.rating ?? 0);
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
  void _query; void _categories;
  return { explanation: [], filters: {} };
}
