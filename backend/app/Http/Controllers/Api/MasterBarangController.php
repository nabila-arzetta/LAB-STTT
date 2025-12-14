<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MasterBarangController extends Controller
{
    // LIST SEMUA BARANG (GLOBAL)
    public function index(Request $request)
    {
        $query = DB::table('master_barang')
            ->select(
                'id',
                'kode_barang',
                'nama_barang',
                'deskripsi',
                'kategori',
                'satuan',
                'created_at',
                'updated_at'
            )
            ->orderBy('nama_barang', 'asc');

        // Pencarian
        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($qr) use ($q) {
                $qr->where('nama_barang', 'like', "%$q%")
                   ->orWhere('kode_barang', 'like', "%$q%");
            });
        }

        return response()->json([
            'data' => $query->get()
        ]);
    }

    // TAMPIL DETAIL
    public function show($id)
    {
        $barang = DB::table('master_barang')->where('id', $id)->first();

        if (!$barang) {
            return response()->json(['message' => 'Barang tidak ditemukan'], 404);
        }

        return response()->json(['data' => $barang]);
    }

    // TAMBAH BARANG (KODE_BARANG AUTO)
    public function store(Request $request)
    {
        $data = $request->validate([
            'nama_barang' => 'required|string|max:255|unique:master_barang,nama_barang',
            'satuan'      => 'nullable|string|max:50',
            'deskripsi'   => 'nullable|string',
            'kategori'    => 'nullable|string|max:50',
        ]);

        $lastKode = DB::table('master_barang')->max('kode_barang');
        $newKode  = ($lastKode ?? 0) + 1;

        $id = DB::table('master_barang')->insertGetId([
            'kode_barang' => $newKode, 
            'nama_barang' => $data['nama_barang'],
            'satuan'      => $data['satuan'] ?? 'unit',
            'deskripsi'   => $data['deskripsi'] ?? '',
            'kategori'    => $data['kategori'] ?? 'alat',
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        $barang = DB::table('master_barang')->where('id', $id)->first();

        return response()->json([
            'message' => 'Master barang berhasil ditambahkan',
            'data'    => $barang
        ], 201);
    }

    // UPDATE BARANG
    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'nama_barang' => 'required|string|max:255|unique:master_barang,nama_barang,' . $id,
            'satuan'      => 'nullable|string|max:50',
            'deskripsi'   => 'nullable|string',
            'kategori'    => 'nullable|string|max:50',
        ]);

        $exists = DB::table('master_barang')->where('id', $id)->exists();
        if (!$exists) {
            return response()->json(['message' => 'Barang tidak ditemukan'], 404);
        }

        DB::table('master_barang')
            ->where('id', $id)
            ->update([
                'nama_barang' => $data['nama_barang'],
                'satuan'      => $data['satuan'] ?? 'unit',
                'deskripsi'   => $data['deskripsi'] ?? '',
                'kategori'    => $data['kategori'] ?? 'alat',
                'updated_at'  => now(),
            ]);

        return response()->json(['message' => 'Barang berhasil diperbarui']);
    }

    // DELETE BARANG (AMAN KARENA FK RESTRICT)
    public function destroy($id)
    {
        try {
            $exists = DB::table('master_barang')->where('id', $id)->exists();
            if (!$exists) {
                return response()->json(['message' => 'Barang tidak ditemukan'], 404);
            }

            DB::table('master_barang')->where('id', $id)->delete();

            return response()->json(['message' => 'Barang berhasil dihapus']);
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json([
                'message' => 'Barang tidak bisa dihapus karena sedang digunakan dalam transaksi.'
            ], 409);
        }
    }


    // SEARCH GLOBAL
    public function search(Request $request)
    {
        $q = trim((string) $request->get('q', ''));

        $query = DB::table('master_barang')
            ->select('id', 'kode_barang', 'nama_barang')
            ->orderBy('nama_barang');

        if ($q !== '') {
            $query->where(function ($w) use ($q) {
                $w->where('nama_barang', 'like', "%$q%")
                  ->orWhere('kode_barang', 'like', "%$q%");
            });
        }

        return response()->json([
            'data' => $query->limit(30)->get()
        ]);
    }

    public function autocomplete(Request $request)
    {
        $q = trim($request->get('q', ''));

        if ($q === '') {
            return response()->json([
                'data' => []
            ]);
        }

        $data = DB::table('master_barang')
            ->select('id', 'nama_barang')
            ->where('nama_barang', 'LIKE', $q . '%')
            ->orderBy('nama_barang', 'asc')
            ->limit(10)
            ->get();

        return response()->json([
            'data' => $data
        ]);
    }

}
