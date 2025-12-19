<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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

        // Cari user berdasarkan USERNAME di database lokal
        $user = User::where('username', $credentials['username'])->first();

        if ($user) {
            if (!Hash::check($credentials['password'], $user->password)) {
                RateLimiter::hit($key, 60);
                return response()->json([
                    'message' => 'Password yang Anda masukkan salah.'
                ], 401);
            }

            // Login sukses
            RateLimiter::clear($key);

            // Generate token
            $token = $user->createToken('auth_token')->plainTextToken;

            // Load relasi bagian jika ada
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

        try {
            //  token SIMAK
            Log::info('Attempting to get SIMAK token');
            
            $getToken = Http::timeout(30)->post(env('SIMAK_BASE_URL') . '/login', [
                'email' => env('SIMAK_CLIENT_EMAIL'),
                'password' => env('SIMAK_CLIENT_PASSWORD')
            ]);

            if (!$getToken->successful()) {
                Log::error('Failed to get SIMAK token', [
                    'status' => $getToken->status(),
                    'body' => $getToken->body()
                ]);
                
                RateLimiter::hit($key, 60);
                return response()->json([
                    'message' => 'Gagal terhubung ke sistem SIMAK. Silakan coba lagi.'
                ], 500);
            }

            $tokenData = $getToken->json();
          
            if (!isset($tokenData['status']) || $tokenData['status'] !== 'success') {
                Log::error('SIMAK token response invalid', ['response' => $tokenData]);
                
                RateLimiter::hit($key, 60);
                return response()->json([
                    'message' => 'Gagal mendapatkan akses ke sistem SIMAK.'
                ], 500);
            }

            $simakToken = $tokenData['data']['token'] ?? null;
            
            if (!$simakToken) {
                Log::error('SIMAK token not found in response', ['response' => $tokenData]);
                
                RateLimiter::hit($key, 60);
                return response()->json([
                    'message' => 'Token SIMAK tidak valid.'
                ], 500);
            }

            //  Cek user di SIMAK dengan token
            Log::info('Checking user in SIMAK', ['username' => $credentials['username']]);
            
            $simakResponse = Http::timeout(30)
                ->withToken($simakToken)
                ->get(env('SIMAK_BASE_URL') . '/simak/cek-user', [
                    'username' => $credentials['username'],
                    'password' => $credentials['password']
                ]);

            if (!$simakResponse->successful()) {
                Log::warning('SIMAK user check failed', [
                    'status' => $simakResponse->status(),
                    'body' => $simakResponse->body()
                ]);
                
                RateLimiter::hit($key, 60);
                return response()->json([
                    'message' => 'Username atau password salah.'
                ], 401);
            }

            $simakData = $simakResponse->json();
            
            // Cek struktur response SIMAK
            if (!isset($simakData['status']) || $simakData['status'] !== 'success') {
                RateLimiter::hit($key, 60);
                return response()->json([
                    'message' => 'Username atau password salah.'
                ], 401);
            }

            $simakUsers = $simakData['data'] ?? [];
            
            if (empty($simakUsers) || !is_array($simakUsers)) {
                RateLimiter::hit($key, 60);
                return response()->json([
                    'message' => 'Data user tidak ditemukan di SIMAK.'
                ], 401);
            }

            $simakUser = $simakUsers[0];

            Log::info('SIMAK user found', ['simak_user' => $simakUser]);

            $passwordMd5 = md5($credentials['password']);
            if ($simakUser['XPASSWORD_WEB'] !== $passwordMd5) {
                RateLimiter::hit($key, 60);
                return response()->json([
                    'message' => 'Password yang Anda masukkan salah.'
                ], 401);
            }

            // Cek  akun aktif
            if (!isset($simakUser['AKTIF']) || $simakUser['AKTIF'] != 1) {
                RateLimiter::hit($key, 60);
                return response()->json([
                    'message' => 'Akun Anda tidak aktif. Hubungi administrator.'
                ], 403);
            }

            $newUser = User::create([
                'username' => $credentials['username'],
                'name' => $simakUser['XUSER'] ?? $credentials['username'],
                'email' => $credentials['username'] . '@stttekstil.ac.id', // Generate email jika tidak ada
                'password' => Hash::make($credentials['password']), // Simpan password asli (encrypted)
                'role' => $this->determineRole($simakUser), // Tentukan role dari data SIMAK
                'kode_bagian' => $simakUser['KODE_BAGIAN'] ?? null,
            ]);

            Log::info('New user created from SIMAK', [
                'user_id' => $newUser->id,
                'username' => $newUser->username,
                'role' => $newUser->role,
                'kode_bagian' => $newUser->kode_bagian
            ]);

            RateLimiter::clear($key);

            $token = $newUser->createToken('auth_token')->plainTextToken;

            if ($newUser->kode_bagian) {
                $newUser->load(['bagian' => function ($query) {
                    $query->select('kode_bagian', 'nama_bagian', 'deskripsi', 'status');
                }]);
            }

            return response()->json([
                'message' => 'Login berhasil.',
                'user' => [
                    'id' => $newUser->id,
                    'username' => $newUser->username,
                    'name' => $newUser->name,
                    'email' => $newUser->email,
                    'role' => $newUser->role,
                    'kode_bagian' => $newUser->kode_bagian,
                    'lab' => $newUser->bagian ? [
                        'kode_bagian' => $newUser->bagian->kode_bagian,
                        'nama_bagian' => $newUser->bagian->nama_bagian,
                        'status' => $newUser->bagian->status,
                    ] : null,
                ],
                'token' => $token,
            ], 200);

        } catch (\Exception $e) {
            Log::error('SIMAK login error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            RateLimiter::hit($key, 60);
            
            return response()->json([
                'message' => 'Terjadi kesalahan saat menghubungi sistem SIMAK. Silakan coba lagi.'
            ], 500);
        }
    }
    
    /**
     * Tentukan role user berdasarkan data SIMAK
     */
    private function determineRole($simakUser)
    {
        // Jika ada KODE_BAGIAN, set sebagai admin_lab
        if (isset($simakUser['KODE_BAGIAN']) && !empty($simakUser['KODE_BAGIAN'])) {
            
            $kodeBagian = $simakUser['KODE_BAGIAN'];
            
            $kodeBagianLogistik = ['020'];
            $kodeBagianAdminLab = ['201','202','207','208','209','210','211','212','213','214','214','215','216','217','218','219','220','206'];
            
            if (in_array($kodeBagian, $kodeBagianLogistik)) {
                return 'logistik';
            }
            
            return 'admin_lab';
        }
        
        return 'user';
    }

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
        $username = $request->input('username');
        $ip = $request->ip();
        $key = Str::lower($username).'|'.$ip;
        
        RateLimiter::clear($key);
        
        return response()->json([
            'message' => 'Login attempts cleared.'
        ], 200);
    }
}