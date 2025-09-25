<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\KoperasiController;

Route::get('/', function () {
    return view('welcome');
});

