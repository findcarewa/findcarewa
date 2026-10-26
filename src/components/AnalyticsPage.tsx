import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Search, Eye, Map as MapIcon, Heart, FileText,
  Users, TrendUp, Calendar, BarChart3, ArrowLeft, Lock,
} from './IconLib';
import { useAuth } from '../lib/auth';
import { fetchAnalyticsSummary, type AnalyticsSummary } from '../lib/analytics';
import { supabase } from '../lib/supabase';
import type { Route } from '../lib/router';
import { setPageMeta } from '../lib/seo';

interface AnalyticsPageProps {
  onNavigate: (route: Route) => void;
}

export function AnalyticsPage({ onNavigate }: AnalyticsPageProps) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setPageMeta({
      title: 'Analytics Dashboard | FindCare',
      description: 'Privacy-friendly usage analytics for FindCare WA',
      canonical: '/analytics',
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await fetchAnalyticsSummary();
      setData(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data: adminRows } = await supabase
        .from('analytics_admin_emails')
        .select('email');
      if (cancelled) return;
      const emails = (adminRows ?? []).map((r: { email: string }) => r.email.toLowerCase());
      setIsAdmin(emails.includes((user.email ?? '').toLowerCase()));
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    load();
  }, [user, authLoading, load, refreshKey]);

  if (authLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-cream-50">
        <div className="max-w-md mx-auto px-4 sm:px-6 text-center pt-16">
          <div className="w-16 h-16 rounded-2xl bg-cream-200 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="font-display font-bold text-xl text-primary-800 mb-2">Sign in required</h1>
          <p className="text-sm text-primary-500 mb-6">
            The analytics dashboard is private. Sign in with your FindCare account to view usage data.
          </p>
          <button
            onClick={() => onNavigate({ name: 'home' })}
            className="px-5 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 transition-all"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-cream-50">
        <div className="max-w-md mx-auto px-4 sm:px-6 text-center pt-16">
          <div className="w-16 h-16 rounded-2xl bg-danger-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-danger-500" />
          </div>
          <h1 className="font-display font-bold text-xl text-primary-800 mb-2">Admin access required</h1>
          <p className="text-sm text-primary-500 mb-2">
            Your account does not have permission to view analytics.
          </p>
          <p className="text-xs text-primary-400 mb-6">
            Add your email to the admin list to gain access.
          </p>
          <button
            onClick={() => onNavigate({ name: 'home' })}
            className="px-5 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 transition-all"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-16 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => onNavigate({ name: 'home' })}
              className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-sage-600 hover:text-sage-700"
            >
              <ArrowLeft className="w-4 h-4" /> Back to home
            </button>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-primary-800 tracking-tight">
              Analytics Dashboard
            </h1>
            <p className="mt-1 text-sm text-primary-500">
              Privacy-friendly usage metrics. No IP addresses, names, or emails are stored.
            </p>
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-ink-200 text-sm font-medium text-primary-700 hover:border-sage-200 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendUp className="w-4 h-4" />}
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-danger-50 border border-danger-200 p-6 text-center">
            <p className="text-sm font-semibold text-danger-700">{error}</p>
            <button onClick={() => setRefreshKey((k) => k + 1)} className="mt-4 px-4 py-2 rounded-lg bg-danger-600 text-white text-sm font-medium hover:bg-danger-700 transition-colors">
              Try again
            </button>
          </div>
        ) : data ? (
          <div className="space-y-6">
            <StatGrid data={data} />
            <div className="grid lg:grid-cols-2 gap-6">
              <DailyChart data={data.dailyEvents} />
              <TopSearches queries={data.topSearchQueries} />
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <TopPages pages={data.topPages} title="Top Pages" icon={<Eye className="w-4 h-4" />} />
              <TopPages pages={data.topResourceViews.map((r) => ({ page: r.page, count: r.count }))} title="Most Viewed Resources" icon={<FileText className="w-4 h-4" />} />
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <TopPages pages={data.topCategories.map((c) => ({ page: c.category, count: c.count }))} title="Top Category Filters" icon={<BarChart3 className="w-4 h-4" />} />
              <TopPages pages={data.topCities.map((c) => ({ page: c.city, count: c.count }))} title="Top City Filters" icon={<MapIcon className="w-4 h-4" />} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatGrid({ data }: { data: AnalyticsSummary }) {
  const stats = [
    { label: 'Total Events', value: data.totalEvents, today: data.eventsToday, icon: <BarChart3 className="w-5 h-5" />, color: 'bg-primary-50 text-primary-700' },
    { label: 'Searches', value: data.totalSearches, today: data.searchesToday, icon: <Search className="w-5 h-5" />, color: 'bg-sage-50 text-sage-700' },
    { label: 'Page Views', value: data.totalPageViews, icon: <Eye className="w-5 h-5" />, color: 'bg-accent-50 text-accent-700' },
    { label: 'Resource Views', value: data.totalResourceViews, icon: <FileText className="w-5 h-5" />, color: 'bg-cream-100 text-primary-700' },
    { label: 'Map Views', value: data.totalMapViews, icon: <MapIcon className="w-5 h-5" />, color: 'bg-sage-50 text-sage-700' },
    { label: 'Unique Visitors', value: data.uniqueVisitors, icon: <Users className="w-5 h-5" />, color: 'bg-primary-50 text-primary-700' },
    { label: 'Feedback Submissions', value: data.totalFeedback, icon: <Heart className="w-5 h-5" />, color: 'bg-danger-50 text-danger-700' },
    { label: 'Resource Requests', value: data.totalResourceRequests, icon: <FileText className="w-5 h-5" />, color: 'bg-cream-100 text-primary-700' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl bg-white border border-ink-200 p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
              {stat.icon}
            </div>
            {stat.today !== undefined && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sage-600 bg-sage-50 px-2 py-1 rounded-md">
                {stat.today} today
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-primary-800 tabular-nums">{stat.value.toLocaleString()}</p>
          <p className="text-xs text-primary-500 mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

function DailyChart({ data }: { data: { date: string; count: number; searches: number }[] }) {
  if (data.length === 0) {
    return (
      <Card title="Daily Activity (30 days)" icon={<Calendar className="w-4 h-4" />}>
        <p className="text-sm text-primary-400 py-8 text-center">No data yet.</p>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 160;

  return (
    <Card title="Daily Activity (30 days)" icon={<Calendar className="w-4 h-4" />}>
      <div className="flex items-end gap-1" style={{ height: chartHeight }}>
        {data.map((d) => {
          const barHeight = Math.max((d.count / maxCount) * chartHeight, 2);
          const searchHeight = Math.max((d.searches / maxCount) * chartHeight, 0);
          return (
            <div
              key={d.date}
              className="flex-1 group relative flex flex-col justify-end"
              style={{ minWidth: 4 }}
            >
              <div
                className="w-full rounded-t-sm bg-sage-400 transition-all duration-200 group-hover:bg-sage-500"
                style={{ height: `${barHeight}px` }}
              />
              {searchHeight > 0 && (
                <div
                  className="w-full bg-primary-600 absolute bottom-0 rounded-t-sm"
                  style={{ height: `${searchHeight}px`, opacity: 0.7 }}
                />
              )}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap pointer-events-none z-10">
                {d.date.slice(5)}: {d.count} events, {d.searches} searches
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[11px] text-primary-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-sage-400" /> Total events
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-primary-600" /> Searches
        </span>
      </div>
    </Card>
  );
}

function TopSearches({ queries }: { queries: { query: string; count: number }[] }) {
  return (
    <Card title="Top Search Queries (30 days)" icon={<Search className="w-4 h-4" />}>
      {queries.length === 0 ? (
        <p className="text-sm text-primary-400 py-8 text-center">No searches recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {queries.map((q, i) => {
            const maxCount = queries[0].count;
            const pct = (q.count / maxCount) * 100;
            return (
              <div key={q.query} className="flex items-center gap-3">
                <span className="text-xs font-bold text-primary-400 w-6 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-primary-700 truncate">{q.query}</span>
                    <span className="text-xs font-semibold text-sage-600 ml-2 flex-shrink-0">{q.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-cream-100 overflow-hidden">
                    <div className="h-full bg-sage-400 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function TopPages({ pages, title, icon }: { pages: { page: string; count: number }[]; title: string; icon: React.ReactNode }) {
  return (
    <Card title={title} icon={icon}>
      {pages.length === 0 ? (
        <p className="text-sm text-primary-400 py-8 text-center">No data yet.</p>
      ) : (
        <div className="space-y-2">
          {pages.map((p, i) => {
            const maxCount = pages[0].count;
            const pct = (p.count / maxCount) * 100;
            return (
              <div key={p.page + i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-primary-400 w-6 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-primary-700 truncate">{p.page}</span>
                    <span className="text-xs font-semibold text-sage-600 ml-2 flex-shrink-0">{p.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-cream-100 overflow-hidden">
                    <div className="h-full bg-primary-400 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-ink-200 p-5 shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-primary-500">{icon}</span>
        <h3 className="text-sm font-semibold text-primary-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}
