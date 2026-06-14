import { Router } from 'express';
import { db } from '../db/index.js';
import { inventori } from '../db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Helper function to get all admin IDs
async function getAdminIds() {
  const { users } = await import('../db/schema.js');
  const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
  return adminUsers.length > 0 ? adminUsers.map(u => u.id) : [1];
}

// GET /api/inventori
router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const adminIds = await getAdminIds();
      const result = await db.select().from(inventori).where(inArray(inventori.userId, adminIds));
      return res.json(result);
    } else {
      const result = await db.select().from(inventori).where(eq(inventori.userId, req.user.id));
      return res.json(result);
    }
  } catch (err) {
    console.error('Get inventori error:', err);
    res.status(500).json({ error: 'Gagal mengambil data inventori.' });
  }
});

// GET /api/inventori/katalog
// Fetch Admin's inventory for the marketplace
router.get('/katalog', async (req, res) => {
  try {
    const adminIds = await getAdminIds();
    const result = await db.select().from(inventori).where(inArray(inventori.userId, adminIds));
    res.json(result);
  } catch (err) {
    console.error('Get katalog error:', err);
    res.status(500).json({ error: 'Gagal mengambil data katalog Koperasi/Admin.' });
  }
});

// POST /api/inventori
router.post('/', async (req, res) => {
  try {
    const { item, category, stock, unit, status, imageUrl } = req.body;

    if (!item) {
      return res.status(400).json({ error: 'Nama barang wajib diisi.' });
    }

    let targetUserId = req.user.id;
    if (req.user.role === 'admin') {
      const adminIds = await getAdminIds();
      targetUserId = adminIds[0];
    }

    const [newItem] = await db.insert(inventori).values({
      userId: targetUserId,
      item,
      category,
      stock: stock || 0,
      unit,
      status: status || 'Aman',
      imageUrl: imageUrl || null,
    }).returning();

    res.status(201).json(newItem);
  } catch (err) {
    console.error('Create inventori error:', err);
    res.status(500).json({ error: 'Gagal menambahkan barang.' });
  }
});

// PUT /api/inventori/:id
router.put('/:id', async (req, res) => {
  try {
    const { item, category, stock, unit, status, imageUrl } = req.body;

    let condition;
    if (req.user.role === 'admin') {
      const adminIds = await getAdminIds();
      condition = and(eq(inventori.id, parseInt(req.params.id)), inArray(inventori.userId, adminIds));
    } else {
      condition = and(eq(inventori.id, parseInt(req.params.id)), eq(inventori.userId, req.user.id));
    }

    const updateData = { item, category, stock, unit, status, updatedAt: new Date() };
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    const [updated] = await db.update(inventori)
      .set(updateData)
      .where(condition)
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Barang tidak ditemukan.' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Update inventori error:', err);
    res.status(500).json({ error: 'Gagal mengupdate barang.' });
  }
});

// DELETE /api/inventori/:id
router.delete('/:id', async (req, res) => {
  try {
    let condition;
    if (req.user.role === 'admin') {
      const adminIds = await getAdminIds();
      condition = and(eq(inventori.id, parseInt(req.params.id)), inArray(inventori.userId, adminIds));
    } else {
      condition = and(eq(inventori.id, parseInt(req.params.id)), eq(inventori.userId, req.user.id));
    }

    const [deleted] = await db.delete(inventori)
      .where(condition)
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Barang tidak ditemukan.' });
    }

    res.json({ message: 'Barang berhasil dihapus.', deleted });
  } catch (err) {
    console.error('Delete inventori error:', err);
    res.status(500).json({ error: 'Gagal menghapus barang.' });
  }
});

export default router;
