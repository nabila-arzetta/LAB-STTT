<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdjustmentBarang extends Model
{
    protected $table = 'adjustment_barang';
    protected $fillable = ['barang_id','jumlah_awal','jumlah_akhir','selisih','keterangan','tanggal_adjustment'];

    public function barang()
    {
        return $this->belongsTo(Barang::class);
    }
}
