<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MasterLabKodeBagianSeeder extends Seeder
{
    public function run(): void
    {
        $map = [
            'LBHS' => 'LAB. BAHASA',
            'LCL'  => 'LAB. PENCELUPAN',      // kalau di master_lab namanya beda, sesuaikan
            'LCP'  => 'LAB. PENCAPAN',
            'LDS'  => 'LAB. DESAIN',
            'LEVF' => 'LAB. EVALUASI FISIKA',
            'LEVG' => 'LAB. EVALUASI GABUNGAN',
            'LEVK' => 'LAB. EVALUASI KIMIA',
            'LFSK' => 'LAB. FISIKA',
            'LGT'  => 'LAB. GAMBAR TEKNIK',
            'LJQR' => 'LAB. JACQUARD IGI',
            'LKA'  => 'LAB. KIMIA ANALISA LANTAI 3', // dst… sesuaikan
            'LKFT' => 'LAB. KIMIA FISIKA TEKSTIL',
            'LKMP' => 'LAB. KOMPUTER',
            'LPT'  => 'LAB. PEMINTALAN',
            'LRJ'  => 'LAB. PERAJUTAN',
            'LTN'  => 'LAB. PERTENUNAN',
            'LTXP' => 'LAB. TEXPRO IGI',
        ];

        foreach ($map as $kodeBagian => $namaLab) {
            DB::table('master_lab')
              ->where('nama_lab', $namaLab)
              ->update(['kode_bagian' => $kodeBagian]);
        }
    }
}
