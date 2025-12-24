<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (
            Schema::hasTable('master_barang') &&
            Schema::hasTable('master_lab') &&
            Schema::hasTable('stok_opname') &&
            Schema::hasTable('barang') &&
            Schema::hasTable('transfer_barang') &&
            Schema::hasTable('transfer_barang_detail') &&
            Schema::hasTable('permintaan_barang') &&
            Schema::hasTable('permintaan_barang_detail')
        ) {
            DB::statement("
                CREATE OR REPLACE VIEW view_stok_inventaris AS
                SELECT
                    mb.id AS id_barang,
                    mb.kode_barang,
                    mb.nama_barang,
                    mb.kode_ruangan AS lab,

                    COALESCE((
                        SELECT so.jumlah_fisik
                        FROM stok_opname so
                        JOIN barang b ON b.id = so.barang_id
                        WHERE b.kode_barang = mb.kode_barang
                        AND b.kode_bagian = mb.kode_ruangan
                        ORDER BY so.tanggal_opname DESC
                        LIMIT 1
                    ), 0)

                    + COALESCE((
                        SELECT SUM(td.quantity)
                        FROM transfer_barang_detail td
                        JOIN transfer_barang t ON t.id_transfer = td.id_transfer
                        WHERE td.kode_barang = mb.kode_barang
                        AND t.kode_ruangan_tujuan = mb.kode_ruangan
                    ), 0)

                    - COALESCE((
                        SELECT SUM(td.quantity)
                        FROM transfer_barang_detail td
                        JOIN transfer_barang t ON t.id_transfer = td.id_transfer
                        WHERE td.kode_barang = mb.kode_barang
                        AND t.kode_ruangan_dari = mb.kode_ruangan
                    ), 0)

                    - COALESCE((
                        SELECT SUM(pd.quantity)
                        FROM permintaan_barang_detail pd
                        JOIN permintaan_barang p ON p.id_permintaan = pd.id_permintaan
                        WHERE pd.kode_barang = mb.kode_barang
                        AND p.kode_ruangan = mb.kode_ruangan
                    ), 0)

                    AS stok_akhir

                FROM master_barang mb
                LEFT JOIN master_lab ml ON ml.kode_bagian = mb.kode_ruangan
                WHERE ml.status = 'aktif';
            ");
        }
    }

    public function down(): void
    {
        DB::statement("DROP VIEW IF EXISTS view_stok_inventaris;");
    }
};
