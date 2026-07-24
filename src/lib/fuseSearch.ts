/**
 * Fuse.js-based healthcare search engine.
 *
 * Replaces the hand-rolled fuzzy search with Fuse.js for robust typo tolerance,
 * partial matching, and multi-field weighted ranking. Supports:
 *  - Symptom searches (auto-indexed from Supabase symptoms table)
 *  - Provider/specialty searches (indexed from resource specialties)
 *  - City and county searches (indexed as location fields)
 *  - Synonym expansion (heart doctor → cardiologist, pink eye → conjunctivitis)
 *  - Tiered ranking: exact name > symptom category > specialty/service > location > corpus
 *  - Crisis-line deprioritization for non-crisis queries
 *
 * The index is built from the resource array + symptoms array, so any new
 * symptom pages or providers added to Supabase are automatically indexed
 * the next time the app loads data.
 */

import Fuse, { type IFuseOptions, type FuseResult } from 'fuse.js';
import type { ResourceWithCategory } from './supabase';
import type { Symptom } from './symptoms';
import { isOpenNow } from './format';
import { expandWithSynonyms } from './synonyms';

// ─── Filters (re-exported for backward compatibility) ──────────────────────────

export interface SearchFilters {
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

// ─── Zip extraction (kept for backward compat) ─────────────────────────────────

export function extractZip(query: string): string | null {
  const m = query.match(/\b(\d{5})\b/);
  return m ? m[1] : null;
}

// ─── Index document type ────────────────────────────────────────────────────────

interface SearchDoc {
  id: string;
  name: string;
  description: string;
  services: string[];
  specialties: string[];
  tags: string[];
  city: string;
  county: string;
  categorySlug: string;
  categoryName: string;
  searchCorpus: string;
  symptomKeywords: string[];
  isCrisisLine: boolean;
}

// ─── Index builder ─────────────────────────────────────────────────────────────

/**
 * Build a Fuse.js index from resources and symptoms.
 * Each resource becomes a searchable document with weighted fields.
 * Symptom keywords are injected into the resource's symptomKeywords field
 * when the resource's category matches a symptom's category_slugs.
 */
export function buildSearchIndex(
  resources: ResourceWithCategory[],
  symptoms: Symptom[],
): Fuse<SearchDoc> {
  const symptomKeywordMap = buildSymptomKeywordMap(symptoms);

  const docs: SearchDoc[] = resources.map((r) => {
    const catSlug = r.resource_categories?.slug ?? '';
    const categoryName = r.resource_categories?.name ?? '';

    const symptomKeywords = symptomKeywordMap.get(catSlug) ?? [];

    return {
      id: r.id,
      name: r.name ?? '',
      description: r.description ?? '',
      services: r.services ?? [],
      specialties: r.specialties ?? [],
      tags: r.tags ?? [],
      city: r.city ?? '',
      county: r.county ?? '',
      categorySlug: catSlug,
      categoryName,
      searchCorpus: r.search_text ?? '',
      symptomKeywords,
      isCrisisLine: catSlug === 'crisis-line',
    };
  });

  const options: IFuseOptions<SearchDoc> = {
    includeScore: true,
    includeMatches: true,
    threshold: 0.35,
    ignoreLocation: true,
    useExtendedSearch: false,
    keys: [
      { name: 'name', weight: 1.0 },
      { name: 'symptomKeywords', weight: 0.7 },
      { name: 'specialties', weight: 0.6 },
      { name: 'services', weight: 0.5 },
      { name: 'categoryName', weight: 0.4 },
      { name: 'tags', weight: 0.3 },
      { name: 'city', weight: 0.25 },
      { name: 'county', weight: 0.2 },
      { name: 'description', weight: 0.15 },
      { name: 'searchCorpus', weight: 0.1 },
    ],
  };

  return new Fuse(docs, options);
}

/**
 * Map category slugs to symptom keywords. When a resource belongs to a
 * category that symptoms recommend, the symptom keywords get injected
 * into the resource's searchable text.
 */
function buildSymptomKeywordMap(symptoms: Symptom[]): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const symptom of symptoms) {
    const slugs = (symptom as any).category_slugs as string[] | undefined;
    if (!slugs) continue;

    const keywords = [
      symptom.name.toLowerCase(),
      ...(symptom.keywords ?? []).map((k) => k.toLowerCase()),
    ];

    for (const slug of slugs) {
      const existing = map.get(slug) ?? [];
      map.set(slug, [...existing, ...keywords]);
    }
  }

  return map;
}

// ─── Crisis query detection ────────────────────────────────────────────────────

const CRISIS_TERMS = new Set([
  'crisis', 'suicidal', 'suicide', 'overdose', 'self harm', 'selfharm',
  'self-harm', 'killing myself', 'kill myself', 'end it all',
]);

function isCrisisQuery(query: string): boolean {
  const lower = query.toLowerCase();
  return [...CRISIS_TERMS].some((term) => lower.includes(term));
}

// ─── Tiered re-ranking ──────────────────────────────────────────────────────────

/**
 * Fuse.js returns fuzzy scores (0 = perfect match, 1 = no match).
 * We invert to a positive score, then apply tiered boosts so that
 * exact name matches rank above symptom matches, which rank above
 * specialty matches, which rank above location matches.
 */
