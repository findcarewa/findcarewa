/**
 * Resource image resolution.
 *
 * Priority chain per resource:
 *  1. photo_url column \u2014 manual override
 *  2. Google Places photo \u2014 physical locations
 *     - Calls Places Text Search or Place Details directly from the browser
 *       using VITE_GOOGLE_MAPS_API_KEY
 *     - Photo bytes proxied through edge function to avoid key exposure in
 *       img src URLs and to add long-lived cache headers
 *  3. Clearbit logo \u2014 virtual/hotline services (domain column)
 *  4. Category SVG avatar \u2014 always works, instant, zero network
 */

import type { ResourceWithCategory } from './supabase';
import { loadGoogleMaps } from './mapsLoader';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const GOOGLE_KEY   = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export const PLACE_PHOTOS_FN = `${SUPABASE_URL}/functions/v1/place-photos`;

// \u2500\u2500\u2500 Types \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

export interface PlacePhoto {
  reference: string;       // photo_reference (may be empty when using Maps JS)
  width: number;
  height: number;
  attributions: string[];
  _obj?: any;              // google.maps.places.PlacePhoto instance (Maps JS only)
}

export interface PlaceResult {
  placeId: string | null;
  photos: PlacePhoto[];
  name: string | null;
}

// \u2500\u2500\u2500 Module-scope caches (survive component re-renders) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

const resultCache = new Map<string, PlaceResult>();
const inFlight    = new Map<string, Promise<PlaceResult>>();

// \u2500\u2500\u2500 Key check \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

export function hasGoogleKey(): boolean {
  return Boolean(GOOGLE_KEY && GOOGLE_KEY.trim().length > 0);
}

// \u2500\u2500\u2500 Virtual/hotline heuristic \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

const VIRTUAL_SLUGS = new Set(['crisis-line']);

export function isVirtualService(resource: ResourceWithCategory): boolean {
  const slug = resource.resource_categories?.slug ?? '';
  if (VIRTUAL_SLUGS.has(slug)) return true;
  const addr = (resource.address ?? '').toLowerCase();
  return addr.startsWith('various') || addr.startsWith('po box') || addr.startsWith('p.o. box');
}

// \u2500\u2500\u2500 Query builder \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

export function buildPlacesQuery(resource: ResourceWithCategory): string {
  const cleanName = resource.name
    .replace(/\s*-\s*(batch\s*\d+|final|v\d+)$/i, '')
    .replace(/\s+(cboc|telehealth)$/i, '')
    .trim();
  return `${cleanName} ${resource.city} WA`;
}

// \u2500\u2500\u2500 Shared PlacesService (hidden map div) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

let _placesService: google.maps.places.PlacesService | null = null;

function getPlacesService(): google.maps.places.PlacesService | null {
  if (_placesService) return _placesService;
  if (typeof google === 'undefined') return null;
  // PlacesService requires a map or a div element
  const div = document.createElement('div');
  _placesService = new google.maps.places.PlacesService(div);
  return _placesService;
}

// \u2500\u2500\u2500 Core Google Places fetch (Maps JS API \u2014 browser only) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

async function fetchFromGoogle(resource: ResourceWithCategory): Promise<PlaceResult> {
  const empty: PlaceResult = { placeId: null, photos: [], name: null };
  if (!GOOGLE_KEY) return empty;

  // Ensure Maps JS is loaded
  const g = await loadGoogleMaps();
  if (!g) return empty;

  const svc = getPlacesService();
  if (!svc) return empty;

  try {
    // Always use TextSearch - don't rely on cached place IDs which can expire
    const query = buildPlacesQuery(resource);
    const placeId = await new Promise<string | null>((resolve) => {
      svc.textSearch(
        {
          query,
          location: new google.maps.LatLng(47.4009, -120.5015),
          radius: 400000, // ~250 miles \u2014 covers all of WA
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results?.length) {
            resolve(results[0].place_id ?? null);
          } else {
            resolve(null);
          }
        }
      );
    });

    if (!placeId) return empty;

    // Step 2: Place Details \u2192 photos
    const detail = await new Promise<google.maps.places.PlaceResult | null>((resolve) => {
      svc.getDetails(
        { placeId, fields: ['photos', 'name', 'rating'] },
        (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) resolve(result);
          else resolve(null);
        }
      );
    });

    if (!detail) return empty;

    const photos: PlacePhoto[] = (detail.photos ?? []).slice(0, 10).map((p) => ({
      reference:    (p as any).photo_reference ?? '',  // internal ref used by getUrl
      width:        p.width,
      height:       p.height,
      attributions: p.html_attributions ?? [],
      // Store the PlacePhoto object itself for getUrl() calls
      _obj: p,
    } as PlacePhoto & { _obj: google.maps.places.PlacePhoto }));

    return { placeId, photos, name: detail.name ?? null };
  } catch {
    return empty;
  }
}

