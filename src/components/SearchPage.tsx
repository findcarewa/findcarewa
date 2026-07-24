import { useState, useEffect, useMemo, useRef, useDeferredValue } from 'react';
import {
  Search, SlidersHorizontal, Star, MapPin, Clock, Check,
  Frown, Map as MapIcon, List, DollarSign,
  Building2, Sparkles, Heart,
} from './IconLib';
import type { ResourceCategory, ResourceWithCategory } from '../lib/supabase';
import { searchResources, buildSearchIndex, extractZip, featuredServices, type SearchFilters } from '../lib/fuseSearch';
import { fetchSymptoms, type Symptom } from '../lib/symptoms';
import { useFavorites } from '../lib/favorites';
import { useAuth } from '../lib/auth';
import { getCategoryIcon, getCategoryColor } from '../lib/icons';
import { formatCost, isOpenNow, formatTodayHours, roundDownFriendly } from '../lib/format';
import { hasRating } from '../lib/resourceImages';
import { ResourceDetail } from './ResourceDetail';
import { highlightSegments } from '../lib/highlight';

interface SearchPageProps {
  resources: ResourceWithCategory[];
  categories: ResourceCategory[];
  initialQuery?: string;
  initialCategorySlug?: string;
  initialCity?: string;
  onNavigate: (route: any) => void;
}

