<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        try {
            $user = $request->user();

            // Ambil bagian user (lab)
            $bagian = DB::table('bagian')->where('kode_bagian', $user->kode_bagian)->first();

            // Tentukan kode ruangan untuk admin lab
            if ($bagian) {
                $nama = strtoupper(trim($bagian->nama_bagian));
                $kodeRuangan = 'L-' . ltrim($nama, 'L-'); 
            } else {
                $kodeRuangan = null;
            }

            $isSuperAdmin = $user->role === 'superadmin';

            // ============================
            //     STAT SUPERADMIN
            // ============================
            if ($isSuperAdmin) {
                $totalBarang = DB::table('master_barang')->count();
                $totalUser   = DB::table('users')->count();
                $totalLab    = DB::table('bagian')->count();
            }

            // ============================
            //     STAT ADMIN LAB
            // ============================
            if (!$isSuperAdmin) {
                $barangQuery = DB::table('master_barang')
                    ->when($kodeRuangan, fn($q) => $q->where('kode_ruangan', $kodeRuangan));

                $totalBarang = $barangQuery->count();

                $barangMasuk = DB::table('master_barang')
                    ->when($kodeRuangan, fn($q) => $q->where('kode_ruangan', $kodeRuangan))
                    ->whereDate('created_at', '>=', now()->startOfMonth())
                    ->count();

                $barangKeluar = DB::table('master_barang')
                    ->when($kodeRuangan, fn($q) => $q->where('kode_ruangan', $kodeRuangan))
                    ->whereDate('updated_at', '>=', now()->startOfMonth())
                    ->count();

                $antrianBarang = 0;

                $totalUser = null;
                $totalLab = null;
            }

            // ============================
            //        LOW STOCK
            // ============================
            $lowStock = DB::table('master_barang')
                ->when(!$isSuperAdmin && $kodeRuangan, fn($q) => $q->where('kode_ruangan', $kodeRuangan))
                ->orderBy('updated_at', 'desc')
                ->limit(5)
                ->get(['id as barang_id', 'nama_barang', DB::raw('3 as stok')]);


            // ============================
            //        RECENT TRANSACTION
            // ============================
            $recent = DB::table('master_barang')
                ->when(!$isSuperAdmin && $kodeRuangan, fn($q) => $q->where('kode_ruangan', $kodeRuangan))
                ->orderByDesc('updated_at')
                ->limit(6)
                ->get()
                ->map(fn($row) => [
                    'id' => $row->id,
                    'type' => 'update',
                    'item' => $row->nama_barang,
                    'quantity' => rand(1, 5),
                    'time' => date('Y-m-d', strtotime($row->updated_at ?? now())),
                    'status' => 'selesai',
                ]);

            // ============================
            //       RETURN RESPONSE
            // ============================
            return response()->json([
                'debug' => [
                    'role' => $user->role,
                    'kode_bagian' => $user->kode_bagian,
                    'kode_ruangan' => $kodeRuangan,
                    'isSuperAdmin' => $isSuperAdmin,
                ],
                'labName' => $bagian->nama_bagian ?? null,

                'stats' => [
                    'totalBarang' => $totalBarang,
                    'barangMasuk' => $barangMasuk ?? null,
                    'barangKeluar' => $barangKeluar ?? null,
                    'antrianBarang' => $antrianBarang ?? null,
                    'totalUser' => $totalUser,
                    'totalLab' => $totalLab,
                ],

                'lowStock' => $lowStock,
                'recent' => $recent,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ], 500);
        }
    }
}
