// Chay file .sql lon tu may tinh (neu SQL Editor cua Supabase khong nhan file qua lon).
// Cach dung:  DATABASE_URL="postgresql://..." node tools/import-sql.mjs sql/03-records-2021.sql sql/03-records-2022.sql ...
import fs from 'node:fs';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) { console.error('Thieu DATABASE_URL'); process.exit(1); }
const files = process.argv.slice(2);
if (!files.length) { console.error('Cach dung: node tools/import-sql.mjs file1.sql file2.sql ...'); process.exit(1); }
const sql = postgres(url, { prepare: false, max: 1, ssl: process.env.PGSSL === 'disable' ? false : 'require' });
for (const f of files) {
  process.stdout.write(`Dang chay ${f} ... `);
  await sql.unsafe(fs.readFileSync(f, 'utf8'));
  console.log('xong');
}
await sql.end();
