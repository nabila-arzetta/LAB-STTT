<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Relations\BelongsTo;  

class BarangExemplar extends Model
{
    protected $table = 'barang_exemplars';

    protected $fillable = [
        'barang_id',
        'serial_number',
        'kondisi',
        'peminjaman_id', 
        'status'         
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->serial_number)) {
                // generate a new serial_number (global unique integer)
                $next = DB::table('barang_exemplars')->max('serial_number');
                $model->serial_number = ($next ?? 0) + 1;
            }
        });
    }

    public function barang(): BelongsTo
    {
        return $this->belongsTo(Barang::class);
    }

    public function peminjaman(): BelongsTo
    {
        return $this->belongsTo(Peminjaman::class);
    }
}