import { readFileSync, writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env
readFileSync('.env', 'utf8').split('\n').forEach((line) => {
  const p = line.indexOf('=');
  if (p > 0 && !line.startsWith('#')) {
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

interface ResourceRow {
  id: string;
  name: string;
  category_id: string | null;
  subcategory: string;
  description: string;
  address: string;
  city: string;
  county: string;
  state: string;
  zip_code: string;
  phone: string;
  website: string | null;
  hours: Record<string, string>;
  accepts_uninsured: boolean;
  sliding_scale: boolean;
  medicaid: boolean;
  medicare: boolean;
  private_insurance: boolean;
  walk_ins_welcome: boolean;
  appointments: boolean;
  telehealth: boolean;
  cost_free: boolean;
  cost_estimate_min: number;
  cost_estimate_max: number;
  languages: string[];
  accessibility: string[];
  services: string[];
  specialties: string[];
  audiences: string[];
  rating: number | null;
  photo_url: string;
  source: string;
  google_place_id: string | null;
  created_at: string;
  updated_at: string;
  tags: string[];
  search_text: string | null;
  domain: string | null;
  lat: number | null;
  lng: number | null;
  slug: string | null;
}

// Robust CSV parser that handles quoted fields with embedded commas, quotes, and newlines
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        field += char;
        i++;
        continue;
      }
    }

    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (char === ',') {
      current.push(field);
      field = '';
      i++;
      continue;
    }

    if (char === '\r') {
      i++;
      continue;
    }

    if (char === '\n') {
      current.push(field);
      rows.push(current);
      current = [];
      field = '';
      i++;
      continue;
    }

    field += char;
    i++;
  }

  // Last field/row
  if (field.length > 0 || current.length > 0) {
    current.push(field);
    rows.push(current);
  }

  return rows;
}

function parseJSONField(val: string): Record<string, string> | string[] {
  if (!val || val === '[]' || val === '{}') {
    return typeof val === 'string' && val.startsWith('[') ? [] : {};
  }
  try {
    return JSON.parse(val);
  } catch {
    return typeof val === 'string' && val.startsWith('[') ? [] : {};
  }
}

