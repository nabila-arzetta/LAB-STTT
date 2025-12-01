<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BagianController extends Controller
{
    public function index(Request $request)
    {
        $onlyManage = $request->boolean('onlyManage', false);
        $user = $request->user();

        $query = DB::table('master_lab as ml')
            ->select([
                'ml.id_lab',
                'ml.kode_ruangan',
                'ml.kode_bagian',
                'ml.nama_lab',
                'ml.status',
                DB::raw('COUNT(mb.id) as jumlah_barang'),
                DB::raw("CASE   
                    WHEN '{$user->role}' = 'superadmin' THEN true
                    WHEN ml.kode_bagian = '{$user->kode_bagian}' THEN true
                    ELSE false
                END as can_manage")
            ])
            ->leftJoin('master_barang as mb', 'mb.kode_ruangan', '=', 'ml.kode_ruangan')
            ->groupBy(
                'ml.id_lab',
                'ml.kode_ruangan',
                'ml.kode_bagian',
                'ml.nama_lab',
                'ml.status'
            )
            ->orderBy('ml.nama_lab', 'asc');

        if ($onlyManage && $user->role !== 'superadmin') {
            $query->where('ml.kode_bagian', $user->kode_bagian);
        }

        $labs = $query->get();

        return response()->json([
            'data' => $labs
        ]);
    }
}
