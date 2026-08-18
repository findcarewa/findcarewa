/**
 * Semantic search enhancement layer — sits on top of the existing hybrid
 * keyword search engine. It does NOT replace hybridSearch; it pre-processes
 * the user's natural-language query to extract intent, symptoms, and
 * specialty recommendations, then re-ranks the results from hybridSearch.
 *
 * Pipeline:
 *  1. detectIntent()      — classify what the user is asking for
 *  2. extractSymptoms()   — match against the symptoms DB (keywords, names)
 *  3. recommendSpecialty()— map symptoms/intent → category slugs + specialties
 *  4. buildSemanticFilters()— translate intent into HybridFilters
 *  5. reRank()             — boost resources that match the semantic intent
 */

import type { ResourceWithCategory } from './supabase';
import type { Symptom } from './symptoms';
import { hybridSearch, type HybridFilters } from './searchEngine';
import { fuzzyScore, fuzzyMatch } from './fuzzy';
import { isOpenNow } from './format';

// ─── Intent types ─────────────────────────────────────────────────────────────

export type SearchIntent =
  | 'symptom'        // "my child has a fever"
  | 'cost'           // "cheap dentist without insurance"
  | 'provider-type'  // "doctor for constant headaches"
  | 'insurance'      // "where can i go with apple health"
  | 'service'        // "where can I get food help near Kent?"
  | 'location'       // "clinic near seattle"
  | 'demographic'    // "veteran mental health", "senior services"
  | 'keyword';       // fallback: plain keyword search

export interface SemanticAnalysis {
  intent: SearchIntent;
  confidence: number;          // 0–1
  symptoms: MatchedSymptom[];  // symptoms matched from the DB
  recommendedCategories: string[]; // category slugs
  recommendedSpecialties: string[];
  extractedFilters: Partial<HybridFilters>;
  /** Human-readable interpretation for the UI panel. */
  interpretation: string;
  /** Whether any matched symptom is a red-flag emergency. */
  redFlag: boolean;
}

export interface MatchedSymptom {
  symptom: Symptom;
  score: number;
  matchedKeyword: string;
}

// ─── Category relationships ───────────────────────────────────────────────────

/**
 * Related categories for each primary category. When the semantic analysis
 * recommends a category, its relatives are also boosted (at a lower tier)
 * so the results include complementary services instead of only the exact
 * match. For example, "primary care" also surfaces urgent care, FQHCs,
 * telehealth, and pharmacies because a user searching for primary care
 * benefits from seeing those nearby options too.
 */
const CATEGORY_RELATIVES: Record<string, string[]> = {
  'primary-care':     ['urgent-care', 'fqhc', 'telehealth', 'pharmacy', 'pediatrics', 'hospital'],
  'urgent-care':      ['primary-care', 'fqhc', 'hospital', 'pharmacy'],
  'fqhc':             ['primary-care', 'urgent-care', 'dental', 'mental-health', 'pharmacy', 'pediatrics'],
  'mental-health':    ['substance-use', 'crisis-line', 'fqhc', 'primary-care', 'veterans', 'community-org'],
  'substance-use':    ['mental-health', 'crisis-line', 'fqhc', 'primary-care', 'community-org'],
  'dental':           ['fqhc', 'primary-care', 'urgent-care'],
  'pediatrics':       ['primary-care', 'fqhc', 'urgent-care', 'dental', 'mental-health'],
  'hospital':         ['urgent-care', 'primary-care', 'pharmacy', 'crisis-line'],
  'crisis-line':      ['mental-health', 'substance-use', 'hospital', 'community-org'],
  'food-bank':        ['community-org', 'transportation', 'senior-services'],
  'community-org':    ['food-bank', 'transportation', 'legal-aid', 'veterans', 'senior-services'],
  'transportation':   ['community-org', 'senior-services', 'food-bank'],
  'veterans':         ['mental-health', 'primary-care', 'community-org', 'substance-use'],
  'legal-aid':        ['community-org'],
  'pharmacy':         ['primary-care', 'urgent-care', 'hospital'],
  'senior-services':  ['community-org', 'transportation', 'primary-care', 'mental-health', 'food-bank'],
  'telehealth':       ['primary-care', 'mental-health', 'fqhc'],
};

