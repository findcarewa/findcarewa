import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SITE_URL = "https://findcarewa.org";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  "Content-Type": "application/xml",
};

async function fetchTable(table: string, select: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?select=${select}&order=updated_at.desc`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
      },
    },
  );
  if (!res.ok) throw new Error(`Failed to fetch ${table}: ${res.status}`);
  return res.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const now = new Date().toISOString();

    const staticPages = [
      { path: "/", priority: "1.0", changefreq: "weekly" },
      { path: "/#/search", priority: "0.9", changefreq: "weekly" },
      { path: "/#/symptoms", priority: "0.8", changefreq: "weekly" },
      { path: "/#/map", priority: "0.7", changefreq: "weekly" },
      { path: "/#/about", priority: "0.5", changefreq: "monthly" },
      { path: "/#/how-it-works", priority: "0.5", changefreq: "monthly" },
      { path: "/#/faq", priority: "0.5", changefreq: "monthly" },
      { path: "/#/locations", priority: "0.8", changefreq: "weekly" },
    ];

    const [resources, symptoms, categories] = await Promise.all([
      fetchTable("resources", "id,city,county"),
      fetchTable("symptoms", "slug,updated_at"),
      fetchTable("resource_categories", "slug"),
    ]);

    // Build location URLs from cities and counties
    const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const citySet = new Set<string>();
    const countySet = new Set<string>();
    for (const r of resources) {
      if (r.city) citySet.add(r.city);
      if (r.county) countySet.add(r.county);
    }

    const urls: string[] = [];

    for (const p of staticPages) {
      urls.push(`  <url>
    <loc>${SITE_URL}${p.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`);
    }

    for (const cat of categories) {
      urls.push(`  <url>
    <loc>${SITE_URL}/#/search?cat=${cat.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }

    for (const s of symptoms) {
      urls.push(`  <url>
    <loc>${SITE_URL}/#/symptom/${s.slug}</loc>
    <lastmod>${s.updated_at}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }

    for (const r of resources) {
      urls.push(`  <url>
    <loc>${SITE_URL}/#/resource/${r.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }

    // Location pages — city + county
    for (const city of citySet) {
      urls.push(`  <url>
    <loc>${SITE_URL}/#/locations/${slugify(city)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }
    for (const county of countySet) {
      urls.push(`  <url>
    <loc>${SITE_URL}/#/locations/${slugify(county)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }
    // Location + specialty pages
    for (const county of countySet) {
      for (const cat of categories) {
        urls.push(`  <url>
    <loc>${SITE_URL}/#/locations/${slugify(county)}/${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    return new Response(xml, { status: 200, headers: corsHeaders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(`<!-- sitemap generation failed: ${msg} -->`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
