import { useState, useEffect, useMemo } from 'react';
import { Search, AlertCircle, Loader2, ArrowRight, Activity, ShieldCheck } from './IconLib';
import type { Route } from '../lib/router';
import {
  fetchSymptoms,
  searchSymptoms,
  urgencyColor,
  type Symptom,
  type SymptomUrgency,
} from '../lib/symptoms';

function formatReviewDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

interface SymptomsPageProps {
  onNavigate: (route: Route) => void;
}


export function SymptomsPage({ onNavigate }: SymptomsPageProps) {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<SymptomUrgency | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchSymptoms();
        if (!cancelled) {
          setSymptoms(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load symptoms.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let result = symptoms;
    if (urgencyFilter) {
      result = result.filter((s) => s.urgency === urgencyFilter);
    }
    if (query.trim()) {
      result = searchSymptoms(result, query);
    }
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [symptoms, query, urgencyFilter]);

  if (loading) {
    return (
      <section className="min-h-screen pt-20 lg:pt-24 pb-16 bg-cream-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 text-primary-400 animate-spin" />
          <p className="text-sm text-primary-500">Loading symptom information…</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-screen pt-20 lg:pt-24 pb-16 bg-cream-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-danger-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-danger-600" />
          </div>
          <p className="font-display font-bold text-primary-800 text-lg">Unable to load symptoms</p>
          <p className="text-sm text-primary-600 mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-5 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 transition-colors"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-20 lg:pt-24 pb-16 bg-cream-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sage-50 border border-sage-200 mb-4">
            <Activity className="w-3.5 h-3.5 text-sage-600" />
            <span className="text-xs font-semibold text-sage-700 tracking-wide">Symptom Guide</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-primary-800 tracking-tight">
            Healthcare Symptoms & Conditions
          </h1>
          <p className="mt-3 text-primary-600 max-w-2xl mx-auto text-base leading-relaxed">
            Browse common symptoms and conditions to understand urgency levels, find recommended
            care types, and connect with healthcare resources across Washington State.
          </p>
        </div>

        {/* Search + filter bar */}
        <div className="rounded-2xl bg-white border border-ink-200 shadow-soft p-4 sm:p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search symptoms, conditions, or keywords…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cream-50 border border-ink-200 text-sm focus:outline-none focus:border-sage-400 focus:ring-4 focus:ring-sage-500/10 transition-all duration-200 ease-out-expo"
                aria-label="Search symptoms"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['emergency', 'high', 'moderate', 'low'] as SymptomUrgency[]).map((u) => {
                const colors = urgencyColor(u);
                const active = urgencyFilter === u;
                return (
                  <button
                    key={u}
                    onClick={() => setUrgencyFilter(active ? null : u)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-200 ease-out-expo border ${active
                      ? `${colors.bg} ${colors.text} ${colors.border}`
                      : 'bg-white border-ink-200 text-primary-500 hover:border-primary-300'
                    }`}
                  >
                    {u}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink-100">
            <p className="text-sm text-primary-500">
              {filtered.length} {filtered.length === 1 ? 'symptom' : 'symptoms'}
              {urgencyFilter && ` · ${urgencyFilter} urgency`}
              {query.trim() && ` matching "${query.trim()}"`}
            </p>
            {(query.trim() || urgencyFilter) && (
              <button
                onClick={() => { setQuery(''); setUrgencyFilter(null); }}
                className="text-xs font-semibold text-sage-600 hover:text-sage-700 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Symptoms list */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-white border border-ink-200 shadow-soft p-10 text-center">
            <p className="text-primary-500 text-sm">
              No symptoms match your search. Try a different term or clear filters.
            </p>
            <button
              onClick={() => { setQuery(''); setUrgencyFilter(null); }}
              className="mt-3 text-sm font-semibold text-sage-600 hover:text-sage-700"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {filtered.map((s) => {
              const colors = urgencyColor(s.urgency);
              return (
                <button
                  key={s.id}
                  onClick={() => onNavigate({ name: 'symptom', slug: s.slug })}
                  className="group flex items-start gap-3 p-4 rounded-2xl bg-white border border-ink-200 hover:border-primary-300 hover:shadow-soft transition-all duration-200 ease-out-expo text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-primary-800 group-hover:text-primary-900">
                        {s.name}
                      </h3>
                    </div>
                    <p className="text-xs text-primary-500 line-clamp-2 leading-relaxed">
                      {s.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors.bg} ${colors.text} ${colors.border} capitalize`}>
                        {s.urgency}
                      </span>
                      {s.specialties.slice(0, 2).map((sp) => (
                        <span key={sp} className="text-[10px] text-primary-400 font-medium">
                          {sp}
                        </span>
                      ))}
                    </div>
                    {s.reviewed_at && (
                      <p className="text-[10px] text-primary-400 mt-2 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-sage-500" />
                        Reviewed {formatReviewDate(s.reviewed_at)}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary-300 group-hover:text-sage-500 group-hover:translate-x-0.5 transition-all duration-200 ease-out-expo flex-shrink-0 mt-1" />
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-10 rounded-2xl bg-gradient-to-br from-primary-700 to-primary-800 p-6 text-center">
          <h2 className="font-display font-bold text-xl text-white mb-2">
            Need to find a provider?
          </h2>
          <p className="text-sm text-slate-300 mb-4 max-w-md mx-auto">
            Search our directory of healthcare resources across Washington State by symptom, insurance, location, and more.
          </p>
          <button
            onClick={() => onNavigate({ name: 'search' })}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary-800 text-sm font-semibold hover:bg-cream-100 transition-colors"
          >
            <Search className="w-4 h-4" /> Search for care
          </button>
        </div>

        {/* Disclaimer */}
        <p className="mt-6 text-xs text-primary-400 text-center max-w-2xl mx-auto leading-relaxed">
          This information is for educational purposes only and is not a substitute for professional
          medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare
          provider with questions about a medical condition.
        </p>
      </div>
    </section>
  );
}
