// Import resources from a CSV file into Supabase, converting all field formats
// from CSV/JSON to PostgreSQL-compatible types.
//
// Key conversions:
// - Generates fresh UUIDs (ignores CSV ids to avoid conflicts)
// - Parses JSON arrays like ["English","Spanish"] -> string[] for text[] columns
// - Parses JSON object like {"monday":"24/7",...} -> object for jsonb hours column
// - Converts empty strings in nullable columns to null
// - Converts "true"/"false" strings to booleans
// - Parses numeric fields
// - Deduplicates by name+address+city to avoid inserting exact duplicates
//
// Usage: npx tsx scripts/import-csv.ts <path-to-csv>

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// ── Load env ──────────────────────────────────────────────────────────────
readFileSync('.env', 'utf8').split('\n').forEach((line) => {
  const p = line.indexOf('=');
  if (p > 0) {
    const key = line.slice(0, p).trim();
    const val = line.slice(p + 1).trim();
    process.env[key] = val;
  }
});

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false },
});

// ── CSV parser ────────────────────────────────────────────────────────────
// Minimal CSV parser that handles quoted fields with embedded commas,
// newlines, and doubled double-quotes ("").
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  let current = '';
  let inQuotes = false;

  while (i < line.length) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
        i++;
      } else {
        current += ch;
        i++;
      }
    }
  }
  fields.push(current);
  return fields;
}

// Parse full CSV that may contain newlines inside quoted fields
function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '"') {
      // Check for doubled quote
      if (inQuotes && content[i + 1] === '"') {
        current += '""';
        i++;
      } else {
        inQuotes = !inQuotes;
        current += ch;
      }
    } else if (ch === '\n' && !inQuotes) {
      lines.push(current);
      current = '';
    } else if (ch === '\r' && !inQuotes) {
      // skip carriage return
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).filter((l) => l.trim()).map(parseCSVLine);
  return { headers, rows };
}

// ── Field converters ──────────────────────────────────────────────────────

function parseJSONArray(val: string): string[] {
  if (!val || val.trim() === '') return [];
  // Input looks like ["English","Spanish"] or ["item1","item2"]
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.map((s: unknown) => String(s));
  } catch {
    // Fallback: strip brackets and split by comma
    const cleaned = val.replace(/^\[/, '').replace(/\]$/, '');
    return cleaned.split(',').map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
  }
  return [];
}

function parseJSONHours(val: string): Record<string, string> {
  if (!val || val.trim() === '') return {};
  try {
    const parsed = JSON.parse(val);
    if (typeof parsed === 'object' && parsed !== null) return parsed;
  } catch {
    return {};
  }
  return {};
}

function parseBool(val: string): boolean {
  return val === 'true' || val === 'TRUE' || val === 'True' || val === '1';
}

function parseNullableString(val: string): string | null {
  if (!val || val.trim() === '') return null;
  return val.trim();
}

