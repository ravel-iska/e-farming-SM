import { Router } from 'express';
import { db } from '../db/index.js';
import { lahan } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');

// Ensure uploads dir exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const router = Router();
router.use(authMiddleware);

// Helper to save base64 image
const saveBase64Image = (base64Str) => {
  if (!base64Str || !base64Str.startsWith('data:image')) return base64Str; // return as is if not base64 or already a URL
  
  const matches = base64Str.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return null;
  
  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
  const data = matches[2];
  const buffer = Buffer.from(data, 'base64');
  const filename = `lahan_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
  
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  return `/uploads/${filename}`;
};

// GET /api/lahan
router.get('/', async (req, res) => {
  try {
    const result = await db.select().from(lahan).where(eq(lahan.userId, req.user.id));
    res.json(result);
  } catch (err) {
    console.error('Get lahan error:', err);
    res.status(500).json({ error: 'Gagal mengambil data lahan.' });
  }
});

// POST /api/lahan
router.post('/', async (req, res) => {
  try {
    const { name, area, soilType, irrigation, status, imageUrl, latitude, longitude, address } = req.body;

    if (!name || !area) {
      return res.status(400).json({ error: 'Nama dan luas lahan wajib diisi.' });
    }

    const processedImageUrl = saveBase64Image(imageUrl);

    const [newLahan] = await db.insert(lahan).values({
      userId: req.user.id,
      name,
      area,
      soilType,
      irrigation,
      status: status || 'Aktif',
      imageUrl: processedImageUrl || imageUrl,
      latitude,
      longitude,
      address,
    }).returning();

    res.status(201).json(newLahan);
  } catch (err) {
    console.error('Create lahan error:', err);
    res.status(500).json({ error: 'Gagal menambahkan lahan.' });
  }
});

// PUT /api/lahan/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, area, soilType, irrigation, status, imageUrl, latitude, longitude, address } = req.body;

    const processedImageUrl = saveBase64Image(imageUrl);

    const [updated] = await db.update(lahan)
      .set({ 
        name, 
        area, 
        soilType, 
        irrigation, 
        status, 
        ...(processedImageUrl ? { imageUrl: processedImageUrl } : {}), // only update if new image provided
        latitude, 
        longitude,
        address
      })
      .where(and(eq(lahan.id, parseInt(req.params.id)), eq(lahan.userId, req.user.id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Lahan tidak ditemukan.' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Update lahan error:', err);
    res.status(500).json({ error: 'Gagal mengupdate lahan.' });
  }
});

// DELETE /api/lahan/:id
router.delete('/:id', async (req, res) => {
  try {
    const [deleted] = await db.delete(lahan)
      .where(and(eq(lahan.id, parseInt(req.params.id)), eq(lahan.userId, req.user.id)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Lahan tidak ditemukan.' });
    }

    res.json({ message: 'Lahan berhasil dihapus.', deleted });
  } catch (err) {
    console.error('Delete lahan error:', err);
    res.status(500).json({ error: 'Gagal menghapus lahan.' });
  }
});

export default router;
