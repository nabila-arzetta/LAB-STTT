<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PenggunaanBarangController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $isSuper = $user->role === 'superadmin';

        $query = DB::table('penggunaan_barang as p')
            ->select('p.*', 'ml.nama_lab', 'ml.kode_bagian')
            ->leftJoin('master_lab as ml', 'ml.kode_ruangan', '=', 'p.kode_ruangan')
            ->orderByDesc('p.id_penggunaan');

        if (!$isSuper) {
            $query->where('ml.kode_bagian', $user->kode_bagian);
        }

        $penggunaan = $query->get();

        $detail = DB::table('penggunaan_barang_detail')->get();

        $barang = DB::table('master_barang')
            ->select('kode_barang', 'nama_barang', 'satuan', 'kategori')
            ->get()
            ->keyBy('kode_barang');

        $result = $penggunaan->map(function ($p) use ($detail, $barang) {
            $p->detail = $detail
                ->where('id_penggunaan', $p->id_penggunaan)
                ->map(function ($d) use ($barang) {
                    $d->barang = $barang->get($d->kode_barang);
                    return $d;
                })
                ->values();
            return $p;
        });

        return response()->json(['data' => $result]);
    }


    // CREATE PENGGUNAAN
    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'admin_lab') {
            return response()->json(['message' => 'Superadmin tidak dapat membuat penggunaan'], 403);
        }

        $validated = $request->validate([
            'kode_ruangan'          => 'required|string',
            'tanggal'               => 'required|date',
            'keterangan'            => 'nullable|string',
            'detail'                => 'required|array|size:1',
            'detail.*.kode_barang'  => 'required|integer|exists:master_barang,kode_barang',
            'detail.*.quantity'     => 'required|integer|min:1',
        ]);

        $labUser = DB::table('master_lab')
            ->where('kode_bagian', $user->kode_bagian)
            ->first();

        if (
            !$labUser ||
            strtoupper($validated['kode_ruangan']) !== strtoupper($labUser->kode_ruangan)
        ) {
            return response()->json(['message' => 'Tidak dapat membuat penggunaan untuk lab lain'], 403);
        }

        DB::beginTransaction();

        try {
            $id = DB::table('penggunaan_barang')->insertGetId([
                'kode_ruangan' => strtoupper($validated['kode_ruangan']),
                'tanggal'      => $validated['tanggal'],
                'keterangan'   => $validated['keterangan'] ?? null,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);

            foreach ($validated['detail'] as $item) {

                $stok = $this->getStok($validated['kode_ruangan'], $item['kode_barang']);

                if ($stok < $item['quantity']) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'Stok tidak mencukupi untuk penggunaan',
                        'detail' => [
                            'kode_barang' => $item['kode_barang'],
                            'stok_tersedia' => $stok,
                            'diminta' => $item['quantity'],
                        ]
                    ], 422);
                }

                DB::table('penggunaan_barang_detail')->insert([
                    'id_penggunaan' => $id,
                    'kode_barang'   => $item['kode_barang'],
                    'quantity'      => $item['quantity'],
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Penggunaan berhasil diajukan']);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // EDIT PENGGUNAAN
    public function update(Request $request, $id)
    {
        $user = $request->user();

        if ($user->role !== 'admin_lab') {
            return response()->json(['message' => 'Superadmin tidak dapat mengubah penggunaan'], 403);
        }

        $penggunaan = DB::table('penggunaan_barang')
            ->where('id_penggunaan', $id)
            ->first();

        if (!$penggunaan) {
            return response()->json(['message' => 'Tidak ditemukan'], 404);
        }

        // Pastikan lab sama
        $labUser = DB::table('master_lab')
            ->where('kode_bagian', $user->kode_bagian)
            ->first();

        if (
            !$labUser ||
            strtoupper($labUser->kode_ruangan) !== strtoupper($penggunaan->kode_ruangan)
        ) {
            return response()->json(['message' => 'Tidak boleh mengubah penggunaan lab lain'], 403);
        }

        $validated = $request->validate([
            'tanggal'               => 'required|date',
            'keterangan'            => 'nullable|string',
            'detail'                => 'required|array|min:1',
            'detail.*.kode_barang'  => 'required|integer|exists:master_barang,kode_barang',
            'detail.*.quantity'     => 'required|integer|min:1',
        ]);

        DB::beginTransaction();

        try {
            DB::table('penggunaan_barang')
                ->where('id_penggunaan', $id)
                ->update([
                    'tanggal'    => $validated['tanggal'],
                    'keterangan' => $validated['keterangan'] ?? null,
                    'updated_at' => now(),
                ]);

            DB::table('penggunaan_barang_detail')
                ->where('id_penggunaan', $id)
                ->delete();

            foreach ($validated['detail'] as $item) {

                $stok = $this->getStok($penggunaan->kode_ruangan, $item['kode_barang']);

                if ($stok < $item['quantity']) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'Stok tidak mencukupi untuk penggunaan',
                        'detail' => [
                            'kode_barang' => $item['kode_barang'],
                            'stok_tersedia' => $stok,
                            'diminta' => $item['quantity'],
                        ]
                    ], 422);
                }

                DB::table('penggunaan_barang_detail')->insert([
                    'id_penggunaan' => $id,
                    'kode_barang'   => $item['kode_barang'],
                    'quantity'      => $item['quantity'],
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Penggunaan berhasil diperbarui']);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // DELETE PENGGUNAAN
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        if ($user->role !== 'admin_lab') {
            return response()->json(['message' => 'Superadmin tidak dapat menghapus penggunaan'], 403);
        }

        $penggunaan = DB::table('penggunaan_barang')
            ->where('id_penggunaan', $id)
            ->first();

        if (!$penggunaan) {
            return response()->json(['message' => 'Tidak ditemukan'], 404);
        }

        $labUser = DB::table('master_lab')
            ->where('kode_bagian', $user->kode_bagian)
            ->first();

        if (
            !$labUser ||
            strtoupper($penggunaan->kode_ruangan) !== strtoupper($labUser->kode_ruangan)
        ) {
            return response()->json(['message' => 'Tidak dapat menghapus penggunaan lab lain'], 403);
        }

        DB::table('penggunaan_barang_detail')
            ->where('id_penggunaan', $id)
            ->delete();

        DB::table('penggunaan_barang')
            ->where('id_penggunaan', $id)
            ->delete();

        return response()->json(['message' => 'Penggunaan dihapus']);
    }

    private function getStok($kode_ruangan, $kode_barang)
    {
        return DB::table('view_stok_inventaris')
            ->where('kode_ruangan', strtoupper($kode_ruangan))
            ->where('kode_barang', $kode_barang)
            ->value('stok_akhir') ?? 0;
    }
}