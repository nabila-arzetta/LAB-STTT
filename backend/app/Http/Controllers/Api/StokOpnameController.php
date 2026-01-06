<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class StokOpnameController extends Controller
{
    public function getBarangForOpname(Request $request)
    {
        $user = auth()->user();
        $role = $user->role;

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
        else if ($role === 'admin_lab') {

            if (!$user->kode_bagian) {
                return response()->json([
                    'success' => false,
                    'message' => "Admin lab tidak memiliki kode_bagian"
                ], 400);
            }

            $lab = DB::table('master_lab')
                ->where('kode_bagian', $user->kode_bagian)
                ->first();

            if (!$lab) {
                return response()->json([
                    "success" => true,
                    "data"    => []
                ]);
            }

            $kodeRuangan = $lab->kode_ruangan;
        }
        else {
            return response()->json([
                "success" => false,
                "message" => "Role tidak diizinkan"
            ], 403);
        }

        $barang = DB::table('view_stok_inventaris AS vs')
            ->join('master_barang AS mb', 'mb.kode_barang', '=', 'vs.kode_barang')
            ->where('vs.kode_ruangan', strtoupper($kodeRuangan))
            ->select(
                'vs.kode_barang',
                'mb.nama_barang',
                'mb.satuan',
                DB::raw('vs.stok_akhir AS stok_sistem')
            )
            ->orderBy('mb.nama_barang')
            ->get();

        return response()->json([
            "success" => true,
            "data"    => $barang
        ]);
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $role = $user->role;

        $paramLab = strtoupper($request->query('lab', ''));

        // SUPERADMIN
        if ($role === 'superadmin') {

            if (!$paramLab) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parameter lab wajib diisi'
                ], 400);
            }

            $data = DB::table('view_stok_opname')
                ->where('kode_ruangan', $paramLab)
                ->orderBy('tanggal', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        }

        // ADMIN LAB
        if ($role === 'admin_lab') {

            if (!$user->kode_bagian) {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin lab tidak punya kode_bagian'
                ], 400);
            }

            $lab = DB::table('master_lab')
                ->where('kode_bagian', $user->kode_bagian)
                ->first();

            if (!$lab) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            $data = DB::table('view_stok_opname')
                ->where('kode_ruangan', $lab->kode_ruangan)
                ->orderBy('tanggal', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Role tidak diizinkan'
        ], 403);
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode_ruangan' => 'required|string',
            'barang' => 'required|array|min:1',
            'barang.*.kode_barang' => 'required|integer',
            'barang.*.stok_sistem' => 'required|integer|min:0',
            'barang.*.stok_fisik' => 'required|integer|min:0',
        ]);

        // konversi kode_bagian -> kode_ruangan asli
        $lab = DB::table('master_lab')
            ->where('kode_bagian', $request->kode_ruangan)
            ->first();

        if (!$lab) {
            return response()->json([
                'success' => false,
                'message' => 'Kode lab tidak valid'
            ], 400);
        }

        $kodeRuangan = $lab->kode_ruangan;
        $tanggal = now();

        DB::beginTransaction();

        try {

            // 1️⃣ Buat header opname
            $idOpname = DB::table('stok_opname')->insertGetId([
                'kode_ruangan' => $kodeRuangan,
                'tanggal' => $tanggal,
                'created_at' => $tanggal,
                'updated_at' => $tanggal,
            ]);

            // 2️⃣ Simpan detail opname (TIDAK membuat transaksi logistik/penggunaan)
            foreach ($request->barang as $item) {

                $stokSistem = (int)$item['stok_sistem'];
                $stokFisik  = (int)$item['stok_fisik'];
                $selisih    = $stokFisik - $stokSistem;

                if ($selisih === 0) continue;

                $tipe = $selisih > 0 ? 'plus' : 'minus';

                DB::table('stok_opname_detail')->insert([
                    'id_opname'   => $idOpname,
                    'kode_barang' => $item['kode_barang'],
                    'stok_sistem' => $stokSistem,
                    'stok_fisik'  => $stokFisik,
                    'selisih'     => $selisih,
                    'tipe'        => $tipe,
                    'created_at'  => $tanggal,
                    'updated_at'  => $tanggal,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Stok opname berhasil dicatat'
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }




    // EXPORT CSV OPNAME
    public function exportCsv(Request $request)
    {
        $request->validate([
            'tahun' => 'required|integer',
            'lab'   => 'required|string',   
            'bulan' => 'nullable|integer|min:1|max:12'
        ]);

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
            "data"    => $query->orderBy('tanggal', 'desc')->get()
        ]);
    }
}
