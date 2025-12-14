<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Validasi input dengan pesan kustom
        try {
            $credentials = $request->validate([
                'email' => 'required|string|email',
                'password' => 'required|string|min:6',
            ], [
                'email.required' => 'Email wajib diisi.',
                'email.email' => 'Format email tidak valid.',
                'password.required' => 'Password wajib diisi.',
                'password.min' => 'Password minimal 6 karakter.',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $e->errors()
            ], 422);
        }

        // Rate limiting - mencegah brute force attack
        $key = Str::lower($request->input('email')).'|'.$request->ip();
        
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'message' => "Terlalu banyak percobaan login. Silakan coba lagi dalam {$seconds} detik."
            ], 429);
        }

        // Mencari user berdasarkan email
        $user = User::where('email', $credentials['email'])->first();

        // Cek apakah email terdaftar
        if (!$user) {
            RateLimiter::hit($key, 60); 
            
            return response()->json([
                'message' => 'Email tidak terdaftar dalam sistem.'
            ], 401);
        }

        // Cek apakah password cocok
        if (!Hash::check($credentials['password'], $user->password)) {
            RateLimiter::hit($key, 60); // Increment failed attempts
            
            return response()->json([
                'message' => 'Password yang Anda masukkan salah.'
            ], 401);
        }

        // Clear rate limiter on successful login
        RateLimiter::clear($key);

        // Membuat token baru
        $token = $user->createToken('auth_token')->plainTextToken;

        if ($user->kode_bagian) {
            $user->load(['bagian' => function($query) {
                $query->select('kode_bagian', 'nama_bagian', 'deskripsi', 'status');
            }]);
        }

        // Mengembalikan response sukses
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