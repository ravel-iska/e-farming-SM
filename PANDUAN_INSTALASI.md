# PANDUAN INSTALASI TANI.SMART

Versi: 1.0.0

## KEBUTUHAN SISTEM
- Node.js v18+
- PostgreSQL v14+

## LANGKAH INSTALASI

1. Install dependency: npm install
2. Install dependency backend: cd backend && npm install
3. Buat file backend/.env (lihat contoh di bawah)
4. Buat tabel database: npm run db:push
5. Isi data awal: npm run db:seed
6. Jalankan: npm run dev

## CONTOH FILE backend/.env

DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/tanismart_db
JWT_SECRET=string_rahasia_panjang
PORT=5000
OPENROUTER_API_KEY=sk-or-xxx

## AKUN DEFAULT (setelah seed)
- Admin: admin@tanismart.id / admin123

## AKSES APLIKASI
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
