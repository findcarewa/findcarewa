import { useState, useEffect, useCallback } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'search'; query?: string; categorySlug?: string; city?: string }
  | { name: 'map' }
  | { name: 'resource'; id: string; slug?: string }
  | { name: 'request' }
  | { name: 'feedback'; resourceId?: string }
  | { name: 'about' }
  | { name: 'how-it-works' }
  | { name: 'saved' }
  | { name: 'faq' }
  | { name: 'symptoms' }
  | { name: 'symptom'; slug: string }
  | { name: 'locations' }
  | { name: 'location'; location: string; specialty?: string }
;
/**
 * Parse the current URL into a Route.
 * Supports both path-based (`/resource/foo`) and hash-based (`/#/resource/foo`) URLs.
 * Hash-based URLs are kept for backward compatibility — existing links and
 * bookmarks using `/#/...` continue to work. New links use path-based URLs
 * so search engines can crawl individual pages.
 */
function parseUrl(): Route {
  let path = window.location.pathname;
  let queryString = window.location.search.replace(/^\?/, '');

  // If there's a hash that looks like a route (starts with #/), use that instead
  const hash = window.location.hash;
  if (hash.startsWith('#/')) {
    const hashPath = hash.replace(/^#\/?/, '');
    const [hPath, hQuery] = hashPath.split('?');
    path = '/' + hPath;
    queryString = hQuery || '';
  }

  // Normalize: remove trailing slash (except root)
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);

  const segments = path.split('/').filter(Boolean);
  const params = new URLSearchParams(queryString || '');

  if (segments.length === 0 || segments[0] === 'home') return { name: 'home' };

  if (segments[0] === 'map') return { name: 'map' };
  if (segments[0] === 'search') {
    return {
      name: 'search',
      query: params.get('q') || undefined,
      categorySlug: params.get('cat') || undefined,
      city: params.get('city') || undefined,
    };
  }

  if (segments[0] === 'resource' && segments[1]) {
    return { name: 'resource', id: segments[1], slug: segments[1] };
  }

  if (segments[0] === 'locations') {
    if (segments.length === 1) return { name: 'locations' };
    if (segments.length >= 2) {
      return { name: 'location', location: segments[1], specialty: segments[2] };
    }
  }

  if (segments[0] === 'request') return { name: 'request' };
  if (segments[0] === 'feedback') {
    return { name: 'feedback', resourceId: params.get('resource') || undefined };
  }
  if (segments[0] === 'about') return { name: 'about' };
  if (segments[0] === 'saved') return { name: 'saved' };
  if (segments[0] === 'faq') return { name: 'faq' };
  if (segments[0] === 'how-it-works') return { name: 'how-it-works' };
  if (segments[0] === 'symptoms') return { name: 'symptoms' };
  if (segments[0] === 'symptom' && segments[1]) return { name: 'symptom', slug: segments[1] };

  return { name: 'home' };
}

/**
 * Convert a Route to a path-based URL string (no hash).
 * Used for `navigate()` so the browser URL bar shows crawlable paths.
 */
export function routeToPath(route: Route): string {
  switch (route.name) {
    case 'home': return '/';
    case 'map':  return '/map';
    case 'search': {
      const params = new URLSearchParams();
      if (route.query) params.set('q', route.query);
      if (route.categorySlug) params.set('cat', route.categorySlug);
      if (route.city) params.set('city', route.city);
      const qs = params.toString();
      return `/search${qs ? '?' + qs : ''}`;
    }
    case 'resource': return `/resource/${route.slug || route.id}`;
    case 'locations': return '/locations';
    case 'location': {
      if (route.specialty) return `/locations/${route.location}/${route.specialty}`;
      return `/locations/${route.location}`;
    }
    case 'request': return '/request';
    case 'feedback': {
      const params = new URLSearchParams();
      if (route.resourceId) params.set('resource', route.resourceId);
      const qs = params.toString();
      return `/feedback${qs ? '?' + qs : ''}`;
    }
    case 'about': return '/about';
    case 'how-it-works': return '/how-it-works';
    case 'saved': return '/saved';
    case 'faq': return '/faq';
    case 'symptoms': return '/symptoms';
    case 'symptom': return `/symptom/${route.slug}`;
  }
}

/**
 * Backward-compatible hash-based URL generator.
 * Kept for any code that still references `routeToHash`.
 */
export function routeToHash(route: Route): string {
  const path = routeToPath(route);
  return '#' + path;
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(parseUrl);

  useEffect(() => {
    const onUrlChange = () => setRoute(parseUrl());
    window.addEventListener('popstate', onUrlChange);
    window.addEventListener('hashchange', onUrlChange);
    return () => {
      window.removeEventListener('popstate', onUrlChange);
      window.removeEventListener('hashchange', onUrlChange);
    };
  }, []);

  const navigate = useCallback((newRoute: Route) => {
    const path = routeToPath(newRoute);
    // Use pushState for path-based navigation (crawlable URLs)
    window.history.pushState({}, '', path);
    setRoute(parseUrl());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return { route, navigate };
}

// ─── Location slug helpers ────────────────────────────────────────────────────

/** Convert a city or county name to a URL-safe slug. */
export function toLocationSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Convert a slug back to a display name (title case, spaces). */
export function fromLocationSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
