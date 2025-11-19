<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetailPenggunaanBarang extends Model
{
    protected $table = 'penggunaan_barang_detail'; // FIXED
    protected $primaryKey = 'id';

    protected $fillable = [
        'id_penggunaan',
        'kode_barang',
        'quantity',
    ];

    public $timestamps = true; // tabel kamu ada created_at / updated_at

    public function barang()
    {
        return $this->belongsTo(Barang::class, 'kode_barang', 'kode_barang');
    }

    public function penggunaan()
    {
        return $this->belongsTo(PenggunaanBarang::class, 'id_penggunaan', 'id_penggunaan');
    }
}
