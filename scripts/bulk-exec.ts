import { readFileSync, readdirSync } from 'fs';

// Load .env manually
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

const files = readdirSync('scripts/batches')
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`Found ${files.length} batch files`);

let success = 0;
let failed = 0;

for (const file of files) {
  const sql = readFileSync(`scripts/batches/${file}`, 'utf-8');
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_seed`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql_text: sql }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`FAIL ${file}: ${res.status} ${body.slice(0, 200)}`);
      failed++;
    } else {
      success++;
      process.stdout.write('.');
    }
  } catch (err) {
    console.error(`ERROR ${file}: ${err}`);
    failed++;
  }
}

console.log(`\nDone. Success: ${success}, Failed: ${failed}`);
