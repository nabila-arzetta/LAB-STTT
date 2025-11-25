<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class StokController extends Controller
{
    /**
     * Ambil data stok inventaris dari view_stok_inventaris
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $role = $user->role;

            $lab = $request->query('lab'); // <-- ambil lab dari query param

            $query = DB::table('view_stok_opname');

            // superadmin -> boleh pilih lab manapun
            if ($role === 'superadmin' && $lab) {
                $query->where('kode_ruangan', strtoupper($lab));
            }

            // admin lab -> pakai kode_bagian
            if ($role === 'admin_lab') {
                $query->where('kode_ruangan', strtoupper($user->kode_bagian));
            }

            $data = $query->orderBy('tanggal', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ambil stok berdasarkan kode ruangan
     */
    public function byLab($kodeRuangan)
    {
        try {
            $stok = DB::table('view_stok_inventaris')
                ->where('kode_ruangan', $kodeRuangan)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $stok,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat data stok lab: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getBarangByLab(Request $request)
    {
        try {
            $user = auth()->user();

            if (!$user) {
                return response()->json([
                    "success" => false,
                    "message" => "User tidak terautentikasi"
                ], 401);
            }

            // Jika superadmin → ambil semua barang dari master_barang + stok terakhir
            if ($user->role === 'superadmin') {
                $data = DB::table('master_barang as b')
                    ->leftJoin('stok_opname_detail as d', 'd.kode_barang', '=', 'b.kode_barang')
                    ->select(
                        'b.kode_barang',
                        'b.nama_barang',
                        'b.satuan',
                        DB::raw("COALESCE(d.stok_fisik, 0) as stok_akhir")
                    )
                    ->groupBy('b.kode_barang', 'b.nama_barang', 'b.satuan', 'd.stok_fisik')
                    ->get();

                return response()->json([
                    "success" => true,
                    "data" => $data
                ]);
            }

            // Admin lab wajib punya kode_bagian
            if (!$user->kode_bagian) {
                return response()->json([
                    "success" => false,
                    "message" => "User tidak memiliki kode ruangan"
                ]);
            }

            $kodeRuangan = $user->kode_bagian;

            // Barang berdasarkan LAB (mengambil stok terakhir berdasarkan opname)
            $data = DB::table('master_barang as b')
                ->leftJoin('stok_opname as o', 'o.kode_ruangan', '=', DB::raw("'$kodeRuangan'"))
                ->leftJoin('stok_opname_detail as d', 'd.id_opname', '=', 'o.id_opname')
                ->select(
                    'b.kode_barang',
                    'b.nama_barang',
                    'b.satuan',
                    DB::raw("COALESCE(d.stok_fisik, 0) as stok_akhir")
                )
                ->groupBy('b.kode_barang', 'b.nama_barang', 'b.satuan', 'd.stok_fisik')
                ->get();

            return response()->json([
                "success" => true,
                "data" => $data
            ]);

        } catch (\Throwable $e) {

            \Log::error("ERROR getBarangByLab: " . $e->getMessage());

            return response()->json([
                "success" => false,
                "message" => "Server error: " . $e->getMessage()
            ], 500);
        }
    }

}
