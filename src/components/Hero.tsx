import { useState } from 'react';
import {
  MagnifyingGlass, MapPin, ShieldCheck,
  ArrowRight, Warning, Phone, Heart,
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
];

export function Hero({ onSearch, onNavigate, categories, totalResources, totalCities }: HeroProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query);
    else onNavigate({ name: 'search' });
  };

  const featuredSlugs = ['primary-care', 'mental-health', 'dental', 'food-bank', 'pharmacy', 'transportation'];
  const featured = featuredSlugs
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter(Boolean) as ResourceCategory[];

  return (
    <section className="relative overflow-hidden bg-cream-50">
      <div className="absolute inset-0 bg-mesh-radial pointer-events-none" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-24 pb-16 lg:pb-20">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-ink-200 shadow-soft">
            <MapPin size={14} weight="fill" className="text-sage-600" />
            <span className="text-xs font-semibold text-primary-700 tracking-wide">
              {totalResources.toLocaleString()}+ resources across {totalCities} Washington communities
            </span>
          </div>

          <h1 className="mt-6 font-display font-bold text-4xl sm:text-5xl lg:text-[3.5rem] text-primary-800 leading-[1.08] tracking-tight">
            Find the <span className="text-sage-600 underline decoration-sage-400 decoration-2 underline-offset-4">right care</span>,
            <br />
            wherever you are.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-primary-600 leading-relaxed max-w-2xl mx-auto font-sans">
            Search in plain language for healthcare, food, transportation, and community
            resources across Washington State, filtered to your insurance, language, and needs.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 max-w-xl mx-auto">
            <div className="flex items-center gap-2 rounded-2xl bg-white border border-ink-200 shadow-card focus-within:border-sage-400 focus-within:ring-4 focus-within:ring-sage-500/10 transition-all p-2">
              <div className="flex items-center gap-2 pl-3 flex-1 min-w-0">
                <MagnifyingGlass size={20} weight="regular" className="text-ink-400 flex-shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Try: “dental 98104”"
                  className="flex-1 min-w-0 bg-transparent text-sm text-primary-800 placeholder:text-ink-400 focus:outline-none py-2.5 font-sans"
                  aria-label="Search for healthcare resources"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-800 text-white text-sm font-semibold hover:bg-primary-900 transition-colors flex-shrink-0"
              >
                <ArrowRight size={16} weight="bold" />
                <span>Search</span>
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {SAMPLE_QUERIES.map((sample) => (
              <button
                key={sample}
                onClick={() => onSearch(sample)}
                className="px-3.5 py-1.5 rounded-full bg-white border border-ink-200 text-[11px] font-medium text-primary-600 hover:border-sage-300 hover:text-sage-700 hover:bg-sage-50 transition-all"
              >
                {sample}
              </button>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-primary-500">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} weight="regular" className="text-sage-600" />
              Free and confidential
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} weight="regular" className="text-secondary-600" />
              39 counties statewide
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ArrowRight size={14} weight="bold" className="text-accent-600" />
              Search by keyword or zip
            </span>
          </div>
        </div>

        <div className="mt-9 grid lg:grid-cols-3 gap-4">
          <div className="relative rounded-2xl bg-primary-800 p-5 shadow-card overflow-hidden lg:col-span-1">
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Warning size={17} weight="regular" className="text-white" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Emergency?</span>
              </div>
              <p className="text-white/80 text-xs leading-relaxed mb-4 font-sans">
                Call 911 for life-threatening emergencies.<br />
                988 for mental health crises.
              </p>
              <div className="flex gap-2">
                <a href="tel:911" className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white text-danger-700 font-bold text-xs hover:bg-danger-50 transition-colors">
                  <Phone size={14} weight="regular" /> 911
                </a>
                <a href="tel:988" className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-xs hover:bg-white/20 transition-colors">
                  <Heart size={14} weight="fill" /> 988
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl bg-white border border-ink-200 shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-primary-700 font-sans">Browse by category</h2>
              <button
                onClick={() => onNavigate({ name: 'search' })}
                className="text-[11px] font-medium text-sage-600 hover:text-sage-700 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight size={12} weight="regular" />
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {featured.map((category) => {
                const Icon = getCategoryIcon(category.icon);
                const color = getCategoryColor(category.color);
                return (
                  <button
                    key={category.id}
                    onClick={() => onNavigate({ name: 'search', categorySlug: category.slug })}
                    className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-cream-100 transition-colors text-center"
                  >
                    <div className={`w-9 h-9 rounded-xl ${color.bgSoft} ${color.text} flex items-center justify-center transition-transform group-hover:scale-105`}>
                      <Icon size={18} weight="regular" />
                    </div>
                    <span className="text-[9px] font-medium text-primary-600 leading-tight font-sans">{category.name}</span>
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
