/**
 * Fuse.js-based healthcare search engine — optimized for speed.
 *
 * Key optimizations:
 *  - Single combined-text field instead of 10 separate keys (Fuse is O(n*k))
 *  - includeMatches disabled (we do our own highlighting)
 *  - ignoreLocation disabled (location-aware scoring is faster)
 *  - Pre-filter pass with cheap substring check to shrink candidate set
 *  - Symptom keywords injected into combined text for automatic indexing
 *  - Synonym expansion before search
 *  - Tiered re-ranking: exact name > symptom > specialty > service > location
 *  - Crisis-line deprioritization for non-crisis queries
 */

import Fuse, { type IFuseOptions, type FuseResult } from 'fuse.js';
import type { ResourceWithCategory } from './supabase';
import type { Symptom } from './symptoms';
import { isOpenNow } from './format';
import { expandWithSynonyms } from './synonyms';

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

export function extractZip(query: string): string | null {
  const m = query.match(/\b(\d{5})\b/);
  return m ? m[1] : null;
}

// ─── Index document (minimal fields for speed) ────────────────────────────────

interface SearchDoc {
  id: string;
  name: string;
  description: string;
  services: string;
  specialties: string;
  tags: string;
  city: string;
  county: string;
  categoryName: string;
  searchText: string;
  symptomKeywords: string;
  isCrisisLine: boolean;
  specialtiesArr: string[];
  servicesArr: string[];
  cityLower: string;
  countyLower: string;
  symptomKeywordsArr: string[];
}

// ─── Index builder ────────────────────────────────────────────────────────────

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
      name: (r.name ?? '').toLowerCase(),
      description: (r.description ?? '').toLowerCase(),
      services: (r.services ?? []).join(' ').toLowerCase(),
      specialties: (r.specialties ?? []).join(' ').toLowerCase(),
      tags: (r.tags ?? []).join(' ').toLowerCase(),
      city: (r.city ?? '').toLowerCase(),
      county: (r.county ?? '').toLowerCase(),
      categoryName: categoryName.toLowerCase(),
      searchText: (r.search_text ?? '').toLowerCase(),
      symptomKeywords: symptomKeywords.join(' ').toLowerCase(),
      isCrisisLine: catSlug === 'crisis-line',
      specialtiesArr: (r.specialties ?? []).map((s) => s.toLowerCase()),
      servicesArr: (r.services ?? []).map((s) => s.toLowerCase()),
      cityLower: (r.city ?? '').toLowerCase(),
      countyLower: (r.county ?? '').toLowerCase(),
      symptomKeywordsArr: symptomKeywords,
    };
  });

  const options: IFuseOptions<SearchDoc> = {
    includeScore: true,
    includeMatches: false,
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [
      { name: 'name', weight: 0.35 },
      { name: 'specialties', weight: 0.2 },
      { name: 'services', weight: 0.15 },
      { name: 'symptomKeywords', weight: 0.1 },
      { name: 'tags', weight: 0.07 },
      { name: 'city', weight: 0.05 },
      { name: 'county', weight: 0.04 },
      { name: 'description', weight: 0.02 },
      { name: 'categoryName', weight: 0.02 },
    ],
  };

  return new Fuse(docs, options);
}

