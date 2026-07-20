/**
 * Hybrid deterministic search engine.
 * Supports: zip extraction, token matching, category, city, county,
 * and all boolean attribute filters (insurance, cost, access, etc.)
 */

import { isOpenNow } from './format';
import type { ResourceWithCategory } from './supabase';

// ─────────────────────────────────────────────────────────────────────────────

/** Extract a 5-digit US zip code from an arbitrary query string. */
export function extractZip(query: string): string | null {
  const m = query.match(/\b(\d{5})\b/);
  return m ? m[1] : null;
}

// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

/**
 * Score a resource against a text query.
 * Returns 0 if the resource does not match ALL significant tokens.
 * Returns a positive relevance score otherwise (higher = better match).
 */
function textScore(resource: ResourceWithCategory, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 1;

  // Build a searchable corpus from the resource
  const corpus = (resource.search_text ?? '').toLowerCase();
  if (!corpus) return 0;

  let score = 0;
  let matched = 0;

  for (const token of queryTokens) {
    // Skip noise tokens
    if (token.length < 2) { matched++; continue; }
    if (['in', 'at', 'for', 'the', 'and', 'or', 'near', 'a', 'an'].includes(token)) {
      matched++;
      continue;
    }

    if (corpus.includes(token)) {
      matched++;
      // Bonus for name match
      if ((resource.name ?? '').toLowerCase().includes(token)) score += 3;
      // Bonus for city match
      if ((resource.city ?? '').toLowerCase() === token) score += 2;
      score += 1;
    }
  }

  // All non-trivial tokens must match
  const nonTrivialTokens = queryTokens.filter(
    (t) => t.length >= 2 && !['in', 'at', 'for', 'the', 'and', 'or', 'near', 'a', 'an'].includes(t)
  );
  if (nonTrivialTokens.length > 0 && matched < nonTrivialTokens.length) return 0;

  return score;
}

// ─────────────────────────────────────────────────────────────────────────────

export function hybridSearch(
  resources: ResourceWithCategory[],
  filters: HybridFilters
): ResourceWithCategory[] {
  let result = resources;

  // a) Zip code filter — exact match on zip_code column
  if (filters.zip) {
    const zip = filters.zip;
    result = result.filter((r) => r.zip_code === zip);
    // If zip returns nothing, don't filter by it (fall through to text)
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
    result = result.filter((r) =>
      r.county.toLowerCase().includes(filters.county!.toLowerCase())
    );
  }
  if (filters.city) {
    result = result.filter((r) =>
      r.city.toLowerCase().includes(filters.city!.toLowerCase())
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
  if (filters.language) result = result.filter((r) => r.languages.includes(filters.language!));

  // e) Text search — run last so boolean filters reduce the corpus first
  if (filters.text) {
    // Strip any zip from the text before tokenizing (zip already handled above)
    const textWithoutZip = filters.text.replace(/\b\d{5}\b/g, '').trim();
    if (textWithoutZip) {
      const tokens = tokenize(textWithoutZip);
      const scored = result
        .map((r) => ({ r, score: textScore(r, tokens) }))
        .filter((x) => x.score > 0);
      // If text search returns results, use them; otherwise fall back to unfiltered
      if (scored.length > 0) {
        result = scored.sort((a, b) => b.score - a.score).map((x) => x.r);
      }
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────

/** Returns a curated set of resources for the homepage feature section. */
export function featuredServices(
  resources: ResourceWithCategory[],
  limit = 6
): ResourceWithCategory[] {
  // Prioritise: high rating, open now, has multiple languages, is FQHC or community-org
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

// ─────────────────────────────────────────────────────────────────────────────
// Kept so any residual imports don't crash. UI now uses hybridSearch directly.

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
