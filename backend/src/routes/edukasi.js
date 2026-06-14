import { Router } from 'express';
import { db } from '../db/index.js';
import { edukasi } from '../db/schema.js';
import { desc } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.select().from(edukasi).orderBy(desc(edukasi.createdAt));
    res.json(result);
  } catch (err) {
    console.error('Fetch edukasi err:', err);
    res.status(500).json({ error: 'Gagal mengambil data edukasi' });
  }
});

export default router;
