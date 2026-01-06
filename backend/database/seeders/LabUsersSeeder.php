<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class LabUsersSeeder extends Seeder
{
    public function run(): void
    {
        // Ambil semua lab dari tabel 'bagian'
        $labs = DB::table('bagian')->select('kode_bagian','nama_bagian')->get();

        foreach ($labs as $lab) {
            $kode = $lab->kode_bagian;       // contoh: LBHS
            $slug = strtolower($kode);       // lbhs

            // === ADMIN LAB ===
            DB::table('users')->updateOrInsert(
                ['email' => "{$slug}-admin@test.com"],
                [
                    'name'         => "{$kode} Admin",
                    'username'     => "{$slug}_admin",
                    'full_name'    => "{$kode} Admin",
                    'password'     => Hash::make('password'),
                    'role'         => 'admin_lab',
                    'kode_bagian'  => $kode,         // FK ke bagian.kode_bagian
                    'is_active'    => 1,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]
            );

            // === USER LAB (non-admin) ===
            DB::table('users')->updateOrInsert(
                ['email' => "{$slug}-user@test.com"],
                [
                    'name'         => "{$kode} User",
                    'username'     => "{$slug}_user",
                    'full_name'    => "{$kode} User",
                    'password'     => Hash::make('password'),
                    'role'         => 'user_lab',
                    'kode_bagian'  => $kode,
                    'is_active'    => 1,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]
            );
        }
    }
}
