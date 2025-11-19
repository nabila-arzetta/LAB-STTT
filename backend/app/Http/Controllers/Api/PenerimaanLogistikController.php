<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PenerimaanLogistikController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Query awal
        $headers = DB::table('penerimaan_logistik AS pl')
            ->join('master_lab AS ml', 'ml.kode_ruangan', '=', 'pl.kode_ruangan')
            ->select(
                'pl.id_penerimaan',
                'pl.kode_ruangan',
                'ml.nama_lab',
                'pl.tanggal',
                'pl.keterangan',
                'pl.created_at'
            )
            ->orderBy('pl.created_at', 'desc');

        // FILTER ADMIN LAB
        if ($user->role === 'admin_lab') {
            $headers->whereIn('pl.kode_ruangan', function($q) use ($user) {
                $q->select('kode_ruangan')
                  ->from('master_lab')
                  ->where('kode_bagian', $user->kode_bagian);
            });
        }

        // Ambil header
        $headers = $headers->get();

        // Tambah detail untuk tiap header
        $result = $headers->map(function ($h) {
            $detail = DB::table('penerimaan_logistik_detail AS d')
                ->join('master_barang AS mb', 'mb.kode_barang', '=', 'd.kode_barang')
                ->where('d.id_penerimaan', $h->id_penerimaan)
                ->select(
                    'd.kode_barang',
                    'mb.nama_barang',
                    'mb.satuan',
                    'd.quantity'
                )
                ->get();

            return [
                'id_penerimaan' => $h->id_penerimaan,
                'kode_ruangan'  => $h->kode_ruangan,
                'nama_lab'      => $h->nama_lab,
                'tanggal'       => $h->tanggal,
                'keterangan'    => $h->keterangan,
                'created_at'    => $h->created_at,
                'detail'        => $detail,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode_ruangan' => 'required|string',
            'tanggal'      => 'required|date',
            'keterangan'   => 'nullable|string',
            'detail'       => 'required|array|min:1',
            'detail.*.kode_barang' => 'required|string',
            'detail.*.quantity'    => 'required|integer|min:1',
        ]);

        DB::beginTransaction();

        try {
            $idPenerimaan = DB::table('penerimaan_logistik')->insertGetId([
                'kode_ruangan' => $request->kode_ruangan,
                'tanggal'      => $request->tanggal,
                'keterangan'   => $request->keterangan,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);

            foreach ($request->detail as $item) {
                DB::table('penerimaan_logistik_detail')->insert([
                    'id_penerimaan' => $idPenerimaan,
                    'kode_barang'   => $item['kode_barang'],
                    'quantity'      => $item['quantity'],
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Penerimaan logistik berhasil dicatat.',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $header = DB::table('penerimaan_logistik')->where('id_penerimaan', $id)->first();
        if (!$header) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan.'
            ], 404);
        }

        $detail = DB::table('penerimaan_logistik_detail AS d')
            ->join('master_barang AS mb', 'mb.kode_barang', '=', 'd.kode_barang')
            ->where('d.id_penerimaan', $id)
            ->select(
                'd.kode_barang',
                'mb.nama_barang',
                'mb.satuan',
                'd.quantity'
            )
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'header' => $header,
                'detail' => $detail
            ]
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'tanggal' => 'required|date',
            'keterangan' => 'nullable|string',
            'detail' => 'required|array|min:1',
            'detail.*.kode_barang' => 'required|string',
            'detail.*.quantity' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();

        try {

            // Pastikan header ada
            $header = DB::table('penerimaan_logistik')->where('id_penerimaan', $id)->first();
            if (!$header) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data tidak ditemukan.'
                ], 404);
            }

            // UPDATE HEADER
            DB::table('penerimaan_logistik')
                ->where('id_penerimaan', $id)
                ->update([
                    'tanggal' => $request->tanggal,
                    'keterangan' => $request->keterangan,
                    'updated_at' => now(),
                ]);

            // HAPUS DETAIL LAMA
            DB::table('penerimaan_logistik_detail')->where('id_penerimaan', $id)->delete();

            // INSERT DETAIL BARU
            foreach ($request->detail as $item) {
                DB::table('penerimaan_logistik_detail')->insert([
                    'id_penerimaan' => $id,
                    'kode_barang' => $item['kode_barang'],
                    'quantity' => $item['quantity'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Penerimaan logistik berhasil diperbarui.',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }


    public function destroy($id)
    {
        DB::beginTransaction();

        try {
            DB::table('penerimaan_logistik_detail')->where('id_penerimaan', $id)->delete();
            DB::table('penerimaan_logistik')->where('id_penerimaan', $id)->delete();

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Penerimaan berhasil dihapus.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
