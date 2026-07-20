import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X, MapPin, Filter, Layers, Navigation, Clock } from 'lucide-react';
import type { ResourceCategory, ResourceWithCategory } from '../lib/supabase';
import { isOpenNow, formatTodayHours } from '../lib/format';
import { loadGoogleMaps } from '../lib/mapsLoader';
import { ResourceDetail } from './ResourceDetail';

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// WA state center + zoom
const WA_CENTER  = { lat: 47.4009, lng: -120.5015 };
const WA_ZOOM    = 7;

// Category slug → pin colour (hex, must contrast on light map)
const PIN_COLORS: Record<string, string> = {
  hospital:        '#1e4060',
  'primary-care':  '#2d6a4f',
  fqhc:            '#1a5276',
  'mental-health': '#5d3a7e',
  'substance-use': '#7e5a3a',
  dental:          '#1b6ca8',
  'crisis-line':   '#c0392b',
  'community-org': '#2e7d32',
  'food-bank':     '#e65100',
  transportation:  '#1565c0',
  veterans:        '#37474f',
  pediatrics:      '#ad1457',
  pharmacy:        '#00695c',
  'legal-aid':     '#4a148c',
};
const DEFAULT_PIN = '#455a64';

function pinColor(slug: string | undefined): string {
  return PIN_COLORS[slug ?? ''] ?? DEFAULT_PIN;
}

/** Build a modern SVG pin data-URI.
 *  Crisp white ring + soft drop shadow lift it off any basemap;
 *  solid colored body with a small white inner dot gives a clean focal point. */
function makePinSvg(color: string, size = 34, selected = false): string {
  const stroke = selected ? 3.2 : 2.4;
  const dotR = selected ? 2.6 : 2.1;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.4}" viewBox="0 0 32 44.8">
    <defs>
      <filter id="s" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="1.6" stdDeviation="1.4" flood-color="#0f172a" flood-opacity="${selected ? 0.45 : 0.32}"/>
      </filter>
    </defs>
    <path d="M16 1.5C8.0 1.5 1.5 8.0 1.5 16c0 10.6 14.5 27.3 14.5 27.3S30.5 26.6 30.5 16C30.5 8.0 24.0 1.5 16 1.5z"
      fill="${color}" stroke="#ffffff" stroke-width="${stroke}" stroke-linejoin="round" filter="url(#s)"/>
    <circle cx="16" cy="15.5" r="4.6" fill="#ffffff" fill-opacity="0.96"/>
    <circle cx="16" cy="15.5" r="${dotR}" fill="${color}"/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

interface HealthMapProps {
  resources: ResourceWithCategory[];
  categories: ResourceCategory[];
  onNavigate: (route: any) => void;
}

