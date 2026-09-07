import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const csvPath = 'scripts/washington_resources_missing_supabase_ready_enriched_2026-08-30.csv';
const outDir = 'scripts/csv_batches';

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
        else { inQuotes = false; i++; continue; }
      } else { field += char; i++; continue; }
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

function parseArrayField(val: string): string[] {
  if (!val || val === '[]') return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch { return []; }
}

function parseBool(val: string): boolean {
  return val === 'true' || val === 'TRUE' || val === 'True' || val === '1';
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

function sqlEscape(val: string): string {
  return val.replace(/'/g, "''");
}

function formatArray(arr: string[]): string {
  if (arr.length === 0) return "'{}'";
  return `ARRAY[${arr.map(a => `'${sqlEscape(a)}'`).join(',')}]::text[]`;
}

function formatJson(val: string): string {
  if (!val || val === '{}') return "'{}'::jsonb";
  try {
    const parsed = JSON.parse(val);
    return `'${sqlEscape(JSON.stringify(parsed))}'::jsonb`;
  } catch { return "'{}'::jsonb"; }
}

async function main() {
  const raw = readFileSync(csvPath, 'utf8');
  const rows = parseCSV(raw);
  if (rows.length < 2) { console.error('CSV has no data rows'); return; }

  const headers = rows[0];
  console.log(`CSV headers: ${headers.length} columns`);
  console.log(`Total CSV rows: ${rows.length - 1}`);

  // Get existing IDs from DB via a file we'll generate
  const allIds: string[] = [];
  const records: { id: string; cells: string[] }[] = [];

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (cells.length < headers.length) continue;
    const get = (col: string): string => {
      const idx = headers.indexOf(col);
      return idx >= 0 ? (cells[idx] ?? '') : '';
    };
    const id = get('id');
    if (!id) continue;
    records.push({ id, cells });
    allIds.push(id);
  }

  // Write the list of IDs for checking
  writeFileSync('scripts/csv_all_ids.json', JSON.stringify(allIds));
  console.log(`Wrote ${allIds.length} IDs to scripts/csv_all_ids.json`);
  console.log('Now check which IDs already exist in the DB, then run csv-to-sql-batch.ts');
}

main().catch(console.error);