/**
 * Fetch (or return cached) Google Places result for a resource.
 * Deduplicates concurrent calls.
 */
export async function fetchPlaceResult(resource: ResourceWithCategory): Promise<PlaceResult> {
  const key = resource.id;
  if (resultCache.has(key)) return resultCache.get(key)!;
  if (inFlight.has(key))    return inFlight.get(key)!;

  const promise = fetchFromGoogle(resource).then((result) => {
    resultCache.set(key, result);
    inFlight.delete(key);
    return result;
  });
  inFlight.set(key, promise);
  return promise;
}

export function getCachedPlaceResult(resourceId: string): PlaceResult | null {
  return resultCache.get(resourceId) ?? null;
}

/** Legacy compat: fetch photos for a known placeId using Maps JS API */
export async function fetchPlacePhotos(placeId: string): Promise<PlacePhoto[]> {
  if (!GOOGLE_KEY) return [];
  const g = await loadGoogleMaps();
  if (!g) return [];
  const svc = getPlacesService();
  if (!svc) return [];
  try {
    return await new Promise<PlacePhoto[]>((resolve) => {
      svc.getDetails(
        { placeId, fields: ['photos'] },
        (result, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !result?.photos) {
            resolve([]);
            return;
          }
          resolve(result.photos.slice(0, 10).map((p) => ({
            reference: '',
            width: p.width,
            height: p.height,
            attributions: p.html_attributions ?? [],
            _obj: p,
          })));
        }
      );
    });
  } catch { return []; }
}

// \u2500\u2500\u2500 Photo URL \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

/**
 * Get a usable photo URL from a PlacePhoto.
 * - Maps JS path (_obj present): uses PlacePhoto.getUrl() \u2014 no proxy needed
 * - REST path: routes through edge-function proxy for caching
 */
export function placePhotoUrl(photo: PlacePhoto | string, maxWidth = 800): string {
  // Accept a PlacePhoto object (new Maps JS path)
  if (typeof photo === 'object') {
    if (photo._obj && typeof photo._obj.getUrl === 'function') {
      return (photo._obj as google.maps.places.PlacePhoto).getUrl({ maxWidth, maxHeight: maxWidth });
    }
    if (photo.reference) {
      return `${PLACE_PHOTOS_FN}?ref=${encodeURIComponent(photo.reference)}&w=${maxWidth}`;
    }
    return '';
  }
  // Accept a plain reference string (legacy REST path)
  return `${PLACE_PHOTOS_FN}?ref=${encodeURIComponent(photo)}&w=${maxWidth}`;
}

// \u2500\u2500\u2500 Clearbit logo \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

export function clearbitLogoUrl(domain: string): string {
  return `https://logo.clearbit.com/${domain}?size=128`;
}

// \u2500\u2500\u2500 Website screenshot providers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Multiple providers in a fallback chain \u2014 if one is blocked by the target site
// or returns a placeholder, the next is tried. All are keyless/free-tier.

export type ScreenshotProvider = 'mshots' | 'thumio' | 'microlink';

export function websiteScreenshotUrl(
  domain: string,
  width = 800,
  provider: ScreenshotProvider = 'mshots'
): string {
  const url = `https://${domain}`;
  switch (provider) {
    case 'thumio':
      // thum.io \u2014 keyless, real browser render. Width modifier prefix.
      return `https://image.thum.io/get/width/${width}/noanimate/${url}`;
    case 'microlink':
      // microlink.io \u2014 free tier (50/day, no key). Returns full-page screenshot.
      return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&viewport.${width}=x${Math.round(width * 0.625)}`;
    case 'mshots':
    default:
      // WordPress mshots \u2014 keyless, widely cached.
      return `https://s0.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=${width}&h=${Math.round(width * 0.625)}`;
  }
}

export const SCREENSHOT_PROVIDERS: ScreenshotProvider[] = ['mshots', 'thumio', 'microlink'];

// \u2500\u2500\u2500 Category SVG avatars \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

interface AvatarSpec { bg: string; fg: string; icon: string }