export function HealthMap({ resources, categories, onNavigate }: HealthMapProps) {
  const mapRef  = useRef<HTMLDivElement>(null);
  const gMap    = useRef<google.maps.Map | null>(null);
  const infoWindow = useRef<google.maps.InfoWindow | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);

  const [mapReady,  setMapReady]  = useState(false);
  const [mapError,  setMapError]  = useState<string | null>(null);
  const [selected,  setSelected]  = useState<ResourceWithCategory | null>(null);
  const [search,    setSearch]    = useState('');
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [onlyOpen,  setOnlyOpen]  = useState(false);

  // Resources that are mappable (have lat/lng)
  const mappable = useMemo(
    () => resources.filter((r) => r.lat != null && r.lng != null),
    [resources]
  );

  // Filtered set based on sidebar search + category + open-now
  const filtered = useMemo(() => {
    let set = mappable;
    if (activeSlug) set = set.filter((r) => r.resource_categories?.slug === activeSlug);
    if (onlyOpen)   set = set.filter((r) => isOpenNow(r.hours));
    if (search.trim()) {
      const q = search.toLowerCase();
      set = set.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.county.toLowerCase().includes(q)
      );
    }
    return set;
  }, [mappable, activeSlug, onlyOpen, search]);

  // Load Google Maps JS API
  useEffect(() => {
    if (!GOOGLE_KEY) {
      setMapError('Add VITE_GOOGLE_MAPS_API_KEY to .env to enable the map.');
      return;
    }
    loadGoogleMaps().then((g) => {
      if (g) setMapReady(true);
      else setMapError('Failed to load Google Maps. Check your API key.');
    });
  }, []);

  // Initialize map once API is ready
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    gMap.current = new google.maps.Map(mapRef.current, {
      center: WA_CENTER,
      zoom:   WA_ZOOM,
      mapTypeId: 'roadmap',
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
      styles: MAP_STYLES,
    });

    infoWindow.current = new google.maps.InfoWindow();
  }, [mapReady]);

  // Place/update markers whenever filtered set changes
  useEffect(() => {
    if (!gMap.current) return;

    // Remove old markers
    markers.current.forEach((m) => m.setMap(null));
    markers.current = [];

    filtered.forEach((resource) => {
      if (resource.lat == null || resource.lng == null) return;
      const slug  = resource.resource_categories?.slug ?? '';
      const color = pinColor(slug);
      const open  = isOpenNow(resource.hours);

      const marker = new google.maps.Marker({
        position: { lat: resource.lat, lng: resource.lng },
        map: gMap.current!,
        title: resource.name,
        icon: {
          url: makePinSvg(open ? color : '#94a3b8'),
          scaledSize: new google.maps.Size(30, 42),
          anchor: new google.maps.Point(15, 42),
        },
        optimized: true,
      });

      marker.addListener('click', () => {
        setSelected(resource);
        // Pan map toward selected marker (offset left to avoid sidebar covering it)
        gMap.current?.panTo({ lat: resource.lat! + 0.01, lng: resource.lng! });
      });

      markers.current.push(marker);
    });
  }, [filtered, gMap.current]);

  // Fit map bounds whenever filtered set changes
  useEffect(() => {
    if (!gMap.current) return;
    const pts = filtered.filter((r) => r.lat != null && r.lng != null);
    if (pts.length === 1) {
      gMap.current.setCenter({ lat: pts[0].lat!, lng: pts[0].lng! });
      gMap.current.setZoom(13);
    } else if (pts.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      pts.forEach((r) => bounds.extend({ lat: r.lat!, lng: r.lng! }));
      gMap.current.fitBounds(bounds, 60);
    }
  }, [filtered, gMap.current]);

  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  function flyTo(resource: ResourceWithCategory) {
    if (!gMap.current || resource.lat == null || resource.lng == null) return;
    gMap.current.panTo({ lat: resource.lat, lng: resource.lng });
    gMap.current.setZoom(15);
    setSelected(resource);
  }

  // Count per category for the legend
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((r) => {
      const s = r.resource_categories?.slug ?? 'other';
      counts[s] = (counts[s] ?? 0) + 1;
    });
    return counts;
  }, [filtered]);

  const activeFilters = (activeSlug ? 1 : 0) + (onlyOpen ? 1 : 0);

  if (mapError) {
    return (
      <div className="pt-20 min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-ink-100 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-ink-400" />
          </div>
          <h2 className="font-display font-bold text-xl text-primary-800 mb-2">Map unavailable</h2>
          <p className="text-sm text-primary-500">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-20 flex flex-col" style={{ height: '100vh' }}>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-ink-200 flex items-center gap-3 z-10">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={handleSearchInput}
            placeholder="Search by name, city, or county…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ink-200 bg-cream-50/50 text-sm text-primary-800 placeholder:text-ink-400 focus:outline-none focus:border-sage-400 focus:bg-white focus:ring-4 focus:ring-sage-500/10 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters((s) => !s)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${showFilters || activeFilters ? 'bg-sage-50 border-sage-300 text-sage-700' : 'bg-white border-ink-200 text-primary-700 hover:border-sage-200 hover:bg-cream-50'}`}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filter</span>
          {activeFilters > 0 && (
            <span className="w-5 h-5 rounded-full bg-sage-600 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-primary-500 whitespace-nowrap pl-1">
          <span className="font-semibold text-primary-700">{filtered.length.toLocaleString()}</span>
          <span className="text-primary-400">of</span>
          <span>{mappable.length.toLocaleString()}</span>
          <span className="hidden md:inline">locations</span>
        </div>
      </div>

      {/* ── Filter strip ────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="flex-shrink-0 px-4 py-3 bg-cream-50 border-b border-ink-200 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setOnlyOpen((s) => !s)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all ${onlyOpen ? 'bg-success-600 border-success-600 text-white shadow-soft' : 'bg-white border-ink-200 text-primary-700 hover:border-sage-300'}`}
          >
            <Clock className="w-3 h-3" />
            Open now
          </button>
          {categories.map((cat) => {
            const cnt = categoryCounts[cat.slug] ?? 0;
            if (cnt === 0) return null;
            const active = activeSlug === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveSlug(active ? null : cat.slug)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all ${active ? 'text-white border-transparent shadow-soft' : 'bg-white border-ink-200 text-primary-700 hover:border-sage-300'}`}
                style={active ? { background: pinColor(cat.slug), borderColor: pinColor(cat.slug) } : undefined}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: active ? '#ffffff' : pinColor(cat.slug) }} />
                {cat.name}
                <span className={`text-[10px] font-bold ${active ? 'text-white/80' : 'text-primary-400'}`}>{cnt}</span>
              </button>
            );
          })}
          {activeFilters > 0 && (
            <button
              onClick={() => { setActiveSlug(null); setOnlyOpen(false); }}
              className="px-3 py-2 rounded-full text-xs font-medium text-sage-600 hover:text-sage-700 hover:bg-sage-50 transition-colors ml-auto"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* ── Map + sidebar ────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Google Map canvas */}
        <div ref={mapRef} className="flex-1 h-full" />

        {/* Loading overlay */}
        {!mapReady && (
          <div className="absolute inset-0 bg-cream-100 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full border-4 border-sage-300 border-t-sage-600 animate-spin mx-auto mb-3" />
              <p className="text-sm text-primary-500">Loading map…</p>
            </div>
          </div>
        )}

        {/* Results sidebar (desktop) */}
        <aside className="hidden lg:flex flex-col w-80 xl:w-96 h-full bg-white border-l border-ink-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-primary-400 uppercase tracking-wider">Results</p>
              <p className="text-sm font-semibold text-primary-800 mt-0.5">
                {filtered.length} resource{filtered.length !== 1 ? 's' : ''}
                {activeSlug && <span className="text-primary-500 font-normal"> · {categories.find((c) => c.slug === activeSlug)?.name ?? ''}</span>}
              </p>
            </div>
            <Navigation className="w-4 h-4 text-primary-300" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.slice(0, 200).map((r) => (
              <MapSidebarCard
                key={r.id}
                resource={r}
                isSelected={selected?.id === r.id}
                onClick={() => flyTo(r)}
              />
            ))}
            {filtered.length > 200 && (
              <p className="p-4 text-xs text-center text-primary-400">
                Showing top 200 · use search or filter to narrow results
              </p>
            )}
            {filtered.length === 0 && (
              <div className="p-8 text-center">
                <MapPin className="w-8 h-8 text-ink-300 mx-auto mb-2" />
                <p className="text-sm text-primary-500">No resources match your filters.</p>
              </div>
            )}
          </div>
        </aside>

        {/* Legend (bottom-left) — compact floating pill */}
        <div className="absolute bottom-5 left-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-card border border-ink-200 p-3.5 hidden md:block max-w-[220px]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary-400 mb-2.5 flex items-center gap-1.5">
            <Layers className="w-3 h-3" /> Categories
          </p>
          <div className="space-y-0.5">
            {categories.slice(0, 8).map((cat) => {
              const cnt = categoryCounts[cat.slug];
              if (!cnt) return null;
              const active = activeSlug === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveSlug(active ? null : cat.slug)}
                  className={`w-full flex items-center gap-2.5 text-left rounded-lg px-2 py-1.5 transition-colors group ${active ? 'bg-cream-100' : 'hover:bg-cream-50'}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/5" style={{ background: pinColor(cat.slug) }} />
                  <span className={`text-[11px] truncate ${active ? 'text-primary-900 font-semibold' : 'text-primary-700 group-hover:text-sage-700'}`}>{cat.name}</span>
                  <span className="ml-auto text-[10px] font-medium text-primary-400 tabular-nums">{cnt}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Resource detail modal */}
      {selected && (
        <ResourceDetail
          resource={selected}
          categories={categories}
          onClose={() => setSelected(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

// ─── Sidebar card ─────────────────────────────────────────────────────────────

function MapSidebarCard({
  resource, isSelected, onClick,
}: {
  resource: ResourceWithCategory;
  isSelected: boolean;
  onClick: () => void;
}) {
  const slug  = resource.resource_categories?.slug ?? '';
  const color = pinColor(slug);
  const open  = isOpenNow(resource.hours);
  const hours = formatTodayHours(resource.hours);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-3.5 border-l-2 transition-colors ${isSelected ? 'bg-sage-50 border-sage-500' : 'border-transparent hover:bg-cream-50'}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${open ? color : '#94a3b8'}14` }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: open ? color : '#94a3b8' }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary-800 leading-snug truncate">{resource.name}</p>
          <p className="text-xs text-primary-500 mt-0.5 truncate">
            {resource.city.toLowerCase() === 'statewide' ? 'Statewide service' : <>{resource.city}, {resource.county} Co.</>}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${open ? 'text-success-700' : 'text-primary-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-success-500' : 'bg-primary-300'}`} />
              {open ? 'Open' : 'Closed'}
            </span>
            <span className="text-[10px] text-primary-300">·</span>
            <span className="text-[10px] text-primary-500 truncate">{hours}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Subtle map style (muted, healthcare-appropriate) ────────────────────────

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f0' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f0' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5f0e5' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e4f0' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
];
