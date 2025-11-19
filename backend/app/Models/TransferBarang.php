<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransferBarang extends Model
{
    protected $table = 'transfer_barang';
    protected $primaryKey = 'id_transfer';

    // kalau tabel punya created_at & updated_at, biarkan true (default)
    public $timestamps = true;

    protected $fillable = [
        'kode_ruangan_dari',
        'kode_ruangan_tujuan',
        'tanggal',
        'keterangan',
        'status',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'tanggal'     => 'date',
        'approved_at' => 'datetime',
    ];

    // === RELASI ===

    public function detail()
    {
        return $this->hasMany(TransferBarangDetail::class, 'id_transfer', 'id_transfer');
    }

    public function labAsal()
    {
        // master_lab: kode_ruangan, nama_lab, kode_bagian, dst.
        return $this->belongsTo(MasterLab::class, 'kode_ruangan_dari', 'kode_ruangan');
    }

    public function labTujuan()
    {
        return $this->belongsTo(MasterLab::class, 'kode_ruangan_tujuan', 'kode_ruangan');
    }
}
