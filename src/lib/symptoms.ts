/**
 * Symptom information system — data types and fetch helpers.
 *
 * Symptoms are stored in Supabase (tables: symptoms, symptom_faqs,
 * symptom_sources) and loaded at runtime. Nothing is hardcoded in UI
 * components; all symptom data flows through these helpers.
 */

import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SymptomUrgency = 'low' | 'moderate' | 'high' | 'emergency';

export interface SymptomFAQ {
  id: string;
  symptom_id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export interface SymptomSource {
  id: string;
  symptom_id: string;
  title: string;
  url: string;
  publisher: string | null;
  sort_order: number;
}

export interface Symptom {
  id: string;
  name: string;
  slug: string;
  description: string;
  keywords: string[];
  specialties: string[];
  urgency: SymptomUrgency;
  recommended_care_types: string[];
  category_slugs: string[];
  red_flag: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
}

/** Symptom with nested FAQs and sources — the full detail payload. */
export interface SymptomWithDetails extends Symptom {
  faqs: SymptomFAQ[];
  sources: SymptomSource[];
}

// ─── Urgency helpers ──────────────────────────────────────────────────────────

const URGENCY_RANK: Record<SymptomUrgency, number> = {
  low: 1,
  moderate: 2,
  high: 3,
  emergency: 4,
};

export function urgencyRank(u: SymptomUrgency): number {
  return URGENCY_RANK[u] ?? 0;
}

export function urgencyColor(u: SymptomUrgency): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (u) {
    case 'emergency':
      return { bg: 'bg-danger-50', text: 'text-danger-700', border: 'border-danger-200', label: 'Emergency' };
    case 'high':
      return { bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-warning-200', label: 'High' };
    case 'moderate':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Moderate' };
    case 'low':
      return { bg: 'bg-sage-50', text: 'text-sage-700', border: 'border-sage-200', label: 'Low' };
  }
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

/**
 * Load all symptoms (without FAQs/sources) ordered by sort_order.
 * Use this for browse lists and search expansion.
 */
export async function fetchSymptoms(): Promise<Symptom[]> {
  const { data, error } = await supabase
    .from('symptoms')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Symptom[];
}

/**
 * Load a single symptom by slug, with its FAQs and sources.
 */
export async function fetchSymptomBySlug(
  slug: string,
): Promise<SymptomWithDetails | null> {
  const { data: symptom, error: sErr } = await supabase
    .from('symptoms')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (sErr) throw sErr;
  if (!symptom) return null;

  const [faqRes, srcRes] = await Promise.all([
    supabase
      .from('symptom_faqs')
      .select('*')
      .eq('symptom_id', symptom.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('symptom_sources')
      .select('*')
      .eq('symptom_id', symptom.id)
      .order('sort_order', { ascending: true }),
  ]);
  if (faqRes.error) throw faqRes.error;
  if (srcRes.error) throw srcRes.error;

  return {
    ...(symptom as Symptom),
    faqs: (faqRes.data ?? []) as SymptomFAQ[],
    sources: (srcRes.data ?? []) as SymptomSource[],
  };
}

/**
 * Search symptoms by a free-text query. Matches against name, keywords,
 * and specialties using case-insensitive containment. Returns ranked
 * results (exact name > keyword > specialty).
 */
export function searchSymptoms(
  symptoms: Symptom[],
  query: string,
): Symptom[] {
  const q = query.toLowerCase().trim();
  if (!q) return symptoms;

  const scored = symptoms
    .map((s) => {
      const name = s.name.toLowerCase();
      const keywords = s.keywords.map((k) => k.toLowerCase());
      const specialties = s.specialties.map((sp) => sp.toLowerCase());

      let score = 0;
      if (name === q) score += 100;
      else if (name.includes(q)) score += 60;
      else if (q.includes(name)) score += 40;

      for (const kw of keywords) {
        if (kw === q) score += 50;
        else if (kw.includes(q) || q.includes(kw)) score += 30;
      }
      for (const sp of specialties) {
        if (sp.includes(q) || q.includes(sp)) score += 20;
      }
      return { s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return urgencyRank(b.s.urgency) - urgencyRank(a.s.urgency);
    });

  return scored.map((x) => x.s);
}

/**
 * Given a free-text search query, return the category_slugs from any
 * matching symptoms. Used by the search engine to boost resource
 * categories when a user types a symptom.
 */
export function symptomCategoriesForQuery(
  symptoms: Symptom[],
  query: string,
): { categories: string[]; redFlag: boolean } {
  const matched = searchSymptoms(symptoms, query);
  const categories = new Set<string>();
  let redFlag = false;
  for (const s of matched) {
    for (const cat of s.category_slugs) categories.add(cat);
    if (s.red_flag) redFlag = true;
  }
  return { categories: [...categories], redFlag };
}
