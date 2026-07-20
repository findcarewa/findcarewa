/**
 * Singleton Google Maps JS API loader.
 * Ensures the API is only loaded once regardless of how many components use it.
 */

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

let loadPromise: Promise<typeof google | null> | null = null;

/** Load (or return already-loaded) Google Maps JS API. Returns null if no key. */
export async function loadGoogleMaps(): Promise<typeof google | null> {
  if (!GOOGLE_KEY) return null;
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    // Inject Google Maps script directly
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places,geometry&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(typeof google !== 'undefined' ? google : null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });

  return loadPromise;
}

/** Returns true if google maps is already loaded in the window. */
export function isMapsLoaded(): boolean {
  return typeof google !== 'undefined' && typeof google.maps !== 'undefined';
}
