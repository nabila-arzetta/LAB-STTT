<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('peminjaman', function (Blueprint $table) {
            $table->id();
            // FK ke tabel users, mencatat siapa yang melakukan peminjaman
            $table->foreignId('user_id')->constrained('users')->onDelete('restrict');
            $table->string('tujuan');
            $table->enum('status', ['dipinjam', 'selesai', 'dibatalkan'])->default('dipinjam');
            $table->date('tanggal_pinjam');
            $table->date('tanggal_kembali_estimasi')->nullable();
            $table->date('tanggal_kembali_aktual')->nullable(); // Diisi saat pengembalian selesai
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('peminjaman');
    }
};