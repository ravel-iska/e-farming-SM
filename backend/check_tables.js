import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

// Check if transaksi_jualbeli table exists
try {
  const r = await db.execute(sql.raw("SELECT COUNT(*) as cnt FROM transaksi_jualbeli"));
  console.log('Table EXISTS, rows:', r.rows);
} catch(e) {
  console.log('Table MISSING:', e.message);
  // Create the table
  try {
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS transaksi_jualbeli (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(10) NOT NULL,
        item_name VARCHAR(150) NOT NULL,
        quantity DECIMAL(10,2) DEFAULT 0,
        price_per_unit BIGINT DEFAULT 0,
        total_nominal BIGINT NOT NULL,
        status VARCHAR(20) DEFAULT 'Selesai',
        date TIMESTAMP DEFAULT NOW()
      )
    `));
    console.log('Table CREATED successfully!');
  } catch(e2) {
    console.log('Failed to create:', e2.message);
  }
}

// Check tanaman_timeline too
try {
  await db.execute(sql.raw("SELECT COUNT(*) as cnt FROM tanaman_timeline"));
  console.log('tanaman_timeline EXISTS');
} catch(e) {
  console.log('tanaman_timeline MISSING:', e.message);
  try {
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS tanaman_timeline (
        id SERIAL PRIMARY KEY,
        tanaman_id INTEGER NOT NULL REFERENCES tanaman(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        image_url TEXT,
        date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `));
    console.log('tanaman_timeline CREATED!');
  } catch(e2) {
    console.log('Failed to create tanaman_timeline:', e2.message);
  }
}

process.exit(0);