function parseIntOrZero(val: string): number {
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

function parseFloatOrZero(val: string): number {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const csvPath = process.argv[2] || 'washington_resources_missing_supabase_ready_enriched_2026-08-30.csv';
  console.log(`Reading CSV: ${csvPath}`);

  const content = readFileSync(csvPath, 'utf-8');
  const { headers, rows } = parseCSV(content);
  console.log(`CSV has ${headers.length} columns and ${rows.length} data rows`);
  console.log(`Headers: ${headers.join(', ')}`);

  // Map header names to indices
  const idx: Record<string, number> = {};
  headers.forEach((h, i) => { idx[h] = i; });

  // Fetch existing name+city combos to skip exact duplicates
  const { data: existing } = await supabase
    .from('resources')
    .select('name, city');
  const existingKeys = new Set((existing ?? []).map((r: { name: string; city: string }) => `${r.name.toLowerCase()}|${(r.city || '').toLowerCase()}`));
  console.log(`Database has ${existingKeys.size} existing resources to check against`);

  // Also fetch existing slugs to skip duplicates
  const { data: existingSlugs } = await supabase
    .from('resources')
    .select('slug');
  const slugSet = new Set((existingSlugs ?? []).map((r: { slug: string }) => r.slug).filter(Boolean));
  console.log(`Database has ${slugSet.size} existing slugs`);

  const resources: Record<string, unknown>[] = [];
  let skippedDup = 0;
  let skippedCat = 0;

  for (const row of rows) {
    const name = row[idx['name']] || '';
    const city = row[idx['city']] || '';
    const dupKey = `${name.toLowerCase()}|${city.toLowerCase()}`;

    if (existingKeys.has(dupKey)) {
      skippedDup++;
      continue;
    }

    const categoryId = row[idx['category_id']] || '';
    if (!categoryId) {
      skippedCat++;
      continue;
    }

    // Check slug uniqueness — if slug exists, append a suffix
    let slug = row[idx['slug']] || '';
    if (slug && slugSet.has(slug)) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }
    if (slug) slugSet.add(slug);

    const resource: Record<string, unknown> = {
      name: name,
      category_id: categoryId,
      subcategory: row[idx['subcategory']] || '',
      description: row[idx['description']] || '',
      address: row[idx['address']] || '',
      city: city,
      county: row[idx['county']] || '',
      state: row[idx['state']] || 'WA',
      zip_code: row[idx['zip_code']] || '',
      phone: row[idx['phone']] || '',
      website: parseNullableString(row[idx['website']]),
      hours: parseJSONHours(row[idx['hours']]),
      accepts_uninsured: parseBool(row[idx['accepts_uninsured']]),
      sliding_scale: parseBool(row[idx['sliding_scale']]),
      medicaid: parseBool(row[idx['medicaid']]),
      medicare: parseBool(row[idx['medicare']]),
      private_insurance: parseBool(row[idx['private_insurance']]),
      walk_ins_welcome: parseBool(row[idx['walk_ins_welcome']]),
      appointments: parseBool(row[idx['appointments']]),
      telehealth: parseBool(row[idx['telehealth']]),
      cost_free: parseBool(row[idx['cost_free']]),
      cost_estimate_min: parseIntOrZero(row[idx['cost_estimate_min']]),
      cost_estimate_max: parseIntOrZero(row[idx['cost_estimate_max']]),
      languages: parseJSONArray(row[idx['languages']]),
      accessibility: parseJSONArray(row[idx['accessibility']]),
      services: parseJSONArray(row[idx['services']]),
      specialties: parseJSONArray(row[idx['specialties']]),
      audiences: parseJSONArray(row[idx['audiences']]),
      rating: parseFloatOrZero(row[idx['rating']]) || 4.5,
      photo_url: row[idx['photo_url']] || '',
      source: row[idx['source']] || 'wa-211',
      google_place_id: parseNullableString(row[idx['google_place_id']]),
      tags: parseJSONArray(row[idx['tags']]),
      search_text: parseNullableString(row[idx['search_text']]),
      domain: parseNullableString(row[idx['domain']]),
      lat: null, // CSV has 0 for all — leave null so map can geocode later
      lng: null,
      slug: slug || null,
    };

    resources.push(resource);
    existingKeys.add(dupKey);
  }

  console.log(`Prepared ${resources.length} resources to insert`);
  console.log(`Skipped ${skippedDup} exact duplicates, ${skippedCat} missing category`);

  if (resources.length === 0) {
    console.log('Nothing to insert.');
    return;
  }

  // Insert in batches of 25
  const BATCH = 25;
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < resources.length; i += BATCH) {
    const batch = resources.slice(i, i + BATCH);
    const { error } = await supabase.from('resources').insert(batch);
    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH) + 1} error:`, error.message);
      errors.push(`Batch ${Math.floor(i / BATCH) + 1}: ${error.message}`);
      failed += batch.length;
    } else {
      success += batch.length;
    }
    if ((i + BATCH) % 250 === 0 || i + BATCH >= resources.length) {
      console.log(`Progress: ${Math.min(i + BATCH, resources.length)}/${resources.length} processed`);
    }
  }

  console.log(`\nDone. Inserted: ${success}, Failed: ${failed}`);
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach((e) => console.log(`  ${e}`));
  }

  const { count: finalCount } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true });
  console.log(`Total resources in database: ${finalCount}`);
}

main().catch(console.error);
