<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master_lab', function (Blueprint $table) {
            // Sesuai Model, Primary Key adalah 'id_lab'
            $table->increments('id_lab'); // Pakai increments (INT)
            $table->string('nama_lab');
            $table->text('deskripsi')->nullable();
            $table->string('lokasi')->nullable();
            $table->string('status')->default('aktif');
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('master_lab'); }
};