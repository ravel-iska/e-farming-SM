import { Router } from 'express';
import { db } from '../db/index.js';
import { transaksiJualBeli, inventori, users } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';
import { sql } from 'drizzle-orm';

const getMarketPrice = (category) => {
  const prices = {
    'Pupuk': 5000,
    'Benih': 20000,
    'Pestisida': 15000,
    'Alat Pertanian': 50000,
    'Hasil Panen': 8000,
    'Lainnya': 10000
  };
  // Add some random fluctuation logic to make it look dynamic if we wanted, 
  // but fixed is fine for now based on category
  return prices[category] || 10000;
};

const router = Router();
router.use(authMiddleware);

// GET /api/jualbeli
// Riwayat untuk Petani
router.get('/', async (req, res) => {
  try {
    const history = await db.select().from(transaksiJualBeli)
      .where(eq(transaksiJualBeli.userId, req.user.id));
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data transaksi.' });
  }
});

// GET /api/jualbeli/admin/pengajuan
// Daftar transaksi 'Jual' yang masih 'Pending'
router.get('/admin/pengajuan', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    
    // Gunakan inner join untuk menampilkan nama petani
    const reqs = await db.select({
      id: transaksiJualBeli.id,
      userId: transaksiJualBeli.userId,
      userName: users.name,
      itemName: transaksiJualBeli.itemName,
      quantity: transaksiJualBeli.quantity,
      pricePerUnit: transaksiJualBeli.pricePerUnit,
      totalNominal: transaksiJualBeli.totalNominal,
      status: transaksiJualBeli.status,
      type: transaksiJualBeli.type,
      date: transaksiJualBeli.date
    }).from(transaksiJualBeli)
    .leftJoin(users, eq(transaksiJualBeli.userId, users.id))
    .where(eq(transaksiJualBeli.status, 'Pending'));
    
    res.json(reqs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data pengajuan.' });
  }
});

// GET /api/jualbeli/admin/history
// Daftar transaksi yang Selesai / Ditolak
router.get('/admin/history', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    
    const history = await db.select({
      id: transaksiJualBeli.id,
      userId: transaksiJualBeli.userId,
      userName: users.name,
      itemName: transaksiJualBeli.itemName,
      quantity: transaksiJualBeli.quantity,
      pricePerUnit: transaksiJualBeli.pricePerUnit,
      totalNominal: transaksiJualBeli.totalNominal,
      status: transaksiJualBeli.status,
      type: transaksiJualBeli.type,
      date: transaksiJualBeli.date
    }).from(transaksiJualBeli)
    .leftJoin(users, eq(transaksiJualBeli.userId, users.id))
    .where(sql`${transaksiJualBeli.status} != 'Pending'`)
    .orderBy(sql`${transaksiJualBeli.date} DESC`);
    
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil riwayat transaksi.' });
  }
});

// PUT /api/jualbeli/admin/terima/:id
router.put('/admin/terima/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    
    const trxId = parseInt(req.params.id);
    const [trx] = await db.select().from(transaksiJualBeli).where(eq(transaksiJualBeli.id, trxId));
    if (!trx || trx.status !== 'Pending') return res.status(400).json({ error: 'Transaksi tidak valid.' });

    // Update status transaksi menjadi Diterima
    await db.update(transaksiJualBeli).set({ status: 'Selesai' }).where(eq(transaksiJualBeli.id, trxId));

    // Dapatkan adminId target (admin pertama)
    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
    const adminId = adminUsers.length > 0 ? adminUsers[0].id : req.user.id;

    if (trx.type === 'Jual') {
      // Petani Jual ke Admin: Tambah stok ke inventori Koperasi (Gudang Panen)
      let [adminItem] = await db.select().from(inventori)
        .where(and(eq(inventori.item, trx.itemName), eq(inventori.userId, adminId)));
        
      if (adminItem) {
        await db.update(inventori).set({ stock: Number(adminItem.stock) + Number(trx.quantity) }).where(eq(inventori.id, adminItem.id));
      } else {
        await db.insert(inventori).values({
          userId: adminId,
          item: trx.itemName,
          category: 'Hasil Panen', // FORCED
          stock: Number(trx.quantity),
          unit: 'Kg', 
          status: 'Aman'
        });
      }
    } else if (trx.type === 'Beli') {
      // Petani Beli dari Admin: Tambah stok ke inventori Petani
      let [adminItemRef] = await db.select().from(inventori)
        .where(and(eq(inventori.item, trx.itemName), eq(inventori.userId, adminId)));
        
      const cat = adminItemRef ? adminItemRef.category : 'Lainnya';
      const unit = adminItemRef ? adminItemRef.unit : 'Kg';

      let [userItem] = await db.select().from(inventori)
        .where(and(eq(inventori.item, trx.itemName), eq(inventori.userId, trx.userId)));
        
      if (userItem) {
        await db.update(inventori).set({ stock: Number(userItem.stock) + Number(trx.quantity) }).where(eq(inventori.id, userItem.id));
      } else {
        await db.insert(inventori).values({
          userId: trx.userId,
          item: trx.itemName,
          category: cat,
          stock: Number(trx.quantity),
          unit: unit, 
          status: 'Aman'
        });
      }
    }

    res.json({ message: 'Transaksi disetujui.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menerima pengajuan.' });
  }
});

