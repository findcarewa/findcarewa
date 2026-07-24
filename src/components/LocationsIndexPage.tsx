import { useState, useMemo, useEffect } from 'react';
import { MapPin, Search, Building2, ArrowRight } from './IconLib';
import type { Route } from '../lib/router';
import { toLocationSlug } from '../lib/router';
import type { ResourceWithCategory } from '../lib/supabase';
import { setPageMeta, injectPageSchema, locationIndexMeta, breadcrumbSchema } from '../lib/seo';

interface LocationsIndexPageProps {
  resources: ResourceWithCategory[];
  onNavigate: (route: Route) => void;
}

export function LocationsIndexPage({ resources, onNavigate }: LocationsIndexPageProps) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    setPageMeta(locationIndexMeta());
    injectPageSchema('breadcrumb', breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Locations', path: '/#/locations' },
    ]));
    injectPageSchema('itemList', null);
    injectPageSchema('collectionPage', null);
    return () => {
      injectPageSchema('breadcrumb', null);
    };
  }, []);

  // Build city and county lists with resource counts
  const { cities, counties } = useMemo(() => {
    const cityMap = new Map<string, number>();
    const countyMap = new Map<string, number>();
    resources.forEach((r) => {
      cityMap.set(r.city, (cityMap.get(r.city) ?? 0) + 1);
      countyMap.set(r.county, (countyMap.get(r.county) ?? 0) + 1);
    });
    return {
      cities: [...cityMap.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
      counties: [...countyMap.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
    };
  }, [resources]);

  const filteredCities = useMemo(() => {
    if (!search) return cities;
    const q = search.toLowerCase();
    return cities.filter((c) => c.name.toLowerCase().includes(q));
  }, [cities, search]);

  const filteredCounties = useMemo(() => {
    if (!search) return counties;
    const q = search.toLowerCase();
    return counties.filter((c) => c.name.toLowerCase().includes(q));
  }, [counties, search]);

  return (
    <section className="min-h-screen pt-20 lg:pt-24 pb-16 bg-cream-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-primary-500 mb-4">
          <button onClick={() => onNavigate({ name: 'home' })} className="hover:text-primary-700 transition-colors">Home</button>
          <span className="text-primary-300">/</span>
          <span className="text-primary-700 font-semibold">Locations</span>
        </nav>

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-primary-700 to-primary-900 p-6 sm:p-8 mb-6 overflow-hidden relative">
          <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/5" />
          <div className="relative flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/20">
              <MapPin className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                Healthcare Resources by Location
              </h1>
              <p className="mt-2 text-sm text-slate-200 max-w-xl">
                Browse {cities.length} cities and {counties.length} counties across Washington State. Find clinics, food banks, mental health services, dental care, and community resources near you.
              </p>
            </div>
          </div>
        </div>

        {/* Search filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 rounded-2xl bg-white border border-ink-200 shadow-soft focus-within:border-sage-400 focus-within:ring-4 focus-within:ring-sage-500/10 transition-all p-2">
            <div className="flex items-center gap-2 pl-3 flex-1">
              <Search className="w-5 h-5 text-primary-500 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by city or county name..."
                className="flex-1 bg-transparent text-sm text-primary-800 placeholder:text-primary-400 focus:outline-none py-2.5"
                aria-label="Filter locations"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="px-2 py-1 rounded-lg text-xs font-medium text-primary-500 hover:bg-cream-200 transition-colors flex-shrink-0"
                >Clear</button>
              )}
            </div>
          </div>
        </div>

        {/* Counties */}
        {filteredCounties.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display font-bold text-lg text-primary-800 mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-secondary-600" /> Counties
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredCounties.map((county) => (
                <button
                  key={county.name}
                  onClick={() => onNavigate({ name: 'location', location: toLocationSlug(county.name) })}
                  className="group flex items-center justify-between p-3 rounded-xl bg-white border border-ink-200 hover:border-sage-300 hover:shadow-soft transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary-400" />
                    <span className="text-sm font-semibold text-primary-700">{county.name} County</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-primary-400">{county.count}</span>
                    <ArrowRight className="w-3 h-3 text-primary-300 group-hover:text-sage-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cities */}
        {filteredCities.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display font-bold text-lg text-primary-800 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sage-600" /> Cities
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredCities.map((city) => (
                <button
                  key={city.name}
                  onClick={() => onNavigate({ name: 'location', location: toLocationSlug(city.name) })}
                  className="group flex items-center justify-between p-3 rounded-xl bg-white border border-ink-200 hover:border-sage-300 hover:shadow-soft transition-all"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary-400" />
                    <span className="text-sm font-semibold text-primary-700">{city.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-primary-400">{city.count}</span>
                    <ArrowRight className="w-3 h-3 text-primary-300 group-hover:text-sage-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredCities.length === 0 && filteredCounties.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-primary-500">No locations match "{search}". Try a different search.</p>
          </div>
        )}
      </div>
    </section>
  );
}
