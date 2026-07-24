import { useState, useRef, useEffect } from 'react';
import {
  MagnifyingGlass, Sparkle, MapPin, ShieldCheck,
  ArrowRight, Warning, Phone,
} from '@phosphor-icons/react';
import type { Route } from '../lib/router';
import type { ResourceCategory } from '../lib/supabase';
import { getCategoryIcon, getCategoryColor } from '../lib/icons';

interface HeroProps {
  onSearch: (query: string) => void;
  onNavigate: (route: Route) => void;
  categories: ResourceCategory[];
  totalResources: number;
  totalCities: number;
}

const SAMPLE_QUERIES = [
  'dental 98104',
  'food bank Seattle',
  'veteran mental health Tacoma',
  'free clinic Yakima',
  'Spanish primary care Wenatchee',
];

export function Hero({ onSearch, onNavigate, categories, totalResources, totalCities }: HeroProps) {
  const [query, setQuery] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % SAMPLE_QUERIES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query);
    else onNavigate({ name: 'search' });
  };

  const featuredSlugs = ['primary-care', 'mental-health', 'dental', 'food-bank', 'pharmacy', 'transportation'];
  const featured = featuredSlugs
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter(Boolean) as ResourceCategory[];

  return (
    <section className="relative pt-16 lg:pt-20 overflow-hidden bg-cream-50">
      {/* Subtle sage radial wash */}
      <div className="absolute inset-0 bg-mesh-radial pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-[0.04] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #1e293b, transparent 70%)' }} />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-20 pb-16 lg:pb-24">
        <div className="text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-ink-200 shadow-soft mb-6">
            <Sparkle size={14} weight="fill" className="text-sage-600" />
            <span className="text-xs font-semibold text-primary-700 tracking-wide">
              {totalResources.toLocaleString()}+ resources across {totalCities} Washington communities
            </span>
          </div>

          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[3.5rem] text-primary-800 leading-[1.1] tracking-tight">
            Find the{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-sage-700">right care</span>
              <svg className="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none">
                <path d="M2 5.5C50 2 150 2 198 5.5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>
            ,<br />
            wherever you are.
          </h1>

          <p className="mt-6 text-lg text-primary-600 leading-relaxed max-w-2xl mx-auto font-sans">
            Search in plain language for healthcare, food, transportation, and community resources
            across Washington State, filtered to your insurance, language, and needs.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 rounded-2xl bg-white border border-ink-200 shadow-card focus-within:border-sage-400 focus-within:ring-4 focus-within:ring-sage-500/10 transition-all p-2">
              <div className="flex items-center gap-2 pl-3 flex-1">
                <MagnifyingGlass size={20} weight="regular" className="text-ink-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Try: "${SAMPLE_QUERIES[placeholderIdx]}"`}
                  className="flex-1 bg-transparent text-sm text-primary-800 placeholder:text-ink-400 focus:outline-none py-2.5 font-sans"
                  aria-label="Search for healthcare resources"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 transition-colors flex-shrink-0"
              >
                <Sparkle size={16} weight="fill" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {SAMPLE_QUERIES.slice(0, 4).map((q) => (
              <button
                key={q}
                onClick={() => onSearch(q)}
                className="px-3.5 py-1.5 rounded-full bg-white border border-ink-200 text-xs font-medium text-primary-600 hover:border-sage-300 hover:text-sage-700 hover:bg-sage-50 transition-all max-w-full truncate"
                title={q}
              >
                {q}
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-primary-500">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={16} weight="regular" className="text-sage-600" />
              Free and confidential
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={16} weight="regular" className="text-secondary-600" />
              39 counties statewide
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkle size={16} weight="fill" className="text-accent-500" />
              Search by keyword or zip
            </span>
          </div>
        </div>

        {/* Bento grid: Emergency + Categories */}
        <div className="mt-12 grid lg:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '120ms' }}>
          <div className="relative rounded-2xl bg-primary-800 p-6 shadow-card overflow-hidden lg:col-span-1">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <Warning size={20} weight="regular" className="text-white" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">Emergency?</span>
              </div>
              <p className="text-white/80 text-sm mb-4 font-sans">Call 911 for life-threatening emergencies. 988 for mental health crises.</p>
              <div className="flex gap-2">
                <a href="tel:911" className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white text-danger-700 font-bold text-sm hover:bg-danger-50 transition-colors">
                  <Phone size={16} weight="regular" /> 911
                </a>
                <a href="tel:988" className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors">
                  <Phone size={16} weight="regular" /> 988
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl bg-white border border-ink-200 shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary-700 font-sans">Browse by category</h3>
              <button
                onClick={() => onNavigate({ name: 'search' })}
                className="text-xs font-medium text-sage-600 hover:text-sage-700 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight size={12} weight="regular" />
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {featured.map((cat) => {
                const Icon = getCategoryIcon(cat.icon);
                const color = getCategoryColor(cat.color);
                return (
                  <button
                    key={cat.id}
                    onClick={() => onNavigate({ name: 'search', categorySlug: cat.slug })}
                    className="group flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-cream-100 transition-colors text-center"
                  >
                    <div className={`w-10 h-10 rounded-xl ${color.bgSoft} ${color.text} flex items-center justify-center transition-transform group-hover:scale-105`}>
                      <Icon size={20} weight="regular" />
                    </div>
                    <span className="text-[10px] font-medium text-primary-600 leading-tight font-sans">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
