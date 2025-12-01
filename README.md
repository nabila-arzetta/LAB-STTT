# o-lab
Aplikasi operasional laboratorium Politeknik STTT Bandung

Sistem manajemen inventaris dan operasional laboratorium yang terdiri dari backend Laravel dan frontend React.

## Arsitektur Proyek

Proyek ini terdiri dari dua bagian utama:

- **Backend** (`/backend`) - API server menggunakan Laravel PHP framework
- **Frontend** (`/frontend`) - Aplikasi web menggunakan React dan TypeScript

## Persyaratan Sistem

- **Backend:**
  - PHP ^8.2
  - Composer
  - Database (MySQL, PostgreSQL, atau SQLite)

- **Frontend:**
  - Node.js (versi 16 atau lebih tinggi)
  - npm atau yarn

## Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd lab-sttt
```

### 2. Setup Backend
```bash
cd backend
composer install
npm install
cp .env.example .env
# Edit .env untuk konfigurasi database
php artisan key:generate
php artisan migrate
php artisan db:seed
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
# Buat file .env jika diperlukan untuk API_BASE_URL
```

### 4. Jalankan Aplikasi
```bash
# Terminal 1 - Backend
cd backend
composer run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Aplikasi akan berjalan di:
- Backend API: `http://localhost:8000`
- Frontend: `http://localhost:5173`

## Dokumentasi Lengkap

- [Backend README](./backend/README.md) - Instruksi setup dan running backend
- [Frontend README](./frontend/README.md) - Instruksi setup dan running frontend

## Fitur Utama

- **Manajemen Inventaris** - Tracking barang dan stok laboratorium
- **Peminjaman Barang** - Sistem peminjaman dan pengembalian
- **Stok Opname** - Pencatatan dan verifikasi stok
- **Transfer Barang** - Pemindahan barang antar lab/bagian
- **Penggunaan Barang** - Pencatatan penggunaan bahan
- **Dashboard Admin** - Monitoring dan laporan

## Teknologi

- **Backend:** Laravel 12, PHP 8.2, MySQL/PostgreSQL
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn-ui
- **Authentication:** Laravel Sanctum

## Development

### Database Schema
Lihat file migrasi di `backend/database/migrations/` untuk struktur database.

### API Endpoints
Endpoint API tersedia di `backend/routes/api.php`.

### Testing
```bash
# Backend tests
cd backend && composer run test

# Frontend tests
cd frontend && npm run test
```

## Deployment

### Backend
1. Setup server dengan PHP dan Composer
2. Clone repository
3. Install dependencies dan setup environment
4. Jalankan `php artisan migrate --seed`
5. Configure web server (Apache/Nginx) untuk serve `public/` folder

### Frontend
1. Build aplikasi: `npm run build`
2. Upload folder `dist/` ke web server
3. Configure server untuk serve static files

## Kontribusi

1. Fork repository
2. Buat branch fitur baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## Lisensi

MIT License - lihat file [LICENSE](./backend/LICENSE) untuk detail.
