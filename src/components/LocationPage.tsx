import { useState, useMemo, useEffect } from 'react';
import {
  ArrowRight, MapPin, Search, ChevronDown, Loader2, AlertCircle,
  Stethoscope, Clock, DollarSign, Heart, Building2,
} from './IconLib';
import type { Route } from '../lib/router';
import { fromLocationSlug, toLocationSlug } from '../lib/router';
import type { ResourceCategory, ResourceWithCategory } from '../lib/supabase';
import { getCategoryIcon, getCategoryColor } from '../lib/icons';
import { formatCost, formatTodayHours, isOpenNow } from '../lib/format';
import { useFavorites } from '../lib/favorites';
import { useAuth } from '../lib/auth';
import {
  setPageMeta, injectPageSchema,
  locationMeta, locationItemListSchema, collectionPageSchema, breadcrumbSchema,
} from '../lib/seo';

interface LocationPageProps {
  location: string;
  specialty?: string;
  resources: ResourceWithCategory[];
  categories: ResourceCategory[];
  onNavigate: (route: Route) => void;
}

export function LocationPage({ location, specialty, resources, categories, onNavigate }: LocationPageProps) {
  const [showAllResources, setShowAllResources] = useState(false);

  // Determine if this slug matches a city or county
  const { locationName, isCounty, locationResources } = useMemo(() => {
    const slug = location.toLowerCase();
    const normalized = fromLocationSlug(location).toLowerCase();

    // Try county match first (counties are less ambiguous)
    const countyMatch = resources.find((r) => {
      const c = r.county.toLowerCase().replace(/\s+/g, '-');
      return c === slug || r.county.toLowerCase() === normalized;
    });

    if (countyMatch) {
      const countyName = countyMatch.county;
      const matched = resources.filter((r) => r.county.toLowerCase() === countyName.toLowerCase());
      return { locationName: countyName, isCounty: true, locationResources: matched };
    }

    // Try city match
    const cityMatch = resources.find((r) => {
      const c = r.city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return c === slug || r.city.toLowerCase() === normalized;
    });

    if (cityMatch) {
      const cityName = cityMatch.city;
      const matched = resources.filter((r) => r.city.toLowerCase() === cityName.toLowerCase());
      return { locationName: cityName, isCounty: false, locationResources: matched };
    }

    // Fuzzy match — try to find a city/county that fuzzy-matches
    const allCounties = new Map<string, string>();
    resources.forEach((r) => allCounties.set(r.county.toLowerCase(), r.county));
    for (const [countyLower, countyName] of allCounties) {
      const countySlug = countyLower.replace(/[^a-z0-9]+/g, '-');
      if (countySlug === slug) {
        const matched = resources.filter((r) => r.county.toLowerCase() === countyLower);
        return { locationName: countyName, isCounty: true, locationResources: matched };
      }
    }

    const allCities = new Map<string, string>();
    resources.forEach((r) => allCities.set(r.city.toLowerCase(), r.city));
    for (const [cityLower, cityName] of allCities) {
      const citySlug = cityLower.replace(/[^a-z0-9]+/g, '-');
      if (citySlug === slug) {
        const matched = resources.filter((r) => r.city.toLowerCase() === cityLower);
        return { locationName: cityName, isCounty: false, locationResources: matched };
      }
    }

    return { locationName: fromLocationSlug(location), isCounty: false, locationResources: [] as ResourceWithCategory[] };
  }, [location, resources]);

  // Find the specialty category if specified
  const specialtyCategory = useMemo(() => {
    if (!specialty) return undefined;
    return categories.find((c) => c.slug === specialty);
  }, [specialty, categories]);

  // Filter resources by specialty if present
  const displayResources = useMemo(() => {
    if (specialty && specialtyCategory) {
      return locationResources.filter((r) => r.resource_categories?.slug === specialty);
    }
    return locationResources;
  }, [locationResources, specialty, specialtyCategory]);

  // Sort: open now first, then rating
  const sortedResources = useMemo(() => {
    return [...displayResources].sort((a, b) => {
      const aOpen = isOpenNow(a.hours) ? 1 : 0;
      const bOpen = isOpenNow(b.hours) ? 1 : 0;
      if (aOpen !== bOpen) return bOpen - aOpen;
      return b.rating - a.rating;
    });
  }, [displayResources]);

  // Available categories in this location
  const availableCategories = useMemo(() => {
    const catIds = new Set(locationResources.map((r) => r.category_id));
    return categories.filter((c) => catIds.has(c.id));
  }, [locationResources, categories]);

  // Nearby cities/counties for internal linking
  const nearbyLocations = useMemo(() => {
    if (isCounty) {
      // List cities within this county
      const cities = new Map<string, number>();
      locationResources.forEach((r) => {
        cities.set(r.city, (cities.get(r.city) ?? 0) + 1);
      });
      return [...cities.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([city, count]) => ({ name: city, count, type: 'city' as const }));
    }
    // For cities — list nearby counties
    const cityResource = locationResources[0];
    if (!cityResource) return [];
    const county = cityResource.county;
    const countyResources = resources.filter((r) => r.county === county);
    const cities = new Map<string, number>();
    countyResources.forEach((r) => {
      if (r.city.toLowerCase() !== locationName.toLowerCase()) {
        cities.set(r.city, (cities.get(r.city) ?? 0) + 1);
      }
    });
    return [...cities.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, count]) => ({ name: city, count, type: 'city' as const }));
  }, [isCounty, locationResources, locationName, resources]);

  // Other counties for cross-linking
  const otherCounties = useMemo(() => {
    const counties = new Map<string, number>();
    resources.forEach((r) => {
      if (r.county.toLowerCase() !== locationName.toLowerCase()) {
        counties.set(r.county, (counties.get(r.county) ?? 0) + 1);
      }
    });
    return [...counties.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([county, count]) => ({ name: county, count }));
  }, [resources, locationName]);

  // ── SEO: set page meta + JSON-LD schema ──────────────────────────────────
  useEffect(() => {
    const meta = locationMeta(
      locationName,
      isCounty,
      displayResources.length,
      specialty,
      specialtyCategory?.name,
    );
    setPageMeta(meta);

    const crumbs = [
      { name: 'Home', path: '/' },
      { name: 'Locations', path: '/#/locations' },
    ];
    if (specialty && specialtyCategory) {
      crumbs.push({ name: isCounty ? `${locationName} County` : locationName, path: `/#/locations/${toLocationSlug(locationName)}` });
      crumbs.push({ name: specialtyCategory.name, path: `/#/locations/${toLocationSlug(locationName)}/${specialty}` });
    } else {
      crumbs.push({ name: isCounty ? `${locationName} County` : locationName, path: `/#/locations/${toLocationSlug(locationName)}` });
    }
    injectPageSchema('breadcrumb', breadcrumbSchema(crumbs));

    if (displayResources.length > 0) {
      injectPageSchema('itemList', locationItemListSchema(locationName, isCounty, displayResources, meta.canonicalPath));
      injectPageSchema('collectionPage', collectionPageSchema(locationName, isCounty, meta.canonicalPath, displayResources.length));
    } else {
      injectPageSchema('itemList', null);
      injectPageSchema('collectionPage', null);
    }

    return () => {
      injectPageSchema('itemList', null);
      injectPageSchema('collectionPage', null);
    };
  }, [locationName, isCounty, displayResources, specialty, specialtyCategory]);

  // ── Empty state ──────────────────────────────────────────────────────────
  if (locationResources.length === 0) {
    return (
      <section className="min-h-screen pt-20 lg:pt-24 pb-16 bg-cream-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb onNavigate={onNavigate} locationName={locationName} isCounty={isCounty} specialty={specialty} specialtyName={specialtyCategory?.name} />
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-cream-100 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-7 h-7 text-primary-400" />
            </div>
            <h1 className="font-display font-bold text-2xl text-primary-800 mb-2">
              No resources found in {isCounty ? `${locationName} County` : locationName}
            </h1>
            <p className="text-sm text-primary-500 mb-6 max-w-md mx-auto">
              We don't have any healthcare resources listed in this area yet. Try searching across all of Washington State, or browse a nearby location.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => onNavigate({ name: 'search' })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 transition-colors"
              >
                <Search className="w-4 h-4" /> Search all resources
              </button>
              <button
                onClick={() => onNavigate({ name: 'locations' })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-ink-200 text-primary-700 text-sm font-semibold hover:border-sage-300 transition-colors"
              >
                Browse locations
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const locLabel = isCounty ? `${locationName} County` : locationName;
  const visibleResources = showAllResources ? sortedResources : sortedResources.slice(0, 12);

  return (
      <section className="min-h-screen pt-20 lg:pt-24 pb-16 bg-cream-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb onNavigate={onNavigate} locationName={locationName} isCounty={isCounty} specialty={specialty} specialtyName={specialtyCategory?.name} />

          {/* Hero */}
          <div className="rounded-3xl bg-gradient-to-br from-primary-700 to-primary-900 p-6 sm:p-8 mb-6 overflow-hidden relative">
            <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/5" />
            <div className="relative flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/20">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                  {specialtyCategory ? `${specialtyCategory.name} in ${locLabel}` : `Healthcare Resources in ${locLabel}`}
                </h1>
                <p className="mt-2 text-sm text-slate-200 max-w-xl">
                  {displayResources.length} verified {specialtyCategory ? specialtyCategory.name.toLowerCase() : 'healthcare'} {displayResources.length === 1 ? 'resource' : 'resources'} in {locLabel}, Washington State.
                </p>
              </div>
            </div>
          </div>

          {/* Category chips (only on non-specialty pages) */}
          {!specialty && availableCategories.length > 0 && (
            <div className="mb-6">
              <h2 className="font-display font-bold text-base text-primary-800 mb-3">Available categories</h2>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((cat) => {
                  const Icon = getCategoryIcon(cat.icon);
                  const color = getCategoryColor(cat.color);
                  const count = locationResources.filter((r) => r.category_id === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => onNavigate({ name: 'location', location: toLocationSlug(locationName), specialty: cat.slug })}
                      className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-ink-200 hover:border-sage-300 hover:shadow-soft transition-all"
                    >
                      <div className={`w-7 h-7 rounded-lg ${color.bgSoft} ${color.text} flex items-center justify-center`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-primary-700">{cat.name}</span>
                      <span className="text-[10px] text-primary-400">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Provider list */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-primary-800">
                {specialtyCategory ? `${specialtyCategory.name} providers` : 'Healthcare providers'}
              </h2>
              <button
                onClick={() => onNavigate({ name: 'search', city: locationName })}
                className="text-xs font-medium text-sage-600 hover:text-sage-700 flex items-center gap-1"
              >
                Search in {locLabel} <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {visibleResources.map((r) => (
                <LocationResourceCard
                  key={r.id}
                  resource={r}
                  category={categories.find((c) => c.id === r.category_id)}
                  onClick={() => onNavigate({ name: 'resource', id: r.id })}
                />
              ))}
            </div>

            {sortedResources.length > 12 && !showAllResources && (
              <button
                onClick={() => setShowAllResources(true)}
                className="mt-4 w-full py-3 rounded-xl bg-white border border-ink-200 text-sm font-semibold text-primary-700 hover:border-sage-300 hover:bg-sage-50 transition-all flex items-center justify-center gap-2"
              >
                Show all {sortedResources.length} resources <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Nearby locations */}
          {nearbyLocations.length > 0 && (
            <div className="mb-6">
              <h2 className="font-display font-bold text-lg text-primary-800 mb-3">
                {isCounty ? `Cities in ${locationName} County` : `Nearby cities in ${locationResources[0]?.county ?? ''} County`}
              </h2>
              <div className="flex flex-wrap gap-2">
                {nearbyLocations.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => onNavigate({ name: 'location', location: toLocationSlug(loc.name) })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-ink-200 text-xs font-medium text-primary-600 hover:border-sage-300 hover:text-sage-700 transition-all"
                  >
                    <MapPin className="w-3 h-3 text-primary-400" />
                    {loc.name}
                    <span className="text-[10px] text-primary-400">{loc.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Other counties */}
          {otherCounties.length > 0 && (
            <div className="mb-6">
              <h2 className="font-display font-bold text-lg text-primary-800 mb-3">Browse other counties</h2>
              <div className="flex flex-wrap gap-2">
                {otherCounties.map((county) => (
                  <button
                    key={county.name}
                    onClick={() => onNavigate({ name: 'location', location: toLocationSlug(county.name) })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-ink-200 text-xs font-medium text-primary-600 hover:border-sage-300 hover:text-sage-700 transition-all"
                  >
                    <Building2 className="w-3 h-3 text-primary-400" />
                    {county.name} County
                    <span className="text-[10px] text-primary-400">{county.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SEO content block */}
          <div className="rounded-2xl bg-white border border-ink-200 shadow-soft p-5 sm:p-6">
            <h2 className="font-display font-bold text-base text-primary-800 mb-2">
              About healthcare resources in {locLabel}
            </h2>
            <p className="text-sm text-primary-600 leading-relaxed">
              FindCare lists {displayResources.length} verified healthcare resources in {locLabel}, Washington State.
              {!specialty && availableCategories.length > 0 && ` Browse by category: ${availableCategories.slice(0, 5).map((c) => c.name).join(', ')}.`}
              {' '}Each resource includes details on services, insurance accepted, cost, languages, hours, and accessibility.
              Use the search to filter by insurance type, language, or specific service needs.
            </p>
          </div>
        </div>
      </section>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb({ onNavigate, locationName, isCounty, specialty, specialtyName }: {
  onNavigate: (r: Route) => void;
  locationName: string;
  isCounty: boolean;
  specialty?: string;
  specialtyName?: string;
}) {
  const locLabel = isCounty ? `${locationName} County` : locationName;
  return (
    <nav className="flex items-center gap-1.5 text-xs text-primary-500 mb-4 flex-wrap">
      <button onClick={() => onNavigate({ name: 'home' })} className="hover:text-primary-700 transition-colors">Home</button>
      <span className="text-primary-300">/</span>
      <button onClick={() => onNavigate({ name: 'locations' })} className="hover:text-primary-700 transition-colors">Locations</button>
      <span className="text-primary-300">/</span>
      {specialty ? (
        <>
          <button
            onClick={() => onNavigate({ name: 'location', location: toLocationSlug(locationName) })}
            className="hover:text-primary-700 transition-colors"
          >{locLabel}</button>
          <span className="text-primary-300">/</span>
          <span className="text-primary-700 font-semibold">{specialtyName ?? specialty}</span>
        </>
      ) : (
        <span className="text-primary-700 font-semibold">{locLabel}</span>
      )}
    </nav>
  );
}

// ─── Resource card (compact) ───────────────────────────────────────────────────

function LocationResourceCard({ resource, category, onClick }: {
  resource: ResourceWithCategory;
  category?: ResourceCategory;
  onClick: () => void;
}) {
  const Icon = category ? getCategoryIcon(category.icon) : Stethoscope;
  const color = category ? getCategoryColor(category.color) : getCategoryColor('teal');
  const { isFavorite, toggle } = useFavorites();
  const { user } = useAuth();
  const isFav = isFavorite(resource.id);
  const open = isOpenNow(resource.hours);
  const todayHours = formatTodayHours(resource.hours);

  return (
    <button
      onClick={onClick}
      className="card-editorial group text-left rounded-2xl bg-white border border-ink-200 overflow-hidden shadow-soft hover:shadow-card hover:-translate-y-0.5 hover:border-sage-200 transition-all duration-200 ease-out-expo flex flex-col"
    >
      <div className={`relative h-16 overflow-hidden bg-gradient-to-br ${color.pastelBg}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className={`w-8 h-8 ${color.pastelAccent} opacity-40 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-60`} strokeWidth={1.5} />
        </div>
        <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1">
          {user && (
            <button
              onClick={(e) => { e.stopPropagation(); toggle(resource.id); }}
              className="w-6 h-6 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center hover:bg-white transition-colors"
              aria-label={isFav ? "Remove from saved" : "Save resource"}
            >
              <Heart className={'w-3 h-3 ' + (isFav ? 'text-danger-600 fill-danger-600' : 'text-primary-400')} />
            </button>
          )}
          {open ? (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-sage-600/90 text-white backdrop-blur-sm">Open</span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-primary-800/70 text-white backdrop-blur-sm">Closed</span>
          )}
        </div>
        {category && (
          <div className={`absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-white/70 ${color.pastelText} backdrop-blur-sm`}>
            <Icon className="w-2.5 h-2.5" />
            {category.name}
          </div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-display font-bold text-xs text-primary-800 leading-tight group-hover:text-primary-700 transition-colors line-clamp-2">
          {resource.name}
        </h3>
        <p className="mt-0.5 text-[11px] text-primary-500 line-clamp-1 leading-relaxed">{resource.description}</p>
        <div className="mt-1.5 space-y-0.5 text-[10px] text-primary-600 flex-1">
          <div className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-primary-400" />
            <span className="truncate">{todayHours}</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-2.5 h-2.5 text-primary-400" />
            <span className="truncate">{formatCost(resource.cost_estimate_min, resource.cost_estimate_max, resource.cost_free, resource.sliding_scale)}</span>
          </div>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {resource.cost_free && <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-accent-50 text-accent-700">Free</span>}
          {resource.medicaid && <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-success-50 text-success-700">Apple Health</span>}
          {resource.telehealth && <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-secondary-50 text-secondary-700">Telehealth</span>}
        </div>
      </div>
    </button>
  );
}