const CATEGORY_AVATARS: Record<string, AvatarSpec> = {
  hospital:        { bg:'#1e4060', fg:'#e8f4fd', icon:'M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9zm1 14h-2v-4H7v-2h3V7h2v4h3v2h-3v4z' },
  'primary-care':  { bg:'#2d6a4f', fg:'#e8f5f0', icon:'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z' },
  fqhc:            { bg:'#1a5276', fg:'#d6eaf8', icon:'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z' },
  'mental-health': { bg:'#5d3a7e', fg:'#f3eafd', icon:'M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z' },
  'substance-use': { bg:'#7e5a3a', fg:'#fdf0e8', icon:'M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3z' },
  dental:          { bg:'#1b6ca8', fg:'#e8f4fd', icon:'M12 1C8.1 1 5 4.1 5 8c0 2.4.4 4.3 1.2 5.9C7.8 17 9.1 18.6 12 22c2.9-3.4 4.2-5 5.8-8.1.8-1.6 1.2-3.5 1.2-5.9C19 4.1 15.9 1 12 1zm-2 7c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z' },
  'crisis-line':   { bg:'#c0392b', fg:'#fde8e8', icon:'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.19 2.2z' },
  'community-org': { bg:'#2e7d32', fg:'#e8f5e9', icon:'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
  'food-bank':     { bg:'#e65100', fg:'#fff3e0', icon:'M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-8.21-15.03-8.21-15.03 0h15.03zM1.02 17h15v2H1.02v-2z' },
  transportation:  { bg:'#1565c0', fg:'#e3f2fd', icon:'M17 5H3c-1.1 0-2 .89-2 2v9h2c0 1.65 1.34 3 3 3s3-1.35 3-3h5.5c0 1.65 1.34 3 3 3s3-1.35 3-3H23v-5l-6-6zM3 11V7h4v4H3zm3 6.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm7-6.5H9V7h4v4zm4.5 6.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM15 11V7h1l4 4h-5z' },
  veterans:        { bg:'#37474f', fg:'#eceff1', icon:'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z' },
  pediatrics:      { bg:'#ad1457', fg:'#fce4ec', icon:'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
  pharmacy:        { bg:'#00695c', fg:'#e0f2f1', icon:'M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm-4 8h-3v3h-2v-3H8v-2h3V6h2v3h3v2zm4-5h-2V5h2v1z' },
  'legal-aid':     { bg:'#4a148c', fg:'#f3e5f5', icon:'M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z' },
};

const DEFAULT_AVATAR: AvatarSpec = {
  bg: '#455a64', fg: '#eceff1',
  icon: 'M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z',
};

export function categoryAvatarDataUri(slug: string | null | undefined, size = 400): string {
  const spec = CATEGORY_AVATARS[slug ?? ''] ?? DEFAULT_AVATAR;
  const padding  = Math.round(size * 0.28);
  const iconSize = size - padding * 2;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">`,
    `<rect width="${size}" height="${size}" fill="${spec.bg}"/>`,
    `<g transform="translate(${padding},${padding}) scale(${iconSize / 24})">`,
    `<path fill="${spec.fg}" d="${spec.icon}"/>`,
    `</g>`,
    `</svg>`,
  ].join('');
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function getAvatarBgColor(slug: string | null | undefined): string {
  return CATEGORY_AVATARS[slug ?? '']?.bg ?? DEFAULT_AVATAR.bg;
}

// \u2500\u2500\u2500 Public meta \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

export interface ResourceImageMeta {
  src: string;
  type: 'photo_url' | 'google_places' | 'clearbit' | 'avatar';
  placeId?: string;
}

export function getResourceImageMeta(resource: ResourceWithCategory): ResourceImageMeta {
  const slug = resource.resource_categories?.slug ?? '';

  if (resource.photo_url) return { src: resource.photo_url, type: 'photo_url' };

  // Return cached Google photo if available
  const cached = resultCache.get(resource.id);
  if (cached?.photos.length) {
    return {
      src: placePhotoUrl(cached.photos[0], 800),
      type: 'google_places',
      placeId: cached.placeId ?? undefined,
    };
  }

  if (hasGoogleKey() && !isVirtualService(resource)) {
    return { src: categoryAvatarDataUri(slug), type: 'google_places' };
  }

  if (resource.domain) return { src: clearbitLogoUrl(resource.domain), type: 'clearbit' };
  return { src: categoryAvatarDataUri(slug), type: 'avatar' };
}

export function getResourceImage(resource: ResourceWithCategory): string {
  return getResourceImageMeta(resource).src;
}

export function hasRating(rating: number | null | undefined): boolean {
  return typeof rating === 'number' && rating > 0;
}
