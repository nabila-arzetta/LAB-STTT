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
        $user = auth()->user();
        $role = $user->role;

        // SUPERADMIN mengirim ?lab=KODE_BAGIAN
        $paramBagian = strtoupper($request->query('lab', ''));

        // ========================= SUPERADMIN =========================
        if ($role === 'superadmin') {

            $paramRuangan = strtoupper($request->query('lab', ''));

            $query = DB::table('view_stok_opname')
                ->orderBy('tanggal', 'desc');

            if ($paramRuangan) {
                $query->where('kode_ruangan', $paramRuangan);
            }

            return response()->json([
                'success' => true,
                'data'    => $query->get()
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

            // Mapping kode_bagian → kode_ruangan asli
            $lab = DB::table('master_lab')->where('kode_bagian', $user->kode_bagian)->first();

            if (!$lab) {
                return response()->json([
                    'success' => false,
                    'message' => "Lab tidak ditemukan untuk kode_bagian {$user->kode_bagian}"
                ], 400);
            }

            $kodeRuangan = $lab->kode_ruangan;  // contoh: L-BHS

            $data = DB::table('view_stok_opname')
                ->where('kode_ruangan', $kodeRuangan)
                ->orderBy('tanggal', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data'    => $data
            ]);
        }

        // ========================= ROLE LAIN =========================
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

        // SUPERADMIN memilih ?lab=KODE_BAGIAN
        if ($role === 'superadmin') {

            $bagian = strtoupper($request->query('lab', ''));

            if (!$bagian) {
                return response()->json([
                    "success" => false,
                    "message" => "Superadmin wajib memilih lab (?lab=KODE_BAGIAN)"
                ], 400);
            }

            $lab = DB::table('master_lab')->where('kode_bagian', $bagian)->first();
            if (!$lab) {
                return response()->json([
                    "success" => true,
                    "data"    => []
                ]);
            }

            $kodeRuangan = $lab->kode_ruangan;
        }

        // ADMIN LAB
        else if ($role === 'admin_lab') {

            if (!$user->kode_bagian) {
                return response()->json([
                    'success' => false,
                    'message' => "Admin lab tidak memiliki kode_bagian"
                ], 400);
            }

            $lab = DB::table('master_lab')->where('kode_bagian', $user->kode_bagian)->first();
            if (!$lab) {
                return response()->json([
                    "success" => true,
                    "data"    => []
                ]);
            }

            $kodeRuangan = $lab->kode_ruangan;  // L-BHS
        }

        // AMBIL BARANG
        $barang = DB::table('master_barang AS mb')
            ->leftJoin('view_stok_inventaris AS vs', function ($join) use ($kodeRuangan) {
                $join->on('vs.kode_barang', '=', 'mb.kode_barang')
                     ->where('vs.kode_ruangan', '=', $kodeRuangan);
            })
            ->select(
                'mb.kode_barang',
                'mb.nama_barang',
                'mb.satuan',
                DB::raw("COALESCE(vs.stok_akhir, 0) AS stok_sistem")
            )
            ->orderBy('mb.nama_barang')
            ->get();

        return response()->json([
            "success" => true,
            "data"    => $barang
        ]);
    }

    // ============================================================
    // 3. STORE OPNAME
    // ============================================================
    public function store(Request $request)
    {
        $request->validate([
            'kode_ruangan' => 'required|string',  // FE kirim kode_bagian, tapi BE harus mapping
            'barang' => 'required|array|min:1',
            'barang.*.kode_barang'  => 'required|string',
            'barang.*.stok_sistem'  => 'required|integer|min:0',
            'barang.*.stok_fisik'   => 'required|integer|min:0',
        ]);

        // Convert FE kode_ruangan (yang sebenarnya kode_bagian) ke kode_ruangan asli
        $lab = DB::table('master_lab')->where('kode_bagian', $request->kode_ruangan)->first();
        if (!$lab) {
            return response()->json([
                'success' => false,
                'message' => "Kode lab tidak valid (kode_bagian: {$request->kode_ruangan})"
            ], 400);
        }

        $kodeRuanganAsli = $lab->kode_ruangan;

        DB::beginTransaction();

        try {
            // insert opname
            $idOpname = DB::table('stok_opname')->insertGetId([
                'kode_ruangan' => $kodeRuanganAsli,
                'tanggal'      => now(),
                'created_at'   => now(),
                'updated_at'   => now()
            ]);

            // insert detail
            foreach ($request->barang as $item) {

                $selisih = $item['stok_fisik'] - $item['stok_sistem'];
                $tipe    = $selisih == 0
                    ? "sesuai"
                    : ($selisih > 0 ? "plus" : "minus");

                DB::table('stok_opname_detail')->insert([
                    'id_opname'   => $idOpname,
                    'kode_barang' => $item['kode_barang'],
                    'stok_sistem' => $item['stok_sistem'],
                    'stok_fisik'  => $item['stok_fisik'],
                    'selisih'     => $selisih,
                    'tipe'        => $tipe,
                    'created_at'  => now(),
                    'updated_at'  => now()
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
            'lab'   => 'required|string',   // kode_bagian dari FE
            'bulan' => 'nullable|integer|min:1|max:12'
        ]);

        // map kode_bagian → kode_ruangan
        $lab = DB::table('master_lab')->where('kode_bagian', $request->lab)->first();

        if (!$lab) {
            return response()->json([
                "success" => true,
                "data"    => []
            ]);
        }

        $kodeRuangan = $lab->kode_ruangan;

        $query = DB::table('view_stok_opname')
            ->where('kode_ruangan', $kodeRuangan)
            ->whereYear('tanggal', $request->tahun);

        if ($request->bulan) {
            $query->whereMonth('tanggal', $request->bulan);
        }

        return response()->json([
            "success" => true,
            "data"    => $query->orderBy('tanggal', 'asc')->get()
        ]);
    }
}
