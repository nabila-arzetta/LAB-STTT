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

        $totalBarang   = 0;
        $barangMasuk   = 0;
        $barangKeluar  = 0;
        $antrianBarang = 0;
        $totalUser     = null;
        $totalLab      = null;

        //  STAT SUPERADMIN
        if ($isSuperAdmin) {
            $totalBarang = DB::table('master_barang')->count();
            $totalUser   = DB::table('users')->count();
            $totalLab    = DB::table('master_lab')
                ->where('status', 'aktif')
                ->count();
        }

        // STAT ADMIN LAB
        if (!$isSuperAdmin) {
        $totalBarang = DB::table('master_barang')->count();

        $barangMasuk = DB::table('penerimaan_logistik')
            ->where('kode_ruangan', $kodeRuangan)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $barangKeluar = DB::table('penggunaan_barang')
            ->where('kode_ruangan', $kodeRuangan)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $antrianBarang = DB::table('transfer_barang')
            ->whereRaw(
                'TRIM(UPPER(kode_ruangan_tujuan)) = TRIM(UPPER(?))',
                [$kodeRuangan]
            )
            ->whereRaw('TRIM(LOWER(status)) = ?', ['pending'])
            ->count();
    }

        // RECENT TRANSACTION
        $recent = DB::table('penerimaan_logistik')
            ->where('kode_ruangan', $kodeRuangan)
            ->orderByDesc('created_at')
            ->limit(6)
            ->get()
            ->map(fn ($row) => [
                'id'       => $row->id_penerimaan ?? null,   
                'type'     => 'masuk',
                'item'     => $row->nama_barang ?? '-',
                'quantity' => $row->jumlah ?? 0,
                'time'     => date('Y-m-d', strtotime($row->created_at ?? now())),
                'status'   => 'selesai',
            ]);

        // RETURN RESPONSE
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


public function itemHistory(Request $request)
{
    $user = $request->user();

    $start = $request->start;
    $end   = $request->end;
    $kodeBarang = $request->barang;
    $labFilter  = $request->lab;

    $isSuperAdmin = $user->role === 'superadmin';

    // Ambil lab admin
    $labUser = DB::table('master_lab')
        ->where('kode_bagian', $user->kode_bagian)
        ->first();

    $kodeRuanganAdmin = $labUser
        ? strtoupper(trim($labUser->kode_ruangan))
        : null;

    // ================= PENERIMAAN =================
    $masuk = DB::table('penerimaan_logistik')
        ->whereBetween('created_at', [$start, $end])
        ->when($kodeBarang, fn ($q) =>
            $q->where('kode_barang', $kodeBarang)
        )
        ->when(!$isSuperAdmin, fn ($q) =>
            $q->where('kode_ruangan', $kodeRuanganAdmin)
        )
        ->when($isSuperAdmin && $labFilter, fn ($q) =>
            $q->where('kode_ruangan', $labFilter)
        )
        ->selectRaw("
            created_at as tanggal,
            nama_barang as barang,
            'Penerimaan' as aktivitas,
            jumlah as qty,
            'Pengadaan' as keterangan,
            kode_ruangan as lab
        ");

    // ================= PENGGUNAAN =================
    $keluar = DB::table('penggunaan_barang')
        ->whereBetween('created_at', [$start, $end])
        ->when($kodeBarang, fn ($q) =>
            $q->where('kode_barang', $kodeBarang)
        )
        ->when(!$isSuperAdmin, fn ($q) =>
            $q->where('kode_ruangan', $kodeRuanganAdmin)
        )
        ->when($isSuperAdmin && $labFilter, fn ($q) =>
            $q->where('kode_ruangan', $labFilter)
        )
        ->selectRaw("
            created_at as tanggal,
            nama_barang as barang,
            'Penggunaan' as aktivitas,
            -jumlah as qty,
            keterangan,
            kode_ruangan as lab
        ");

    // ================= TRANSFER =================
    $transfer = DB::table('transfer_barang')
        ->whereBetween('created_at', [$start, $end])
        ->when($kodeBarang, fn ($q) =>
            $q->where('kode_barang', $kodeBarang)
        )
        ->when(!$isSuperAdmin, fn ($q) =>
            $q->where('kode_ruangan_tujuan', $kodeRuanganAdmin)
        )
        ->when($isSuperAdmin && $labFilter, fn ($q) =>
            $q->where('kode_ruangan_tujuan', $labFilter)
        )
        ->selectRaw("
            created_at as tanggal,
            nama_barang as barang,
            'Transfer Masuk' as aktivitas,
            quantity as qty,
            CONCAT('Dari ', kode_ruangan_dari) as keterangan,
            kode_ruangan_tujuan as lab
        ");

    // ================= GABUNGKAN =================
    $data = $masuk
        ->unionAll($keluar)
        ->unionAll($transfer)
        ->orderBy('tanggal', 'asc')
        ->get();

    return response()->json([
        'role' => $user->role,
        'data' => $data
    ]);
}


}
