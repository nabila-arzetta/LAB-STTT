# o-lab Frontend
Frontend aplikasi operasional laboratorium Politeknik STTT Bandung

## Persyaratan Sistem
- Node.js (versi 16 atau lebih tinggi)
- npm atau yarn

## Instalasi

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment**
   Buat file `.env` di root folder frontend dan sesuaikan konfigurasi API backend:
   ```
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

## Menjalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173` (atau port yang ditentukan).

## Build untuk Production

```bash
npm run build
```

## Teknologi yang Digunakan

- **Vite** - Build tool dan dev server
- **TypeScript** - Type-safe JavaScript
- **React** - UI library
- **shadcn-ui** - Komponen UI
- **Tailwind CSS** - CSS framework
- **Axios** - HTTP client untuk API calls

## Struktur Proyek

- `src/components/` - Komponen UI reusable
- `src/pages/` - Halaman aplikasi
- `src/services/` - Service untuk API calls
- `src/hooks/` - Custom React hooks
- `src/contexts/` - React contexts
- `src/lib/` - Utility functions

## Koneksi ke Backend

Pastikan backend Laravel sudah berjalan di `http://localhost:8000`. Frontend akan mengirim request ke endpoint API backend untuk autentikasi, data inventaris, dan operasi lainnya.

## Development

### Menambah Halaman Baru
1. Buat file baru di `src/pages/`
2. Tambahkan route di `src/App.tsx` atau router yang digunakan
3. Implementasikan komponen sesuai kebutuhan

### Menambah API Service
1. Buat file baru di `src/services/`
2. Gunakan axios untuk HTTP requests
3. Export functions untuk digunakan di komponen

### Styling
Gunakan Tailwind CSS classes langsung di komponen atau custom CSS di `src/index.css`.

## Testing

Jalankan test dengan:
```bash
npm run test
```

## Deployment

### Manual Deployment
1. Build aplikasi: `npm run build`
2. Upload folder `dist/` ke web server
3. Konfigurasi server untuk serve static files

## Kontribusi

1. Fork repository
2. Buat branch fitur baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request
