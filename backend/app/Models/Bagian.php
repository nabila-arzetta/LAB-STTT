<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bagian extends Model
{
    protected $table = 'bagian';
    protected $primaryKey = 'kode_bagian';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'kode_bagian', 'nama_bagian', 'deskripsi', 'status',
    ];

    // Tambahkan relasi ke tabel master_lab
    public function lab()
    {
        return $this->belongsTo(MasterLab::class, 'kode_lab', 'kode_lab');
    }
}
