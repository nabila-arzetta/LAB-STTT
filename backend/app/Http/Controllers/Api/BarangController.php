<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BarangController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = DB::table('master_barang as mb')
            ->select('mb.*')
            ->orderBy('mb.nama_barang', 'asc');

        if ($request->has('id_lab')) {
            $idLab = $request->get('id_lab');
            $lab = DB::table('master_lab')->where('id_lab', $idLab)->first();
            if ($lab) {
                $query->where('mb.kode_ruangan', $lab->kode_ruangan);
            }
        }

        if ($user->role === 'admin_lab') {
            $query->where('mb.kode_ruangan', $user->kode_bagian);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'master_barang_id' => 'required|integer',
            'id_lab' => 'required|integer',
            'jumlah_tersedia' => 'required|integer|min:1',
            'tanggal_masuk' => 'nullable|date',
            'status_barang' => 'required|string',
            'keterangan' => 'nullable|string',
        ]);

        $lab = DB::table('master_lab')->where('id_lab', $validated['id_lab'])->first();
        if (!$lab) {
            return response()->json(['message' => 'Lab tidak ditemukan'], 404);
        }

        if ($user->role === 'admin_lab' && $lab->kode_bagian !== $user->kode_bagian) {
            return response()->json(['message' => 'Tidak berwenang menambah barang di lab ini'], 403);
        }

        $masterBarang = DB::table('master_barang')->where('id', $validated['master_barang_id'])->first();
        if (!$masterBarang) {
            return response()->json(['message' => 'Master barang tidak ditemukan'], 404);
        }

        DB::table('master_barang')->insert([
            'kode_barang' => $masterBarang->kode_barang,
            'nama_barang' => $masterBarang->nama_barang,
            'kode_ruangan' => $lab->kode_ruangan,
            'kategori' => 'alat',
            'satuan' => 'unit',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Barang berhasil ditambahkan']);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $barang = DB::table('master_barang')
            ->where('id', $id)
            ->orWhere('id', $request->barang_id ?? null)
            ->first();

        if (!$barang) {
            return response()->json(['message' => 'Barang tidak ditemukan'], 404);
        }

        if ($user->role === 'admin_lab' && $barang->kode_ruangan !== $user->kode_bagian) {
            return response()->json(['message' => 'Tidak berwenang mengedit barang ini'], 403);
        }

        DB::table('master_barang')->where('id', $barang->id)->update([
            'nama_barang' => $request->nama_barang ?? $barang->nama_barang,
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Barang berhasil diperbarui']);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $barang = DB::table('master_barang')
            ->where('id', $id)
            ->orWhere('id', $request->barang_id ?? null)
            ->first();

        if (!$barang) {
            return response()->json(['message' => 'Barang tidak ditemukan'], 404);
        }

        if ($user->role === 'admin_lab' && $barang->kode_ruangan !== $user->kode_bagian) {
            return response()->json(['message' => 'Tidak berwenang menghapus barang ini'], 403);
        }

        DB::table('master_barang')->where('id', $barang->id)->delete();

        return response()->json(['message' => 'Barang berhasil dihapus']);
    }

    public function history(Request $request, $kode_barang)
    {
        $kode_barang = strtoupper($kode_barang);
        $lab = strtoupper($request->query('lab'));

        if (!$lab) {
            return response()->json([
                "success" => false,
                "message" => "Parameter lab wajib diisi (?lab=KODE)"
            ], 400);
        }

        // TRANSFER MASUK
        $transferMasuk = DB::table('transfer_barang_detail as d')
            ->join('transfer_barang as t', 't.id_transfer', '=', 'd.id_transfer')
            ->where('d.kode_barang', $kode_barang)
            ->where('t.kode_ruangan_tujuan', $lab)
            ->select(
                't.tanggal',
                DB::raw("'transfer_masuk' as tipe"),
                't.id_transfer as related_id',
                'd.quantity as jumlah',
                DB::raw("CONCAT('Dari ', t.kode_ruangan_dari) as keterangan")
            );

        // TRANSFER KELUAR
        $transferKeluar = DB::table('transfer_barang_detail as d')
            ->join('transfer_barang as t', 't.id_transfer', '=', 'd.id_transfer')
            ->where('d.kode_barang', $kode_barang)
            ->where('t.kode_ruangan_dari', $lab)
            ->select(
                't.tanggal',
                DB::raw("'transfer_keluar' as tipe"),
                't.id_transfer as related_id',
                DB::raw("-d.quantity as jumlah"),
                DB::raw("CONCAT('Ke ', t.kode_ruangan_tujuan) as keterangan")
            );

        // PENGGUNAAN (keluar)
        $penggunaan = DB::table('penggunaan_barang_detail as d')
            ->join('penggunaan_barang as p', 'p.id_penggunaan', '=', 'd.id_penggunaan')
            ->where('d.kode_barang', $kode_barang)
            ->where('p.kode_ruangan', $lab)
            ->select(
                'p.tanggal',
                DB::raw("'penggunaan' as tipe"),
                'p.id_penggunaan as related_id',
                DB::raw("-d.quantity as jumlah"),
                DB::raw("'Barang digunakan' as keterangan")
            );

        // OPNAME
        $opname = DB::table('stok_opname_detail as d')
            ->join('stok_opname as o', 'o.id_opname', '=', 'd.id_opname')
            ->where('d.kode_barang', $kode_barang)
            ->where('o.kode_ruangan', $lab)
            ->select(
                'o.tanggal',
                DB::raw("'opname' as tipe"),
                'o.id_opname as related_id',
                'd.selisih as jumlah',
                DB::raw("CONCAT('Opname (', d.tipe, ')') as keterangan")
            );

        // UNION
        $query = $transferMasuk
            ->unionAll($transferKeluar)
            ->unionAll($penggunaan)
            ->unionAll($opname);

        // Wrap union
        $data = DB::table(DB::raw("({$query->toSql()}) as x"))
            ->mergeBindings($query)
            ->orderBy('tanggal', 'asc')
            ->get();

        return response()->json([
            "success" => true,
            "data" => $data
        ]);
    }
}
