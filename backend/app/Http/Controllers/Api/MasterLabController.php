<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MasterLabController extends Controller
{
    /**
     * Daftar seluruh lab
     * - superadmin → semua
     * - admin_lab → lab miliknya
     * - opsi ?onlyManage=true → filter lab milik user
     */
    public function index(Request $request)
    {
        $onlyManage = $request->boolean('onlyManage', false);
        $user = $request->user();

        $query = DB::table('master_lab')
            ->select([
                'master_lab.id_lab',
                'master_lab.kode_ruangan',
                'master_lab.kode_bagian',
                'master_lab.nama_lab',
                'master_lab.lokasi',
                'master_lab.status',
                DB::raw('COUNT(mb.id) as jumlah_barang'),
            ])
            ->leftJoin('master_barang as mb', 'mb.kode_ruangan', '=', 'master_lab.kode_ruangan')
            ->groupBy(
                'master_lab.id_lab',
                'master_lab.kode_ruangan',
                'master_lab.kode_bagian',
                'master_lab.nama_lab',
                'master_lab.lokasi',
                'master_lab.status'
            )
            ->orderBy('master_lab.nama_lab', 'asc');

        // 🔹 filter hanya lab milik user (kalau bukan superadmin)
        if ($onlyManage && $user->role !== 'superadmin') {
            $query->where('master_lab.kode_bagian', $user->kode_bagian);
        }

        $labs = $query->get();

        // Tambahkan flag can_manage untuk frontend
        $labs = $labs->map(function ($lab) use ($user) {
            $lab->can_manage = (
                $user->role === 'superadmin' ||
                ($user->role === 'admin_lab' && strtoupper($user->kode_bagian ?? '') === strtoupper($lab->kode_bagian ?? ''))
            );
            return $lab;
        });

        return response()->json(['data' => $labs]);
    }

    /**
     * Endpoint khusus dropdown (lab untuk pilihan user)
     * Lebih ringan, tanpa join atau count.
     */
    public function options()
    {
        return response()->json([
            'data' => DB::table('master_lab')
                ->select('id_lab', 'nama_lab', 'kode_ruangan', 'kode_bagian', 'lokasi')
                ->get()
        ]);
    }


    /**
     * Update lab
     * - Superadmin bebas edit semua lab
     * - Admin_lab hanya bisa edit lab miliknya
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();

        $data = $request->validate([
            'nama_lab'    => 'required|string',
            'lokasi'      => 'nullable|string',
            'status'      => 'required|in:aktif,nonaktif,1,0',
            'kode_bagian' => 'nullable|string',
        ]);

        $status = in_array($data['status'], ['aktif', '1', 1, true], true) ? 'aktif' : 'nonaktif';
        $kodeBagian = strtoupper(trim($data['kode_bagian'] ?? ''));

        $lab = DB::table('master_lab')->where('id_lab', $id)->first();

        if (!$lab) {
            return response()->json(['message' => 'Lab tidak ditemukan.'], 404);
        }

        // Admin_lab hanya boleh edit lab miliknya
        if (
            $user->role === 'admin_lab' &&
            strtoupper($user->kode_bagian ?? '') !== strtoupper($lab->kode_bagian ?? '')
        ) {
            return response()->json(['message' => 'Anda tidak berhak mengedit lab ini.'], 403);
        }

        if ($kodeBagian && !DB::table('bagian')->where('kode_bagian', $kodeBagian)->exists()) {
            DB::table('bagian')->insert([
                'kode_bagian' => $kodeBagian,
                'nama_bagian' => strtoupper($data['nama_lab']),
                'status'      => $status,
            ]);
        }

        DB::table('master_lab')->where('id_lab', $id)->update([
            'nama_lab'   => strtoupper($data['nama_lab']),
            'lokasi'     => $data['lokasi'] ?? '-',
            'status'     => $status,
            'kode_bagian' => $kodeBagian ?: null,
            'updated_at' => now(),
        ]);

        $updated = DB::table('master_lab')->where('id_lab', $id)->first();

        return response()->json([
            'message' => 'Laboratorium berhasil diperbarui.',
            'data' => $updated,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'superadmin') {
            return response()->json(['message' => 'Hanya superadmin yang dapat menambahkan lab.'], 403);
        }

        $data = $request->validate([
            'nama_lab'    => 'required|string',
            'lokasi'      => 'nullable|string',
            'status'      => 'required|in:aktif,nonaktif,1,0',
            'kode_bagian' => 'required|string|unique:master_lab,kode_bagian',
        ]);

        $status = in_array($data['status'], ['aktif', '1', 1, true], true) ? 'aktif' : 'nonaktif';
        $kodeBagian = strtoupper(trim($data['kode_bagian']));
        $kodeRuangan = 'L-' . preg_replace('/^L-?/', '', $kodeBagian);

        // 🧩 1️⃣ Buat bagian dulu kalau belum ada
        $existsInBagian = DB::table('bagian')->where('kode_bagian', $kodeBagian)->exists();
        if (!$existsInBagian) {
            DB::table('bagian')->insert([
                'kode_bagian' => $kodeBagian,
                'nama_bagian' => strtoupper($data['nama_lab']),
                'status'      => $status,
            ]);
        }

        // 🧩 2️⃣ Baru insert ke master_lab
        $id = DB::table('master_lab')->insertGetId([
            'kode_bagian'  => $kodeBagian,
            'kode_ruangan' => $kodeRuangan,
            'nama_lab'     => strtoupper($data['nama_lab']),
            'lokasi'       => $data['lokasi'] ?? '-',
            'status'       => $status,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        // 🧩 3️⃣ Ambil data lab yang baru dibuat
        $newLab = DB::table('master_lab')->where('id_lab', $id)->first();

        return response()->json([
            'message' => 'Laboratorium berhasil ditambahkan.',
            'data' => $newLab,
        ], 201);
    }


    /**
     * Hapus lab
     * - Superadmin bisa hapus semua
     * - Admin_lab hanya lab miliknya
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        $lab = DB::table('master_lab')->where('id_lab', $id)->first();

        if (!$lab) {
            return response()->json(['message' => 'Lab tidak ditemukan.'], 404);
        }

        if (
            $user->role === 'admin_lab' &&
            strtoupper($user->kode_bagian ?? '') !== strtoupper($lab->kode_bagian ?? '')
        ) {
            return response()->json(['message' => 'Anda tidak berhak menghapus lab ini.'], 403);
        }

        DB::table('master_lab')->where('id_lab', $id)->delete();

        return response()->json(['message' => 'Laboratorium berhasil dihapus.']);
    }
}
