<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            
            // Kolom dari Model User.php kamu
            $table->string('name'); // Kolom 'name' standar
            $table->string('username')->unique()->nullable(); // <-- TAMBAHAN
            $table->string('full_name')->nullable(); // <-- TAMBAHAN
            
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');

            // Kolom 'kode_bagian' harus string & cocok dengan tabel 'bagian'
            $table->string('kode_bagian', 50)->nullable(); // <-- TAMBAHAN
            $table->string('role')->default('user'); // <-- TAMBAHAN
            
            $table->string('phone')->nullable(); // <-- TAMBAHAN
            $table->text('address')->nullable(); // <-- TAMBAHAN
            $table->boolean('is_active')->default(true); // <-- TAMBAHAN
            $table->timestamp('last_login')->nullable(); // <-- TAMBAHAN

            $table->rememberToken();
            $table->timestamps();

            // Tambahkan Foreign Key
            // Pastikan ini didefinisikan SETELAH kolom 'kode_bagian'
            $table->foreign('kode_bagian')
                  ->references('kode_bagian')
                  ->on('bagian')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};