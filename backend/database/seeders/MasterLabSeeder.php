<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MasterLabSeeder extends Seeder
{
    public function run(): void
    {
        // Map dari CSV: KD_RUANG/SINGKATAN -> NAMA LAB & STATUS
        // AKTIF: 1 => 'aktif', 0 => 'nonaktif'
        $rows = [
            ['kode_bagian'=>'LBHS','nama_lab'=>'LAB. BAHASA','aktif'=>1],
            ['kode_bagian'=>'LCL', 'nama_lab'=>'LAB. PENCELUPAN','aktif'=>1],
            ['kode_bagian'=>'LCL', 'nama_lab'=>'LAB. PENCELUPAN','aktif'=>1], // CL2
            ['kode_bagian'=>'LCL', 'nama_lab'=>'LAB. PENCELUPAN','aktif'=>0], // CL3
            ['kode_bagian'=>'LCP', 'nama_lab'=>'LAB. PENCAPAN','aktif'=>1],   // CP1
            ['kode_bagian'=>'LCP', 'nama_lab'=>'LAB. PENCAPAN','aktif'=>1],   // CP2
            ['kode_bagian'=>'LCP', 'nama_lab'=>'LAB. PENCAPAN','aktif'=>0],   // CP3
            ['kode_bagian'=>'LDS', 'nama_lab'=>'LAB. DESAIN','aktif'=>1],     // DS1
            ['kode_bagian'=>'LDS', 'nama_lab'=>'LAB. DESAIN','aktif'=>1],     // DS2
            ['kode_bagian'=>'LDS', 'nama_lab'=>'LAB. DESAIN','aktif'=>0],     // DS3
            ['kode_bagian'=>'LEVF','nama_lab'=>'LAB. EVALUASI FISIKA','aktif'=>1], // EVF1
            ['kode_bagian'=>'LEVF','nama_lab'=>'LAB. EVALUASI FISIKA','aktif'=>1], // EVF2
            ['kode_bagian'=>'LEVF','nama_lab'=>'LAB. EVALUASI FISIKA & KIMIA','aktif'=>0], // EVF3
            ['kode_bagian'=>'LEVG','nama_lab'=>'LAB. EVALUASI GABUNGAN','aktif'=>1],
            ['kode_bagian'=>'LEVK','nama_lab'=>'LAB. EVALUASI KIMIA','aktif'=>1], // K1
            ['kode_bagian'=>'LEVK','nama_lab'=>'LAB. EVALUASI KIMIA','aktif'=>1], // K2
            ['kode_bagian'=>'LEVK','nama_lab'=>'LAB. EVALUASI KIMIA & FISIKA','aktif'=>0], // K3
            ['kode_bagian'=>'LFSK','nama_lab'=>'LAB. FISIKA','aktif'=>1],
            ['kode_bagian'=>'LGT', 'nama_lab'=>'LAB. GAMBAR TEKNIK','aktif'=>1],
            ['kode_bagian'=>'LJQR','nama_lab'=>'LAB. JACQUARD IGI','aktif'=>0],
            ['kode_bagian'=>'LKA', 'nama_lab'=>'LAB. KIMIA ANALISA LANTAI 3','aktif'=>1], // KA1
            ['kode_bagian'=>'LKA', 'nama_lab'=>'LAB. KIMIA ANALISA LANTAI 3','aktif'=>1], // KA2
            ['kode_bagian'=>'LKA', 'nama_lab'=>'LAB. KIMIA ANALISA LANTAI 3','aktif'=>0], // KA3
            ['kode_bagian'=>'LKA', 'nama_lab'=>'LAB. KIMIA ANALISA LANTAI 4','aktif'=>1], // KA4
            ['kode_bagian'=>'LKA', 'nama_lab'=>'LAB. KIMIA ANALISA LANTAI 4','aktif'=>0], // KA5
            ['kode_bagian'=>'LKA', 'nama_lab'=>'LAB. KIMIA ANALISA LANTAI 4','aktif'=>0], // KA6
            ['kode_bagian'=>'LKFT','nama_lab'=>'LAB. KIMIA FISIKA TEKSTIL','aktif'=>1], // KFT1
            ['kode_bagian'=>'LKFT','nama_lab'=>'LAB. KIMIA FISIKA TEKSTIL','aktif'=>1], // KFT2
            ['kode_bagian'=>'LKMP','nama_lab'=>'LAB. KOMPUTER','aktif'=>1],
            ['kode_bagian'=>'LPT', 'nama_lab'=>'LAB. PEMINTALAN','aktif'=>1], // PT1
            ['kode_bagian'=>'LPT', 'nama_lab'=>'LAB. PEMINTALAN','aktif'=>1], // PT2
            ['kode_bagian'=>'LRJ', 'nama_lab'=>'LAB. PERAJUTAN','aktif'=>1],  // RJ1
            ['kode_bagian'=>'LRJ', 'nama_lab'=>'LAB. PERAJUTAN','aktif'=>1],  // RJ2
            ['kode_bagian'=>'LRJ', 'nama_lab'=>'LAB. PERAJUTAN','aktif'=>1],  // RJ3
            ['kode_bagian'=>'LTN', 'nama_lab'=>'LAB. PERTENUNAN','aktif'=>1], // TN1
            ['kode_bagian'=>'LTN', 'nama_lab'=>'LAB. PERTENUNAN','aktif'=>1], // TN2
            ['kode_bagian'=>'LTN', 'nama_lab'=>'LAB. PERTENUNAN','aktif'=>1], // TN3
            ['kode_bagian'=>'LTXP','nama_lab'=>'LAB. TEXPRO IGI','aktif'=>0],
        ];

        $now = now();
        foreach ($rows as $r) {
            DB::table('master_lab')->updateOrInsert(
                // unikkan dengan kombinasi nama_lab + kode_bagian
                ['nama_lab' => $r['nama_lab'], 'kode_bagian' => $r['kode_bagian']],
                [
                    'deskripsi'  => null,
                    'lokasi'     => null,
                    'status'     => $r['aktif'] ? 'aktif' : 'nonaktif',
                    'created_by' => null,
                    'updated_at' => $now,
                    'created_at' => $now,
                ]
            );
        }
    }
}
