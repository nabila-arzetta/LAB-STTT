<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransferBarangController extends Controller
{
    /**
     * GET /api/transfer-barang
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        // Lab user
        $labUser = DB::table('master_lab')
            ->where('kode_bagian', $user->kode_bagian)
            ->first();

        if (!$labUser) {
            $prefix = strtoupper(explode('_', $user->username)[0]);
            $labUser = DB::table('master_lab')->where('kode_ruangan', 'L-'.$prefix)->first();
        }

        // Query utama
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

        // admin_lab hanya melihat transfer terkait lab-nya
        if ($user->role === 'admin_lab' && $labUser) {
            $kode = strtoupper($labUser->kode_ruangan);
            $query->where(function ($q) use ($kode) {
                $q->where('t.kode_ruangan_dari', $kode)
                  ->orWhere('t.kode_ruangan_tujuan', $kode);
            });
        }

        $transfers = $query->get();

        // Detail
        if ($transfers->count()) {
            $ids = $transfers->pluck('id_transfer');

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

            $transfers->transform(function ($t) use ($details) {
                $t->detail = $details->get($t->id_transfer, collect())->map(function ($d) {
                    return [
                        'kode_barang' => $d->kode_barang,
                        'nama_barang' => $d->nama_barang,
                        'satuan'      => $d->satuan,
                        'quantity'    => $d->quantity,
                        'qty_approved'=> $d->qty_approved,
                    ];
                })->values();
                return $t;
            });
        }

        return response()->json(['success'=>true,'data'=>$transfers]);
    }

    /**
     * POST /api/transfer-barang
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message'=>'Unauthenticated'],401);
        if ($user->role !== 'admin_lab') return response()->json(['message'=>'Forbidden'],403);

        // Validasi
        $validated = $request->validate([
            'kode_ruangan_tujuan' => 'required|string',
            'tanggal'             => 'required|date',
            'keterangan'          => 'nullable|string',
            'detail'              => 'required|array|min:1',
            'detail.*.kode_barang'=> 'required|string',
            'detail.*.quantity'   => 'required|integer|min:1',
        ]);

        // Ambil lab user
        $labUser = DB::table('master_lab')->where('kode_bagian',$user->kode_bagian)->first();
        if (!$labUser) return response()->json(['message'=>'User tidak memiliki lab'],403);

        DB::beginTransaction();
        try {
            $id = DB::table('transfer_barang')->insertGetId([
                'kode_ruangan_dari'   => $labUser->kode_ruangan,
                'kode_ruangan_tujuan' => strtoupper($validated['kode_ruangan_tujuan']),
                'tanggal'             => $validated['tanggal'],
                'keterangan'          => $validated['keterangan'] ?? null,
                'status'              => 'pending',
                'created_at'          => now(),
                'updated_at'          => now(),
            ]);

            foreach ($validated['detail'] as $d) {
                DB::table('transfer_barang_detail')->insert([
                    'id_transfer'  => $id,
                    'kode_barang'  => $d['kode_barang'],
                    'quantity'     => $d['quantity'],
                    'qty_approved' => null,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);
            }

            DB::commit();
            return response()->json(['success'=>true,'message'=>'Transfer berhasil dibuat']);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success'=>false,'error'=>$e->getMessage()],500);
        }
    }

    /**
     * PUT /api/transfer-barang/{id}
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'admin_lab')
            return response()->json(['message'=>'Unauthorized'],403);

        $transfer = DB::table('transfer_barang')->where('id_transfer',$id)->first();
        if (!$transfer) return response()->json(['message'=>'Transfer tidak ditemukan'],404);

        if ($transfer->status !== 'pending')
            return response()->json(['message'=>'Transfer tidak dapat diedit'],422);

        $validated = $request->validate([
            'kode_ruangan_tujuan' => 'required|string',
            'tanggal'             => 'required|date',
            'keterangan'          => 'nullable|string',
            'detail'              => 'required|array|min:1',
            'detail.*.kode_barang'=> 'required|string',
            'detail.*.quantity'   => 'required|integer|min:1',
        ]);

        DB::beginTransaction();
        try {
            DB::table('transfer_barang')->where('id_transfer',$id)->update([
                'kode_ruangan_tujuan'=> strtoupper($validated['kode_ruangan_tujuan']),
                'tanggal'            => $validated['tanggal'],
                'keterangan'         => $validated['keterangan'] ?? null,
                'updated_at'         => now(),
            ]);

            DB::table('transfer_barang_detail')->where('id_transfer',$id)->delete();

            foreach ($validated['detail'] as $d) {
                DB::table('transfer_barang_detail')->insert([
                    'id_transfer'  => $id,
                    'kode_barang'  => $d['kode_barang'],
                    'quantity'     => $d['quantity'],
                    'qty_approved' => null,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);
            }

            DB::commit();
            return response()->json(['success'=>true,'message'=>'Transfer diperbarui']);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success'=>false,'error'=>$e->getMessage()],500);
        }
    }

    /**
     * DELETE /api/transfer-barang/{id}
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'admin_lab')
            return response()->json(['message'=>'Unauthorized'],403);

        $transfer = DB::table('transfer_barang')->where('id_transfer',$id)->first();
        if (!$transfer) return response()->json(['message'=>'Transfer tidak ditemukan'],404);

        if ($transfer->status !== 'pending')
            return response()->json(['message'=>'Tidak bisa menghapus, transfer sudah diproses'],422);

        DB::beginTransaction();
        try {
            DB::table('transfer_barang_detail')->where('id_transfer',$id)->delete();
            DB::table('transfer_barang')->where('id_transfer',$id)->delete();

            DB::commit();
            return response()->json(['success'=>true,'message'=>'Transfer dihapus']);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success'=>false,'error'=>$e->getMessage()],500);
        }
    }

    /**
     * POST /api/transfer-barang/{id}/approve
     * ACC oleh lab tujuan
     */
    public function approve(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'admin_lab')
            return response()->json(['message'=>'Unauthorized'],403);

        $transfer = DB::table('transfer_barang')->where('id_transfer',$id)->first();
        if (!$transfer) return response()->json(['message'=>'Transfer tidak ditemukan'],404);

        // cek bahwa user adalah lab tujuan
        $labUser = DB::table('master_lab')->where('kode_bagian',$user->kode_bagian)->first();
        if (!$labUser || strtoupper($labUser->kode_ruangan) !== strtoupper($transfer->kode_ruangan_tujuan))
            return response()->json(['message'=>'Anda bukan lab tujuan'],403);

        if ($transfer->status !== 'pending')
            return response()->json(['message'=>'Transfer sudah diproses'],422);

        $validated = $request->validate([
            'detail'                 => 'required|array|min:1',
            'detail.*.kode_barang'   => 'required|string',
            'detail.*.qty_approved'  => 'required|integer|min:0',
        ]);

        DB::beginTransaction();
        try {
            $allZero = true;
            $allFull = true;

            foreach ($validated['detail'] as $d) {
                $qty = (int)$d['qty_approved'];
                $kodeBarang = $d['kode_barang'];

                // cek apakah full approve atau sebagian
                $requestedQty = DB::table('transfer_barang_detail')
                    ->where('id_transfer',$id)
                    ->where('kode_barang',$kodeBarang)
                    ->value('quantity');

                if ($qty > 0) $allZero = false;
                if ($qty < $requestedQty) $allFull = false;

                // update detail
                DB::table('transfer_barang_detail')
                    ->where('id_transfer',$id)
                    ->where('kode_barang',$kodeBarang)
                    ->update(['qty_approved'=>$qty]);

                if ($qty > 0) {
                    // kurangi stok lab asal
                    DB::table('inventaris')
                        ->where('kode_ruangan',$transfer->kode_ruangan_dari)
                        ->where('kode_barang',$kodeBarang)
                        ->decrement('stok_akhir',$qty);

                    // tambah stok lab tujuan
                    $exists = DB::table('inventaris')
                        ->where('kode_ruangan',$transfer->kode_ruangan_tujuan)
                        ->where('kode_barang',$kodeBarang)
                        ->exists();

                    if ($exists) {
                        DB::table('inventaris')
                            ->where('kode_ruangan',$transfer->kode_ruangan_tujuan)
                            ->where('kode_barang',$kodeBarang)
                            ->increment('stok_akhir',$qty);
                    } else {
                        DB::table('inventaris')->insert([
                            'kode_ruangan'=>$transfer->kode_ruangan_tujuan,
                            'kode_barang'=>$kodeBarang,
                            'stok_akhir'=>$qty
                        ]);
                    }
                }
            }

            // tentukan status
            if ($allZero) {
                $status = 'rejected';
            } elseif ($allFull) {
                $status = 'approved';
            } else {
                $status = 'partial_approved';
            }

            DB::table('transfer_barang')->where('id_transfer',$id)->update([
                'status'      => $status,
                'approved_by' => $user->id,
                'approved_at' => now(),
                'updated_at'  => now(),
            ]);

            DB::commit();
            return response()->json(['success'=>true,'status'=>$status,'message'=>'Transfer di-ACC']);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success'=>false,'error'=>$e->getMessage()],500);
        }
    }

    /**
     * POST /api/transfer-barang/{id}/reject
     */
    public function reject(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'admin_lab')
            return response()->json(['message'=>'Unauthorized'],403);

        $transfer = DB::table('transfer_barang')->where('id_transfer',$id)->first();
        if (!$transfer) return response()->json(['message'=>'Transfer tidak ditemukan'],404);

        $labUser = DB::table('master_lab')->where('kode_bagian',$user->kode_bagian)->first();
        if (!$labUser || strtoupper($labUser->kode_ruangan) !== strtoupper($transfer->kode_ruangan_tujuan))
            return response()->json(['message'=>'Anda bukan lab tujuan'],403);

        if ($transfer->status !== 'pending')
            return response()->json(['message'=>'Transfer sudah diproses'],422);

        DB::beginTransaction();
        try {
            DB::table('transfer_barang_detail')
                ->where('id_transfer',$id)
                ->update([
                    'qty_approved'=>0,
                    'updated_at'=>now(),
                ]);

            DB::table('transfer_barang')
                ->where('id_transfer',$id)
                ->update([
                    'status'=>'rejected',
                    'approved_by'=>$user->id,
                    'approved_at'=>now(),
                    'updated_at'=>now(),
                ]);

            DB::commit();
            return response()->json(['success'=>true,'message'=>'Transfer ditolak']);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success'=>false,'error'=>$e->getMessage()],500);
        }
    }
}
