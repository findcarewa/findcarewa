/**
 * ResourceImage — smart image component.
 *
 * Fallback chain per resource:
 *   1. photo_url column (manual override)
 *   2. Google Places photo (if API key present)
 *   3. Website screenshot — tries multiple providers (mshots → thum.io → microlink);
 *      if a provider returns a blocked/placeholder image, advances to the next.
 *   4. Clearbit logo (domain favicon / logo)
 *   5. Category avatar (always works, never blank)
 */

import { useState, useEffect, useRef } from 'react';
import type { ResourceWithCategory } from '../lib/supabase';
import {
  fetchPlaceResult,
  placePhotoUrl,
  clearbitLogoUrl,
  isVirtualService,
  hasGoogleKey,
  websiteScreenshotUrl,
  SCREENSHOT_PROVIDERS,
  type ScreenshotProvider,
  type PlacePhoto,
  type PlaceResult,
  getAvatarBgColor,
} from '../lib/resourceImages';
import { getCategoryIcon, getCategoryColor } from '../lib/icons';

// ─── Slug → Tailwind colour key ───────────────────────────────────────────────
function slugToColorKey(slug: string): string {
  const map: Record<string, string> = {
    hospital: 'navy', 'primary-care': 'teal', fqhc: 'teal', 'mental-health': 'purple',
    'substance-use': 'orange', dental: 'blue', 'crisis-line': 'red', 'community-org': 'green',
    'food-bank': 'orange', transportation: 'blue', veterans: 'gray', pediatrics: 'pink',
    pharmacy: 'teal', 'legal-aid': 'purple',
  };
  return map[slug] ?? 'teal';
}

// ─── Category avatar badge ────────────────────────────────────────────────────
export function AvatarBadge({ slug, className = '' }: { slug: string; className?: string }) {
  const Icon  = getCategoryIcon(slug);
  const color = getCategoryColor(slugToColorKey(slug));
  return (
    <div className={`flex items-center justify-center ${color.bg} ${className}`}>
      <Icon className="w-8 h-8 text-white opacity-60" />
    </div>
  );
}

// ─── Main ResourceImage component ─────────────────────────────────────────────

interface ResourceImageProps {
  resource: ResourceWithCategory;
  className?: string;
  maxWidth?: number;
  onPlaceResult?: (result: PlaceResult) => void;
}

type ImgState =
  | { kind: 'avatar' }
  | { kind: 'clearbit'; src: string }
  | { kind: 'screenshot'; src: string; providerIdx: number }
  | { kind: 'photo'; src: string };

