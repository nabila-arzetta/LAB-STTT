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

   **Contoh file .env (berdasarkan konfigurasi aktual):**
   ```env
   APP_NAME=Laravel
   APP_ENV=local
   APP_KEY=base64:jHnn6vz3i/dwZtWuPnqU68GMBlmuqJldi1e3rqRdbPY=
   APP_DEBUG=true
   APP_URL=http://127.0.0.1:8000

   APP_LOCALE=en
   APP_FALLBACK_LOCALE=en
   APP_FAKER_LOCALE=en_US

   APP_MAINTENANCE_DRIVER=file
   # APP_MAINTENANCE_STORE=database

   PHP_CLI_SERVER_WORKERS=4

   BCRYPT_ROUNDS=12

   LOG_CHANNEL=stack
   LOG_STACK=single
   LOG_DEPRECATIONS_CHANNEL=null
   LOG_LEVEL=debug

   DB_CONNECTION=mysql
   DB_HOST=103.146.144.36
   DB_PORT=3306
   DB_DATABASE=sttt-lab
   DB_USERNAME=user_dev
   DB_PASSWORD=adminDev

   SESSION_DOMAIN=localhost
   SANCTUM_STATEFUL_DOMAINS=localhost:8080,127.0.0.1:8080
   SESSION_DRIVER=database
   SESSION_LIFETIME=120
   SESSION_ENCRYPT=false
   SESSION_PATH=/
   SESSION_DOMAIN=null

   # manggil API SIMAK
   SIMAK_CLIENT_EMAIL=test2@example.com
   SIMAK_CLIENT_PASSWORD=12345
   SIMAK_BASE_URL=https://services.stttekstil.ac.id/api

   BROADCAST_CONNECTION=log
   FILESYSTEM_DISK=local
   QUEUE_CONNECTION=database

   CACHE_STORE=database
   # CACHE_PREFIX=

   MEMCACHED_HOST=127.0.0.1

   REDIS_CLIENT=phpredis
   REDIS_HOST=127.0.0.1
   REDIS_PASSWORD=null
   REDIS_PORT=6379

   MAIL_MAILER=log
   MAIL_SCHEME=null
   MAIL_HOST=127.0.0.1
   MAIL_PORT=2525
   MAIL_USERNAME=null
   MAIL_PASSWORD=null
   MAIL_FROM_ADDRESS="hello@example.com"
   MAIL_FROM_NAME="${APP_NAME}"

   AWS_ACCESS_KEY_ID=
   AWS_SECRET_ACCESS_KEY=
   AWS_DEFAULT_REGION=us-east-1
   AWS_BUCKET=
   AWS_USE_PATH_STYLE_ENDPOINT=false

   VITE_APP_NAME="${APP_NAME}"
   VITE_API_BASE_URL=http://127.0.0.1:8000/api
   ```

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