<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('master_lab', function (Blueprint $table) {
            if (!Schema::hasColumn('master_lab', 'kode_bagian')) {
                $table->string('kode_bagian', 20)->nullable()->after('id_lab');
            }
        });
    }
    public function down(): void {
        Schema::table('master_lab', function (Blueprint $table) {
            if (Schema::hasColumn('master_lab', 'kode_bagian')) {
                $table->dropColumn('kode_bagian');
            }
        });
    }
};
