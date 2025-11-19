<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class StokOpnameController extends Controller
{
    // ============================================================
    // 1. LIST STOK OPNAME (ROLE-BASED)
    // ============================================================
    public function index(Request $request)
    {
        $user  = auth()->user();
        $role  = $user->role;

        // SUPERADMIN menerima ?lab=kode_ruangan
        $paramLab = strtoupper($request->query('lab', ''));

        // ========================= SUPERADMIN =========================
        if ($role === 'superadmin') {

            $query = DB::table('view_stok_opname')
                ->orderBy('tanggal', 'desc');

            if ($paramLab) {
                $query->where('kode_ruangan', $paramLab);
            }

            return response()->json([
                'success' => true,
                'data' => $query->get()
            ]);
        }

        // ========================= ADMIN LAB =========================
        if ($role === 'admin_lab') {

            if (!$user->kode_bagian) {
                return response()->json([
                    'success' => false,
                    'message' => "Admin lab tidak memiliki kode_bagian"
                ], 400);
            }

            // ADMIN LAB → MAP kode_bagian → kode_ruangan
            $kodeRuangan = DB::table('master_lab')
                ->where('kode_bagian', $user->kode_bagian)
                ->value('kode_ruangan');

            if (!$kodeRuangan) {
                return response()->json([
                    'success' => false,
                    'message' => "Kode ruangan untuk admin lab tidak ditemukan"
                ], 404);
            }

            $data = DB::table('view_stok_opname')
                ->where('kode_ruangan', $kodeRuangan)
                ->orderBy('tanggal', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => "Role tidak diizinkan"
        ], 403);
    }

    // ============================================================
    // 2. GET BARANG UNTUK POPUP OPNAME
    // ============================================================
    public function getBarangForOpname(Request $request)
    {
        $user = auth()->user();
        $role = $user->role;

        // ================= SUPERADMIN =================
        if ($role === 'superadmin') {

            $lab = strtoupper($request->query('lab', ''));

            if (!$lab) {
                return response()->json([
                    "success" => false,
                    "message" => "Superadmin wajib memilih lab (?lab=KODE_RUANGAN)"
                ], 400);
            }
        }

        // ================= ADMIN LAB =================
        else {

            if (!$user->kode_bagian) {
                return response()->json([
                    'success' => false,
                    'message' => "Admin lab tidak memiliki kode_bagian"
                ], 400);
            }

            // map kode_bagian → kode_ruangan
            $lab = DB::table('master_lab')
                ->where('kode_bagian', $user->kode_bagian)
                ->value('kode_ruangan');

            if (!$lab) {
                return response()->json([
                    'success' => false,
                    'message' => "kode_ruangan tidak ditemukan untuk admin lab"
                ], 404);
            }
        }

        // Ambil barang berdasarkan kode_ruangan
        $barang = DB::table('master_barang AS mb')
            ->leftJoin('view_stok_inventaris AS vs', 'vs.kode_barang', '=', 'mb.kode_barang')
            ->where('mb.kode_ruangan', $lab)
            ->select(
                'mb.kode_barang',
                'mb.nama_barang',
                'mb.satuan',
                DB::raw("IFNULL(vs.stok_akhir, 0) AS stok_sistem")
            )
            ->orderBy('mb.nama_barang')
            ->get();

        return response()->json([
            "success" => true,
            "data" => $barang
        ]);
    }

    // ============================================================
    // 3. STORE OPNAME
    // ============================================================
    public function store(Request $request)
    {
        $request->validate([
            'kode_ruangan' => 'required|string',
            'barang' => 'required|array|min:1',
            'barang.*.kode_barang' => 'required|string',
            'barang.*.stok_sistem' => 'required|integer|min:0',
            'barang.*.stok_fisik' => 'required|integer|min:0',
        ]);

        DB::beginTransaction();

        try {

            $idOpname = DB::table('stok_opname')->insertGetId([
                'kode_ruangan' => $request->kode_ruangan,
                'tanggal' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            foreach ($request->barang as $item) {

                $selisih = $item['stok_fisik'] - $item['stok_sistem'];

                $tipe = $selisih == 0
                    ? "sesuai"
                    : ($selisih > 0 ? "plus" : "minus");

                DB::table('stok_opname_detail')->insert([
                    'id_opname' => $idOpname,
                    'kode_barang' => $item['kode_barang'],
                    'stok_sistem' => $item['stok_sistem'],
                    'stok_fisik' => $item['stok_fisik'],
                    'selisih' => $selisih,
                    'tipe' => $tipe,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Stok Opname berhasil disimpan"
            ]);

        } catch (\Throwable $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // ============================================================
    // 4. EXPORT CSV
    // ============================================================
    public function exportCsv(Request $request)
    {
        $request->validate([
            'tahun' => 'required|integer',
            'lab' => 'required|string',
            'bulan' => 'nullable|integer|min:1|max:12'
        ]);

        $lab = strtoupper($request->lab);

        $query = DB::table('view_stok_opname')
            ->where('kode_ruangan', $lab)
            ->whereYear('tanggal', $request->tahun);

        if ($request->bulan) {
            $query->whereMonth('tanggal', $request->bulan);
        }

        $data = $query->orderBy('tanggal', 'asc')->get();

        return response()->json([
            "success" => true,
            "data" => $data
        ]);
    }
}
