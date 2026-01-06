<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('user'); // user | admin | superadmin | admin_lab | user_lab
            }
            if (!Schema::hasColumn('users', 'lab_id')) {
                $table->string('lab_id', 50)->nullable()->after('role');
                $table->foreign('lab_id')->references('kode_bagian')->on('bagian')->nullOnDelete();
            }
        });
    }
    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'lab_id')) {
                $table->dropForeign(['lab_id']);
                $table->dropColumn('lab_id');
            }
            // role biarkan saja (opsional drop)
        });
    }
};
