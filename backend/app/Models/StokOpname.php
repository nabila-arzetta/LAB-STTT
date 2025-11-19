<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StokOpname extends Model
{
    protected $table = 'stok_opname';
    protected $fillable = ['barang_id','jumlah_sistem','jumlah_fisik','selisih','status_adjust','tanggal_opname'];

    public function barang()
    {
        return $this->belongsTo(Barang::class);
    }
}
