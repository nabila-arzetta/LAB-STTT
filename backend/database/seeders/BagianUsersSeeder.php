<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;
use App\Models\User;
use App\Models\Bagian;

class BagianUsersSeeder extends Seeder
{
    public function run(): void
    {
        // Cek kolom tersedia di tabel bagian
        $cols = Schema::getColumnListing('bagian'); // atau 'bagians' sesuai namanya
        $hasSingkatan  = in_array('singkatan', $cols, true);
        $hasNamaBagian = in_array('nama_bagian', $cols, true);

        // Ambil semua bagian
        $bagians = Bagian::query()->get();

        foreach ($bagians as $b) {
            // Ambil nilai-nilai yang ada
            $kode      = $b->kode_bagian;                       // wajib ada karena PK
            $singkatan = $hasSingkatan ? ($b->singkatan ?: null) : null;
            $nama      = $hasNamaBagian ? ($b->nama_bagian ?: $kode) : $kode;

            // Slug untuk email
            $slug = $singkatan
                ? Str::lower(Str::slug($singkatan, '-'))
                : Str::lower(Str::slug($kode, '-'));

            // ADMIN per bagian
            User::firstOrCreate(
                ['email' => "{$slug}-admin@test.com"],
                [
                    'name'         => ($singkatan ?: $nama).' Admin',
                    'username'     => "{$slug}_admin",
                    'full_name'    => ($singkatan ?: $nama).' Admin',
                    'password'     => Hash::make('password'),
                    'role'         => 'admin_lab',
                    'kode_bagian'  => $kode,
                    'is_active'    => 1,
                ]
            );

            // USER per bagian
            User::firstOrCreate(
                ['email' => "{$slug}-user@test.com"],
                [
                    'name'         => ($singkatan ?: $nama).' User',
                    'username'     => "{$slug}_user",
                    'full_name'    => ($singkatan ?: $nama).' User',
                    'password'     => Hash::make('password'),
                    'role'         => 'user_lab',
                    'kode_bagian'  => $kode,
                    'is_active'    => 1,
                ]
            );
        }
    }
}