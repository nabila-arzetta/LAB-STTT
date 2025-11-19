<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        try {
            $user = $request->user();

            // Ambil bagian user (misal kode_bagian = 201)
            $bagian = DB::table('bagian')->where('kode_bagian', $user->kode_bagian)->first();

            if ($bagian) {
                // Ambil nama bagian, misal "LBHS"
                $nama = strtoupper(trim($bagian->nama_bagian));

                // Langsung format jadi "L-" + nama (tanpa cek-cek lagi)
                $kodeRuangan = 'L-' . ltrim($nama, 'L-'); // ini kunci fix-nya 🔥
            } else {
                $kodeRuangan = null;
            }


            $isSuperAdmin = $user->role === 'superadmin';

            // ========== DASHBOARD SUMMARY ==========

            // Barang yang relevan
            $barangQuery = DB::table('master_barang');

            if (!$isSuperAdmin && $kodeRuangan) {
                // Jika admin_lab, filter hanya lab miliknya
                $barangQuery->where('kode_ruangan', $kodeRuangan);
            }

            // Statistik
            $totalBarang   = $barangQuery->count();
            $barangMasuk   = $barangQuery->whereDate('created_at', '>=', now()->startOfMonth())->count();
            $barangKeluar  = $barangQuery->whereDate('updated_at', '>=', now()->startOfMonth())->count();
            $antrianBarang = 0;

            // Low stock (stok <= 3 contoh)
            $lowStock = DB::table('master_barang')
                ->when(!$isSuperAdmin && $kodeRuangan, fn($q) => $q->where('kode_ruangan', $kodeRuangan))
                ->whereRaw('CAST(satuan AS CHAR) IS NOT NULL') // jaga-jaga untuk null
                ->orderBy('updated_at', 'desc')
                ->limit(5)
                ->get(['id as barang_id', 'nama_barang', DB::raw('3 as stok')]);

            // Recent (simulasi update terbaru)
            $recent = DB::table('master_barang')
                ->when(!$isSuperAdmin && $kodeRuangan, fn($q) => $q->where('kode_ruangan', $kodeRuangan))
                ->orderByDesc('updated_at')
                ->limit(6)
                ->get()
                ->map(fn($row) => [
                    'type' => 'update',
                    'item' => $row->nama_barang,
                    'quantity' => rand(1, 5), // contoh data dummy
                    'time' => date('Y-m-d', strtotime($row->updated_at ?? now())),
                    'status' => 'selesai',
                ]);

            return response()->json([
                'debug' => [
                    'role' => $user->role,
                    'kode_bagian' => $user->kode_bagian,
                    'kode_ruangan' => $kodeRuangan,
                    'isSuperAdmin' => $isSuperAdmin,
                ],
                'stats' => [
                    'totalBarang' => $totalBarang,
                    'barangMasuk' => $barangMasuk,
                    'barangKeluar' => $barangKeluar,
                    'antrianBarang' => $antrianBarang,
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
