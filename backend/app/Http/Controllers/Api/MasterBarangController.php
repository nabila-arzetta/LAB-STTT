<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MasterBarangController extends Controller
{
    // List semua master barang (bisa filter per lab)
    public function index(Request $request)
    {
        $query = DB::table('master_barang as mb')
            ->select(
                'mb.id',
                'mb.kode_barang',
                'mb.nama_barang',
                'mb.deskripsi',
                'mb.kategori',
                'mb.satuan',
                'mb.kode_ruangan',
                'mb.id_lab',
                'ml.nama_lab'
            )
            ->leftJoin('master_lab as ml', 'ml.id_lab', '=', 'mb.id_lab')
            ->orderBy('mb.nama_barang', 'asc');

        // Filter berdasarkan id_lab
        if ($request->filled('id_lab')) {
            $query->where('mb.id_lab', $request->id_lab);
        }

        // Filter pencarian
        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($qr) use ($q) {
                $qr->where('mb.nama_barang', 'like', "%$q%")
                   ->orWhere('mb.kode_barang', 'like', "%$q%");
            });
        }

        $barang = $query->get();

        return response()->json([
            'data' => $barang,
        ]);
    }

    // Tambah master barang baru
    public function store(Request $request)
    {
        $data = $request->validate([
            'kode_barang'   => 'required|string|max:100|unique:master_barang,kode_barang',
            'nama_barang'   => 'required|string|max:255',
            'satuan'        => 'nullable|string|max:50',
            'deskripsi'     => 'nullable|string',
            'kategori'      => 'nullable|string|max:50',
            'id_lab'        => 'nullable|integer|exists:master_lab,id_lab',
        ]);

        // Ambil kode_ruangan otomatis berdasarkan id_lab
        $kodeRuangan = null;
        if (!empty($data['id_lab'])) {
            $lab = DB::table('master_lab')->where('id_lab', $data['id_lab'])->first();
            $kodeRuangan = $lab ? $lab->kode_ruangan : null;
        }

        // Simpan ke DB
        $barangId = DB::table('master_barang')->insertGetId([
            'kode_barang'  => $data['kode_barang'],
            'nama_barang'  => $data['nama_barang'],
            'deskripsi'    => $data['deskripsi'] ?? '',
            'kategori'     => $data['kategori'] ?? 'alat',
            'satuan'       => $data['satuan'] ?? 'unit',
            'kode_ruangan' => $kodeRuangan ?? '-',
            'id_lab'       => $data['id_lab'] ?? null,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        $barang = DB::table('master_barang')->find($barangId);

        return response()->json([
            'message' => 'Master Barang berhasil dibuat',
            'data' => $barang,
        ], 201);
    }

    // Perbarui data barang
    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'nama_barang' => 'required|string|max:255',
            'satuan'      => 'nullable|string|max:50',
            'deskripsi'   => 'nullable|string',
            'kategori'    => 'nullable|string|max:50',
        ]);

        $exists = DB::table('master_barang')->where('id', $id)->exists();
        if (!$exists) {
            return response()->json(['message' => 'Barang tidak ditemukan'], 404);
        }

        DB::table('master_barang')->where('id', $id)->update([
            'nama_barang' => $data['nama_barang'],
            'satuan' => $data['satuan'] ?? 'unit',
            'deskripsi' => $data['deskripsi'] ?? '',
            'kategori'    => $data['kategori'] ?? 'alat',
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Barang berhasil diperbarui']);
    }

    // Menghapus barang
    public function destroy($id)
    {
        $exists = DB::table('master_barang')->where('id', $id)->exists();
        if (!$exists) {
            return response()->json(['message' => 'Barang tidak ditemukan'], 404);
        }

        DB::table('master_barang')->where('id', $id)->delete();

        return response()->json(['message' => 'Barang berhasil dihapus']);
    }

    // Pencarian master barang
    public function search(Request $request)
    {
        $q     = trim((string) $request->get('q', ''));
        $limit = (int) $request->get('limit', 20);
        $limit = max(1, min($limit, 50));

        $qb = DB::table('master_barang as mb')
            ->select('mb.id', 'mb.kode_barang', 'mb.nama_barang')
            ->orderBy('mb.nama_barang');

        if ($q !== '') {
            $qb->where(function ($w) use ($q) {
                $w->where('mb.nama_barang', 'like', "%{$q}%")
                  ->orWhere('mb.kode_barang', 'like', "%{$q}%");
            });
        }

        $rows = $qb->limit($limit)->get();

        return response()->json(['data' => $rows], 200);
    }

    public function byLab($kode_ruangan)
    {
        try {
            // Normalisasi kode ruangan → uppercase
            $kode_ruangan = strtoupper($kode_ruangan);

            // Ambil semua barang yang cocok dengan kode_ruangan
            $barang = DB::table('master_barang')
                ->where(DB::raw('UPPER(kode_ruangan)'), $kode_ruangan)
                ->get();

            return response()->json([
                "success" => true,
                "data" => $barang
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                "success" => false,
                "message" => "Server Error",
                "error" => $e->getMessage()
            ], 500);
        }
    }


    public function show($id)
    {
        $barang = DB::table('master_barang as mb')
            ->select(
                'mb.*',
                'ml.nama_lab'
            )
            ->leftJoin('master_lab as ml', 'ml.id_lab', '=', 'mb.id_lab')
            ->where('mb.id', $id)
            ->first();

        if (!$barang) {
            return response()->json([
                'message' => 'Barang tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'data' => $barang
        ]);
    }

}
