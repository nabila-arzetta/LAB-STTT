<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bagian', function (Blueprint $table) {
            // Sesuai Model, Primary Key adalah 'kode_bagian' (bukan ID)
            $table->string('kode_bagian', 50)->primary(); 
            $table->string('nama_bagian');
            $table->text('deskripsi')->nullable();
            $table->string('status')->default('aktif');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('bagian'); }
};