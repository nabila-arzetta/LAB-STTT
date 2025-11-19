<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventarisController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $role = $user->role;
        $userKodeBagian = strtoupper($user->kode_bagian ?? '');

        // Ambil lab dari query param (khusus superadmin)
        $requestedLab = strtoupper($request->query('lab', ''));

        //   ================  ROLE: SUPERADMIN  =====================
        if ($role === 'superadmin') {

            if (!$requestedLab) {
                $query = DB::table('view_stok_inventaris');
            } else {
                $query = DB::table('view_stok_inventaris')
                    ->where('kode_ruangan', $requestedLab);
            }
        }

        //   =================  ROLE: ADMIN LAB  ======================
        elseif ($role === 'admin_lab') {

            // Ambil semua lab milik admin lab berdasarkan kode_bagian user
            $allowedLabs = DB::table('master_lab')
                ->where('kode_bagian', $userKodeBagian)
                ->pluck('kode_ruangan')
                ->map(fn($x) => strtoupper($x))
                ->toArray();

            if (empty($allowedLabs)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin lab tidak memiliki lab yang terdaftar.',
                ], 403);
            }

            // Admin lab tidak pakai parameter lab, backend otomatis filter
            $query = DB::table('view_stok_inventaris')
                ->whereIn('kode_ruangan', $allowedLabs);
        }

        //   ====================  ROLE LAIN  =========================
        else {
            return response()->json([
                'success' => false,
                'message' => 'Role tidak memiliki akses inventaris.',
            ], 403);
        }

        //   ===================  AMBIL DATA  ========================
        $barang = $query->get();

        //   ===============  TAMBAHKAN DATA LAB  ====================
        $labs = DB::table('master_lab')
            ->select('kode_ruangan', 'kode_bagian', 'nama_lab', 'lokasi')
            ->get()
            ->keyBy('kode_ruangan');

        $barang = $barang->map(function ($item) use ($labs) {
            $lab = $labs->get($item->kode_ruangan);

            $item->nama_lab = $lab->nama_lab ?? $item->kode_ruangan;
            $item->kode_bagian = $lab->kode_bagian ?? null;
            $item->lokasi = $lab->lokasi ?? null;

            return $item;
        });

        return response()->json([
            'success' => true,
            'data' => $barang,
        ]);
    }
}
