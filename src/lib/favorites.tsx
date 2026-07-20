import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';

interface FavoriteRecord {
  resource_id: string;
  notes: string;
  created_at: string;
}

interface FavoritesContextValue {
  favorites: Set<string>;
  favoriteRecords: FavoriteRecord[];
  loading: boolean;
  toggle: (resourceId: string) => Promise<void>;
  isFavorite: (resourceId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoriteRecords, setFavoriteRecords] = useState<FavoriteRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      setFavoriteRecords([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from('favorites')
      .select('resource_id, notes, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Failed to load favorites:', error.message);
          setFavorites(new Set());
          setFavoriteRecords([]);
        } else {
          const records = (data as FavoriteRecord[]) ?? [];
          setFavoriteRecords(records);
          setFavorites(new Set(records.map((r) => r.resource_id)));
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user]);

  async function toggle(resourceId: string) {
    if (!user) return;
    const isFav = favorites.has(resourceId);
    // Optimistic update
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(resourceId);
      else next.add(resourceId);
      return next;
    });

    if (isFav) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('resource_id', resourceId);
      if (error) {
        // Revert on error
        setFavorites((prev) => new Set(prev).add(resourceId));
        console.error('Failed to remove favorite:', error.message);
      } else {
        setFavoriteRecords((prev) => prev.filter((r) => r.resource_id !== resourceId));
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, resource_id: resourceId });
      if (error) {
        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(resourceId);
          return next;
        });
        console.error('Failed to add favorite:', error.message);
      } else {
        setFavoriteRecords((prev) => [
          { resource_id: resourceId, notes: '', created_at: new Date().toISOString() },
          ...prev,
        ]);
      }
    }
  }

  function isFavorite(resourceId: string) {
    return favorites.has(resourceId);
  }

  return (
    <FavoritesContext.Provider value={{ favorites, favoriteRecords, loading, toggle, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider');
  return ctx;
}
