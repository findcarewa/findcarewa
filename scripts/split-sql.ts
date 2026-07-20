import { readFileSync, mkdirSync, writeFileSync } from 'fs';

const sql = readFileSync('scripts/resources_seed.sql', 'utf-8');
const stmts = sql.split(/(?=INSERT INTO)/).map(s => s.trim()).filter(s => s.startsWith('INSERT INTO'));
console.log('Statements:', stmts.length);
mkdirSync('scripts/batches', { recursive: true });
for (let i = 0; i < stmts.length; i++) {
  writeFileSync(`scripts/batches/${String(i).padStart(2, '0')}.sql`, stmts[i]);
}
console.log(`Written ${stmts.length} batch files to scripts/batches/`);
