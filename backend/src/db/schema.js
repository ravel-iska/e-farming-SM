import { pgTable, serial, varchar, decimal, integer, text, date, time, timestamp, bigint } from 'drizzle-orm/pg-core';

// ==============================
// USERS
// ==============================
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).default('petani'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================
// LAHAN
// ==============================
export const lahan = pgTable('lahan', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  area: decimal('area', { precision: 10, scale: 2 }).notNull(),
  soilType: varchar('soil_type', { length: 50 }),
  irrigation: varchar('irrigation', { length: 20 }),
  status: varchar('status', { length: 20 }).default('Aktif'),
  imageUrl: text('image_url'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================
// TANAMAN
// ==============================
export const tanaman = pgTable('tanaman', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  lahanId: integer('lahan_id').references(() => lahan.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 100 }).notNull(),
  lahanName: varchar('lahan_name', { length: 100 }),
  icon: varchar('icon', { length: 10 }),
  plantDate: date('plant_date').notNull(),
  estHarvest: date('est_harvest'),
  progress: integer('progress').default(0),
  health: varchar('health', { length: 30 }).default('Baik'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================
// TANAMAN TIMELINE (FASE)
// ==============================
export const tanamanTimeline = pgTable('tanaman_timeline', {
  id: serial('id').primaryKey(),
  tanamanId: integer('tanaman_id').references(() => tanaman.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  date: date('date').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================
// JADWAL KEGIATAN
// ==============================
export const jadwal = pgTable('jadwal', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  date: date('date').notNull(),
  time: time('time'),
  type: varchar('type', { length: 50 }),
  priority: varchar('priority', { length: 20 }).default('Medium'),
  status: varchar('status', { length: 20 }).default('Pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================
// INVENTORI
// ==============================
export const inventori = pgTable('inventori', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  item: varchar('item', { length: 150 }).notNull(),
  category: varchar('category', { length: 50 }),
  stock: integer('stock').default(0),
  unit: varchar('unit', { length: 20 }),
  status: varchar('status', { length: 20 }).default('Aman'),
  imageUrl: text('image_url'),
  updatedAt: timestamp('updated_at').defaultNow(),
});


// ==============================
// LAPORAN PRODUKTIVITAS
// ==============================
export const laporanProduktivitas = pgTable('laporan_produktivitas', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  month: varchar('month', { length: 10 }),
  padi: integer('padi').default(0),
  jagung: integer('jagung').default(0),
  kedelai: integer('kedelai').default(0),
});

// ==============================
// LAPORAN REVENUE
// ==============================
export const laporanRevenue = pgTable('laporan_revenue', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  quarter: varchar('quarter', { length: 5 }),
  revenue: bigint('revenue', { mode: 'number' }).default(0),
  expense: bigint('expense', { mode: 'number' }).default(0),
});

// ==============================
// KONSULTASI PAKAR
// ==============================
export const konsultasiPakar = pgTable('konsultasi_pakar', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  focus: varchar('focus', { length: 200 }),
  emoji: varchar('emoji', { length: 10 }),
  color: varchar('color', { length: 20 }),
  wa: varchar('wa', { length: 20 }),
  prompt: text('prompt'),
  status: varchar('status', { length: 20 }).default('Online'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================
// BUG REPORTS
// ==============================
export const bugReports = pgTable('bug_reports', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).default('Bug'),
  priority: varchar('priority', { length: 20 }).default('Medium'),
  status: varchar('status', { length: 20 }).default('Open'),
  adminReply: text('admin_reply'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================
// TRANSAKSI JUAL BELI
// ==============================
export const transaksiJualBeli = pgTable('transaksi_jualbeli', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 10 }).notNull(), // 'Jual' atau 'Beli'
  itemName: varchar('item_name', { length: 150 }).notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).default(0),
  pricePerUnit: bigint('price_per_unit', { mode: 'number' }).default(0),
  totalNominal: bigint('total_nominal', { mode: 'number' }).notNull(),
  status: varchar('status', { length: 20 }).default('Selesai'),
  date: timestamp('date').defaultNow(),
});

// ==============================
// EDUKASI
// ==============================
export const edukasi = pgTable('edukasi', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  type: varchar('type', { length: 50 }).default('Artikel'), // Artikel, Berita, Panduan
  category: varchar('category', { length: 50 }),
  readTime: varchar('read_time', { length: 50 }),
  imageUrl: text('image_url'),
  link: text('link'),
  content: text('content'),
  createdAt: timestamp('created_at').defaultNow(),
});