/**
 * Given a set of primary category slugs, return the full set including
 * relatives. Primary categories are returned at tier 1, relatives at tier 2.
 */
function expandCategories(primarySlugs: string[]): { primary: Set<string>; related: Set<string> } {
  const primary = new Set<string>();
  const related = new Set<string>();
  for (const slug of primarySlugs) {
    primary.add(slug);
    for (const rel of CATEGORY_RELATIVES[slug] ?? []) {
      if (!primary.has(rel)) related.add(rel);
    }
  }
  return { primary, related };
}

// ─── Intent detection patterns ────────────────────────────────────────────────

interface IntentPattern {
  intent: SearchIntent;
  patterns: RegExp[];
  weight: number;
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: 'symptom',
    weight: 1,
    patterns: [
      /\b(i have|my|me|child|kid|baby|son|daughter|mother|father|wife|husband)\b/i,
      /\b(suffering from|experiencing|feeling|got|came down with)\b/i,
      /\b(hurts?|pain|ache|sore|fever|nausea|dizzy|cough|rash|swollen)\b/i,
      /\b(sick|ill|not feeling well|unwell)\b/i,
    ],
  },
  {
    intent: 'cost',
    weight: 0.9,
    patterns: [
      /\b(cheap|affordable|low cost|free|sliding scale|budget)\b/i,
      /\b(without insurance|no insurance|uninsured|no coverage)\b/i,
      /\b(can'?t afford|broke|money|cost|price|expensive)\b/i,
    ],
  },
  {
    intent: 'insurance',
    weight: 0.9,
    patterns: [
      /\b(medicaid|apple health|medicare|insurance|covered|coverage)\b/i,
      /\b(accepts?|takes?|take)\b.*\b(medicaid|medicare|insurance)\b/i,
    ],
  },
  {
    intent: 'provider-type',
    weight: 0.8,
    patterns: [
      /\b(doctor|physician|clinic|dentist|therapist|counselor|psychiatrist|specialist)\b/i,
      /\b(need|looking for|want|find)\b.*\b(for|that|who)\b/i,
      /\b(someone|someone who|a place|a doctor|a clinic)\b/i,
    ],
  },
  {
    intent: 'service',
    weight: 0.85,
    patterns: [
      /\b(where can (i|we) (get|find)|how do (i|we) (get|find)|i need|need help with|looking for help with)\b/i,
      /\b(food (help|assistance|bank|pantry|stamps|support)|shelter|housing (help|assistance)|clothing (help|assistance)|transportation (help|assistance)|utility (help|assistance))\b/i,
      /\b(food bank|food pantry|food stamps|snap benefits|wic|meal program|free meals|community kitchen)\b/i,
    ],
  },
  {
    intent: 'demographic',
    weight: 0.7,
    patterns: [
      /\b(veteran|veterans|military|senior|elderly|aging|child|children|teen|teenager|pregnant|pregnancy|disability|disabled|homeless|immigrant|refugee)\b/i,
    ],
  },
  {
    intent: 'location',
    weight: 0.6,
    patterns: [
      /\b(near|nearby|close to|around|in|at)\s+[A-Z]/i,
      /\b(seattle|tacoma|spokane|bellevue|everett|yakima|vancouver|olympia|bellingham|redmond|kent|renton|auburn)\b/i,
    ],
  },
];

// ─── Intent detection ─────────────────────────────────────────────────────────

export function detectIntent(query: string): { intent: SearchIntent; confidence: number } {
  const scores: Record<SearchIntent, number> = {
    symptom: 0, cost: 0, 'provider-type': 0, insurance: 0,
    service: 0, location: 0, demographic: 0, keyword: 0,
  };

  for (const { intent, patterns, weight } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(query)) {
        scores[intent] += weight;
      }
    }
  }

  let bestIntent: SearchIntent = 'keyword';
  let bestScore = 0;
  for (const [intent, score] of Object.entries(scores) as [SearchIntent, number][]) {
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  // Confidence: normalize by max possible score for the winning intent
  const maxPossible = INTENT_PATTERNS
    .filter((p) => p.intent === bestIntent)
    .reduce((sum, p) => sum + p.patterns.length * p.weight, 0);
  const confidence = maxPossible > 0 ? Math.min(bestScore / maxPossible, 1) : 0;

  return { intent: bestIntent, confidence };
}

