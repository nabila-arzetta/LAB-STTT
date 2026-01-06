<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Barang extends Model
{
    protected $table = 'master_barang';

    protected $fillable = [
        'master_barang_id',
        'id_lab',
        'jumlah_tersedia',
        
        'tanggal_masuk',
        'tanggal_keluar',
        'status_barang'
    ];

   public function masterBarang()
   {
        return $this->belongsTo(MasterBarang::class, 'master_barang_id');
    }


    public function lab()
    {
        return $this->belongsTo(MasterLab::class, 'id_lab', 'id_lab');
    }

    public function bagian()
    {
        return $this->belongsTo(Bagian::class, 'kode_bagian', 'kode_bagian');
    }


    public function adjustments()
    {
        return $this->hasMany(AdjustmentBarang::class, 'barang_id');
    }

    public function opnames()
    {
        return $this->hasMany(StokOpname::class, 'barang_id');
    }

    public function exemplars()
    {
        return $this->hasMany(BarangExemplar::class, 'barang_id');
    }
}
