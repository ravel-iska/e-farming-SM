import { Router } from 'express';
import { db } from '../db/index.js';
import { users, lahan, tanaman, inventori, jadwal, konsultasiPakar, bugReports, transaksiJualBeli, edukasi } from '../db/schema.js';
import { eq, sql, desc } from 'drizzle-orm';

import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = Router();
router.use(authMiddleware);
router.use(adminMiddleware);

// Endpoint khusus untuk Maintenance & Settings diatur di server.js memory
// API Key testing juga butuh import fetch, kita handle route settings bareng maintenance

// ==============================
// STATS OVERVIEW
// ==============================
router.get('/stats', async (req, res) => {
  try {
    const userCount = await db.select({ count: sql`count(*)` }).from(users);
    const lahanCount = await db.select({ count: sql`count(*)` }).from(lahan);
    const tanamanCount = await db.select({ count: sql`count(*)` }).from(tanaman);
    const pakarCount = await db.select({ count: sql`count(*)` }).from(konsultasiPakar);
    
    // Recent users
    const recentUsers = await db.select({
      id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt
    }).from(users).orderBy(sql`${users.createdAt} DESC`).limit(5);

    res.json({
      users: userCount[0].count,
      lahan: lahanCount[0].count,
      tanaman: tanamanCount[0].count,
      pakar: pakarCount[0].count,
      recentUsers
    });
  } catch (err) {
    console.error('Admin Stats err:', err);
    res.status(500).json({ error: 'Gagal mengambil statistik.' });
  }
});

// ==============================
// USERS MANAGEMENT
// ==============================
router.get('/users', async (req, res) => {
  try {
    const allUsers = await db.select({
      id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt
    }).from(users).orderBy(sql`${users.id} DESC`);
    res.json(allUsers);
  } catch (err) { res.status(500).json({ error: 'Gagal mengambil pengguna' }); }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { role } = req.body;
    const [updated] = await db.update(users).set({ role }).where(eq(users.id, parseInt(req.params.id))).returning({ id: users.id, name: users.name, role: users.role });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: 'Gagal update user' }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    // Jangan hapus admin diri sendiri
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Tidak dapat menghapus akun Anda sendiri.' });
    }
    await db.delete(users).where(eq(users.id, parseInt(req.params.id)));
    res.json({ message: 'User berhasil dihapus' });
  } catch (err) { res.status(500).json({ error: 'Gagal hapus user' }); }
});

router.get('/users/:id/details', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const [user] = await db.select({
      id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt, avatar: users.photoUrl
    }).from(users).where(eq(users.id, userId));

    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    const userLahan = await db.select().from(lahan).where(eq(lahan.userId, userId));
    const userTanaman = await db.select().from(tanaman).where(eq(tanaman.userId, userId));
    const userInventori = await db.select().from(inventori).where(eq(inventori.userId, userId));
    const userTransaksi = await db.select().from(transaksiJualBeli).where(eq(transaksiJualBeli.userId, userId)).orderBy(sql`${transaksiJualBeli.date} DESC`).limit(20);

    res.json({
      user,
      lahan: userLahan,
      tanaman: userTanaman,
      inventori: userInventori,
      transaksi: userTransaksi
    });
  } catch (err) { 
    console.error('Details user err:', err);
    res.status(500).json({ error: 'Gagal mengambil detail user' }); 
  }
});


// ==============================
// DATA TRANSAKSIONAL GLOBAL
// ==============================
// Mengambil data join dengan nama user
router.get('/lahan', async (req, res) => {
  try {
    const result = await db.select({
      id: lahan.id, name: lahan.name, area: lahan.area, soilType: lahan.soilType, irrigation: lahan.irrigation, status: lahan.status,
      imageUrl: lahan.imageUrl, latitude: lahan.latitude, longitude: lahan.longitude,
      owner_name: users.name
    }).from(lahan).leftJoin(users, eq(lahan.userId, users.id)).orderBy(sql`${lahan.id} DESC`);
    res.json(result);
  } catch (err) { res.status(500).json({ error: 'Gagal' }); }
});

router.get('/tanaman', async (req, res) => {
  try {
    const result = await db.select({
      id: tanaman.id, name: tanaman.name, lahanName: tanaman.lahanName, progress: tanaman.progress, health: tanaman.health, plantDate: tanaman.plantDate, estHarvest: tanaman.estHarvest, icon: tanaman.icon, imageUrl: tanaman.imageUrl,
      owner_name: users.name
    }).from(tanaman).leftJoin(users, eq(tanaman.userId, users.id)).orderBy(sql`${tanaman.id} DESC`);
    res.json(result);
  } catch (err) { res.status(500).json({ error: 'Gagal' }); }
});

