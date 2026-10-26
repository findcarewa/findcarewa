import { supabase } from './supabase';

const SESSION_KEY = 'fc_anon_session';
const SESSION_DAY_KEY = 'fc_anon_session_day';

function getSessionHash(): string {
  const today = new Date().toISOString().slice(0, 10);
  const storedDay = sessionStorage.getItem(SESSION_DAY_KEY);
  let token = sessionStorage.getItem(SESSION_KEY);

  if (!token || storedDay !== today) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    token = Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem(SESSION_KEY, token);
    sessionStorage.setItem(SESSION_DAY_KEY, today);
  }

  return hashToken(token);
}

async function hashToken(token: string): Promise<string> {
  try {
    const data = new TextEncoder().encode(token);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return token;
  }
}

export type AnalyticsEventType =
  | 'page_view'
  | 'search'
  | 'resource_view'
  | 'map_view'
  | 'feedback_submit'
  | 'resource_request';

interface AnalyticsEvent {
  event_type: AnalyticsEventType;
  page?: string;
  search_query?: string;
  result_count?: number;
  category_slug?: string;
  city_filter?: string;
}

export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  try {
    const session_hash = await getSessionHash();
    await supabase.from('analytics_events').insert({
      event_type: event.event_type,
      page: event.page ?? null,
      search_query: event.search_query ?? null,
      result_count: event.result_count ?? null,
      category_slug: event.category_slug ?? null,
      city_filter: event.city_filter ?? null,
      session_hash,
    });
  } catch {
    // Analytics should never break the app
  }
}

export function trackPageView(page: string): void {
  trackEvent({ event_type: 'page_view', page });
}

export function trackSearch(query: string, resultCount: number, categorySlug?: string, city?: string): void {
  trackEvent({
    event_type: 'search',
    search_query: query,
    result_count: resultCount,
    category_slug: categorySlug,
    city_filter: city,
  });
}

export function trackResourceView(slug: string): void {
  trackEvent({ event_type: 'resource_view', page: slug });
}

export interface AnalyticsSummary {
  totalEvents: number;
  totalSearches: number;
  totalPageViews: number;
  totalResourceViews: number;
  totalMapViews: number;
  totalFeedback: number;
  totalResourceRequests: number;
  uniqueVisitors: number;
  eventsToday: number;
  searchesToday: number;
  topSearchQueries: { query: string; count: number }[];
  topPages: { page: string; count: number }[];
  topResourceViews: { page: string; count: number }[];
  dailyEvents: { date: string; count: number; searches: number }[];
  topCategories: { category: string; count: number }[];
  topCities: { city: string; count: number }[];
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [allRes, todayRes, topSearchRes, topPagesRes, topResourceRes, dailyRes, topCatRes, topCityRes] = await Promise.all([
    supabase.from('analytics_events').select('event_type, session_hash'),
    supabase.from('analytics_events').select('event_type').gte('created_at', todayStart),
    supabase.from('analytics_events')
      .select('search_query')
      .not('search_query', 'is', null)
      .neq('search_query', '')
      .gte('created_at', thirtyDaysAgo),
    supabase.from('analytics_events')
      .select('page')
      .eq('event_type', 'page_view')
      .not('page', 'is', null)
      .gte('created_at', thirtyDaysAgo),
    supabase.from('analytics_events')
      .select('page')
      .eq('event_type', 'resource_view')
      .not('page', 'is', null)
      .gte('created_at', thirtyDaysAgo),
    supabase.from('analytics_events')
      .select('created_at, event_type')
      .gte('created_at', thirtyDaysAgo),
    supabase.from('analytics_events')
      .select('category_slug')
      .not('category_slug', 'is', null)
      .neq('category_slug', '')
      .gte('created_at', thirtyDaysAgo),
    supabase.from('analytics_events')
      .select('city_filter')
      .not('city_filter', 'is', null)
      .neq('city_filter', '')
      .gte('created_at', thirtyDaysAgo),
  ]);

  const allRows = allRes.data ?? [];
  const todayRows = todayRes.data ?? [];

  const totalEvents = allRows.length;
  const totalSearches = allRows.filter((r) => r.event_type === 'search').length;
  const totalPageViews = allRows.filter((r) => r.event_type === 'page_view').length;
  const totalResourceViews = allRows.filter((r) => r.event_type === 'resource_view').length;
  const totalMapViews = allRows.filter((r) => r.event_type === 'map_view').length;
  const totalFeedback = allRows.filter((r) => r.event_type === 'feedback_submit').length;
  const totalResourceRequests = allRows.filter((r) => r.event_type === 'resource_request').length;
  const uniqueVisitors = new Set(allRows.map((r) => r.session_hash).filter(Boolean)).size;

  const eventsToday = todayRows.length;
  const searchesToday = todayRows.filter((r) => r.event_type === 'search').length;

  const topSearchQueries = aggregateField(topSearchRes.data ?? [], 'search_query')
    .map((r) => ({ query: r.key, count: r.count })).slice(0, 15);
  const topPages = aggregateField(topPagesRes.data ?? [], 'page')
    .map((r) => ({ page: r.key, count: r.count })).slice(0, 15);
  const topResourceViews = aggregateField(topResourceRes.data ?? [], 'page')
    .map((r) => ({ page: r.key, count: r.count })).slice(0, 15);
  const topCategories = aggregateField(topCatRes.data ?? [], 'category_slug')
    .map((r) => ({ category: r.key, count: r.count })).slice(0, 10);
  const topCities = aggregateField(topCityRes.data ?? [], 'city_filter')
    .map((r) => ({ city: r.key, count: r.count })).slice(0, 10);

  const dailyMap = new Map<string, { count: number; searches: number }>();
  for (const row of dailyRes.data ?? []) {
    const date = (row.created_at as string).slice(0, 10);
    if (!dailyMap.has(date)) dailyMap.set(date, { count: 0, searches: 0 });
    const entry = dailyMap.get(date)!;
    entry.count++;
    if (row.event_type === 'search') entry.searches++;
  }
  const dailyEvents = Array.from(dailyMap.entries())
    .map(([date, v]) => ({ date, count: v.count, searches: v.searches }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalEvents, totalSearches, totalPageViews, totalResourceViews,
    totalMapViews, totalFeedback, totalResourceRequests, uniqueVisitors,
    eventsToday, searchesToday, topSearchQueries, topPages, topResourceViews,
    dailyEvents, topCategories, topCities,
  };
}

function aggregateField(rows: Record<string, unknown>[], field: string): { key: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const val = row[field] as string;
    if (!val) continue;
    counts.set(val, (counts.get(val) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}