// ─── Symptom extraction ───────────────────────────────────────────────────────

/**
 * Match the query against the symptoms database using keyword overlap,
 * fuzzy matching, and name containment. Returns ranked matches.
 */
export function extractSymptoms(query: string, symptoms: Symptom[]): MatchedSymptom[] {
  const q = query.toLowerCase().trim();
  if (!q || symptoms.length === 0) return [];

  const scored: MatchedSymptom[] = [];

  for (const symptom of symptoms) {
    let bestScore = 0;
    let matchedKeyword = '';

    // Check symptom name
    const name = (symptom.name ?? '').toLowerCase();
    if (q.includes(name)) {
      bestScore = Math.max(bestScore, 80);
      matchedKeyword = name;
    } else if (fuzzyMatch(q, name, 0.8)) {
      bestScore = Math.max(bestScore, 60 * fuzzyScore(q, name));
      matchedKeyword = name;
    }

    // Check keywords
    for (const kw of symptom.keywords ?? []) {
      const kwLower = kw.toLowerCase();
      if (q.includes(kwLower)) {
        // Longer keyword matches are more specific → higher score
        const kwScore = 40 + Math.min(kwLower.length / 2, 30);
        if (kwScore > bestScore) {
          bestScore = kwScore;
          matchedKeyword = kw;
        }
      } else if (kwLower.length >= 4 && fuzzyMatch(kwLower, q, 0.85)) {
        const fuzzyKwScore = 30 * fuzzyScore(kwLower, q);
        if (fuzzyKwScore > bestScore) {
          bestScore = fuzzyKwScore;
          matchedKeyword = kw;
        }
      }
    }

    // Check specialties as a weaker signal
    for (const sp of symptom.specialties ?? []) {
      const spLower = sp.toLowerCase();
      if (q.includes(spLower)) {
        bestScore = Math.max(bestScore, 25);
        if (!matchedKeyword) matchedKeyword = sp;
      }
    }

    if (bestScore > 0) {
      scored.push({ symptom, score: bestScore, matchedKeyword });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5);
}

// ─── Specialty recommendation ────────────────────────────────────────────────

/**
 * Given the matched symptoms and detected intent, recommend category slugs
 * and specialties. Pulls from the symptom DB's category_slugs and specialties,
 * plus intent-based boosts.
 */
export function recommendSpecialty(
  intent: SearchIntent,
  matchedSymptoms: MatchedSymptom[],
): { categories: string[]; specialties: string[] } {
  const categories = new Set<string>();
  const specialties = new Set<string>();

  // From matched symptoms
  for (const { symptom } of matchedSymptoms) {
    for (const cat of symptom.category_slugs ?? []) categories.add(cat);
    for (const sp of symptom.specialties ?? []) specialties.add(sp);
  }

  // Intent-based category boosts
  const intentCategoryMap: Partial<Record<SearchIntent, string[]>> = {
    cost: ['fqhc', 'community-org'],
    insurance: ['fqhc', 'primary-care'],
    'provider-type': ['primary-care'],
    service: ['food-bank', 'community-org', 'transportation', 'senior-services'],
    demographic: ['veterans', 'senior-services', 'pediatrics', 'community-org'],
  };
  const intentCats = intentCategoryMap[intent];
  if (intentCats) {
    for (const cat of intentCats) categories.add(cat);
  }

  return { categories: [...categories], specialties: [...specialties] };
}

// ─── Filter extraction ────────────────────────────────────────────────────────

/**
 * Translate the detected intent into concrete HybridFilters that the existing
 * search engine understands. This is the bridge between semantic understanding
 * and the existing keyword system.
 */
export function buildSemanticFilters(
  query: string,
  intent: SearchIntent,
  matchedSymptoms: MatchedSymptom[],
  recommendedCategories: string[],
): Partial<HybridFilters> {
  const filters: Partial<HybridFilters> = {};

  // Cost intent → financial filters
  if (intent === 'cost') {
    if (/\bfree\b/i.test(query)) {
      filters.free = true;
    } else if (/\b(cheap|affordable|low cost|budget)\b/i.test(query)) {
      filters.freeOptions = true;
      filters.slidingScale = true;
    }
    if (/\b(without insurance|no insurance|uninsured|no coverage)\b/i.test(query)) {
      filters.acceptsUninsured = true;
      filters.slidingScale = true;
    }
  }

  // Insurance intent
  if (intent === 'insurance') {
    if (/\b(medicaid|apple health)\b/i.test(query)) filters.acceptsMedicaid = true;
    if (/\bmedicare\b/i.test(query)) filters.medicare = true;
  }

  // Demographic intent
  if (intent === 'demographic') {
    if (/\b(veteran|veterans|military)\b/i.test(query)) {
      // Don't set a filter — just let category recommendation handle it
    }
  }

  // Do NOT hard-filter to a single category. The re-ranker boosts primary
  // and related categories so users see complementary services alongside
  // the exact match (e.g. primary care + urgent care + pharmacy).

  return filters;
}

// ─── Full analysis ────────────────────────────────────────────────────────────

/**
 * Run the complete semantic analysis pipeline on a natural-language query.
 * Returns everything the UI and re-ranker need.
 */
export function analyzeQuery(query: string, symptoms: Symptom[]): SemanticAnalysis {
  const { intent, confidence } = detectIntent(query);
  const matchedSymptoms = extractSymptoms(query, symptoms);
  const { categories, specialties } = recommendSpecialty(intent, matchedSymptoms);
  const extractedFilters = buildSemanticFilters(query, intent, matchedSymptoms, categories);
  const redFlag = matchedSymptoms.some((m) => m.symptom.red_flag);

  // Only show symptom matches when the intent is genuinely symptom-related.
  // For location, cost, provider-type, insurance, service, and keyword
  // intents, symptom matches are almost always false positives (e.g. "care"
  // in "urgent care" matching symptom keywords like "burns") and should not
  // be displayed.
  const symptomIntents: SearchIntent[] = ['symptom', 'demographic'];
  const isSymptomIntent = symptomIntents.includes(intent);
  const finalSymptoms = isSymptomIntent ? matchedSymptoms : [];
  const finalRedFlag = isSymptomIntent ? redFlag : false;

  // Build human-readable interpretation
  const interpretation = buildInterpretation(query, intent, finalSymptoms, categories, specialties);

  return {
    intent,
    confidence,
    symptoms: finalSymptoms,
    recommendedCategories: categories,
    recommendedSpecialties: specialties,
    extractedFilters,
    interpretation,
    redFlag: finalRedFlag,
  };
}

function buildInterpretation(
  query: string,
  intent: SearchIntent,
  matchedSymptoms: MatchedSymptom[],
  categories: string[],
  specialties: string[],
): string {
  const parts: string[] = [];

  // Intent
  const intentLabels: Record<SearchIntent, string> = {
    symptom: 'symptom-based search',
    cost: 'cost-conscious search',
    'provider-type': 'provider search',
    insurance: 'insurance-focused search',
    service: 'service search',
    location: 'location search',
    demographic: 'demographic-specific search',
    keyword: 'keyword search',
  };
  parts.push(`Detected: ${intentLabels[intent]}`);

  // Symptoms
  if (matchedSymptoms.length > 0) {
    const symNames = matchedSymptoms.slice(0, 3).map((m) => m.symptom.name);
    parts.push(`Symptoms: ${symNames.join(', ')}`);
  }

  // Recommended categories
  if (categories.length > 0) {
    parts.push(`Recommended: ${categories.join(', ')}`);
  }

  // Specialties
  if (specialties.length > 0) {
    parts.push(`Specialties: ${specialties.slice(0, 4).join(', ')}`);
  }

  return parts.join(' · ');
}

// ─── Re-ranking ───────────────────────────────────────────────────────────────

/**
 * Re-rank the results from hybridSearch using the semantic analysis.
 * Boosts resources that:
 *  - Belong to a recommended category
 *  - Have a matching specialty
 *  - Match the intent's financial/demographic signals
 *
 * Does NOT filter out results — only reorders them. This preserves the
 * existing search behavior while improving relevance for natural-language queries.
 */
export function reRank(
  results: ResourceWithCategory[],
  analysis: SemanticAnalysis,
): ResourceWithCategory[] {
  if (analysis.intent === 'keyword' && analysis.symptoms.length === 0) {
    return results; // No semantic signal — return as-is
  }

  const { primary: primaryCats, related: relatedCats } = expandCategories(analysis.recommendedCategories);
  const specialties = new Set(analysis.recommendedSpecialties.map((s) => s.toLowerCase()));

  const scored = results.map((r) => {
    let boost = 0;
    const catSlug = r.resource_categories?.slug ?? '';
    const rSpecialties = (r.specialties ?? []).map((s) => s.toLowerCase());

    // Category match boost — primary categories get a larger boost than
    // related categories so the exact match ranks first while related
    // services still appear below.
    if (primaryCats.has(catSlug)) {
      boost += 50;
    } else if (relatedCats.has(catSlug)) {
      boost += 25;
    }

    // Specialty match boost
    for (const sp of rSpecialties) {
      if (specialties.has(sp)) {
        boost += 30;
        break;
      }
    }

    // Symptom keyword match boost — check if resource services/tags contain
    // any of the matched symptom keywords
    for (const { symptom } of analysis.symptoms) {
      const resourceText = [
        r.description ?? '',
        ...(r.services ?? []),
        ...(r.tags ?? []),
        r.search_text ?? '',
      ].join(' ').toLowerCase();

      for (const kw of symptom.keywords ?? []) {
        if (resourceText.includes(kw.toLowerCase())) {
          boost += 15;
          break;
        }
      }
    }

    // Intent-specific boosts
    if (analysis.intent === 'cost') {
      if (r.cost_free) boost += 20;
      if (r.sliding_scale) boost += 15;
      if (r.accepts_uninsured) boost += 10;
    }
    if (analysis.intent === 'insurance' && analysis.extractedFilters.acceptsMedicaid && r.medicaid) {
      boost += 25;
    }
    if (analysis.intent === 'demographic') {
      const audiences = (r.audiences ?? []).map((a) => a.toLowerCase());
      const rTags = (r.tags ?? []).map((t) => t.toLowerCase());
      for (const tag of [...audiences, ...rTags]) {
        if (tag.includes('veteran') || tag.includes('senior') || tag.includes('pediatric') ||
            tag.includes('pregnant') || tag.includes('disabil') || tag.includes('homeless')) {
          boost += 20;
          break;
        }
      }
    }
    if (analysis.intent === 'service') {
      const resourceText = [
        r.description ?? '',
        ...(r.services ?? []),
        ...(r.tags ?? []),
        r.search_text ?? '',
      ].join(' ').toLowerCase();
      if (/food|meal|pantry|snap|wic|shelter|housing|transport|utility|clothing/.test(resourceText)) {
        boost += 25;
      }
    }

    return { r, boost };
  });

  scored.sort((a, b) => {
    if (b.boost !== a.boost) return b.boost - a.boost;
    const aOpen = isOpenNow(a.r.hours) ? 1 : 0;
    const bOpen = isOpenNow(b.r.hours) ? 1 : 0;
    if (aOpen !== bOpen) return bOpen - aOpen;
    return (b.r.rating ?? 0) - (a.r.rating ?? 0);
  });

  return scored.map((x) => x.r);
}

// ─── Semantic search (wrapper) ────────────────────────────────────────────────

/**
 * Convenience wrapper: analyze the query, merge semantic filters with
 * user-provided filters, run hybridSearch, then re-rank.
 * Does NOT modify the existing hybridSearch function.
 */
export function semanticSearch(
  resources: ResourceWithCategory[],
  symptoms: Symptom[],
  filters: HybridFilters,
): { results: ResourceWithCategory[]; analysis: SemanticAnalysis | null } {
  const text = filters.text;
  if (!text || text.trim().length < 2) {
    return { results: resources, analysis: null };
  }

  const analysis = analyzeQuery(text, symptoms);

  // Merge semantic filters into the user's filters (user filters take precedence)
  const merged: HybridFilters = {
    ...analysis.extractedFilters,
    ...filters,
  };

  // If semantic analysis recommends categories and the user hasn't set one,
  // and the analysis confidence is high, use the first recommended category
  // as a soft filter (we don't hard-filter, just boost in re-ranking)
  // — so we DON'T set merged.categorySlug here. Re-ranking handles it.

  // Run the existing search engine
  let results = hybridSearch(resources, merged);

  // Re-rank with semantic signals
  results = reRank(results, analysis);

  return { results, analysis };
}
