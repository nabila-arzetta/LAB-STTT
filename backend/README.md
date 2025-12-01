# o-lab
Aplikasi operasional laboratorium Politeknik STTT Bandung

## Persyaratan Sistem
- PHP ^8.2
- Composer
- Node.js & npm
- Database (MySQL, PostgreSQL, atau SQLite)

## Instalasi

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install Dependencies PHP**
   ```bash
   composer install
   ```

3. **Install Dependencies Node.js**
   ```bash
   npm install
   ```

4. **Setup Environment**
   ```bash
   cp .env.example .env
   ```
   Edit file `.env` dan sesuaikan konfigurasi database dan lainnya.

5. **Generate Application Key**
   ```bash
   php artisan key:generate
   ```

6. **Migrate Database**
   ```bash
   php artisan migrate
   ```

7. **Seed Database (Opsional)**
   ```bash
   php artisan db:seed
   ```

## Menjalankan Aplikasi

Untuk development, jalankan perintah berikut yang akan menjalankan server Laravel, queue worker, logs, dan Vite secara bersamaan:

```bash
composer run dev
```

Atau jalankan secara manual:

- **Server Laravel**
  ```bash
  php artisan serve
  ```

- **Queue Worker**
  ```bash
  php artisan queue:work
  ```

- **Vite Dev Server**
  ```bash
  npm run dev
  ```

- **Logs**
  ```bash
  php artisan pail
  ```

Aplikasi akan berjalan di `http://localhost:8000` (atau port yang ditentukan).

## Testing

Jalankan test dengan:
```bash
composer run test
```

## API Documentation

Endpoint API dapat diakses melalui `/api/*`. Lihat file `routes/api.php` untuk detail endpoint.

## Struktur Proyek

- `app/` - Kode aplikasi utama
- `database/` - Migrasi dan seeder
- `resources/` - Views dan assets
- `routes/` - Definisi routes
- `tests/` - Unit dan feature tests

## Kontribusi

1. Fork repository
2. Buat branch fitur baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request
