<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use Illuminate\Support\Facades\Http;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Validasi input (USERNAME)
        try {
            $credentials = $request->validate([
                'username' => 'required|string',
                'password' => 'required|string|min:5',
            ], [
                'username.required' => 'Username wajib diisi.',
                'password.required' => 'Password wajib diisi.',
                'password.min' => 'Password minimal 5 karakter.',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $e->errors()
            ], 422);
        }

        // Rate limiter (USERNAME + IP)
        $key = Str::lower($credentials['username']) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'message' => "Terlalu banyak percobaan login. Silakan coba lagi dalam {$seconds} detik."
            ], 429);
        }

        // Cari user berdasarkan USERNAME
        $user = User::where('username', $credentials['username'])->first();

        if (!$user) {
        // 🔁 Coba login ke SIMAK
        $simakResponse = Http::post(config('services.simak.base_url') . '/login', [
            'username' => $credentials['username'],
            'password' => $credentials['password'],
        ]);

        if (!$simakResponse->ok()) {
            RateLimiter::hit($key, 60);
            return response()->json([
                'message' => 'Username atau password salah.'
            ], 401);
        }

        $simakUser = $simakResponse->json();

        // 🔐 Auto-create user lokal (tanpa register)
        $user = User::create([
            'username' => $credentials['username'],
            'name' => $simakUser['name'] ?? $credentials['username'],
            'email' => $simakUser['email'] ?? null,
            'password' => bcrypt(Str::random(40)), // random, tidak dipakai
            'role' => 'user',
        ]);
    }

        // Cek password
        if (!Hash::check($credentials['password'], $user->password)) {
            RateLimiter::hit($key, 60);
            return response()->json([
                'message' => 'Password yang Anda masukkan salah.'
            ], 401);
        }

        // Login sukses
        RateLimiter::clear($key);

        $token = $user->createToken('auth_token')->plainTextToken;

        if ($user->kode_bagian) {
            $user->load(['bagian' => function ($query) {
                $query->select('kode_bagian', 'nama_bagian', 'deskripsi', 'status');
            }]);
        }

        return response()->json([
            'message' => 'Login berhasil.',
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'kode_bagian' => $user->kode_bagian,
                'lab' => $user->bagian ? [
                    'kode_bagian' => $user->bagian->kode_bagian,
                    'nama_bagian' => $user->bagian->nama_bagian,
                    'status' => $user->bagian->status,
                ] : null,
            ],
            'token' => $token,
        ], 200);
    }


    // Menampilkan data user yang sudah login
    public function me(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->kode_bagian) {
                $user->load(['bagian' => function($query) {
                    $query->select('kode_bagian', 'nama_bagian', 'deskripsi', 'status');
                }]);
            }

            return response()->json([
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'kode_bagian' => $user->kode_bagian,
                'lab' => $user->bagian ? [
                    'kode_bagian' => $user->bagian->kode_bagian,
                    'nama_bagian' => $user->bagian->nama_bagian,
                    'status' => $user->bagian->status,
                ] : null,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil data user.'
            ], 500);
        }
    }


    // Logout 
    public function logout(Request $request)
    {
        try {
            // Hapus token yang sedang digunakan
            $request->user()->currentAccessToken()->delete();
            
            return response()->json([
                'message' => 'Logout berhasil.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal melakukan logout.'
            ], 500);
        }
    }

    public function clearLoginAttempts(Request $request)
    {
        $email = $request->input('email');
        $ip = $request->ip();
        $key = Str::lower($email).'|'.$ip;
        
        RateLimiter::clear($key);
        
        return response()->json([
            'message' => 'Login attempts cleared.'
        ], 200);
    }
}