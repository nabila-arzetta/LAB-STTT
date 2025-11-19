<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransferBarangDetail extends Model
{
    protected $table = 'transfer_barang_detail';
    public $timestamps = true;

    protected $fillable = [
        'id_transfer',
        'kode_barang',
        'quantity',
        'qty_approved',
    ];

    public function transfer()
    {
        return $this->belongsTo(TransferBarang::class, 'id_transfer', 'id_transfer');
    }

    public function barang()
    {
        // pastikan nama model barang kamu benar, misal: MasterBarang atau Barang
        return $this->belongsTo(MasterBarang::class, 'kode_barang', 'kode_barang');
    }
}
