<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('barang_exemplars')) {
            Schema::table('barang_exemplars', function (Blueprint $table) {
                if (!Schema::hasColumn('barang_exemplars', 'status')) {
                    $table->string('status', 50)
                          ->default('tersedia')
                          ->after('kondisi');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('barang_exemplars')) {
            Schema::table('barang_exemplars', function (Blueprint $table) {
                if (Schema::hasColumn('barang_exemplars', 'status')) {
                    $table->dropColumn('status');
                }
            });
        }
    }
};
