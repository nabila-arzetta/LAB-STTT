<?php

use Illuminate\Support\Facades\Route;

// ===================== AUTH CONTROLLER =====================
use App\Http\Controllers\AuthController;

// ===================== API CONTROLLERS =====================
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\BarangController;
use App\Http\Controllers\Api\MasterBarangController;
use App\Http\Controllers\Api\MasterLabController;
use App\Http\Controllers\Api\LabController;
use App\Http\Controllers\Api\BagianController;
use App\Http\Controllers\Api\InventarisController;
use App\Http\Controllers\Api\PenggunaanBarangController;
use App\Http\Controllers\Api\StokOpnameController;
use App\Http\Controllers\Api\StokController;
use App\Http\Controllers\Api\PenerimaanLogistikController;
use App\Http\Controllers\Api\PermintaanLogistikController;
use App\Http\Controllers\Api\TransferBarangController;

// ===============         PUBLIC ROUTES         ==============

Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// ===============        PROTECTED ROUTES       ==============

Route::middleware(['auth:sanctum'])->group(function () {

    // -------------------- AUTH --------------------
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::apiResource('users', UserController::class);

    // Development only - hapus di production
    Route::post('/clear-login-attempts', [AuthController::class, 'clearLoginAttempts']);

    // -------------------- DASHBOARD --------------------
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/dashboard/item-history', [DashboardController::class, 'itemHistory']);

    // -------------------- MASTER DATA --------------------
    Route::apiResource('bagian', BagianController::class);
    Route::apiResource('barang', BarangController::class);
    Route::get('/barang/{kode_barang}/history', [BarangController::class, 'history']);
    Route::get('/master-barang/by-lab/{kode_ruangan}', [MasterBarangController::class, 'byLab']);
    Route::get('/master-barang/autocomplete', [MasterBarangController::class, 'autocomplete']);
    Route::apiResource('master-barang', MasterBarangController::class);
    

    // -------------------- LABORATORIUM --------------------
    Route::get('/labs', [MasterLabController::class, 'index']);
    //Route::get('/labs/options', [MasterLabController::class, 'options']);
    Route::get('/labs/options', function () {
        $labs = DB::table('master_lab')
            ->select('id_lab','kode_ruangan','nama_lab','lokasi','kode_bagian')
            ->get();

        return response()->json([
            "success" => true,
            "data" => $labs
        ]);
    });
    Route::post('/labs', [MasterLabController::class, 'store']);
    Route::put('/labs/{id_lab}', [MasterLabController::class, 'update']);
    Route::delete('/labs/{id_lab}', [MasterLabController::class, 'destroy']);

    Route::get('/laboratorium', [LabController::class, 'index']);


    Route::prefix('transaksi')->group(function () {
        Route::post('adjust', [InventarisController::class, 'adjust']);
        Route::post('opname', [InventarisController::class, 'opnameProcess']);
        Route::post('transfer', [InventarisController::class, 'transfer']);
    });

    // -------------------- INVENTARIS (VIEW STOK) --------------------
    Route::get('/inventaris', [InventarisController::class, 'index']);
    

    // -------------------- PENGGUNAAN BARANG --------------------
    Route::apiResource('penggunaan-barang', PenggunaanBarangController::class)
        ->only(['index', 'store', 'update', 'show', 'destroy']); 

    // -------------------- TRANSFER BARANG --------------------
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/transfer-barang', [TransferBarangController::class, 'index']);
        Route::post('/transfer-barang', [TransferBarangController::class, 'store']);
        Route::post('/transfer-barang/{id}/approve', [TransferBarangController::class, 'approve']);
        Route::post('/transfer-barang/{id}/reject', [TransferBarangController::class, 'reject']);
        Route::put('/transfer-barang/{id}', [TransferBarangController::class, 'update']);
        Route::delete('/transfer-barang/{id}', [TransferBarangController::class, 'destroy']);
    });

    // -------------------- PENERIMAAN LOGISTIK --------------------
    Route::get('/penerimaan-logistik', [PenerimaanLogistikController::class, 'index']);
    Route::post('/penerimaan-logistik', [PenerimaanLogistikController::class, 'store']);
    Route::put('/penerimaan-logistik/{id}', [PenerimaanLogistikController::class, 'update']);
    Route::delete('/penerimaan-logistik/{id}', [PenerimaanLogistikController::class, 'destroy']);

    // ===================== PERMINTAAN LOGISTIK =====================
    Route::get('/permintaan-logistik', [PermintaanLogistikController::class, 'index']);
    Route::post('/permintaan-logistik', [PermintaanLogistikController::class, 'store']); // admin
    Route::put('/permintaan-logistik/{id}/kirim', [PermintaanLogistikController::class, 'kirim']); // logistik
    Route::put('/permintaan-logistik/{id}/acc', [PermintaanLogistikController::class, 'acc']); // admin
    Route::put('/permintaan-logistik/{id}', [PermintaanLogistikController::class, 'update']); //admin
    Route::delete('/permintaan-logistik/{id}', [PermintaanLogistikController::class, 'destroy']); //admin

    // -------------------- STOK OPNAME --------------------
    Route::get('/stok-opname', [StokOpnameController::class, 'index']);
    Route::post('/stok-opname', [StokOpnameController::class, 'store']);
    Route::get('/stok-opname/barang', [StokOpnameController::class, 'getBarangForOpname']);
    Route::get('/stok-opname/export-csv', [StokOpnameController::class, 'exportCsv']);


    // -------------------- STOK (BARANG PER LAB + INVENTARIS) --------------------
    Route::prefix('stok')->group(function () {
        Route::get('/get-barang-by-lab', [StokController::class, 'getBarangByLab']);
        Route::get('/', [InventarisController::class, 'index']);
        Route::get('/{kodeRuangan}', [InventarisController::class, 'byLab']);
    });

    Route::get('/master-barang/by-lab/{kode_ruangan}', [MasterBarangController::class, 'byLab']);
    
});
