<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('barang_exemplars')) {
            Schema::create('barang_exemplars', function (Blueprint $table) {
                $table->engine = 'InnoDB';
                $table->increments('id');                 // INT
                $table->unsignedInteger('barang_id');     // FK -> barang.id (INT)

                $table->unsignedInteger('serial_number')->unique(); // serial per unit
                $table->enum('kondisi', ['baik','rusak'])->default('baik');
                $table->timestamps();

                // $table->foreign('barang_id')->references('id')->on('barang')->onDelete('cascade');
                $table->index(['barang_id','kondisi'], 'exemplar_idx');
            });
        } else {
            Schema::table('barang_exemplars', function (Blueprint $table) {
                if (!Schema::hasColumn('barang_exemplars','serial_number')) {
                    $table->unsignedInteger('serial_number')->nullable()->unique();
                }
                if (!Schema::hasColumn('barang_exemplars','kondisi')) {
                    $table->enum('kondisi', ['baik','rusak'])->default('baik');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('barang_exemplars');
    }
};
