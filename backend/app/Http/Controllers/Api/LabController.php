<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LabController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isSuperAdmin = $user->role === 'superadmin';
        $isAdminLab = $user->role === 'admin_lab';

        // Ambil semua lab aktif
        $labs = DB::table('master_lab')
            ->select([
                'id_lab as lab_id',
                'nama_lab',
                'kode_bagian',
                'kode_ruangan',
                'status',
                'lokasi',
            ])
            ->whereIn('status', ['aktif', 1, '1', true])
            ->get();

        // Tandai mana yang bisa dikelola (edit/delete)
        $labs = $labs->map(function ($lab) use ($user, $isSuperAdmin, $isAdminLab) {
            $lab->can_manage = false;

            if ($isSuperAdmin) {
                $lab->can_manage = true;
            } elseif ($isAdminLab && $lab->kode_bagian === $user->kode_bagian) {
                $lab->can_manage = true;
            }

            return $lab;
        });

        // Urutkan:
        // - Jika superadmin → urut alfabet
        // - Jika admin_lab → lab sendiri paling atas, sisanya alfabet
        if ($isSuperAdmin) {
            $labs = $labs->sortBy('nama_lab')->values();
        } else {
            $labs = $labs
                ->sortBy(fn($l) => $l->nama_lab)
                ->sortByDesc(fn($l) => $l->kode_bagian === $user->kode_bagian)
                ->values();
        }

        return response()->json(['data' => $labs]);
    }
    
    public function options()
    {
        $labs = DB::table('master_lab')
            ->select([
                'id_lab',
                'kode_ruangan',
                'nama_lab',
                'lokasi',
                'kode_bagian',
                'status'
            ])
            ->where('status', 'aktif')
            ->orderBy('nama_lab')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $labs
        ]);
    }
}
