import { useState, useMemo } from 'react';
import { Heart, Search, MapPin, DollarSign, Clock, X } from 'lucide-react';
import type { ResourceCategory, ResourceWithCategory } from '../lib/supabase';
import { useFavorites } from '../lib/favorites';
import { getCategoryIcon, getCategoryColor } from '../lib/icons';
import { formatTodayHours, isOpenNow, formatCost } from '../lib/format';
import { ResourceImage } from './ResourceImage';

interface SavedPageProps {
  resources: ResourceWithCategory[];
  categories: ResourceCategory[];
  onNavigate: (route: any) => void;
}

export function SavedPage({ resources, categories, onNavigate }: SavedPageProps) {
  const { favorites } = useFavorites();
  const [search, setSearch] = useState('');

  const savedResources = useMemo(() => {
    const favSet = new Set(favorites);
    return resources.filter((r) => favSet.has(r.id));
  }, [resources, favorites]);

  const filtered = useMemo(() => {
    if (!search.trim()) return savedResources;
    const q = search.toLowerCase();
    return savedResources.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      r.resource_categories?.name?.toLowerCase().includes(q)
    );
  }, [savedResources, search]);

  if (favorites.size === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-cream-100 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-primary-300" />
        </div>
        <h2 className="font-display font-extrabold text-2xl text-primary-800 mb-2">No saved resources yet</h2>
        <p className="text-primary-500 mb-6">Tap the heart icon on any resource to save it here for quick access.</p>
        <button
          onClick={() => onNavigate({ name: 'search' })}
          className="px-6 py-3 rounded-xl bg-primary-700 text-white font-semibold hover:bg-primary-800 transition-colors"
        >
          Browse resources
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-primary-800">Saved Resources</h1>
        <p className="text-sm text-primary-500 mt-1">{savedResources.length} saved resource{savedResources.length !== 1 ? 's' : ''}</p>
      </div>

      {savedResources.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter saved resources..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-ink-200 bg-white text-sm focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-500/10"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-primary-500 py-8">No saved resources match your search.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((resource) => {
            const category = categories.find((c) => c.id === resource.category_id);
            const Icon = category ? getCategoryIcon(category.icon) : Heart;
            const color = getCategoryColor(category?.color ?? 'teal');
            const open = isOpenNow(resource.hours);
            const todayHours = formatTodayHours(resource.hours);

            return (
              <button
                key={resource.id}
                onClick={() => onNavigate({ name: 'resource', resourceId: resource.id })}
                className="w-full text-left rounded-2xl bg-white border border-ink-200 overflow-hidden hover:border-sage-300 hover:shadow-soft transition-all duration-200 ease-out-expo flex"
              >
                <div className="relative w-24 sm:w-32 flex-shrink-0 bg-ink-100">
                  <ResourceImage
                    resource={resource}
                    className="w-full h-full object-cover"
                    maxWidth={256}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
                </div>
                <div className="flex-1 p-3 sm:p-4 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {category && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${color.bgSoft} ${color.text}`}>
                            <Icon className="w-3 h-3" />
                            {category.name}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${open ? 'bg-success-50 text-success-700' : 'bg-cream-100 text-primary-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-success-500' : 'bg-ink-300'}`} />
                          {open ? 'Open' : 'Closed'}
                        </span>
                      </div>
                      <h3 className="font-bold text-primary-800 text-sm mt-1 leading-snug">{resource.name}</h3>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px] text-primary-600 flex-1">
                    <div className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-primary-400" /><span>{todayHours}</span></div>
                    <div className="flex items-center gap-1.5"><DollarSign className="w-3 h-3 text-primary-400" /><span>{formatCost(resource.cost_estimate_min, resource.cost_estimate_max, resource.cost_free, resource.sliding_scale)}</span></div>
                    <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-primary-400" /><span className="truncate">{resource.city}, {resource.county} County</span></div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
