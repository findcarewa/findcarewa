import { readFileSync, writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

readFileSync('.env', 'utf8').split('\n').forEach((line) => {
  const p = line.indexOf('=');
  if (p > 0 && !line.startsWith('#')) {
    process.env[line.slice(0, p).trim()] = line.slice(p + 1).trim();
  }
});

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!, {
  auth: { persistSession: false },
});

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
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += char; i++; continue;
    }
    if (char === '"') { inQuotes = true; i++; continue; }
    if (char === ',') { current.push(field); field = ''; i++; continue; }
    if (char === '\r') { i++; continue; }
    if (char === '\n') { current.push(field); rows.push(current); current = []; field = ''; i++; continue; }
    field += char; i++;
  }
  if (field.length > 0 || current.length > 0) { current.push(field); rows.push(current); }
  return rows;
}

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.,]/g, '');
}

async function main() {
  const csvPath = 'scripts/washington_resources_missing_supabase_ready_enriched_2026-08-30.csv';
  const raw = readFileSync(csvPath, 'utf8');
  const rows = parseCSV(raw);
  const headers = rows[0];

  const get = (cells: string[], col: string): string => {
    const idx = headers.indexOf(col);
    return idx >= 0 ? (cells[idx] ?? '') : '';
  };

  // Parse all CSV records
  const csvRecords: { id: string; name: string; address: string; city: string; row: string[] }[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (cells.length < headers.length) continue;
    const id = get(cells, 'id');
    const name = get(cells, 'name');
    const address = get(cells, 'address');
    const city = get(cells, 'city');
    if (!id) continue;
    csvRecords.push({ id, name, address, city, row: cells });
  }
  console.log(`CSV records: ${csvRecords.length}`);

  // Fetch all existing DB records (name, address, city, id)
  console.log('Fetching all existing resources from database...');
  const dbRecords: Map<string, { id: string; name: string; address: string; city: string }> = new Map();
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('resources')
      .select('id,name,address,city')
      .range(offset, offset + PAGE - 1);
    if (error) { console.error('DB fetch error:', error.message); break; }
    if (!data || data.length === 0) break;
    for (const row of data) {
      const key = `${normalize(row.name || '')}|${normalize(row.address || '')}|${normalize(row.city || '')}`;
      dbRecords.set(key, row);
    }
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  console.log(`DB records fetched: ${dbRecords.size}`);

  // Compare: find CSV records that DON'T match any DB record by name+address+city
  let matchedByLocation = 0;
  let trulyNew: typeof csvRecords = [];
  let idMatchedButLocationDifferent: typeof csvRecords = [];

  // Also build a set of existing DB IDs
  const dbIds = new Set<string>();
  for (const [, val] of dbRecords) dbIds.add(val.id);

  for (const rec of csvRecords) {
    const locKey = `${normalize(rec.name)}|${normalize(rec.address)}|${normalize(rec.city)}`;
    if (dbRecords.has(locKey)) {
      matchedByLocation++;
      // Check if the CSV ID matches the DB ID for this location
      const dbRec = dbRecords.get(locKey)!;
      if (dbRec.id !== rec.id) {
        idMatchedButLocationDifferent.push(rec);
      }
    } else {
      // This location doesn't exist in DB at all - truly new
      // But first check if the CSV ID already exists in DB (different location, same ID)
      if (dbIds.has(rec.id)) {
        // ID exists but location is different - this is a conflict, needs new ID
        idMatchedButLocationDifferent.push(rec);
      } else {
        trulyNew.push(rec);
      }
    }
  }

  console.log(`\n=== Results ===`);
  console.log(`Matched by location (already in DB): ${matchedByLocation}`);
  console.log(`ID matched but location differs (needs new ID): ${idMatchedButLocationDifferent.length}`);
  console.log(`Truly new (not in DB by location or ID): ${trulyNew.length}`);

  // Write out the records that need new IDs
  const needsNewId = [...idMatchedButLocationDifferent, ...trulyNew];
  console.log(`Total records needing new IDs: ${needsNewId.length}`);

  if (needsNewId.length > 0) {
    // Generate new UUIDs for these records
    // Write a new CSV with new IDs
    const outputLines = [headers.join(',')];
    for (const rec of needsNewId) {
      // Generate a new UUID v5 using crypto
      const { randomUUID } = require('crypto');
      const newId = randomUUID();
      // Replace the ID in the row
      const newRow = [...rec.row];
      newRow[headers.indexOf('id')] = newId;
      outputLines.push(newRow.map(c => {
        if (c.includes(',') || c.includes('"') || c.includes('\n')) {
          return '"' + c.replace(/"/g, '""') + '"';
        }
        return c;
      }).join(','));
    }
    writeFileSync('scripts/new_locations_needing_import.csv', outputLines.join('\n'));
    console.log(`\nWrote ${needsNewId.length} records with new IDs to scripts/new_locations_needing_import.csv`);
  }

  // Summary of ID conflicts
  if (idMatchedButLocationDifferent.length > 0) {
    console.log(`\nID conflicts (CSV ID exists in DB but at a different location):`);
    for (const rec of idMatchedButLocationDifferent.slice(0, 20)) {
      const locKey = `${normalize(rec.name)}|${normalize(rec.address)}|${normalize(rec.city)}`;
      const dbRec = dbRecords.get(locKey);
      console.log(`  CSV: ${rec.name} | ${rec.address} | ${rec.city} (id: ${rec.id})`);
    }
    if (idMatchedButLocationDifferent.length > 20) {
      console.log(`  ... and ${idMatchedButLocationDifferent.length - 20} more`);
    }
  }
}

main().catch(console.error);
