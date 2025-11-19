<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('barangs') && !Schema::hasTable('barang')) {
            Schema::rename('barangs', 'barang');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('barang') && !Schema::hasTable('barangs')) {
            Schema::rename('barang', 'barangs');
        }
    }
};
