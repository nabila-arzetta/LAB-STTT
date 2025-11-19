<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('kartu_stok')) {
            Schema::create('kartu_stok', function (Blueprint $table) {
                $table->engine = 'InnoDB';
                $table->increments('id');                 // INT
                $table->unsignedInteger('barang_id');     // FK -> barang.id (INT)
                $table->enum('tipe', ['penerimaan','penggunaan','transfer','pengembalian','adjustment','opname']);
                $table->integer('qty_in')->default(0);
                $table->integer('qty_out')->default(0);
                $table->integer('saldo')->default(0);
                $table->string('keterangan')->nullable();
                $table->date('tanggal_transaksi')->nullable();
                $table->timestamps();

                // Tambahkan FK setelah tabel 'barang' dipastikan ada & tipe sesuai
                // $table->foreign('barang_id')->references('id')->on('barang')->onDelete('cascade');
                $table->index(['barang_id','tanggal_transaksi'], 'kartu_stok_idx');
            });
        } else {
            Schema::table('kartu_stok', function (Blueprint $table) {
                if (!Schema::hasColumn('kartu_stok','tanggal_transaksi')) {
                    $table->date('tanggal_transaksi')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('kartu_stok');
    }
};
