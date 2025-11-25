<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransferBarangController extends Controller
{
    /**
     * GET /api/transfer-barang
     * superadmin: semua
     * admin_lab : hanya transfer yang terkait lab-nya (dari/ke)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // cari lab yang dimiliki user (berdasarkan kode_bagian)
        $labUser = DB::table('master_lab')
            ->where('kode_bagian', $user->kode_bagian)
            ->first();

        if (!$labUser) {
            $prefix = strtoupper(explode('_', $user->username)[0]); // kmp_admin -> KMP
            $kodeRuanganGuess = 'L-' . $prefix;

            $labUser = DB::table('master_lab')
                ->where('kode_ruangan', $kodeRuanganGuess)
                ->first();
        }

        $query = DB::table('transfer_barang as t')
            ->leftJoin('master_lab as l1', 'l1.kode_ruangan', '=', 't.kode_ruangan_dari')
            ->leftJoin('master_lab as l2', 'l2.kode_ruangan', '=', 't.kode_ruangan_tujuan')
            ->select(
                't.id_transfer',
                't.kode_ruangan_dari',
                'l1.nama_lab as lab_asal',
                't.kode_ruangan_tujuan',
                'l2.nama_lab as lab_tujuan',
                't.tanggal',
                't.keterangan',
                't.status',
                't.created_at'
            )
            ->orderByDesc('t.id_transfer');

        // admin_lab hanya lihat yang berhubungan dengan lab-nya
        if ($user->role === 'admin_lab' && $labUser) {
            $kodeRuangan = strtoupper($labUser->kode_ruangan);

            $query->where(function ($q) use ($kodeRuangan) {
                $q->where('t.kode_ruangan_dari', $kodeRuangan)
                  ->orWhere('t.kode_ruangan_tujuan', $kodeRuangan);
            });
        }

        $transfers = $query->get();

        // ambil detail + info barang
        if ($transfers->count() > 0) {
            $ids = $transfers->pluck('id_transfer')->toArray();

            $details = DB::table('transfer_barang_detail as d')
                ->leftJoin('master_barang as b', 'b.kode_barang', '=', 'd.kode_barang')
                ->whereIn('d.id_transfer', $ids)
                ->select(
                    'd.id_transfer',
                    'd.kode_barang',
                    'b.nama_barang',
                    'b.satuan',
                    'd.quantity',
                    'd.qty_approved'
                )
                ->get()
                ->groupBy('id_transfer');

            $transfers = $transfers->map(function ($t) use ($details) {
                $rows = $details->get($t->id_transfer, collect());

                $t->detail = $rows->map(function ($row) {
                    return [
                        'kode_barang'  => $row->kode_barang,
                        'nama_barang'  => $row->nama_barang,
                        'satuan'       => $row->satuan,
                        'quantity'     => $row->quantity,     // diminta
                        'qty_approved' => $row->qty_approved, // disetujui
                    ];
                })->values();

                return $t;
            });
        } else {
            $transfers = $transfers->map(function ($t) {
                $t->detail = [];
                return $t;
            });
        }

        return response()->json([
            'success' => true,
            'data'    => $transfers,
        ]);
    }

    /**
     * POST /api/transfer-barang
     * Hanya admin_lab: membuat permintaan transfer (dari lab sendiri)
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->role !== 'admin_lab') {
            return response()->json(['message' => 'Hanya admin lab dapat membuat transfer'], 403);
        }

        $validated = $request->validate([
            // kode_ruangan_dari boleh tetap divalidasi, tapi kita tidak pakai nilainya
            'kode_ruangan_dari'    => 'required|string',
            'kode_ruangan_tujuan'  => 'required|string|different:kode_ruangan_dari',
            'tanggal'              => 'required|date',
            'keterangan'           => 'nullable|string',
            'detail'               => 'required|array|min:1',
            'detail.*.kode_barang' => 'required|string',
            'detail.*.quantity'    => 'required|integer|min:1',
        ]);

        // cari lab milik user (berdasarkan kode_bagian)
        $labUser = DB::table('master_lab')
            ->where('kode_bagian', $user->kode_bagian)
            ->first();

        if (!$labUser) {
            return response()->json([
                'message' => 'User tidak memiliki lab yang terdaftar'
            ], 403);
        }

        // PAKSA sumber transfer dari lab user sendiri
        $kodeRuanganDari = strtoupper($labUser->kode_ruangan);

        DB::beginTransaction();
        try {
            $id_transfer = DB::table('transfer_barang')->insertGetId([
                'kode_ruangan_dari'   => $kodeRuanganDari, // <-- pakai dari labUser
                'kode_ruangan_tujuan' => strtoupper($validated['kode_ruangan_tujuan']),
                'tanggal'             => $validated['tanggal'],
                'keterangan'          => $validated['keterangan'] ?? null,
                'status'              => 'pending',
                'created_at'          => now(),
                'updated_at'          => now(),
            ]);

            foreach ($validated['detail'] as $d) {
                DB::table('transfer_barang_detail')->insert([
                    'id_transfer'  => $id_transfer,
                    'kode_barang'  => $d['kode_barang'],
                    'quantity'     => $d['quantity'],
                    'qty_approved' => null,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transfer berhasil dibuat',
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat transfer',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/transfer-barang/{id}/approve
     * Lab tujuan meng-ACC (boleh ACC sebagian)
     */
    public function approve(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->role !== 'admin_lab') {
            return response()->json(['message' => 'Hanya admin lab dapat meng-ACC transfer'], 403);
        }

        $transfer = DB::table('transfer_barang')
            ->where('id_transfer', $id)
            ->first();

        if (!$transfer) {
            return response()->json(['message' => 'Transfer tidak ditemukan'], 404);
        }

        // cek bahwa user adalah lab tujuan
        $labUser = DB::table('master_lab')
            ->where('kode_bagian', $user->kode_bagian)
            ->first();

        if (
            !$labUser ||
            strtoupper($labUser->kode_ruangan) !== strtoupper($transfer->kode_ruangan_tujuan)
        ) {
            return response()->json(['message' => 'Anda bukan lab tujuan transfer ini'], 403);
        }

        if ($transfer->status !== 'pending') {
            return response()->json(['message' => 'Transfer tidak dalam status pending'], 422);
        }

        $validated = $request->validate([
            'detail'                 => 'required|array|min:1',
            'detail.*.kode_barang'   => 'required|string',
            'detail.*.qty_approved'  => 'required|integer|min:0',
        ]);

        $detailRows = DB::table('transfer_barang_detail')
            ->where('id_transfer', $id)
            ->get()
            ->keyBy('kode_barang');

        DB::beginTransaction();

        try {
            $allZero = true;
            $allFull = true;

            foreach ($validated['detail'] as $d) {

                $kodeBarang = $d['kode_barang'];
                $qtyApproved = (int) $d['qty_approved'];

                if ($qtyApproved <= 0) continue;

                // Kurangi stok di lab asal
                DB::table('inventaris')
                    ->where('kode_ruangan', $transfer->kode_ruangan_dari)
                    ->where('kode_barang', $kodeBarang)
                    ->decrement('stok_akhir', $qtyApproved);

                // Tambah stok di lab tujuan
                $exists = DB::table('inventaris')
                    ->where('kode_ruangan', $transfer->kode_ruangan_tujuan)
                    ->where('kode_barang', $kodeBarang)
                    ->exists();

                if ($exists) {
                    DB::table('inventaris')
                        ->where('kode_ruangan', $transfer->kode_ruangan_tujuan)
                        ->where('kode_barang', $kodeBarang)
                        ->increment('stok_akhir', $qtyApproved);
                } else {
                    DB::table('inventaris')->insert([
                        'kode_ruangan' => $transfer->kode_ruangan_tujuan,
                        'kode_barang' => $kodeBarang,
                        'stok_akhir' => $qtyApproved,
                    ]);
                }
            }

            // tentukan status baru
            if ($allZero) {
                $status = 'rejected';
            } elseif ($allFull) {
                $status = 'approved';
            } else {
                $status = 'partial_approved';
            }

            DB::table('transfer_barang')
                ->where('id_transfer', $id)
                ->update([
                    'status'      => $status,
                    'approved_by' => $user->id,
                    'approved_at' => now(),
                    'updated_at'  => now(),
                ]);

            // NOTE: di sini kamu bisa tambahkan logika update stok jika mau

            // ==========================
            // UPDATE STOK LAB ASAL & TUJUAN
            // ==========================
            foreach ($validated['detail'] as $d) {

                $kodeBarang = $d['kode_barang'];
                $qtyApproved = (int) $d['qty_approved'];

                if ($qtyApproved <= 0) continue;

                // kurangi stok lab asal
                DB::table('inventaris')
                    ->where('kode_ruangan', $transfer->kode_ruangan_dari)
                    ->where('kode_barang', $kodeBarang)
                    ->decrement('stok_akhir', $qtyApproved);

                // tambah stok lab tujuan
                $exists = DB::table('inventaris')
                    ->where('kode_ruangan', $transfer->kode_ruangan_tujuan)
                    ->where('kode_barang', $kodeBarang)
                    ->exists();

                if ($exists) {
                    DB::table('inventaris')
                        ->where('kode_ruangan', $transfer->kode_ruangan_tujuan)
                        ->where('kode_barang', $kodeBarang)
                        ->increment('stok_akhir', $qtyApproved);
                } else {
                    DB::table('inventaris')->insert([
                        'kode_ruangan' => $transfer->kode_ruangan_tujuan,
                        'kode_barang' => $kodeBarang,
                        'stok_akhir' => $qtyApproved,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transfer di-ACC',
                'status'  => $status,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Gagal meng-ACC transfer',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/transfer-barang/{id}/reject
     * Lab tujuan menolak permintaan
     */
    public function reject(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->role !== 'admin_lab') {
            return response()->json(['message' => 'Hanya admin lab dapat menolak transfer'], 403);
        }

        $transfer = DB::table('transfer_barang')
            ->where('id_transfer', $id)
            ->first();

        if (!$transfer) {
            return response()->json(['message' => 'Transfer tidak ditemukan'], 404);
        }

        $labUser = DB::table('master_lab')
            ->where('kode_ruangan', $user->kode_bagian) 
            ->orWhere('kode_bagian', $user->kode_bagian)
            ->first();

        if (
            !$labUser ||
            strtoupper($labUser->kode_ruangan) !== strtoupper($transfer->kode_ruangan_tujuan)
        ) {
            return response()->json(['message' => 'Anda bukan lab tujuan transfer ini'], 403);
        }

        if ($transfer->status !== 'pending') {
            return response()->json(['message' => 'Transfer tidak dalam status pending'], 422);
        }

        DB::beginTransaction();

        try {
            DB::table('transfer_barang_detail')
                ->where('id_transfer', $id)
                ->update([
                    'qty_approved' => 0,
                    'updated_at'   => now(),
                ]);

            DB::table('transfer_barang')
                ->where('id_transfer', $id)
                ->update([
                    'status'      => 'rejected',
                    'approved_by' => $user->id,
                    'approved_at' => now(),
                    'updated_at'  => now(),
                ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transfer ditolak',
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Gagal menolak transfer',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
