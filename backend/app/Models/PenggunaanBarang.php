<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PenggunaanBarang extends Model
{
    protected $table = 'penggunaan_barang';
    protected $primaryKey = 'id_penggunaan';
    public $incrementing = true;
    protected $keyType = 'int';

    // Sesuaikan dengan controller (kode_ruangan, tanggal, keterangan, status)
    protected $fillable = [
        'kode_ruangan',
        'tanggal',
        'keterangan',
        'status',
    ];

    public $timestamps = true;

    public function bagian()
    {
        return $this->belongsTo(Bagian::class, 'kode_bagian', 'kode_bagian');
    }

    public function detailPenggunaan()
    {
        return $this->hasMany(DetailPenggunaanBarang::class, 'id_penggunaan', 'id_penggunaan');
    }
}
