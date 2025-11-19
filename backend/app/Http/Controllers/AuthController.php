<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User; // Menggunakan model User
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Validasi input
        $credentials = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        // Mencari user berdasarkan email
        $user = User::where('email', $credentials['email'])->first();

        // Verifikasi apakah email ditemukan dan password cocok
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Email atau password salah'], 401);
        }

        // Membuat token dengan Laravel Passport atau Sanctum
        // Pastikan kamu sudah mengonfigurasi Passport atau Sanctum untuk penggunaan token
        $token = $user->createToken('auth_token')->plainTextToken;

        // Mengembalikan data user dan token
        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    // Menampilkan data user yang sudah login
    public function me(Request $request)
    {
        // Mengambil data user beserta bagian (relationship)
        $user = $request->user()->load(['bagian' => function($query) {
            $query->select('kode_bagian', 'nama_bagian', 'deskripsi', 'status');
        }]);

        return response()->json([
            'id' => $user->id,
            'username' => $user->username,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'role' => $user->role,
            'kode_bagian' => $user->kode_bagian,
            'lab' => $user->bagian ? [
                'kode_bagian' => $user->bagian->kode_bagian,
                'nama_bagian' => $user->bagian->nama_bagian,
                'status' => $user->bagian->status,
            ] : null,
        ]);
    }

    // Logout dan hapus token
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }
}