export function SearchPage({
  resources, categories, initialQuery, initialCategorySlug, initialCity, onNavigate,
}: SearchPageProps) {
  const [search, setSearch] = useState(initialQuery || '');
  const deferredSearch = useDeferredValue(search);
  const [zipFilter, setZipFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | undefined>(initialCategorySlug);
  const [county, setCounty] = useState('');
  const [city, setCity] = useState(initialCity || '');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResource, setSelectedResource] = useState<ResourceWithCategory | null>(null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);

  // Load symptoms DB for search index
  useEffect(() => {
    fetchSymptoms().then(setSymptoms).catch(() => {});
  }, []);

  // Build Fuse.js index whenever resources or symptoms change
  const searchIndex = useMemo(
    () => buildSearchIndex(resources, symptoms),
    [resources, symptoms],
  );

  // Filter toggles
  const [acceptsMedicaid, setAcceptsMedicaid] = useState(false);
  const [medicare, setMedicare] = useState(false);
  const [acceptsUninsured, setAcceptsUninsured] = useState(false);
  const [slidingScale, setSlidingScale] = useState(false);
  const [freeOptions, setFreeOptions] = useState(false);
  const [free, setFree] = useState(false);
  const [telehealth, setTelehealth] = useState(false);
  const [walkIns, setWalkIns] = useState(false);
  const [appointmentsAvailable, setAppointmentsAvailable] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [wheelchairAccessible, setWheelchairAccessible] = useState(false);
  const [language, setLanguage] = useState('');

  useEffect(() => {
    if (initialQuery !== undefined) setSearch(initialQuery);
  }, [initialQuery]);
  useEffect(() => { if (initialCategorySlug !== undefined) setActiveCategory(initialCategorySlug); }, [initialCategorySlug]);
  useEffect(() => { if (initialCity !== undefined) setCity(initialCity); }, [initialCity]);

  // Zip is derived purely from the main search bar. Typing "dental 98104"
  // auto-extracts 98104 as the zip filter. Clearing the zip from the text clears the filter.
  useEffect(() => {
    const z = extractZip(search);
    setZipFilter(z ?? '');
  }, [search]);

  const counties = useMemo(
    () => Array.from(new Set(resources.map((r) => r.county))).sort(),
    [resources]
  );

  const allLanguages = useMemo(() => {
    const langs = new Set<string>();
    resources.forEach((r) => r.languages.forEach((l) => langs.add(l)));
    return Array.from(langs).sort();
  }, [resources]);

  const filtered = useMemo(() => {
    const filters: HybridFilters = {
      zip: zipFilter || undefined,
      text: deferredSearch || undefined,
      categorySlug: activeCategory,
      city: city || undefined,
      county: county || undefined,
      acceptsMedicaid,
      medicare,
      acceptsUninsured,
      slidingScale,
      freeOptions,
      free,
      telehealth,
      walkIns,
      appointmentsAvailable,
      openNow,
      wheelchairAccessible,
      language: language || undefined,
    };

    const results = searchResources(searchIndex, resources, filters);

    // For text searches, Fuse.js ranking is authoritative — don't override it.
    // For browse-only (no text), sort by open-now + rating.
    if (deferredSearch && deferredSearch.trim().length >= 2) {
      return results;
    }

    return [...results].sort((a, b) => {
      const aOpen = isOpenNow(a.hours) ? 1 : 0;
      const bOpen = isOpenNow(b.hours) ? 1 : 0;
      if (aOpen !== bOpen) return bOpen - aOpen;
      return b.rating - a.rating;
    });
  }, [resources, searchIndex, activeCategory, county, city, acceptsMedicaid, medicare, acceptsUninsured,
      slidingScale, freeOptions, free, telehealth, walkIns, appointmentsAvailable, openNow,
      wheelchairAccessible, language, deferredSearch, zipFilter]);

  const handleClear = () => {
    setSearch(''); setZipFilter('');
    setActiveCategory(undefined); setCounty(''); setCity('');
    setAcceptsMedicaid(false); setMedicare(false); setAcceptsUninsured(false);
    setSlidingScale(false); setFreeOptions(false); setFree(false);
    setTelehealth(false); setWalkIns(false); setAppointmentsAvailable(false);
    setOpenNow(false); setWheelchairAccessible(false); setLanguage('');
  };

  const activeFilterCount =
    (acceptsMedicaid ? 1 : 0) + (medicare ? 1 : 0) + (acceptsUninsured ? 1 : 0) +
    (slidingScale ? 1 : 0) + (freeOptions ? 1 : 0) + (free ? 1 : 0) +
    (telehealth ? 1 : 0) + (walkIns ? 1 : 0) + (appointmentsAvailable ? 1 : 0) +
    (openNow ? 1 : 0) + (wheelchairAccessible ? 1 : 0) +
    (language ? 1 : 0) + (county ? 1 : 0) + (city ? 1 : 0) + (zipFilter ? 1 : 0);

  return (
    <section className="min-h-screen pt-20 lg:pt-24 pb-16 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-primary-800 tracking-tight">
            Find Care &amp; Resources
          </h1>
          <p className="mt-1 text-sm text-primary-500">
            {roundDownFriendly(resources.length).toLocaleString()}+ resources across Washington State. Search by keyword or zip, or filter manually.
          </p>
        </div>

        {/* Unified search bar — Google-like, live deterministic filtering */}
        <div className="mb-4">
          <div className="flex items-center gap-2 rounded-2xl bg-white border border-ink-200 shadow-soft focus-within:border-sage-400 focus-within:ring-4 focus-within:ring-sage-500/10 transition-all p-2">
            <div className="flex items-center gap-2 pl-3 flex-1">
              <Search className="w-5 h-5 text-primary-500 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, service, or city, e.g., dental 98104, food bank Seattle"
                className="flex-1 bg-transparent text-sm text-primary-800 placeholder:text-primary-400 focus:outline-none py-2.5"
                aria-label="Search for resources"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="px-2 py-1 rounded-lg text-xs font-medium text-primary-500 hover:bg-cream-200 transition-colors flex-shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active zip indicator — zip is extracted from the main search bar */}
        {zipFilter && (
          <div className="mb-3">
            <button
              onClick={() => setSearch(search.replace(/\b\d{5}\b/g, '').trim())}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-50 border border-sage-200 text-xs font-medium text-sage-700 hover:bg-sage-100 transition-colors"
            >
              <MapPin className="w-3 h-3" />
              Zip {zipFilter}
              <span className="ml-1 text-sage-400">remove</span>
            </button>
          </div>
        )}

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
          <button
            onClick={() => setActiveCategory(undefined)}
            className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 ease-out-expo whitespace-nowrap ${!activeCategory ? 'bg-primary-700 text-white shadow-soft' : 'bg-white text-primary-600 border border-ink-200 hover:border-sage-200'}`}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(isActive ? undefined : cat.slug)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 ease-out-expo whitespace-nowrap ${isActive ? 'bg-primary-700 text-white shadow-soft' : 'bg-white text-primary-600 border border-ink-200 hover:border-sage-200'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Filter by city..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-ink-200 text-sm focus:outline-none focus:border-sage-400 focus:ring-4 focus:ring-sage-500/10 transition-all"
            />
          </div>
          <select
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            className="appearance-none px-3 py-2.5 rounded-xl bg-white border border-ink-200 text-sm text-primary-700 focus:outline-none focus:border-sage-400 focus:ring-4 focus:ring-sage-500/10 transition-all cursor-pointer sm:w-44"
          >
            <option value="">All Counties</option>
            {counties.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ease-out-expo ${showFilters || activeFilterCount > 0 ? 'bg-sage-50 border border-sage-200 text-primary-700' : 'bg-white border border-ink-200 text-primary-700 hover:border-sage-200'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-sage-600 text-white text-[10px] font-bold">{activeFilterCount}</span>
            )}
          </button>
          {/* View toggle */}
          <div className="flex rounded-xl border border-ink-200 bg-white p-1">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ease-out-expo flex items-center gap-1.5 ${view === 'list' ? 'bg-primary-700 text-white' : 'text-primary-600 hover:bg-cream-100'}`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setView('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ease-out-expo flex items-center gap-1.5 ${view === 'map' ? 'bg-primary-700 text-white' : 'text-primary-600 hover:bg-cream-100'}`}
            >
              <MapIcon className="w-3.5 h-3.5" /> Map
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mb-4 p-5 rounded-2xl bg-white border border-ink-200 shadow-soft animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary-800">Filter by access, cost &amp; language</h3>
              {activeFilterCount > 0 && (
                <button onClick={handleClear} className="text-xs font-medium text-sage-600 hover:text-sage-700">Clear all</button>
              )}
            </div>
            <div className="space-y-4">

              {/* Availability */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-400 mb-2">Availability</p>
                <div className="flex flex-wrap gap-2">
                  <ToggleChip active={openNow} onClick={() => setOpenNow(!openNow)} label="Open now" />
                  <ToggleChip active={walkIns} onClick={() => setWalkIns(!walkIns)} label="Walk-ins welcome" />
                  <ToggleChip active={appointmentsAvailable} onClick={() => setAppointmentsAvailable(!appointmentsAvailable)} label="Takes appointments" />
                  <ToggleChip active={telehealth} onClick={() => setTelehealth(!telehealth)} label="Telehealth available" />
                </div>
              </div>

              {/* Cost */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-400 mb-2">Cost</p>
                <div className="flex flex-wrap gap-2">
                  <ToggleChip active={free} onClick={() => { setFree(!free); if (!free) setFreeOptions(false); }} label="Free to all" />
                  <ToggleChip active={freeOptions} onClick={() => { setFreeOptions(!freeOptions); if (!freeOptions) setFree(false); }} label="Free options avail." />
                  <ToggleChip active={slidingScale} onClick={() => setSlidingScale(!slidingScale)} label="Sliding scale" />
                </div>
              </div>

              {/* Insurance */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-400 mb-2">Insurance accepted</p>
                <div className="flex flex-wrap gap-2">
                  <ToggleChip active={acceptsMedicaid} onClick={() => setAcceptsMedicaid(!acceptsMedicaid)} label="Apple Health (Medicaid)" />
                  <ToggleChip active={medicare} onClick={() => setMedicare(!medicare)} label="Medicare" />
                  <ToggleChip active={acceptsUninsured} onClick={() => setAcceptsUninsured(!acceptsUninsured)} label="Uninsured OK" />
                </div>
              </div>

              {/* Accessibility */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-400 mb-2">Accessibility</p>
                <div className="flex flex-wrap gap-2">
                  <ToggleChip active={wheelchairAccessible} onClick={() => setWheelchairAccessible(!wheelchairAccessible)} label="Wheelchair accessible" />
                </div>
              </div>

              {/* Language */}
              {allLanguages.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-400 mb-2">Language</p>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="appearance-none px-3 py-2 rounded-lg bg-white border border-ink-200 text-sm text-primary-700 focus:outline-none focus:border-sage-400 cursor-pointer w-full sm:w-56"
                  >
                    <option value="">Any language</option>
                    {allLanguages.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-primary-500">
            <span className="font-semibold text-primary-800">{filtered.length.toLocaleString()}</span>{' '}
            {filtered.length === 1 ? 'resource' : 'resources'} found
          </p>
          {activeFilterCount > 0 && (
            <button onClick={handleClear} className="text-xs font-medium text-sage-600 hover:text-sage-700">Reset filters</button>
          )}
        </div>

        {/* Results: list or map */}
        {filtered.length === 0 ? (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white border border-ink-200 p-8 sm:p-12 text-center">
              <Frown className="w-10 h-10 text-primary-300 mx-auto mb-3" />
              <h3 className="font-semibold text-primary-700">No services found in your area yet</h3>
              <p className="text-sm text-primary-500 mt-1 max-w-md mx-auto">
                We couldn't find services matching your filters. Try a different zip code, broaden your keywords, or clear filters to see what's available nearby.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <button onClick={handleClear} className="px-4 py-2 rounded-lg bg-primary-700 text-white text-sm font-medium hover:bg-primary-800 transition-all duration-200 ease-out-expo">
                  Clear all filters
                </button>
                {zipFilter && (
                  <button onClick={() => setSearch(search.replace(/\b\d{5}\b/g, '').trim())} className="px-4 py-2 rounded-lg bg-cream-200 text-primary-700 text-sm font-medium hover:bg-cream-300 transition-all duration-200 ease-out-expo">
                    Remove zip {zipFilter}
                  </button>
                )}
              </div>
            </div>

            {/* Featured Services Near You */}
            {resources.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-accent-600" />
                  <h4 className="font-semibold text-primary-700">Featured Services Near You</h4>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredServices(resources, 6).map((resource, idx) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      category={categories.find((c) => c.id === resource.category_id)}
                      onClick={() => setSelectedResource(resource)}
                      animationDelay={Math.min(idx * 30, 300)}
                      searchQuery={searchQuery}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : view === 'map' ? (
          <MapView resources={filtered.slice(0, 200)} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.slice(0, 60).map((resource, idx) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                category={categories.find((c) => c.id === resource.category_id)}
                onClick={() => setSelectedResource(resource)}
                animationDelay={Math.min(idx * 30, 300)}
                searchQuery={searchQuery}
              />
            ))}
            {filtered.length > 60 && (
              <div className="col-span-full text-center py-6">
                <p className="text-sm text-primary-500">Showing 60 of {filtered.length.toLocaleString()} results.</p>
                <p className="text-xs text-primary-400 mt-1">Refine your search to see more specific matches.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedResource && (
        <ResourceDetail
          resource={selectedResource}
          categories={categories}
          onClose={() => setSelectedResource(null)}
          onNavigate={onNavigate}
        />
      )}
    </section>
  );
}

function MapView({ resources }: {
  resources: ResourceWithCategory[];
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  // Load Leaflet from CDN if not already
  useEffect(() => {
    if (document.querySelector('#leaflet-css')) {
      initMap();
      return;
    }
    const css = document.createElement('link');
    css.id = 'leaflet-css';
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initMap();
    document.body.appendChild(script);
    // eslint-disable-next-line
  }, []);

  function initMap() {
    if (!window.L || !mapRef.current || mapInstance.current) return;
    const map = window.L.map(mapRef.current).setView([47.3511, -120.7401], 6); // WA center
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);
    mapInstance.current = map;
    updateMarkers();
  }

  function updateMarkers() {
    if (!mapInstance.current || !window.L) return;
    const bounds: [number, number][] = [];

    resources.forEach((r) => {
      if (r.lat && r.lng) {
        const cat = r.resource_categories;
        const pinColor = '#0d9488';
        const pinSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='26' height='36.4' viewBox='0 0 32 44.8'>
          <defs><filter id='s'><feDropShadow dx='0' dy='1.6' stdDeviation='1.4' flood-color='#0f172a' flood-opacity='0.35'/></filter></defs>
          <path d='M16 1.5C8.0 1.5 1.5 8.0 1.5 16c0 10.6 14.5 27.3 14.5 27.3S30.5 26.6 30.5 16C30.5 8.0 24.0 1.5 16 1.5z'
            fill='${pinColor}' stroke='#ffffff' stroke-width='2.4' stroke-linejoin='round' filter='url(#s)'/>
          <circle cx='16' cy='15.5' r='4.6' fill='#ffffff' fill-opacity='0.96'/>
          <circle cx='16' cy='15.5' r='2.1' fill='${pinColor}'/>
        </svg>`;
        const pinIcon = window.L.divIcon({
          className: 'fc-map-pin',
          html: `<img src='data:image/svg+xml;base64,${btoa(pinSvg)}' style='width:26px;height:36.4px;display:block'/>`,
          iconSize: [26, 36.4],
          iconAnchor: [13, 36.4],
          popupAnchor: [0, -32],
        });
        const marker = window.L.marker([r.lat, r.lng], { icon: pinIcon }).addTo(mapInstance.current);
        marker.bindPopup(`
          <div style="min-width:180px">
            <strong style="font-size:13px">${r.name}</strong><br/>
            <span style="font-size:11px;color:#64748b">${cat?.name || 'Resource'} \u00b7 ${r.city}</span><br/>
            <a href="#/resource/${r.id}" style="font-size:12px;color:#0d9488">View details \u2192</a>
          </div>
        `);
        bounds.push([r.lat!, r.lng!]);
      }
    });

    if (bounds.length > 1) {
      mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
    } else if (bounds.length === 1) {
      mapInstance.current.setView(bounds[0], 13);
    }
  }

  useEffect(() => {
    updateMarkers();
    // eslint-disable-next-line
  }, [resources]);

  return (
    <div className="rounded-2xl overflow-hidden border border-ink-200 shadow-soft">
      <div className="bg-white px-4 py-2.5 border-b border-ink-100 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary-600" />
        <span className="text-sm font-medium text-primary-700">Map view · {resources.length} resources</span>
        <span className="text-xs text-primary-400 ml-auto">Click a marker for details</span>
      </div>
      <div ref={mapRef} className="h-[500px] w-full bg-cream-200" />
    </div>
  );
}

function ToggleChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ease-out-expo border ${active ? 'bg-sage-50 border-sage-200 text-primary-700' : 'bg-white border-ink-200 text-primary-600 hover:border-sage-200'}`}
    >
      <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${active ? 'bg-sage-600 text-white' : 'bg-cream-200'}`}>
        {active && <Check className="w-3 h-3" strokeWidth={3} />}
      </span>
      {label}
    </button>
  );
}

function ResourceCard({
  resource, category, onClick, animationDelay, searchQuery,
}: {
  resource: ResourceWithCategory;
  category?: ResourceCategory;
  onClick: () => void;
  animationDelay: number;
  searchQuery: string;
}) {
  const Icon = category ? getCategoryIcon(category.icon) : Building2;
  const color = category ? getCategoryColor(category.color) : getCategoryColor('teal');
  const { isFavorite, toggle } = useFavorites();
  const { user } = useAuth();
  const isFav = isFavorite(resource.id);
  const open = isOpenNow(resource.hours);
  const todayHours = formatTodayHours(resource.hours);

  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${animationDelay}ms` }}
      className="card-editororial group text-left rounded-2xl bg-white border border-ink-200 overflow-hidden shadow-soft hover:shadow-card hover:-translate-y-0.5 hover:border-sage-200 transition-all duration-200 ease-out-expo animate-fade-up flex flex-col"
    >
      <div className={`relative h-28 overflow-hidden bg-gradient-to-br ${color.pastelBg}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className={`w-12 h-12 ${color.pastelAccent} opacity-40 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-60`} strokeWidth={1.5} />
        </div>
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5">
          {user && (
            <button
              onClick={(e) => { e.stopPropagation(); toggle(resource.id); }}
              className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center hover:bg-white transition-colors"
              aria-label={isFav ? "Remove from saved" : "Save resource"}
            >
              <Heart className={'w-3.5 h-3.5 ' + (isFav ? 'text-danger-600 fill-danger-600' : 'text-primary-400')} />
            </button>
          )}
          {open ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-sage-600/90 text-white backdrop-blur-sm">Open</span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-primary-800/70 text-white backdrop-blur-sm">Closed</span>
          )}
        </div>
        {category && (
          <div className={`absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-white/70 ${color.pastelText} backdrop-blur-sm`}>
            <Icon className="w-3 h-3" />
            {category.name}
          </div>
        )}
      </div>
      <div className="p-3.5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold text-sm text-primary-800 leading-tight group-hover:text-primary-700 transition-colors line-clamp-2">
            {highlightSegments(resource.name, searchQuery).map((seg, i) =>
              seg.match ? <mark key={i} className="bg-sage-200 text-primary-900 rounded px-0.5">{seg.text}</mark> : seg.text
            )}
          </h3>
          {hasRating(resource.rating) ? (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Star className="w-3 h-3 text-warning-500 fill-warning-500" />
              <span className="text-xs font-bold text-primary-700">{resource.rating.toFixed(1)}</span>
            </div>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-primary-500 line-clamp-2 leading-relaxed">
          {highlightSegments(resource.description, searchQuery).map((seg, i) =>
            seg.match ? <mark key={i} className="bg-sage-200 text-primary-900 rounded px-0.5">{seg.text}</mark> : seg.text
          )}
        </p>
        <div className="mt-2 space-y-1 text-[11px] text-primary-600 flex-1">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-primary-400" />
            <span className="truncate">{todayHours}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3 h-3 text-primary-400" />
            <span className="truncate">{formatCost(resource.cost_estimate_min, resource.cost_estimate_max, resource.cost_free, resource.sliding_scale)}</span>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {resource.cost_free && <Badge color="accent">Free to all</Badge>}
          {!resource.cost_free && resource.sliding_scale && <Badge color="accent">Free options avail.</Badge>}
          {resource.medicaid && <Badge color="success">Apple Health</Badge>}
          {resource.medicare && <Badge color="success">Medicare</Badge>}
          {resource.telehealth && <Badge color="secondary">Telehealth</Badge>}
          {resource.walk_ins_welcome && <Badge color="primary">Walk-ins OK</Badge>}
          {resource.languages.length > 1 && resource.languages[1] !== 'English' && (
            <Badge color="cyan">{resource.languages[1]}</Badge>
          )}
        </div>
      </div>
    </button>
  );
}

function Badge({ color, children }: { color: 'success' | 'primary' | 'secondary' | 'accent' | 'cyan' | 'warning'; children: React.ReactNode }) {
  const colors = {
    success: 'bg-success-50 text-success-700',
    primary: 'bg-sage-50 text-sage-700',
    secondary: 'bg-secondary-50 text-secondary-700',
    accent: 'bg-accent-50 text-accent-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    warning: 'bg-warning-50 text-warning-700',
  };
  return <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${colors[color]}`}>{children}</span>;
}