export function ResourceImage({
  resource, className = '', maxWidth = 800, onPlaceResult,
}: ResourceImageProps) {
  const slug    = resource.resource_categories?.slug ?? '';
  const virtual = isVirtualService(resource);

  function initialState(): ImgState {
    if (resource.photo_url) return { kind: 'photo', src: resource.photo_url };
    if (resource.domain)    return { kind: 'screenshot', src: websiteScreenshotUrl(resource.domain, maxWidth, SCREENSHOT_PROVIDERS[0]), providerIdx: 0 };
    return { kind: 'avatar' };
  }

  const [state, setState] = useState<ImgState>(initialState);
  const mounted = useRef(true);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  // Reset when resource changes
  useEffect(() => {
    setState(initialState());
  }, [resource.id]);

  // For physical locations with a Google key: fetch a real Places photo
  useEffect(() => {
    if (resource.photo_url) return;
    if (virtual) return;
    if (!hasGoogleKey()) return;

    let cancelled = false;
    fetchPlaceResult(resource).then((result) => {
      if (cancelled || !mounted.current) return;
      if (onPlaceResult) onPlaceResult(result);
      if (result.photos.length > 0) {
        setState({ kind: 'photo', src: placePhotoUrl(result.photos[0], maxWidth) });
      }
    }).catch(() => {
      // Google Places failed — stay on screenshot / clearbit / avatar
    });
    return () => { cancelled = true; };
  }, [resource.id]);

  // ── Advance through the fallback chain ──────────────────────────────────
  function advanceFromScreenshot(currentIdx: number) {
    const nextIdx = currentIdx + 1;
    if (nextIdx < SCREENSHOT_PROVIDERS.length && resource.domain) {
      setState({
        kind: 'screenshot',
        src: websiteScreenshotUrl(resource.domain, maxWidth, SCREENSHOT_PROVIDERS[nextIdx]),
        providerIdx: nextIdx,
      });
    } else if (resource.domain) {
      // All screenshot providers exhausted → clearbit logo
      setState({ kind: 'clearbit', src: clearbitLogoUrl(resource.domain) });
    } else {
      setState({ kind: 'avatar' });
    }
  }

  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    // Blocked/placeholder images from screenshot services are typically tiny
    // (1x1 or 2x2 transparent GIFs). Real screenshots are ≥ 200px wide.
    if (img.naturalWidth <= 2 || img.naturalHeight <= 2) {
      if (state.kind === 'screenshot') advanceFromScreenshot(state.providerIdx);
    }
  }

  function handleError() {
    if (state.kind === 'photo') {
      // Photo failed → try screenshot if we have a domain
      if (resource.domain) {
        setState({ kind: 'screenshot', src: websiteScreenshotUrl(resource.domain, maxWidth, SCREENSHOT_PROVIDERS[0]), providerIdx: 0 });
      } else {
        setState({ kind: 'avatar' });
      }
    } else if (state.kind === 'screenshot') {
      advanceFromScreenshot(state.providerIdx);
    } else if (state.kind === 'clearbit') {
      setState({ kind: 'avatar' });
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (state.kind === 'avatar') {
    return <AvatarBadge slug={slug} className={className} />;
  }

  const bgColor = getAvatarBgColor(slug);

  if (state.kind === 'clearbit') {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ backgroundColor: bgColor }}>
        <img
          src={state.src}
          alt={resource.name}
          className="max-h-[60%] max-w-[60%] object-contain drop-shadow-sm"
          onError={handleError}
          loading="lazy"
        />
      </div>
    );
  }

  // kind === 'screenshot' or 'photo' — both render as cover image
  return (
    <div className={className} style={{ backgroundColor: bgColor }}>
      <img
        src={state.src}
        alt={resource.name}
        className="w-full h-full object-cover object-top"
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
    </div>
  );
}

// ─── Photo gallery (used in ResourceDetail) ──────────────────────────────────

interface PlacePhotoGalleryProps {
  placeId: string;
  resource: ResourceWithCategory;
  name: string;
}

export function PlacePhotoGallery({ resource, name }: PlacePhotoGalleryProps) {
  const [photos, setPhotos] = useState<PlacePhoto[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setActive(0);
    fetchPlaceResult(resource).then((r) => {
      if (!cancelled) { setPhotos(r.photos); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [resource.id]);

  if (loading || photos.length < 2) return null;

  function photoSrc(p: PlacePhoto, w: number) {
    return placePhotoUrl(p, w);
  }

  return (
    <div className="mt-4">
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-ink-100">
        <img
          key={active}
          src={photoSrc(photos[active], 1200)}
          alt={`${name} — photo ${active + 1}`}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.opacity = '0.3'; }}
          loading="lazy"
        />
        {photos.length > 1 && (
          <>
            <button onClick={() => setActive((a) => (a - 1 + photos.length) % photos.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors text-xl font-light"
              aria-label="Previous photo">‹</button>
            <button onClick={() => setActive((a) => (a + 1) % photos.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors text-xl font-light"
              aria-label="Next photo">›</button>
            <span className="absolute bottom-2 right-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-[11px] font-semibold tracking-wide">
              {active + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-none">
        {photos.map((p, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
              i === active ? 'border-sage-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-75'
            }`}>
            <img src={photoSrc(p, 128)} alt={`Thumbnail ${i + 1}`}
              className="w-full h-full object-cover" loading="lazy"
              onError={(e) => { e.currentTarget.style.opacity = '0.3'; }}
            />
          </button>
        ))}
      </div>

      {photos[active]?.attributions?.length > 0 && (
        <p className="mt-1.5 text-[10px] text-primary-400 text-right leading-relaxed"
          dangerouslySetInnerHTML={{ __html: 'Photos: ' + photos[active].attributions[0] }} />
      )}
    </div>
  );
}
