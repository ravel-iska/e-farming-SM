import { Router } from 'express';
import { db } from '../db/index.js';
import { tanaman, tanamanTimeline } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/tanaman
router.get('/', async (req, res) => {
  try {
    const result = await db.select().from(tanaman).where(eq(tanaman.userId, req.user.id));
    res.json(result);
  } catch (err) {
    console.error('Get tanaman error:', err);
    res.status(500).json({ error: 'Gagal mengambil data tanaman.' });
  }
});

// POST /api/tanaman
router.post('/', async (req, res) => {
  try {
    const { name, lahanId, lahanName, icon, plantDate, estHarvest, progress, health, imageUrl } = req.body;

    if (!name || !plantDate) {
      return res.status(400).json({ error: 'Nama tanaman dan tanggal tanam wajib diisi.' });
    }

    const [newTanaman] = await db.insert(tanaman).values({
      userId: req.user.id,
      name,
      lahanId,
      lahanName,
      icon,
      plantDate,
      estHarvest,
      progress: progress || 0,
      health: health || 'Baik',
      imageUrl
    }).returning();

    res.status(201).json(newTanaman);
  } catch (err) {
    console.error('Create tanaman error:', err);
    res.status(500).json({ error: 'Gagal menambahkan tanaman.' });
  }
});

// PUT /api/tanaman/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, lahanId, lahanName, icon, plantDate, estHarvest, progress, health, imageUrl } = req.body;

    const [updated] = await db.update(tanaman)
      .set({ name, lahanId, lahanName, icon, plantDate, estHarvest, progress, health, imageUrl })
      .where(and(eq(tanaman.id, parseInt(req.params.id)), eq(tanaman.userId, req.user.id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Data tanaman tidak ditemukan.' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Update tanaman error:', err);
    res.status(500).json({ error: 'Gagal mengupdate tanaman.' });
  }
});

// DELETE /api/tanaman/:id
router.delete('/:id', async (req, res) => {
  try {
    const [deleted] = await db.delete(tanaman)
      .where(and(eq(tanaman.id, parseInt(req.params.id)), eq(tanaman.userId, req.user.id)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Data tanaman tidak ditemukan.' });
    }

    res.json({ message: 'Data tanaman berhasil dihapus.', deleted });
  } catch (err) {
    console.error('Delete tanaman error:', err);
    res.status(500).json({ error: 'Gagal menghapus tanaman.' });
  }
});

// POST /api/tanaman/:id/panen
router.post('/:id/panen', async (req, res) => {
  try {
    const { quantity } = req.body;

    // 1. Get the crop
    const [crop] = await db.select().from(tanaman)
      .where(and(eq(tanaman.id, parseInt(req.params.id)), eq(tanaman.userId, req.user.id)));

    if (!crop) {
      return res.status(404).json({ error: 'Tanaman tidak ditemukan.' });
    }

    // 2. Add to Inventory as 'Hasil Panen'
    // check if it already exists to add stock, otherwise create new
    const { inventori } = await import('../db/schema.js');
    const [existingItem] = await db.select().from(inventori)
      .where(and(
        eq(inventori.userId, req.user.id),
        eq(inventori.item, crop.name + ' (Panen)'),
        eq(inventori.category, 'Hasil Panen')
      ));

    if (existingItem) {
      await db.update(inventori)
        .set({ stock: existingItem.stock + parseInt(quantity), updatedAt: new Date() })
        .where(eq(inventori.id, existingItem.id));
    } else {
      await db.insert(inventori).values({
        userId: req.user.id,
        item: crop.name + ' (Panen)',
        category: 'Hasil Panen',
        stock: parseInt(quantity),
        unit: 'Kg',
        status: 'Aman',
        imageUrl: crop.imageUrl
      });
    }

    // 3. Delete crop from lahan
    await db.delete(tanaman).where(eq(tanaman.id, crop.id));

    res.json({ message: 'Panen berhasil dimasukkan ke Gudang Logistik.' });
  } catch (err) {
    console.error('Panen error:', err);
    res.status(500).json({ error: 'Gagal memproses panen.' });
  }
});

// ==============================
// TIMELINE PERTUMBUHAN TANAMAN
// ==============================

// GET /api/tanaman/:id/timeline
router.get('/:id/timeline', async (req, res) => {
  try {
    const timelines = await db.select()
      .from(tanamanTimeline)
      .where(eq(tanamanTimeline.tanamanId, parseInt(req.params.id)))
      .orderBy(desc(tanamanTimeline.date), desc(tanamanTimeline.createdAt));
    res.json(timelines);
  } catch (err) {
    console.error('Get timeline error:', err);
    res.status(500).json({ error: 'Gagal mengambil timeline tanaman.' });
  }
});

// POST /api/tanaman/:id/timeline
router.post('/:id/timeline', async (req, res) => {
  try {
    const { title, description, imageUrl, date } = req.body;
    
    // Pastikan tanaman ini milik user
    const [crop] = await db.select().from(tanaman)
      .where(and(eq(tanaman.id, parseInt(req.params.id)), eq(tanaman.userId, req.user.id)));
      
    if (!crop) return res.status(404).json({ error: 'Tanaman tidak ditemukan.' });

    const [newTimeline] = await db.insert(tanamanTimeline).values({
      tanamanId: crop.id,
      title,
      description,
      imageUrl,
      date: date || new Date().toISOString().split('T')[0]
    }).returning();

    res.status(201).json(newTimeline);
  } catch (err) {
    console.error('Create timeline error:', err);
    res.status(500).json({ error: 'Gagal menambahkan timeline.' });
  }
});

// DELETE /api/tanaman/:id/timeline/:timelineId
router.delete('/:id/timeline/:timelineId', async (req, res) => {
  try {
    const [deleted] = await db.delete(tanamanTimeline)
      .where(eq(tanamanTimeline.id, parseInt(req.params.timelineId)))
      .returning();
      
    if (!deleted) return res.status(404).json({ error: 'Timeline tidak ditemukan.' });
    
    res.json({ message: 'Timeline dihapus.' });
  } catch (err) {
    console.error('Delete timeline error:', err);
    res.status(500).json({ error: 'Gagal menghapus timeline.' });
  }
});

export default router;
