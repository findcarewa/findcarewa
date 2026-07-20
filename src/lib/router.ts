import { useState, useEffect, useCallback } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'search'; query?: string; categorySlug?: string; city?: string }
  | { name: 'map' }
  | { name: 'resource'; id: string }
  | { name: 'request' }
  | { name: 'feedback'; resourceId?: string }
  | { name: 'about' }
  | { name: 'how-it-works' }
  | { name: 'saved' }
  | { name: 'faq' };

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [path, queryString] = hash.split('?');
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
    return { name: 'resource', id: segments[1] };
  }

  if (segments[0] === 'request') return { name: 'request' };
  if (segments[0] === 'feedback') {
    return { name: 'feedback', resourceId: params.get('resource') || undefined };
  }
  if (segments[0] === 'about') return { name: 'about' };
  if (segments[0] === 'saved') return { name: 'saved' };
  if (segments[0] === 'faq') return { name: 'faq' };
  if (segments[0] === 'how-it-works') return { name: 'how-it-works' };

  return { name: 'home' };
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case 'home': return '#/';
    case 'map':  return '#/map';
    case 'search': {
      const params = new URLSearchParams();
      if (route.query) params.set('q', route.query);
      if (route.categorySlug) params.set('cat', route.categorySlug);
      if (route.city) params.set('city', route.city);
      const qs = params.toString();
      return `#/search${qs ? '?' + qs : ''}`;
    }
    case 'resource': return `#/resource/${route.id}`;
    case 'request': return '#/request';
    case 'feedback': {
      const params = new URLSearchParams();
      if (route.resourceId) params.set('resource', route.resourceId);
      const qs = params.toString();
      return `#/feedback${qs ? '?' + qs : ''}`;
    }
    case 'about': return '#/about';
    case 'how-it-works': return '#/how-it-works';
    case 'saved': return '#/saved';
    case 'faq': return '#/faq';
  }
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(parseHash);

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((newRoute: Route) => {
    window.location.hash = routeToHash(newRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return { route, navigate };
}
