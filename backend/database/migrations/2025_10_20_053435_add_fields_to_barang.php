<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('barang', function (Blueprint $table) {
            if (!Schema::hasColumn('barang','tanggal_masuk')) {
                $table->date('tanggal_masuk')->nullable()->after('jumlah_tersedia');
            }
            if (!Schema::hasColumn('barang','tanggal_keluar')) {
                $table->date('tanggal_keluar')->nullable()->after('tanggal_masuk');
            }
            if (!Schema::hasColumn('barang','status_barang')) {
                $table->enum('status_barang',['baik','rusak'])->default('baik')->after('tanggal_keluar');
            }
            if (!Schema::hasColumn('barang','serial_number')) {
                $table->unsignedBigInteger('serial_number')->nullable()->unique()->after('status_barang');
            }
        });
    }

    public function down(): void
    {
        Schema::table('barang', function (Blueprint $table) {
            if (Schema::hasColumn('barang','serial_number')) $table->dropUnique(['serial_number']);
            $table->dropColumn(['tanggal_masuk','tanggal_keluar','status_barang','serial_number']);
        });
    }
};
