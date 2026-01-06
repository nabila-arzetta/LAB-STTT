<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BagianImportSeeder extends Seeder
{
    public function run(): void
    {
        // Sumber data: list lab kamu (kode_bagian, nama_bagian, singkatan, aktif)
        $rows = [
            ['kode' => 'L-BHS',  'nama' => 'LAB. BAHASA',                    'singkatan' => 'LBHS', 'aktif' => 1],
            ['kode' => 'L-CL1',  'nama' => 'LAB. PENCELUPAN',               'singkatan' => 'LCL',  'aktif' => 1],
            ['kode' => 'L-CL2',  'nama' => 'LAB. PENCELUPAN',               'singkatan' => 'LCL',  'aktif' => 1],
            ['kode' => 'L-CL3',  'nama' => 'LAB. PENCELUPAN',               'singkatan' => 'LCL',  'aktif' => 0],
            ['kode' => 'L-CP1',  'nama' => 'LAB. PENCAPAN',                 'singkatan' => 'LCP',  'aktif' => 1],
            ['kode' => 'L-CP2',  'nama' => 'LAB. PENCAPAN',                 'singkatan' => 'LCP',  'aktif' => 1],
            ['kode' => 'L-CP3',  'nama' => 'LAB. PENCAPAN',                 'singkatan' => 'LCP',  'aktif' => 0],
            ['kode' => 'L-DS1',  'nama' => 'LAB. DESAIN',                   'singkatan' => 'LDS',  'aktif' => 1],
            ['kode' => 'L-DS2',  'nama' => 'LAB. DESAIN',                   'singkatan' => 'LDS',  'aktif' => 1],
            ['kode' => 'L-DS3',  'nama' => 'LAB. DESAIN',                   'singkatan' => 'LDS',  'aktif' => 1],
            ['kode' => 'LEVF1',  'nama' => 'LAB. EVALUASI FISIKA',          'singkatan' => 'LEVF', 'aktif' => 1],
            ['kode' => 'LEVF2',  'nama' => 'LAB. EVALUASI FISIKA',          'singkatan' => 'LEVF', 'aktif' => 1],
            ['kode' => 'LEVF3',  'nama' => 'LAB. EVALUASI FISIKA & KIMIA',  'singkatan' => 'LEVF', 'aktif' => 0],
            ['kode' => 'LEVGB',  'nama' => 'LAB. EVALUASI GABUNGAN',        'singkatan' => 'LEVG', 'aktif' => 1],
            ['kode' => 'LEVK1',  'nama' => 'LAB. EVALUASI KIMIA',           'singkatan' => 'LEVK', 'aktif' => 1],
            ['kode' => 'LEVK2',  'nama' => 'LAB. EVALUASI KIMIA',           'singkatan' => 'LEVK', 'aktif' => 1],
            ['kode' => 'LEVK3',  'nama' => 'LAB. EVALUASI KIMIA & FISIKA',  'singkatan' => 'LEVK', 'aktif' => 0],
            ['kode' => 'L-FSK',  'nama' => 'LAB. FISIKA',                   'singkatan' => 'LFSK', 'aktif' => 1],
            ['kode' => 'L-GT',   'nama' => 'LAB. GAMBAR TEKNIK',            'singkatan' => 'LGT',  'aktif' => 1],
            ['kode' => 'L-JQR',  'nama' => 'LAB. JACQUARD IGI',             'singkatan' => 'LJQR', 'aktif' => 0],
            ['kode' => 'L-KA1',  'nama' => 'LAB. KIMIA ANALISA LANTAI 3',   'singkatan' => 'LKA',  'aktif' => 1],
            ['kode' => 'L-KA2',  'nama' => 'LAB. KIMIA ANALISA LANTAI 3',   'singkatan' => 'LKA',  'aktif' => 1],
            ['kode' => 'L-KA3',  'nama' => 'LAB. KIMIA ANALISA LANTAI 3',   'singkatan' => 'LKA',  'aktif' => 0],
            ['kode' => 'L-KA4',  'nama' => 'LAB. KIMIA ANALISA LANTAI 4',   'singkatan' => 'LKA',  'aktif' => 1],
            ['kode' => 'L-KA5',  'nama' => 'LAB. KIMIA ANALISA LANTAI 4',   'singkatan' => 'LKA',  'aktif' => 0],
            ['kode' => 'L-KA6',  'nama' => 'LAB. KIMIA ANALISA LANTAI 4',   'singkatan' => 'LKA',  'aktif' => 0],
            ['kode' => 'LKFT1',  'nama' => 'LAB. KIMIA FISIKA TEKSTIL',     'singkatan' => 'LKFT', 'aktif' => 1],
            ['kode' => 'LKFT2',  'nama' => 'LAB. KIMIA FISIKA TEKSTIL',     'singkatan' => 'LKFT', 'aktif' => 1],
            ['kode' => 'L-KMP',  'nama' => 'LAB. KOMPUTER',                 'singkatan' => 'LKMP', 'aktif' => 1],
            ['kode' => 'L-PT1',  'nama' => 'LAB. PEMINTALAN',               'singkatan' => 'LPT',  'aktif' => 1],
            ['kode' => 'L-PT2',  'nama' => 'LAB. PEMINTALAN',               'singkatan' => 'LPT',  'aktif' => 1],
            ['kode' => 'L-RJ1',  'nama' => 'LAB. PERAJUTAN',                'singkatan' => 'LRJ',  'aktif' => 1],
            ['kode' => 'L-RJ2',  'nama' => 'LAB. PERAJUTAN',                'singkatan' => 'LRJ',  'aktif' => 1],
            ['kode' => 'L-RJ3',  'nama' => 'LAB. PERAJUTAN',                'singkatan' => 'LRJ',  'aktif' => 1],
            ['kode' => 'L-TN1',  'nama' => 'LAB. PERTENUNAN',               'singkatan' => 'LTN',  'aktif' => 1],
            ['kode' => 'L-TN2',  'nama' => 'LAB. PERTENUNAN',               'singkatan' => 'LTN',  'aktif' => 1],
            ['kode' => 'L-TN3',  'nama' => 'LAB. PERTENUNAN',               'singkatan' => 'LTN',  'aktif' => 1],
            ['kode' => 'L-TXP',  'nama' => 'LAB. TEXPRO IGI',               'singkatan' => 'LTXP', 'aktif' => 0],
        ];

        foreach ($rows as $r) {
            DB::table('bagian')->updateOrInsert(
                ['kode_bagian' => $r['kode']], // PK/FK yang dipakai di users
                [
                    'nama_bagian' => $r['nama'],
                    // kolom 'deskripsi' bisa diisi singkatan agar tidak hilang infonya
                    'deskripsi'   => $r['singkatan'],
                    'status'      => $r['aktif'] ? 'aktif' : 'nonaktif',
                    'updated_at'  => now(),
                    'created_at'  => now(),
                ]
            );
        }
    }
}
