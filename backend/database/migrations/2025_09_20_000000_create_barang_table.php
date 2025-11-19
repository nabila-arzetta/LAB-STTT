<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('barang', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->increments('id'); // INT UNSIGNED (legacy)

            // Kolom dasar menyesuaikan project lama
            $table->unsignedInteger('master_barang_id')->nullable();
            $table->unsignedInteger('id_lab')->nullable();
            $table->integer('jumlah_tersedia')->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barang');
    }
};
