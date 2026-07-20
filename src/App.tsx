import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle } from './components/IconLib';
import {
  supabase,
  type ResourceCategory,
  type ResourceWithCategory,
  type Resource,
} from './lib/supabase';
import { useRouter } from './lib/router';
import { roundDownFriendly } from './lib/format';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SearchPage } from './components/SearchPage';
import { ResourceDetail } from './components/ResourceDetail';
import { RequestForm } from './components/RequestForm';
import { FeedbackForm } from './components/FeedbackForm';
import { HowItWorks } from './components/HowItWorks';
import { FAQPage } from './components/FAQPage';
import { SavedPage } from './components/SavedPage';
import { AuthModal } from './components/AuthModal';
import { AuthProvider } from './lib/auth';
import { FavoritesProvider } from './lib/favorites';
import { AboutPage } from './components/AboutPage';
import { Footer } from './components/Footer';
import { HealthMap } from './components/HealthMap';

export default function App() {
  const { route, navigate } = useRouter();
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [resources, setResources] = useState<ResourceWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [singleResource, setSingleResource] = useState<Resource | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load categories + resources on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catRes, resRes] = await Promise.all([
          supabase
            .from('resource_categories')
            .select('*')
            .order('sort_order', { ascending: true }),
          supabase
            .from('resources')
            .select('*, resource_categories!resources_category_id_fkey(id, name, slug, icon, color)')
            .order('rating', { ascending: false })
            .limit(5000),
        ]);
        if (cancelled) return;
        if (catRes.error) throw catRes.error;
        if (resRes.error) throw resRes.error;
        setCategories(catRes.data ?? []);
        setResources((resRes.data ?? []) as ResourceWithCategory[]);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load healthcare data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Handle resource detail route  -  load single resource
  useEffect(() => {
    if (route.name === 'resource') {
      // Try to find in loaded resources first
      const found = resources.find((r) => r.id === route.id);
      if (found) {
        setSingleResource(found);
      } else {
        // Fetch from Supabase
        setSingleResource(null);
        (async () => {
          const { data, error: fetchError } = await supabase
            .from('resources')
            .select('*, resource_categories!resources_category_id_fkey(id, name, slug, icon, color)')
            .eq('id', route.id)
            .maybeSingle();
          if (!fetchError && data) {
            setSingleResource(data as Resource);
          }
        })();
      }
    } else {
      setSingleResource(null);
    }
  }, [route, resources]);

  const handleSearch = useCallback((query: string) => {
    navigate({ name: 'search', query });
  }, [navigate]);

  const totalResources = resources.length;
  const totalCities = new Set(resources.map((r) => r.city)).size;
  const totalCounties = new Set(resources.map((r) => r.county)).size;
  const roundedResources = roundDownFriendly(totalResources);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center shadow-soft">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <div className="text-center">
          <p className="font-display font-semibold text-primary-800">Loading FindCare</p>
          <p className="text-sm text-primary-500 mt-1">Connecting to {roundedResources > 0 ? `${roundedResources.toLocaleString()}+` : 'hundreds of'} verified Washington resources…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-14 h-14 rounded-2xl bg-danger-100 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-danger-600" />
        </div>
        <div className="text-center max-w-md">
          <p className="font-display font-bold text-primary-800 text-lg">Something went wrong</p>
          <p className="text-sm text-primary-600 mt-1">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 transition-all duration-200 ease-out-expo shadow-soft"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <AuthProvider>
    <FavoritesProvider>
    <div className="min-h-screen bg-white">
      <Navbar route={route} onNavigate={navigate} />

      <main className={route.name === 'map' ? 'h-screen overflow-hidden' : ''}>
        {route.name === 'home' && (
          <Hero
            onSearch={handleSearch}
            onNavigate={navigate}
            categories={categories}
            totalResources={roundedResources}
            totalCities={totalCities}
          />
        )}

        {route.name === 'map' && (
          <HealthMap
            resources={resources}
            categories={categories}
            onNavigate={navigate}
          />
        )}

        {route.name === 'search' && (
          <SearchPage
            resources={resources}
            categories={categories}
            initialQuery={route.query}
            initialCategorySlug={route.categorySlug}
            initialCity={route.city}
            onNavigate={navigate}
          />
        )}

        {route.name === 'resource' && (
          <div className="pt-20 lg:pt-24 pb-16 bg-cream-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {singleResource ? (
                <div className="py-4">
                  <button
                    onClick={() => navigate({ name: 'search' })}
                    className="mb-4 text-sm font-medium text-sage-600 hover:text-sage-700"
                  >
                    ← Back to search
                  </button>
                  <ResourceDetail
                    resource={singleResource as ResourceWithCategory}
                    categories={categories}
                    onClose={() => navigate({ name: 'search' })}
                    onNavigate={navigate}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
                </div>
              )}
            </div>
          </div>
        )}

        {route.name === 'request' && (
          <RequestForm categories={categories} />
        )}

        {route.name === 'feedback' && (
          <FeedbackForm
            resourceId={route.resourceId}
            resource={resources.find((r) => r.id === route.resourceId)}
          />
        )}

        {route.name === 'saved' && (
          <SavedPage resources={resources} categories={categories} onNavigate={navigate} />
        )}
        {route.name === 'how-it-works' && (
          <HowItWorks onNavigate={navigate} categories={categories} />
        )}

        {route.name === 'faq' && (
          <FAQPage onNavigate={navigate} />
        )}
        {route.name === 'about' && (
          <AboutPage
            onNavigate={navigate}
            totalResources={roundedResources}
            totalCities={totalCities}
            totalCounties={totalCounties}
          />
        )}
      </main>

      <Footer onNavigate={navigate} totalResources={roundedResources} />
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
    </FavoritesProvider>
    </AuthProvider>
  );
}
