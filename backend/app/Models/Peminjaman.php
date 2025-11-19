<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany; // <-- Tambahkan ini
use Illuminate\Database\Eloquent\Relations\BelongsTo; // <-- Tambahkan ini
use Illuminate\Database\Eloquent\Factories\HasFactory; // (Opsional, tapi best practice)

class Peminjaman extends Model
{
    use HasFactory; // (Opsional)

    protected $table = 'peminjaman';

    protected $fillable = [
        'user_id',
        'tujuan',
        'status',
        'tanggal_pinjam',
        'tanggal_kembali_estimasi',
        'tanggal_kembali_aktual',
    ];

    public function exemplars(): HasMany
    {
        // Relasi ini membaca 'peminjaman_id' di tabel 'barang_exemplars'
        return $this->hasMany(BarangExemplar::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}