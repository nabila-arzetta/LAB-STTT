<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PermintaanLogistikController extends Controller
{
    // ============================
    // LIST PERMINTAAN
    // ============================
    public function index(Request $request)
    {
        $user = $request->user();

        $query = DB::table('permintaan_logistik as p')
            ->join('master_lab as ml', 'ml.kode_ruangan', '=', 'p.kode_ruangan')
            ->select(
                'p.id_permintaan',
                'p.kode_ruangan',
                'ml.nama_lab',
                'p.tanggal',
                'p.keterangan',
                'p.status',
                'p.created_at'
            )
            ->orderBy('p.created_at', 'desc');

        // ADMIN LAB hanya lihat lab sendiri
        if ($user->role === 'admin_lab') {
            $query->whereIn('p.kode_ruangan', function ($q) use ($user) {
                $q->select('kode_ruangan')
                ->from('master_lab')
                ->where('kode_bagian', $user->kode_bagian);
            });

        }

        $headers = $query->get();

        $result = $headers->map(function ($h) {
            $detail = DB::table('permintaan_logistik_detail as d')
                ->join('master_barang as mb', 'mb.kode_barang', '=', 'd.kode_barang')
                ->where('d.id_permintaan', $h->id_permintaan)
                ->select(
                    'd.kode_barang',
                    'd.qty_diminta',
                    'd.qty_dikirim',
                    'd.qty_diterima',
                    'mb.nama_barang',
                    'mb.satuan'
                )
                ->get()
                ->map(function ($d) {
                    return [
                        'kode_barang' => $d->kode_barang,
                        'qty_diminta' => $d->qty_diminta,
                        'qty_dikirim' => $d->qty_dikirim,
                        'qty_diterima' => $d->qty_diterima,
                        'barang' => [
                            'kode_barang' => $d->kode_barang,
                            'nama_barang' => $d->nama_barang,
                            'satuan' => $d->satuan,
                        ],
                    ];
                });

            return [
                'id_permintaan' => $h->id_permintaan,
                'kode_ruangan'  => $h->kode_ruangan,
                'nama_lab'      => $h->nama_lab,
                'tanggal'       => $h->tanggal,
                'keterangan'    => $h->keterangan,
                'status'        => $h->status,
                'detail'        => $detail,
            ];
        });

        return response()->json(['success' => true, 'data' => $result]);
    }


    // ============================
    // ADMIN LAB → BUAT PERMINTAAN
    // ============================
    public function store(Request $request)
    {
        $request->validate([
            'kode_ruangan' => 'required',
            'tanggal' => 'required|date',
            'detail' => 'required|array|min:1',
            'detail.*.kode_barang' => 'required',
            'detail.*.qty_diminta' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();

        try {
            $id = DB::table('permintaan_logistik')->insertGetId([
                'kode_ruangan' => $request->kode_ruangan,
                'tanggal' => $request->tanggal,
                'keterangan' => $request->keterangan,
                'status' => 'menunggu',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($request->detail as $d) {
                DB::table('permintaan_logistik_detail')->insert([
                    'id_permintaan' => $id,
                    'kode_barang' => $d['kode_barang'],
                    'qty_diminta' => $d['qty_diminta'],
                    'qty_dikirim' => null,
                    'qty_diterima' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::commit();
            return response()->json(['success' => true]);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // ============================
    // LOGISTIK → KIRIM
    // ============================
    public function kirim(Request $request, $id)
    {
        $request->validate([
            'detail' => 'required|array|min:1',
            'detail.*.kode_barang' => 'required',
            'detail.*.qty_dikirim' => 'required|integer|min:0',
        ]);

        DB::beginTransaction();

        try {
            foreach ($request->detail as $d) {
                DB::table('permintaan_logistik_detail')
                    ->where('id_permintaan', $id)
                    ->where('kode_barang', $d['kode_barang'])
                    ->update([
                        'qty_dikirim' => $d['qty_dikirim'],
                        'updated_at' => now(),
                    ]);
            }

            DB::table('permintaan_logistik')
                ->where('id_permintaan', $id)
                ->update([
                    'status' => 'dikirim',
                    'updated_at' => now()
                ]);

            DB::commit();
            return response()->json(['success' => true]);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'tanggal' => 'required|date',
            'keterangan' => 'nullable|string',
            'detail' => 'required|array|min:1',
            'detail.*.kode_barang' => 'required',
            'detail.*.qty_diminta' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();

        try {
            $permintaan = DB::table('permintaan_logistik')
                ->where('id_permintaan', $id)
                ->first();

            if (!$permintaan) {
                return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
            }

            // Hanya bisa edit jika masih menunggu
            if ($permintaan->status !== 'menunggu') {
                return response()->json(['success' => false, 'message' => 'Permintaan tidak dapat diedit'], 400);
            }

            DB::table('permintaan_logistik')
                ->where('id_permintaan', $id)
                ->update([
                    'tanggal' => $request->tanggal,
                    'keterangan' => $request->keterangan,
                    'updated_at' => now(),
                ]);

            // hapus detail lama
            DB::table('permintaan_logistik_detail')
                ->where('id_permintaan', $id)
                ->delete();

            // insert detail baru
            foreach ($request->detail as $d) {
                DB::table('permintaan_logistik_detail')->insert([
                    'id_permintaan' => $id,
                    'kode_barang' => $d['kode_barang'],
                    'qty_diminta' => $d['qty_diminta'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::commit();
            return response()->json(['success' => true]);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $permintaan = DB::table('permintaan_logistik')
            ->where('id_permintaan', $id)
            ->first();

        if (!$permintaan) {
            return response()->json(['success' => false, 'message' => 'Tidak ditemukan'], 404);
        }

        if ($permintaan->status !== 'menunggu') {
            return response()->json(['success' => false, 'message' => 'Tidak dapat menghapus, status sudah tidak menunggu'], 400);
        }

        DB::table('permintaan_logistik_detail')
            ->where('id_permintaan', $id)
            ->delete();

        DB::table('permintaan_logistik')
            ->where('id_permintaan', $id)
            ->delete();

        return response()->json(['success' => true]);
    }

    // ============================
    // ADMIN LAB → ACC & PINDAH KE PENERIMAAN
    // ============================
    public function acc(Request $request, $id)
    {
        $request->validate([
            'detail' => 'required|array|min:1',
            'detail.*.kode_barang' => 'required',
            'detail.*.qty_diterima' => 'required|integer|min:0',
        ]);

        DB::beginTransaction();

        try {
            $permintaan = DB::table('permintaan_logistik')
                ->where('id_permintaan', $id)
                ->first();

            $ket = trim($permintaan->keterangan ?? "");

            if ($ket !== "") {
                $keteranganPenerimaan = "Dari Logistik - " . $ket;
            } else {
                $keteranganPenerimaan = "Dari Logistik";
            }

            // Buat header penerimaan
            $idPenerimaan = DB::table('penerimaan_logistik')->insertGetId([
                'kode_ruangan' => $permintaan->kode_ruangan,
                'tanggal'      => now()->toDateString(),
                'keterangan'   => $keteranganPenerimaan,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);

            // Simpan detail penerimaan + update qty_diterima
            foreach ($request->detail as $d) {

                DB::table('permintaan_logistik_detail')
                    ->where('id_permintaan', $id)
                    ->where('kode_barang', $d['kode_barang'])
                    ->update([
                        'qty_diterima' => $d['qty_diterima'],
                        'updated_at'   => now(),
                    ]);

                DB::table('penerimaan_logistik_detail')->insert([
                    'id_penerimaan' => $idPenerimaan,
                    'kode_barang'   => $d['kode_barang'],
                    'quantity'      => $d['qty_diterima'],
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);
            }

            DB::table('permintaan_logistik')
                ->where('id_permintaan', $id)
                ->update([
                    'status'     => 'selesai',
                    'updated_at' => now(),
                ]);

            DB::commit();
            return response()->json(['success' => true]);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

}
