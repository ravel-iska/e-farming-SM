import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

console.log('Adding image_url column to inventori table...');
try {
  await db.execute(sql.raw(`ALTER TABLE inventori ADD COLUMN IF NOT EXISTS image_url TEXT`));
  console.log('✅ image_url column added to inventori');
} catch(e) {
  console.log('⚠️ Error:', e.message);
}

process.exit(0);
