<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pinjamen', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->string('peminjam');
            $table->string('jumlahPinjaman');
            $table->string('jumlahHarusDikembalikan');
            $table->string('sudahDibayar')->default('0');
            $table->boolean('lunas')->default(false);
            $table->boolean('disetujui')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // PERBAIKAN: Ubah 'pinjaman' menjadi 'pinjamans'
        Schema::dropIfExists('pinjamen');
    }
};