function parseArrayField(val: string): string[] {
  if (!val || val === '[]') return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function parseBool(val: string): boolean {
  return val === 'true' || val === 'TRUE' || val === 'True' || val === '1';
}

function parseIntOrNull(val: string): number | null {
  if (val === '' || val === 'null') return null;
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

function parseFloatOrNull(val: string): number | null {
  if (val === '' || val === 'null') return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function parseStringOrNull(val: string): string | null {
  if (val === '' || val === 'null') return null;
  return val;
}

async function main() {
  const csvPath = 'scripts/washington_resources_missing_supabase_ready_enriched_2026-08-30.csv';
  console.log(`Reading CSV: ${csvPath}`);
  const raw = readFileSync(csvPath, 'utf8');
  const rows = parseCSV(raw);

  if (rows.length < 2) {
    console.error('CSV has no data rows');
    return;
  }

  const headers = rows[0];
  console.log(`CSV headers (${headers.length} columns):`, headers.join(', '));
  console.log(`Total CSV rows (excluding header): ${rows.length - 1}`);

  // Parse all data rows into typed objects
  const allRecords: ResourceRow[] = [];
  const seenIds = new Set<string>();

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (cells.length < headers.length) {
      console.warn(`Row ${r} has ${cells.length} cells, expected ${headers.length}. Skipping.`);
      continue;
    }

    const get = (col: string): string => {
      const idx = headers.indexOf(col);
      return idx >= 0 ? (cells[idx] ?? '') : '';
    };

    const id = get('id');
    if (!id) {
      console.warn(`Row ${r}: missing id, skipping`);
      continue;
    }
    if (seenIds.has(id)) {
      console.warn(`Row ${r}: duplicate id ${id} within CSV, skipping`);
      continue;
    }
    seenIds.add(id);

    const hoursRaw = get('hours');
    let hours: Record<string, string> = {};
    try {
      hours = JSON.parse(hoursRaw);
    } catch {
      hours = {};
    }

    allRecords.push({
      id,
      name: get('name'),
      category_id: parseStringOrNull(get('category_id')),
      subcategory: get('subcategory') || '',
      description: get('description') || '',
      address: get('address') || '',
      city: get('city') || '',
      county: get('county') || '',
      state: get('state') || 'WA',
      zip_code: get('zip_code') || '',
      phone: get('phone') || '',
      website: parseStringOrNull(get('website')),
      hours,
      accepts_uninsured: parseBool(get('accepts_uninsured')),
      sliding_scale: parseBool(get('sliding_scale')),
      medicaid: parseBool(get('medicaid')),
      medicare: parseBool(get('medicare')),
      private_insurance: parseBool(get('private_insurance')),
      walk_ins_welcome: parseBool(get('walk_ins_welcome')),
      appointments: parseBool(get('appointments')),
      telehealth: parseBool(get('telehealth')),
      cost_free: parseBool(get('cost_free')),
      cost_estimate_min: parseInt(get('cost_estimate_min')) || 0,
      cost_estimate_max: parseInt(get('cost_estimate_max')) || 0,
      languages: parseArrayField(get('languages')),
      accessibility: parseArrayField(get('accessibility')),
      services: parseArrayField(get('services')),
      specialties: parseArrayField(get('specialties')),
      audiences: parseArrayField(get('audiences')),
      rating: parseFloatOrNull(get('rating')),
      photo_url: get('photo_url') || '',
      source: get('source') || 'verified',
      google_place_id: parseStringOrNull(get('google_place_id')),
      created_at: get('created_at') || new Date().toISOString(),
      updated_at: get('updated_at') || new Date().toISOString(),
      tags: parseArrayField(get('tags')),
      search_text: parseStringOrNull(get('search_text')),
      domain: parseStringOrNull(get('domain')),
      lat: parseFloatOrNull(get('lat')),
      lng: parseFloatOrNull(get('lng')),
      slug: parseStringOrNull(get('slug')),
    });
  }

  console.log(`Parsed ${allRecords.length} valid records from CSV`);

  // Check for duplicate IDs already in the database
  console.log('Fetching existing IDs from database...');
  const allCsvIds = allRecords.map((r) => r.id);
  const existingIds = new Set<string>();

  // Query in batches of 200 to avoid URL length limits
  const ID_BATCH = 200;
  for (let i = 0; i < allCsvIds.length; i += ID_BATCH) {
    const batch = allCsvIds.slice(i, i + ID_BATCH);
    const { data, error } = await supabase
      .from('resources')
      .select('id')
      .in('id', batch);

    if (error) {
      console.error('Error fetching existing IDs:', error.message);
      return;
    }

    for (const row of data ?? []) {
      existingIds.add(row.id);
    }
  }

  console.log(`Found ${existingIds.size} IDs already in database`);

  // Filter out records that already exist
  const newRecords = allRecords.filter((r) => !existingIds.has(r.id));
  const skippedCount = allRecords.length - newRecords.length;
  console.log(`New records to insert: ${newRecords.length} (skipped ${skippedCount} duplicates)`);

  if (newRecords.length === 0) {
    console.log('Nothing to insert. All records already exist.');
    return;
  }

  // Insert in batches
  const BATCH_SIZE = 25;
  let success = 0;
  let failed = 0;
  const failedRecords: { row: number; id: string; error: string }[] = [];

  for (let i = 0; i < newRecords.length; i += BATCH_SIZE) {
    const batch = newRecords.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(newRecords.length / BATCH_SIZE);
    console.log(`Inserting batch ${batchNum}/${totalBatches} (${batch.length} records)...`);

    const { error } = await supabase.from('resources').insert(batch as any);

    if (error) {
      console.error(`  Batch ${batchNum} error: ${error.message}`);
      // Try inserting one by one to find the problematic record
      for (const rec of batch) {
        const { error: singleError } = await supabase
          .from('resources')
          .insert(rec as any);
        if (singleError) {
          failed++;
          failedRecords.push({
            row: i + batch.indexOf(rec) + 2,
            id: rec.id,
            error: singleError.message,
          });
        } else {
          success++;
        }
      }
    } else {
      success += batch.length;
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`Total CSV records: ${allRecords.length}`);
  console.log(`Already in database (skipped): ${skippedCount}`);
  console.log(`Successfully inserted: ${success}`);
  console.log(`Failed: ${failed}`);

  if (failedRecords.length > 0) {
    console.log('\nFailed records:');
    for (const f of failedRecords.slice(0, 20)) {
      console.log(`  Row ${f.row} (id: ${f.id}): ${f.error}`);
    }
    if (failedRecords.length > 20) {
      console.log(`  ... and ${failedRecords.length - 20} more`);
    }
    writeFileSync('scripts/import_errors.json', JSON.stringify(failedRecords, null, 2));
    console.log('Full error details written to scripts/import_errors.json');
  }

  // Final count
  const { count } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true });
  console.log(`\nTotal resources in database: ${count}`);
}

main().catch(console.error);
