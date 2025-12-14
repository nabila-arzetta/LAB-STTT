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

        $headers = DB::table('penerimaan_logistik as pl')
            ->join('master_lab as ml', 'ml.kode_ruangan', '=', 'pl.kode_ruangan')
            ->select(
                'pl.id_penerimaan',
                'pl.kode_ruangan',
                'ml.nama_lab',
                'pl.tanggal',
                'pl.keterangan',
                'pl.created_at'
            )
            ->orderBy('pl.created_at', 'desc');

        if ($user->role === 'admin_lab') {
            $headers->whereIn('pl.kode_ruangan', function ($q) use ($user) {
                $q->select('kode_ruangan')
                ->from('master_lab')
                ->where('kode_bagian', $user->kode_bagian);
            });
        }

        $headers = $headers->get();

        $result = $headers->map(function ($h) {
            $detail = DB::table('penerimaan_logistik_detail as d')
                ->join('master_barang as mb', 'mb.kode_barang', '=', 'd.kode_barang')
                ->where('d.id_penerimaan', $h->id_penerimaan)
                ->select(
                    'd.kode_barang',
                    'd.quantity',
                    'mb.nama_barang',
                    'mb.satuan'
                )
                ->get()
                ->map(function ($d) {
                    return [
                        'kode_barang' => $d->kode_barang,
                        'quantity'    => $d->quantity,
                        'barang' => [
                            'kode_barang' => $d->kode_barang,
                            'nama_barang' => $d->nama_barang,
                            'satuan'      => $d->satuan,
                        ]
                    ];
                });

            return [
                'id_penerimaan' => $h->id_penerimaan,
                'kode_ruangan'  => $h->kode_ruangan,
                'nama_lab'      => $h->nama_lab,
                'tanggal'       => $h->tanggal,
                'keterangan'    => $h->keterangan,
                'detail'        => $detail,
            ];
        });

        return response()->json(['success' => true, 'data' => $result]);
    }


    // CREATE MANUAL (OPSIONAL)
    public function store(Request $request)
    {
        DB::beginTransaction();

        try {
            $id = DB::table('penerimaan_logistik')->insertGetId([
                'kode_ruangan' => $request->kode_ruangan,
                'tanggal' => $request->tanggal,
                'keterangan' => $request->keterangan,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($request->detail as $d) {
                DB::table('penerimaan_logistik_detail')->insert([
                    'id_penerimaan' => $id,
                    'kode_barang' => $d['kode_barang'],
                    'quantity' => $d['quantity'],
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
        DB::table('penerimaan_logistik_detail')
            ->where('id_penerimaan', $id)
            ->delete();

        DB::table('penerimaan_logistik')
            ->where('id_penerimaan', $id)
            ->delete();

        return response()->json(['success' => true]);
    }
}