router.get('/inventori', async (req, res) => {
  try {
    const result = await db.select({
      id: inventori.id, item: inventori.item, category: inventori.category, stock: inventori.stock, unit: inventori.unit, status: inventori.status,
      owner_name: users.name
    }).from(inventori).leftJoin(users, eq(inventori.userId, users.id)).orderBy(sql`${inventori.id} DESC`);
    res.json(result);
  } catch (err) { res.status(500).json({ error: 'Gagal' }); }
});

router.get('/jadwal', async (req, res) => {
  try {
    const result = await db.select({
      id: jadwal.id, title: jadwal.title, date: jadwal.date, type: jadwal.type, priority: jadwal.priority, status: jadwal.status,
      owner_name: users.name
    }).from(jadwal).leftJoin(users, eq(jadwal.userId, users.id)).orderBy(sql`${jadwal.id} DESC`);
    res.json(result);
  } catch (err) { res.status(500).json({ error: 'Gagal' }); }
});


// ==============================
// KONSULTASI PAKAR (CRUD)
// ==============================
router.get('/konsultasi', async (req, res) => {
  try {
    const result = await db.select().from(konsultasiPakar).orderBy(sql`${konsultasiPakar.id} ASC`);
    res.json(result);
  } catch (err) { 
    console.error('Admin API Error:', err);
    res.status(500).json({ error: err.message || 'Gagal' }); 
  }
});

router.post('/konsultasi', async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id;
    delete data.createdAt;
    const [inserted] = await db.insert(konsultasiPakar).values(data).returning();
    res.json(inserted);
  } catch (err) { 
    console.error('Admin API Error:', err);
    res.status(500).json({ error: err.message || 'Gagal' }); 
  }
});

router.put('/konsultasi/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id;
    delete data.createdAt;
    const [updated] = await db.update(konsultasiPakar).set(data).where(eq(konsultasiPakar.id, parseInt(req.params.id))).returning();
    res.json(updated);
  } catch (err) { 
    console.error('Admin API Error:', err);
    res.status(500).json({ error: err.message || 'Gagal' }); 
  }
});

router.delete('/konsultasi/:id', async (req, res) => {
  try {
    await db.delete(konsultasiPakar).where(eq(konsultasiPakar.id, parseInt(req.params.id)));
    res.json({ message: 'Dihapus' });
  } catch (err) { 
    console.error('Admin API Error:', err);
    res.status(500).json({ error: err.message || 'Gagal' }); 
  }
});

// ==============================
// BUG REPORTS (Admin View)
// ==============================
router.get('/bugs', async (req, res) => {
  try {
    const result = await db.select({
      id: bugReports.id,
      title: bugReports.title,
      description: bugReports.description,
      category: bugReports.category,
      priority: bugReports.priority,
      status: bugReports.status,
      adminReply: bugReports.adminReply,
      createdAt: bugReports.createdAt,
      reporter_name: users.name,
      reporter_email: users.email,
    }).from(bugReports)
      .leftJoin(users, eq(bugReports.userId, users.id))
      .orderBy(desc(bugReports.createdAt));
    res.json(result);
  } catch (err) {
    console.error('Admin bugs err:', err);
    res.status(500).json({ error: 'Gagal mengambil laporan bug.' });
  }
});

router.put('/bugs/:id', async (req, res) => {
  try {
    const { status, adminReply } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (adminReply !== undefined) updateData.adminReply = adminReply;
    const [updated] = await db.update(bugReports)
      .set(updateData)
      .where(eq(bugReports.id, parseInt(req.params.id)))
      .returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Gagal update laporan bug.' });
  }
});

router.delete('/bugs/:id', async (req, res) => {
  try {
    await db.delete(bugReports).where(eq(bugReports.id, parseInt(req.params.id)));
    res.json({ message: 'Laporan dihapus' });
  } catch (err) { res.status(500).json({ error: 'Gagal hapus laporan' }); }
});

// ==============================
// EDUKASI (CRUD Admin)
// ==============================
router.post('/edukasi', async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id;
    delete data.createdAt;
    const [inserted] = await db.insert(edukasi).values(data).returning();
    res.json(inserted);
  } catch (err) {
    res.status(500).json({ error: 'Gagal menambah edukasi' });
  }
});

router.put('/edukasi/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id;
    delete data.createdAt;
    const [updated] = await db.update(edukasi).set(data).where(eq(edukasi.id, parseInt(req.params.id))).returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Gagal update edukasi' });
  }
});

router.delete('/edukasi/:id', async (req, res) => {
  try {
    await db.delete(edukasi).where(eq(edukasi.id, parseInt(req.params.id)));
    res.json({ message: 'Edukasi dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal hapus edukasi' });
  }
});

export default router;
