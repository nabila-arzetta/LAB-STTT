<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('adjustment_barang')) {
            Schema::create('adjustment_barang', function (Blueprint $table) {
                $table->engine = 'InnoDB';
                $table->increments('id');                 // INT
                $table->unsignedInteger('barang_id');     // FK -> barang.id (INT)

                $table->integer('jumlah_awal');
                $table->integer('jumlah_akhir');
                $table->integer('selisih');
                $table->string('keterangan')->nullable();
                $table->date('tanggal_adjustment')->nullable();
                $table->timestamps();

                // $table->foreign('barang_id')->references('id')->on('barang')->onDelete('cascade');
                $table->index(['barang_id','tanggal_adjustment'], 'adj_barang_idx');
            });
        } else {
            Schema::table('adjustment_barang', function (Blueprint $table) {
                if (!Schema::hasColumn('adjustment_barang','barang_id')) {
                    $table->unsignedInteger('barang_id')->nullable()->after('id');
                    $table->index('barang_id', 'adj_barang_barang_id_idx');
                }
                foreach (['jumlah_awal','jumlah_akhir','selisih'] as $col) {
                    if (!Schema::hasColumn('adjustment_barang',$col)) {
                        $table->integer($col)->nullable();
                    }
                }
                if (!Schema::hasColumn('adjustment_barang','keterangan')) {
                    $table->string('keterangan')->nullable();
                }
                if (!Schema::hasColumn('adjustment_barang','tanggal_adjustment')) {
                    $table->date('tanggal_adjustment')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('adjustment_barang');
    }
};
