<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pinjaman extends Model
{
    use HasFactory;

    public $incrementing = false; 

    protected $fillable = [
        'id',
        'peminjam',
        'jumlahPinjaman',
        'jumlahHarusDikembalikan',
        'sudahDibayar',
        'lunas',
        'disetujui',
    ];
}