function reRankResults(
  fuseResults: FuseResult<SearchDoc>[],
  rawQuery: string,
  crisisQuery: boolean,
): SearchDoc[] {
  const queryLower = rawQuery.toLowerCase().trim();

  const scored = fuseResults.map((fr) => {
    const doc = fr.item;
    let boost = 0;

    // Invert Fuse score: 0 (perfect) → 100, 1 (worst) → 0
    let score = (1 - (fr.score ?? 0)) * 100;

    // Tier 1: exact name match (highest)
    if (doc.name.toLowerCase().includes(queryLower)) {
      boost += 50;
    }

    // Tier 2: name starts with query
    if (doc.name.toLowerCase().startsWith(queryLower)) {
      boost += 30;
    }

    // Tier 3: symptom keyword match
    if (doc.symptomKeywords.some((k) => queryLower.includes(k))) {
      boost += 20;
    }

    // Tier 4: specialty match
    if (doc.specialties.some((s) => s.toLowerCase().includes(queryLower) || queryLower.includes(s.toLowerCase()))) {
      boost += 15;
    }

    // Tier 5: service match
    if (doc.services.some((s) => s.toLowerCase().includes(queryLower) || queryLower.includes(s.toLowerCase()))) {
      boost += 10;
    }

    // Tier 6: city match (location)
    if (doc.city.toLowerCase().includes(queryLower) || queryLower.includes(doc.city.toLowerCase())) {
      boost += 5;
    }

    // Tier 7: county match (location)
    if (doc.county.toLowerCase().includes(queryLower) || queryLower.includes(doc.county.toLowerCase())) {
      boost += 3;
    }

    // Crisis line deprioritization for non-crisis queries
    if (doc.isCrisisLine && !crisisQuery) {
      boost -= 60;
    }

    // Crisis line boost for crisis queries
    if (doc.isCrisisLine && crisisQuery) {
      boost += 40;
    }

    return { doc, score: score + boost };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.doc);
}

// ─── Main search function ──────────────────────────────────────────────────────

/**
 * Search resources using Fuse.js fuzzy matching with synonym expansion
 * and tiered re-ranking. Returns resource IDs in ranked order.
 *
 * The caller maps IDs back to ResourceWithCategory objects.
 */
export function searchResources(
  index: Fuse<SearchDoc>,
  resources: ResourceWithCategory[],
  filters: SearchFilters,
): ResourceWithCategory[] {
  let result = resources;

  // Apply hard filters first (same as before)
  if (filters.zip) {
    const zip = filters.zip;
    result = result.filter((r) => r.zip_code === zip);
    if (result.length === 0) result = resources;
  }

  if (filters.categorySlug) {
    result = result.filter((r) => r.resource_categories?.slug === filters.categorySlug);
  }

  if (filters.county) {
    const c = filters.county.toLowerCase();
    result = result.filter((r) => r.county.toLowerCase().includes(c));
  }

  if (filters.city) {
    const c = filters.city.toLowerCase();
    result = result.filter((r) => r.city.toLowerCase().includes(c));
  }

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
  if (filters.wheelchairAccessible) {
    result = result.filter((r) => r.accessibility.some((a) => a.toLowerCase().includes('wheelchair')));
  }
  if (filters.language) {
    const lang = filters.language.toLowerCase();
    result = result.filter((r) => r.languages.some((l) => l.toLowerCase().includes(lang)));
  }

  // Text search with Fuse.js
  if (filters.text) {
    const textWithoutZip = filters.text.replace(/\b\d{5}\b/g, '').trim();
    if (textWithoutZip.length >= 2) {
      const crisisQuery = isCrisisQuery(textWithoutZip);
      const expanded = expandWithSynonyms(textWithoutZip);

      const fuseResults = index.search(expanded, { limit: 200 });

      if (fuseResults.length === 0) return [];

      const rankedDocs = reRankResults(fuseResults, textWithoutZip, crisisQuery);
      const idSet = new Set(rankedDocs.map((d) => d.id));

      // Filter to resources that passed the hard filters AND matched the text search
      const filteredIds = new Set(result.map((r) => r.id));
      const rankedIds = rankedDocs.map((d) => d.id).filter((id) => filteredIds.has(id));

      // If no results survived the hard-filter intersection, fall back to
      // just the text-matched resources (ignoring hard filters that aren't text-related)
      if (rankedIds.length === 0) {
        return rankedDocs
          .map((d) => resources.find((r) => r.id === d.id))
          .filter((r): r is ResourceWithCategory => r !== undefined);
      }

      result = rankedIds
        .map((id) => result.find((r) => r.id === id))
        .filter((r): r is ResourceWithCategory => r !== undefined);
    }
  }

  return result;
}

// ─── Featured services (kept for backward compat) ──────────────────────────────

export function featuredServices(
  resources: ResourceWithCategory[],
  limit = 6,
): ResourceWithCategory[] {
  const FEATURED_SLUGS = ['fqhc', 'primary-care', 'mental-health', 'food-bank', 'community-org'];
  return [...resources]
    .filter((r) => FEATURED_SLUGS.includes(r.resource_categories?.slug ?? ''))
    .sort((a, b) => {
      const aOpen = isOpenNow(a.hours) ? 1 : 0;
      const bOpen = isOpenNow(b.hours) ? 1 : 0;
      if (aOpen !== bOpen) return bOpen - aOpen;
      return b.rating - a.rating;
    })
    .slice(0, limit);
}

// ─── Legacy stubs (kept for backward compat) ────────────────────────────────────

export interface ParsedQuery {
  explanation: string[];
  filters: Partial<SearchFilters>;
}

export function parseSearchQuery(
  _query: string,
  _categories: { slug: string; name: string }[],
): ParsedQuery {
  return { explanation: [], filters: {} };
}

// ─── Backward-compatible exports ────────────────────────────────────────────────

export type { SearchFilters as HybridFilters };
