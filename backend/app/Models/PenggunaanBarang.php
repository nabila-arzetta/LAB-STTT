<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PenggunaanBarang extends Model
{
    protected $table = 'penggunaan_barang';
    protected $primaryKey = 'id_penggunaan';
    public $incrementing = true;
    protected $keyType = 'int';

    // Sesuaikan dengan apa yang controller expect (kode_ruangan, tanggal, keterangan, status)
    protected $fillable = [
        'kode_ruangan',
        'tanggal',
        'keterangan',
        'status',
        // jika ada: 'kode_bagian', 'catatan', dll
    ];

    // Jika tabel tidak menggunakan timestamps, set ke false. Jika ada created_at/updated_at, biarkan true.
    public $timestamps = true;

    public function bagian()
    {
        return $this->belongsTo(Bagian::class, 'kode_bagian', 'kode_bagian');
    }

    public function detailPenggunaan()
    {
        return $this->hasMany(DetailPenggunaanBarang::class, 'id_penggunaan', 'id_penggunaan');
    }
}
