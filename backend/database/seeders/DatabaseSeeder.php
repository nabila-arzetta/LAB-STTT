<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB; // <-- Import DB

// Import semua Model Master
use App\Models\User;
use App\Models\Bagian;
use App\Models\MasterLab;
use App\Models\MasterBarang;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Nonaktifkan Pengecekan Foreign Key (agar urutan seeding tidak masalah)
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // 0. Kosongkan tabel master (agar tidak ada duplikat ID)
        // (Perintah 'migrate:fresh' sudah melakukan ini, tapi ini lebih aman)
        User::truncate();
        Bagian::truncate();
        MasterLab::truncate();
        MasterBarang::truncate();

        // 1. Buat Data Master 'Bagian'
        $this->command->info('Membuat data Bagian...');
        $bagianTI = Bagian::create(['kode_bagian' => 'TI', 'nama_bagian' => 'Teknik Informatika']);
        $bagianKimia = Bagian::create(['kode_bagian' => 'KIMIA', 'nama_bagian' => 'Teknik Kimia']);
        $bagianUmum = Bagian::create(['kode_bagian' => 'UMUM', 'nama_bagian' => 'Umum & Administrasi']);

        // 2. Buat User (Admin, Peminjam, dan 5 user acak)
        $this->command->info('Membuat data User...');
        $adminUser = User::create([
            'id' => 1, // Paksa ID 1 untuk Admin
            'name' => 'Admin Lab',
            'username' => 'admin',
            'full_name' => 'Administrator Lab',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'kode_bagian' => $bagianUmum->kode_bagian,
            'role' => 'admin',
            'is_active' => true,
        ]);

        $peminjamTI = User::create([
            'id' => 2, // Paksa ID 2 untuk tes peminjam
            'name' => 'User Peminjam TI',
            'username' => 'peminjam_ti',
            'full_name' => 'Peminjam Mahasiswa TI',
            'email' => 'peminjam@test.com',
            'password' => Hash::make('password'),
            'kode_bagian' => $bagianTI->kode_bagian,
            'role' => 'user',
            'is_active' => true,
        ]);
        
        // Buat 5 user peminjam acak (dari UserFactory)
        User::factory(5)->create([
            'kode_bagian' => $bagianTI->kode_bagian
        ]);

        // 4. Buat Data Master 'MasterLab'
        $this->command->info('Membuat data MasterLab...');
        $labKimia = MasterLab::create([
            'id_lab' => 1, // Paksa ID 1 (untuk tes Skenario 1)
            'nama_lab' => 'Lab Kimia Dasar', 'lokasi' => 'Gedung A R.101', 'created_by' => $adminUser->id
        ]);
        $labFisika = MasterLab::create([
            'id_lab' => 2, // Paksa ID 2
            'nama_lab' => 'Lab Fisika Dasar', 'lokasi' => 'Gedung A R.102', 'created_by' => $adminUser->id
        ]);
        $labJarkom = MasterLab::create([
            'id_lab' => 3, // Paksa ID 3
            'nama_lab' => 'Lab Jaringan Komputer', 'lokasi' => 'Gedung C R.301', 'created_by' => $adminUser->id
        ]);

        // Aktifkan kembali Foreign Key Checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        
        $this->command->info('Database seeding selesai!');


        $this->call([
        MasterLabSeeder::class,
        LabUsersSeeder::class,
        BagianUsersSeeder::class,
    ]);
    }
}