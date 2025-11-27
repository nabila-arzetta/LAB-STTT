<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isSuperAdmin = $user->role === 'superadmin';

        $query = DB::table('users as u')
            ->leftJoin('master_lab as ml', 'u.kode_bagian', '=', 'ml.kode_bagian')
            ->select(
                'u.id',
                'u.name',
                'u.email',
                'u.role',
                'u.kode_bagian',
                'ml.nama_lab as lab_name'
            );

        if (!$isSuperAdmin && $user->kode_bagian) {
            $query->where('u.kode_bagian', $user->kode_bagian);
        }

        $users = $query->orderBy('u.name')->get();

        return response()->json(['data' => $users]);
    }

    // Tambah user baru
    public function store(Request $request)
    {
        $authUser = $request->user();

        if ($authUser->role !== 'superadmin') {
            return response()->json(['message' => 'Hanya superadmin yang dapat menambahkan user.'], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => ['required', Rule::in(['admin_lab', 'superadmin'])],
            'kode_bagian' => 'nullable|string|max:50',
        ]);

        // Buat user baru
        $createdId = DB::table('users')->insertGetId([
            'name' => $data['name'],
            'username' => strtolower(preg_replace('/\s+/', '_', $data['name'])),
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
            'kode_bagian' => $data['role'] === 'admin_lab' ? $data['kode_bagian'] : null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Ambil ulang data lengkap dengan join ke master_lab
        $newUser = DB::table('users as u')
            ->leftJoin('master_lab as ml', 'u.kode_bagian', '=', 'ml.kode_bagian')
            ->select(
                'u.id',
                'u.name',
                'u.email',
                'u.role',
                'u.kode_bagian',
                'ml.nama_lab as lab_name'
            )
            ->where('u.id', $createdId)
            ->first();

        return response()->json([
            'message' => 'User berhasil ditambahkan.',
            'data' => $newUser,
        ], 201);
    }

    // Update user
    public function update(Request $request, $id)
    {
        $authUser = $request->user();

        if ($authUser->role !== 'superadmin') {
            return response()->json(['message' => 'Hanya superadmin yang dapat memperbarui user.'], 403);
        }

        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan.'], 404);
        }

        // Validasi input
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:6',
            'role' => ['required', Rule::in(['admin_lab', 'superadmin'])],
            'kode_bagian' => 'nullable|string|max:50',
        ]);

        // Update data user
        $updateData = [
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'kode_bagian' => $data['role'] === 'admin_lab' ? $data['kode_bagian'] : null,
            'updated_at' => now(),
        ];

        if (!empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        DB::table('users')->where('id', $id)->update($updateData);

        $updatedUser = DB::table('users as u')
            ->leftJoin('master_lab as ml', 'u.kode_bagian', '=', 'ml.kode_bagian')
            ->select(
                'u.id',
                'u.name',
                'u.email',
                'u.role',
                'u.kode_bagian',
                'ml.nama_lab as lab_name'
            )
            ->where('u.id', $id)
            ->first();

        return response()->json([
            'message' => 'User berhasil diperbarui.',
            'data' => $updatedUser,
        ]);
    }

    // Hapus user
    public function destroy(Request $request, $id)
    {
        $authUser = $request->user();

        if ($authUser->role !== 'superadmin') {
            return response()->json(['message' => 'Hanya superadmin yang dapat menghapus user.'], 403);
        }

        $target = User::find($id);
        if (!$target) {
            return response()->json(['message' => 'User tidak ditemukan.'], 404);
        }

        $target->delete();

        return response()->json(['message' => 'User berhasil dihapus.']);
    }
}
