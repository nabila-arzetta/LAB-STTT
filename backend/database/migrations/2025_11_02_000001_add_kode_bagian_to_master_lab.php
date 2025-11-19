<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('master_lab', function (Blueprint $table) {
            $table->string('kode_bagian', 10)->nullable()->index()->after('id_lab');
        });
    }
    public function down(): void {
        Schema::table('master_lab', function (Blueprint $table) {
            $table->dropColumn('kode_bagian');
        });
    }
};