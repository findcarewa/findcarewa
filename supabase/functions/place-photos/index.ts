import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY") ?? "";

/**
 * Photo proxy — GET /place-photos?ref=PHOTO_REFERENCE&w=800
 *
 * Fetches the Google Places Photo and pipes the bytes back with CORS +
 * long-lived cache headers. This keeps the API key out of the DOM and
 * lets the CDN edge cache the images.
 *
 * Falls back to empty 204 if no key configured (client will use direct URL).
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url      = new URL(req.url);
  const photoRef = url.searchParams.get("ref");
  const maxWidth = url.searchParams.get("w") ?? "800";

  if (!photoRef) {
    return new Response(JSON.stringify({ error: "ref param required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!GOOGLE_API_KEY) {
    // No key on server — return 204 so client falls back to direct URL
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const photoUrl =
    `https://maps.googleapis.com/maps/api/place/photo` +
    `?maxwidth=${maxWidth}` +
    `&photo_reference=${encodeURIComponent(photoRef)}` +
    `&key=${GOOGLE_API_KEY}`;

  try {
    const upstream = await fetch(photoUrl, { redirect: "follow" });
    if (!upstream.ok) {
      return new Response(null, { status: upstream.status, headers: corsHeaders });
    }
    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    const body = await upstream.arrayBuffer();
    return new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        // Cache 7 days on CDN edge; stale-while-revalidate 30 days
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=2592000",
      },
    });
  } catch {
    return new Response(null, { status: 502, headers: corsHeaders });
  }
});
