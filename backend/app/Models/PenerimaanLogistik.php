<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PenerimaanLogistik extends Model
{
    protected $table = 'penerimaan_logistik';
    protected $primaryKey = 'id_penerimaan';

    protected $fillable = [
        'kode_ruangan',
        'tanggal',
        'keterangan',
    ];

    // DETAIL
    public function detail()
    {
        return $this->hasMany(DetailPenerimaanLogistik::class, 'id_penerimaan', 'id_penerimaan');
    }

    // LAB
    public function lab()
    {
        return $this->belongsTo(\App\Models\MasterLab::class, 'kode_ruangan', 'kode_ruangan');
    }
}
