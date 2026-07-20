// Bulk insert generated resources into Supabase via REST API
import { readFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const sql = readFileSync('scripts/resources_seed.sql', 'utf-8');

// Split into individual INSERT statements
const statements = sql
  .split(/(?=INSERT INTO)/)
  .map(s => s.trim())
  .filter(s => s.startsWith('INSERT INTO'));

console.log(`Found ${statements.length} batch INSERT statements`);

let success = 0;
let failed = 0;

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/none`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    // We can't run arbitrary SQL via REST. Need execute_sql MCP instead.
  } catch {
    // expected
  }
}

// Actually — we need to write a SQL function that accepts the raw SQL
// Let's instead just print each statement so we can feed via MCP
console.log('Cannot run raw SQL via REST. Use execute_sql MCP tool with each batch.');