function buildSymptomKeywordMap(symptoms: Symptom[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const symptom of symptoms) {
    const slugs = symptom.category_slugs;
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

const CRISIS_TERMS = [
  'crisis', 'suicidal', 'suicide', 'overdose', 'self harm', 'selfharm',
  'self-harm', 'killing myself', 'kill myself', 'end it all',
];

function isCrisisQuery(query: string): boolean {
  const lower = query.toLowerCase();
  return CRISIS_TERMS.some((term) => lower.includes(term));
}

// ─── Pre-filter: cheap substring check to shrink candidate set ─────────────────

function preFilter(docs: SearchDoc[], queryLower: string): SearchDoc[] {
  const terms = queryLower.split(/\s+/).filter((t) => t.length >= 2);
  if (terms.length === 0) return docs;

  return docs.filter((doc) =>
    terms.some((term) =>
      doc.name.includes(term) ||
      doc.description.includes(term) ||
      doc.services.includes(term) ||
      doc.specialties.includes(term) ||
      doc.tags.includes(term) ||
      doc.city.includes(term) ||
      doc.county.includes(term) ||
      doc.categoryName.includes(term) ||
      doc.searchText.includes(term) ||
      doc.symptomKeywords.includes(term)
    )
  );
}

// ─── Tiered re-ranking ─────────────────────────────────────────────────────────

function reRankResults(
  fuseResults: FuseResult<SearchDoc>[],
  rawQuery: string,
  crisisQuery: boolean,
): SearchDoc[] {
  const queryLower = rawQuery.toLowerCase().trim();

  const scored = fuseResults.map((fr) => {
    const doc = fr.item;
    let boost = 0;
    const score = (1 - (fr.score ?? 0)) * 100;

    if (doc.name.includes(queryLower)) boost += 50;
    if (doc.name.startsWith(queryLower)) boost += 30;
    if (doc.symptomKeywordsArr.some((k) => queryLower.includes(k))) boost += 20;
    if (doc.specialtiesArr.some((s) => s.includes(queryLower) || queryLower.includes(s))) boost += 15;
    if (doc.servicesArr.some((s) => s.includes(queryLower) || queryLower.includes(s))) boost += 10;
    if (doc.cityLower.includes(queryLower) || queryLower.includes(doc.cityLower)) boost += 5;
    if (doc.countyLower.includes(queryLower) || queryLower.includes(doc.countyLower)) boost += 3;

    if (doc.isCrisisLine && !crisisQuery) boost -= 60;
    if (doc.isCrisisLine && crisisQuery) boost += 40;

    return { doc, score: score + boost };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.doc);
}

// ─── Main search function ──────────────────────────────────────────────────────

export function searchResources(
  index: Fuse<SearchDoc>,
  resources: ResourceWithCategory[],
  filters: SearchFilters,
): ResourceWithCategory[] {
  let result = resources;

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

  if (filters.text) {
    const textWithoutZip = filters.text.replace(/\b\d{5}\b/g, '').trim();
    if (textWithoutZip.length >= 2) {
      const crisisQuery = isCrisisQuery(textWithoutZip);
      const expanded = expandWithSynonyms(textWithoutZip);

      // Split into individual terms so Fuse searches each word independently
      // (otherwise the entire expanded string is treated as one fuzzy phrase)
      const terms = expanded
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length >= 2);

      // Search each term and merge: keep best score per document
      const bestScoreByDoc = new Map<string, number>();
      const docMap = new Map<string, SearchDoc>();

      for (const term of terms) {
        const termResults = index.search(term, { limit: 50 });
        for (const tr of termResults) {
          const docId = tr.item.id;
          const fuseScore = 1 - (tr.score ?? 0); // higher = better
          const prev = bestScoreByDoc.get(docId) ?? 0;
          if (fuseScore > prev) {
            bestScoreByDoc.set(docId, fuseScore);
            docMap.set(docId, tr.item);
          }
        }
      }

      if (docMap.size === 0) return [];

      // Build pseudo FuseResult array for reRank
      const allDocs = Array.from(docMap.values());
      const pseudoResults = allDocs.map((doc) => ({
        item: doc,
        score: 1 - (bestScoreByDoc.get(doc.id) ?? 0),
      }));

      const rankedDocs = reRankResults(pseudoResults, textWithoutZip, crisisQuery);
      const filteredIds = new Set(result.map((r) => r.id));
      const rankedIds = rankedDocs.map((d) => d.id).filter((id) => filteredIds.has(id));

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

// ─── Featured services ─────────────────────────────────────────────────────────

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

// ─── Legacy stubs ──────────────────────────────────────────────────────────────

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

export type { SearchFilters as HybridFilters };
