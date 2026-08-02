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

async function fetchTable(table: string, select: string, orderBy?: string) {
  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}`;
  if (orderBy) url += `&order=${orderBy}.desc`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${table}: ${res.status}`);
  return res.json();
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const now = new Date().toISOString();

    const staticPages = [
      { path: "/", priority: "1.0", changefreq: "weekly" },
      { path: "/search", priority: "0.9", changefreq: "weekly" },
      { path: "/symptoms", priority: "0.8", changefreq: "weekly" },
      { path: "/locations", priority: "0.8", changefreq: "weekly" },
      { path: "/map", priority: "0.7", changefreq: "weekly" },
      { path: "/about", priority: "0.5", changefreq: "monthly" },
      { path: "/how-it-works", priority: "0.5", changefreq: "monthly" },
      { path: "/faq", priority: "0.5", changefreq: "monthly" },
    ];

    const [resources, symptoms, categories] = await Promise.all([
      fetchTable("resources", "id,slug,city,county", "updated_at"),
      fetchTable("symptoms", "slug,updated_at", "updated_at"),
      fetchTable("resource_categories", "slug"),
    ]);

    const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const citySet = new Set<string>();
    const countySet = new Set<string>();
    for (const r of resources) {
      if (r.city) citySet.add(r.city);
      if (r.county) countySet.add(r.county);
    }

    const urls: string[] = [];

    for (const p of staticPages) {
      urls.push(`  <url>\n    <loc>${SITE_URL}${p.path}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`);
    }

    for (const cat of categories) {
      urls.push(`  <url>\n    <loc>${SITE_URL}/search?cat=${cat.slug}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`);
    }

    for (const s of symptoms) {
      urls.push(`  <url>\n    <loc>${SITE_URL}/symptom/${s.slug}</loc>\n    <lastmod>${s.updated_at}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`);
    }

    for (const r of resources) {
      const slug = xmlEscape(r.slug || r.id);
      urls.push(`  <url>\n    <loc>${SITE_URL}/resource/${slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`);
    }

    for (const city of citySet) {
      urls.push(`  <url>\n    <loc>${SITE_URL}/locations/${slugify(city)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`);
    }
    for (const county of countySet) {
      urls.push(`  <url>\n    <loc>${SITE_URL}/locations/${slugify(county)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`);
    }
    for (const county of countySet) {
      for (const cat of categories) {
        urls.push(`  <url>\n    <loc>${SITE_URL}/locations/${slugify(county)}/${cat.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`);
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

    return new Response(xml, { status: 200, headers: corsHeaders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(`<!-- sitemap generation failed: ${msg} -->`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
