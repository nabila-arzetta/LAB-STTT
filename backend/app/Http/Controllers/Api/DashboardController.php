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

        // ============================
        // AMBIL DATA LAB USER
        // ============================
        $labUser = DB::table('master_lab')
            ->where('kode_bagian', $user->kode_bagian)
            ->first();

        $kodeRuangan = $labUser
            ? strtoupper(trim($labUser->kode_ruangan))
            : null;

        $labName = $labUser
            ? ucwords(strtolower(str_replace(['LAB.', 'LAB'], '', $labUser->nama_lab)))
            : null;

        $isSuperAdmin = $user->role === 'superadmin';

        // ============================
        // INISIALISASI DEFAULT
        // ============================
        $totalBarang   = 0;
        $barangMasuk   = 0;
        $barangKeluar  = 0;
        $antrianBarang = 0;
        $totalUser     = null;
        $totalLab      = null;

        // ============================
        //     STAT SUPERADMIN
        // ============================
        if ($isSuperAdmin) {
            $totalBarang = DB::table('master_barang')->count();
            $totalUser   = DB::table('users')->count();
            $totalLab    = DB::table('master_lab')
                ->where('status', 'aktif')
                ->count();
        }

        // ============================
        //     STAT ADMIN LAB
        // ============================
        if (!$isSuperAdmin) {
            $barangQuery = DB::table('master_barang')
                ->when($kodeRuangan, fn ($q) =>
                    $q->where('kode_ruangan', $kodeRuangan)
                );

            $totalBarang = $barangQuery->count();

            $barangMasuk = DB::table('master_barang')
                ->when($kodeRuangan, fn ($q) =>
                    $q->where('kode_ruangan', $kodeRuangan)
                )
                ->whereDate('created_at', '>=', now()->startOfMonth())
                ->count();

            $barangKeluar = DB::table('master_barang')
                ->when($kodeRuangan, fn ($q) =>
                    $q->where('kode_ruangan', $kodeRuangan)
                )
                ->whereDate('updated_at', '>=', now()->startOfMonth())
                ->count();

            $antrianBarang = DB::table('transfer_barang')
                ->when($kodeRuangan, function ($q) use ($kodeRuangan) {
                    $q->whereRaw(
                        'TRIM(UPPER(kode_ruangan_tujuan)) = TRIM(UPPER(?))',
                        [$kodeRuangan]
                    );
                })
                ->whereRaw('TRIM(LOWER(status)) = ?', ['pending'])
                ->count();
        }

        // ============================
        //        LOW STOCK
        // ============================
        $lowStock = DB::table('master_barang')
            ->when(!$isSuperAdmin && $kodeRuangan, fn ($q) =>
                $q->where('kode_ruangan', $kodeRuangan)
            )
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get([
                'id as barang_id',
                'nama_barang',
                DB::raw('3 as stok'),
            ]);

        // ============================
        //        RECENT TRANSACTION
        // ============================
        $recent = DB::table('master_barang')
            ->when(!$isSuperAdmin && $kodeRuangan, fn ($q) =>
                $q->where('kode_ruangan', $kodeRuangan)
            )
            ->orderByDesc('updated_at')
            ->limit(6)
            ->get()
            ->map(fn ($row) => [
                'id'       => $row->id,
                'type'     => 'update',
                'item'     => $row->nama_barang,
                'quantity' => rand(1, 5),
                'time'     => date('Y-m-d', strtotime($row->updated_at ?? now())),
                'status'   => 'selesai',
            ]);

        // ============================
        //       RETURN RESPONSE
        // ============================
        return response()->json([
            'debug' => [
                'role'          => $user->role,
                'kode_bagian'   => $user->kode_bagian,
                'kode_ruangan' => $kodeRuangan,
                'isSuperAdmin' => $isSuperAdmin,
            ],

            'labName' => $labName,

            'stats' => [
                'totalBarang'   => $totalBarang,
                'barangMasuk'   => $barangMasuk,
                'barangKeluar'  => $barangKeluar,
                'antrianBarang' => $antrianBarang,
                'totalUser'     => $totalUser,
                'totalLab'      => $totalLab,
            ],

            'lowStock' => $lowStock,
            'recent'   => $recent,
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'line'  => $e->getLine(),
            'file'  => $e->getFile(),
        ], 500);
    }
}

}
