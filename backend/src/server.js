import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import express from 'express';
import cors from 'cors';
import compression from 'compression';

import authRoutes from './routes/auth.js';
import lahanRoutes from './routes/lahan.js';
import tanamanRoutes from './routes/tanaman.js';
import jadwalRoutes from './routes/jadwal.js';
import inventoriRoutes from './routes/inventori.js';
import laporanRoutes from './routes/laporan.js';
import cuacaRoutes from './routes/cuaca.js';
import diagnosaRoutes from './routes/diagnosa.js';
import konsultasiRoutes from './routes/konsultasi.js';
import bugsRoutes from './routes/bugs.js';
import jualbeliRoutes from './routes/jualbeli.js';
import edukasiRoutes from './routes/edukasi.js';

import adminRoutes from './routes/admin.js';
import { authMiddleware } from './middleware/auth.js';
import { adminMiddleware } from './middleware/admin.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Global State untuk Settings
global.MAINTENANCE_MODE = false;
global.CUSTOM_API_KEY = process.env.OPENROUTER_API_KEY || '';

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Serve static files
const publicPath = path.join(__dirname, '../public');
app.use('/uploads', express.static(path.join(publicPath, 'uploads')));

// Public Endpoints
app.get('/api/maintenance/status', (req, res) => {
  res.json({ active: global.MAINTENANCE_MODE, message: 'Sistem sedang dalam peningkatan rutin. Kami akan segera kembali.' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/lahan', lahanRoutes);
app.use('/api/tanaman', tanamanRoutes);
app.use('/api/jadwal', jadwalRoutes);
app.use('/api/inventori', inventoriRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/cuaca', cuacaRoutes);
app.use('/api/diagnosa', diagnosaRoutes);
app.use('/api/konsultasi', konsultasiRoutes);
app.use('/api/bugs', bugsRoutes);
app.use('/api/jualbeli', jualbeliRoutes);
app.use('/api/edukasi', edukasiRoutes);

// Admin Route Group
app.use('/api/admin', adminRoutes);

// Admin Settings Route (karena perlu akses ke global variables di file ini)
app.get('/api/admin/settings', authMiddleware, adminMiddleware, (req, res) => {
  res.json({
    maintenance: global.MAINTENANCE_MODE,
    apiKeyConfigured: !!global.CUSTOM_API_KEY,
    apiKeyPreview: global.CUSTOM_API_KEY ? global.CUSTOM_API_KEY.substring(0, 8) + '...' : ''
  });
});

app.put('/api/admin/settings', authMiddleware, adminMiddleware, (req, res) => {
  const { maintenance, apiKey } = req.body;
  if (maintenance !== undefined) global.MAINTENANCE_MODE = maintenance;
  if (apiKey !== undefined && apiKey !== '') {
    // Check if it's the masked key, ignore if true
    if (!apiKey.includes('...')) {
       global.CUSTOM_API_KEY = apiKey;
    }
  } else if (apiKey === '') {
    global.CUSTOM_API_KEY = ''; // Clear key
  }
  res.json({ success: true, maintenance: global.MAINTENANCE_MODE });
});

app.post('/api/admin/test-apikey', authMiddleware, adminMiddleware, async (req, res) => {
  const apiKeyToTest = req.body.apiKey && !req.body.apiKey.includes('...') ? req.body.apiKey : global.CUSTOM_API_KEY;
  if (!apiKeyToTest) return res.status(400).json({ error: 'API Key tidak ada' });
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKeyToTest}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      res.json({ valid: true, data });
    } else {
      res.json({ valid: false, error: `Status ${response.status}` });
    }
  } catch (err) {
    res.json({ valid: false, error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tani.Smart API is running 🌱', maintenance: global.MAINTENANCE_MODE });
});

// Handler 404 (Pencegah respons HTML)
app.use((req, res, next) => {
  res.status(404).json({ error: `Rute API '${req.url}' tidak ditemukan.` });
});

// Global Error Handler (Pencegah respons DOCTYPE HTML saat syntax error)
app.use((err, req, res, next) => {
  console.error('🚨 SERVER ERROR:', err.stack || err);
  
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Data yang dikirim tidak valid.' });
  }
  
  res.status(err.status || 500).json({ 
    error: 'Terjadi kegagalan server. Mohon coba lagi.' 
  });
});

// Prevent silent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err);
});

const server = app.listen(PORT, () => {
  console.log(`\n🌱 Tani.Smart API Server berjalan di http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} sudah digunakan proses lain!`);
    console.error(`   Jalankan: netstat -ano | findstr :${PORT}`);
    console.error(`   Lalu kill prosesnya: taskkill /F /PID <PID>`);
    process.exit(1);
  } else {
    console.error('🚨 Server error:', err);
    process.exit(1);
  }
});

// Keep the process alive
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
