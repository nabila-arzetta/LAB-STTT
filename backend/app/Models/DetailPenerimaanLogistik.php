<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetailPenerimaanLogistik extends Model
{
    protected $table = 'penerimaan_logistik_detail';
    protected $primaryKey = 'id_detail';

    protected $fillable = [
        'id_penerimaan',
        'kode_barang',
        'quantity',
    ];

    // PARENT
    public function parent()
    {
        return $this->belongsTo(PenerimaanLogistik::class, 'id_penerimaan', 'id_penerimaan');
    }

    // BARANG
    public function barang()
    {
        return $this->belongsTo(\App\Models\Barang::class, 'kode_barang', 'kode_barang');
    }
}
