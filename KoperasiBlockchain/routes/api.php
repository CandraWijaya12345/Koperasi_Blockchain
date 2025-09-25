<?php

use App\Http\Controllers\KoperasiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/total-anggota', [KoperasiController::class, 'getTotalAnggota']);
Route::get('/info', [KoperasiController::class, 'getContractInfo']);
Route::get('/anggota/{alamat}', [KoperasiController::class, 'getAnggotaDetail']);
Route::get('/pinjaman/semua', [KoperasiController::class, 'getAllPinjaman']);
Route::get('/pinjaman/aktif/{alamat}', [KoperasiController::class, 'getPinjamanAktif']);
Route::get('/pinjaman/riwayat/{alamat}', [KoperasiController::class, 'getRiwayatPinjaman']);
Route::post('/pinjaman/setujui/{id}', [KoperasiController::class, 'setujuiPinjaman']); // Untuk Admin
Route::get('/pinjaman/pending', [KoperasiController::class, 'getPinjamanPending']);