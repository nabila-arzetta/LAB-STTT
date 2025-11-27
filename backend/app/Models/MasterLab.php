<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MasterLab extends Model
{
    use HasFactory;

    protected $table = 'master_lab';
    protected $primaryKey = 'id_lab';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'kode_bagian',
        'kode_ruangan',
        'nama_lab',
        'deskripsi',
        'lokasi',
        'status',
        'created_by',
    ];

    // Relasi ke Bagian (Many-to-One)
    // Setiap lab bisa punya satu bagian (bisa null kalau tidak ada bagian)
    public function bagian()
    {
        return $this->belongsTo(Bagian::class, 'kode_bagian', 'kode_bagian');
    }

    // Relasi ke Barang (One-to-Many)
    // Satu lab memiliki banyak barang
    public function barang()
    {
        // Gunakan kode_ruangan sebagai penghubung jika sesuai di tabel master_barang
        return $this->hasMany(MasterBarang::class, 'kode_ruangan', 'kode_ruangan');
    }

    // Relasi ke User (One-to-Many)
    // Satu lab bisa dikelola oleh banyak user (admin_lab)
    public function users()
    {
        return $this->hasMany(User::class, 'kode_bagian', 'kode_bagian');
    }

    // Scope: hanya lab aktif
    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }
    
    public function getIsAktifAttribute()
    {
        return strtolower($this->status) === 'aktif';
    }
}
