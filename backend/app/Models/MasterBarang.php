<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MasterBarang extends Model
{
    use HasFactory;

    protected $table = 'master_barang';
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'kode_barang',
        'nama_barang',
        'deskripsi',
        'satuan',
        'kode_ruangan',
    ];

    // === Relasi ke Barang (per lab)
    public function barang()
    {
        return $this->hasMany(Barang::class, 'master_barang_id', 'id');
    }

    // === Scope per-lab (kode_ruangan)
    public function scopeByLab($query, $kode)
    {
        return $query->where('kode_ruangan', $kode);
    }
}
