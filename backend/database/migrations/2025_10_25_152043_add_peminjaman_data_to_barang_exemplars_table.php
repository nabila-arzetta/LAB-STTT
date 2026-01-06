<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('barang_exemplars', function (Blueprint $table) {
            // tambah kolom hanya jika belum ada
            if (!Schema::hasColumn('barang_exemplars', 'peminjaman_id')) {
                // sesuaikan tipe/relasi sesuai kebutuhan kamu
                $table->foreignId('peminjaman_id')
                    ->nullable()
                    ->after('kondisi')
                    ->constrained('peminjaman') // atau ->references('id')->on('peminjaman')
                    ->nullOnDelete();           // atau ->cascadeOnDelete() sesuai desain
            }

            // contoh kolom lain, selalu cek dulu
            // if (!Schema::hasColumn('barang_exemplars', 'tanggal_pinjam')) {
            //     $table->dateTime('tanggal_pinjam')->nullable()->after('peminjaman_id');
            // }
        });
    }

    public function down(): void
    {
        Schema::table('barang_exemplars', function (Blueprint $table) {
            // aman saat rollback
            if (Schema::hasColumn('barang_exemplars', 'peminjaman_id')) {
                // jika pakai constrained di atas, gunakan helper ini (Laravel 9+)
                $table->dropConstrainedForeignId('peminjaman_id');

                // Jika versi Laravel lama tidak punya helper ini, pakai dua langkah:
                // $table->dropForeign(['peminjaman_id']);
                // $table->dropColumn('peminjaman_id');
            }

            // if (Schema::hasColumn('barang_exemplars', 'tanggal_pinjam')) {
            //     $table->dropColumn('tanggal_pinjam');
            // }
        });
    }
};
