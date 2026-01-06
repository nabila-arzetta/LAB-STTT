<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('stok_opname')) {
            Schema::create('stok_opname', function (Blueprint $table) {
                $table->engine = 'InnoDB';
                $table->increments('id');                 // INT
                $table->unsignedInteger('barang_id');     // FK -> barang.id (INT)

                $table->integer('jumlah_sistem');
                $table->integer('jumlah_fisik');
                $table->integer('selisih');
                $table->enum('status_adjust', ['none','created','applied'])->default('none');
                $table->date('tanggal_opname')->nullable();
                $table->timestamps();

                // $table->foreign('barang_id')->references('id')->on('barang')->onDelete('cascade');
                $table->index(['barang_id','tanggal_opname'], 'opname_idx');
            });
        } else {
            Schema::table('stok_opname', function (Blueprint $table) {
                foreach (['jumlah_sistem','jumlah_fisik','selisih'] as $col) {
                    if (!Schema::hasColumn('stok_opname',$col)) {
                        $table->integer($col)->nullable();
                    }
                }
                if (!Schema::hasColumn('stok_opname','status_adjust')) {
                    $table->enum('status_adjust', ['none','created','applied'])->default('none');
                }
                if (!Schema::hasColumn('stok_opname','tanggal_opname')) {
                    $table->date('tanggal_opname')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('stok_opname');
    }
};