// PUT /api/jualbeli/admin/tolak/:id
router.put('/admin/tolak/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    
    const trxId = parseInt(req.params.id);
    const [trx] = await db.select().from(transaksiJualBeli).where(eq(transaksiJualBeli.id, trxId));
    if (!trx || trx.status !== 'Pending') return res.status(400).json({ error: 'Transaksi tidak valid.' });

    // Update status transaksi menjadi Ditolak
    await db.update(transaksiJualBeli).set({ status: 'Ditolak' }).where(eq(transaksiJualBeli.id, trxId));

    if (trx.type === 'Jual') {
      // Kembalikan (Refund) stok ke Inventori Petani
      let [userItem] = await db.select().from(inventori)
        .where(and(eq(inventori.item, trx.itemName), eq(inventori.userId, trx.userId)));
        
      if (userItem) {
        await db.update(inventori).set({ stock: Number(userItem.stock) + Number(trx.quantity) }).where(eq(inventori.id, userItem.id));
      } else {
        await db.insert(inventori).values({
          userId: trx.userId,
          item: trx.itemName,
          category: 'Hasil Panen',
          stock: Number(trx.quantity),
          unit: 'Kg', 
          status: 'Aman'
        });
      }
    } else if (trx.type === 'Beli') {
      // Kembalikan (Refund) stok ke Inventori Admin
      const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
      const adminId = adminUsers.length > 0 ? adminUsers[0].id : req.user.id;
      
      let [adminItem] = await db.select().from(inventori)
        .where(and(eq(inventori.item, trx.itemName), eq(inventori.userId, adminId)));
        
      if (adminItem) {
        await db.update(inventori).set({ stock: Number(adminItem.stock) + Number(trx.quantity) }).where(eq(inventori.id, adminItem.id));
      } else {
        // Fallback
      }
    }

    res.json({ message: 'Transaksi ditolak. Barang dikembalikan.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menolak pengajuan.' });
  }
});

// POST /api/jualbeli/jual
// Menjual hasil panen (Mengurangi stok, menjadi PENDING)
router.post('/jual', async (req, res) => {
  try {
    const inventoryId = parseInt(req.body.inventoryId);
    const quantity = parseInt(req.body.quantity);

    if (!inventoryId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Data tidak valid. Pastikan ID dan kuantitas terisi.' });
    }
    
    // Cari barang di inventori Petani
    const [userItem] = await db.select().from(inventori)
      .where(and(eq(inventori.id, inventoryId), eq(inventori.userId, req.user.id)));
      
    if (!userItem) {
      return res.status(400).json({ error: 'Barang tidak ditemukan di inventori Anda.' });
    }
    if (parseInt(userItem.stock) < quantity) {
      return res.status(400).json({ error: `Stok tidak mencukupi. Stok saat ini: ${userItem.stock} ${userItem.unit}.` });
    }

    // Gunakan harga pasar
    const marketPrice = getMarketPrice(userItem.category);
    const totalNominal = quantity * marketPrice;

    // Record Transaksi untuk Petani
    await db.insert(transaksiJualBeli).values({
      userId: req.user.id,
      type: 'Jual',
      itemName: userItem.item,
      quantity: quantity,
      pricePerUnit: marketPrice,
      totalNominal: totalNominal,
      status: 'Pending'
    });

    // Reduce stock Petani sementara (Locked)
    const rest = parseInt(userItem.stock) - quantity;
    if (rest <= 0) {
      await db.delete(inventori).where(eq(inventori.id, userItem.id));
    } else {
      await db.update(inventori).set({ stock: rest }).where(eq(inventori.id, userItem.id));
    }

    res.json({ message: 'Pengajuan penjualan sukses dibuat, menunggu persetujuan pusat.' });
  } catch (err) {
    console.error('POST /jual error:', err);
    res.status(500).json({ error: 'Gagal melakukan transaksi jual: ' + err.message });
  }
});

// POST /api/jualbeli/beli
// Membeli inventori logistik/alat dari Koperasi Pusat (Admin)
router.post('/beli', async (req, res) => {
  try {
    const inventoryId = parseInt(req.body.inventoryId);
    const quantity = parseInt(req.body.quantity);

    if (!inventoryId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Data tidak valid. Pastikan ID dan kuantitas terisi.' });
    }
    
    // Cari Admin ID
    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
    const adminId = adminUsers.length > 0 ? adminUsers[0].id : 1;

    // Cari barang di inventori Koperasi / Pusat (milik admin manapun)
    const [adminItem] = await db.select().from(inventori)
      .where(eq(inventori.id, inventoryId));
      
    if (!adminItem) {
      return res.status(400).json({ error: 'Barang tidak ditemukan di Toko Koperasi Pusat.' });
    }
    if (parseInt(adminItem.stock) < quantity) {
      return res.status(400).json({ error: `Stok tidak mencukupi. Stok tersedia: ${adminItem.stock} ${adminItem.unit}.` });
    }

    // Gunakan harga pasar
    const marketPrice = getMarketPrice(adminItem.category);
    const totalNominal = quantity * marketPrice;

    // Record Transaksi untuk Petani (Pending)
    await db.insert(transaksiJualBeli).values({
      userId: req.user.id,
      type: 'Beli',
      itemName: adminItem.item,
      quantity: quantity,
      pricePerUnit: marketPrice,
      totalNominal: totalNominal,
      status: 'Pending'
    });

    // Kurangi stok Koperasi sementara
    const newStock = parseInt(adminItem.stock) - quantity;
    await db.update(inventori)
      .set({ stock: Math.max(0, newStock) })
      .where(eq(inventori.id, adminItem.id));

    res.json({ message: 'Pengajuan pembelian berhasil. Menunggu konfirmasi pusat.' });
  } catch (err) {
    console.error('POST /beli error:', err);
    res.status(500).json({ error: 'Gagal melakukan transaksi beli: ' + err.message });
  }
});

export default router;
