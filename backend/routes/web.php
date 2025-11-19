<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

// Route default: cek koneksi database.
// Biarkan hanya rute ini di web.php.
Route::get('/', function () {
    try {
        DB::connection()->getPdo();
        return "✅ Database connected successfully!";
    } catch (\Exception $e) {
        return "❌ Database connection failed: " . $e->getMessage();
    }
});

Route::get('/login', function () {
    return response()->json(['message' => 'Unauthorized'], 401);
})->name('login');