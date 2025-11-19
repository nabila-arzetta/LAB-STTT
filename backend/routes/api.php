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
use App\Http\Controllers\Api\PeminjamanController;
use App\Http\Controllers\Api\StokOpnameController;
use App\Http\Controllers\Api\LogistikController;
use App\Http\Controllers\Api\StokController;
use App\Http\Controllers\Api\PenerimaanLogistikController;
use App\Http\Controllers\Api\TransferBarangController;

// ===============         PUBLIC ROUTES         ==============

Route::post('/login', [AuthController::class, 'login']);

// ===============        PROTECTED ROUTES       ==============

Route::middleware(['auth:sanctum'])->group(function () {

    // -------------------- AUTH --------------------
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::apiResource('users', UserController::class);

    // -------------------- DASHBOARD --------------------
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    // -------------------- MASTER DATA --------------------
    Route::apiResource('bagian', BagianController::class);
    Route::apiResource('barang', BarangController::class);
    Route::get('/barang/{kode_barang}/history', [BarangController::class, 'history']);
    Route::get('/master-barang/by-lab/{kode_ruangan}', [MasterBarangController::class, 'byLab']);
    Route::apiResource('master-barang', MasterBarangController::class);
    Route::apiResource('logistik', LogistikController::class);

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

    // (opsional alias, untuk frontend lama yang masih fetch("/api/laboratorium"))
    Route::get('/laboratorium', [LabController::class, 'index']);

    // -------------------- INVENTARIS & STOK --------------------
    //Route::prefix('stok')->group(function () {
     //   Route::get('/', [InventarisController::class, 'index']);
     //   Route::get('/{kodeRuangan}', [InventarisController::class, 'byLab']);
    //});

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
    });

    // -------------------- PENERIMAAN LOGISTIK --------------------
    Route::get('/penerimaan-logistik', [PenerimaanLogistikController::class, 'index']);
    Route::post('/penerimaan-logistik', [PenerimaanLogistikController::class, 'store']);
    Route::put('/penerimaan-logistik/{id}', [PenerimaanLogistikController::class, 'update']);
    Route::delete('/penerimaan-logistik/{id}', [PenerimaanLogistikController::class, 'destroy']);

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


    {/* 
    // -------------------- PEMINJAMAN --------------------
    Route::apiResource('peminjaman', PeminjamanController::class);
    Route::post('/peminjaman/{peminjaman}/kembalikan', [PeminjamanController::class, 'kembalikan']);

    // -------------------- BARANG KHUSUS --------------------
    Route::get('/barang/{id}/history', [BarangController::class, 'history']);
    Route::get('/barang/kondisi/{kondisi}', [BarangController::class, 'byKondisi']);
    */}
    
});
