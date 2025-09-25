<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Web3\Web3;
use Web3\Contract;
use Web3\Providers\HttpProvider;
use Web3\RequestManagers\HttpRequestManager;
use App\Models\Pinjaman;

class KoperasiController extends Controller
{
    protected $web3;
    protected $koperasiContract;

    public function __construct()
    {
        $requestManager = new HttpRequestManager(config('services.infura.sepolia_url'), 5);
        $this->web3 = new Web3(new HttpProvider($requestManager));
        $koperasiAbiString = file_get_contents(storage_path('app/abis/KoperasiSimpanPinjam.json'));
        $koperasiAbi = json_decode($koperasiAbiString);
        $this->koperasiContract = new Contract($this->web3->provider, $koperasiAbi);
    }

    public function getContractInfo()
    {
        try {
            $jumlahAnggota = null;
            $sukuBunga = null;

            $this->koperasiContract->at(config('services.infura.koperasi_address'))->call('jumlahAnggota', function ($err, $result) use (&$jumlahAnggota) {
                if ($err !== null) throw new \Exception($err->getMessage());
                if (!empty($result)) $jumlahAnggota = $result[0]->toString();
            });

            $this->koperasiContract->at(config('services.infura.koperasi_address'))->call('sukuBungaPersen', function ($err, $result) use (&$sukuBunga) {
                if ($err !== null) throw new \Exception($err->getMessage());
                if (!empty($result)) $sukuBunga = $result[0]->toString();
            });
            
            return response()->json([
                'success' => true,
                'data' => [
                    'jumlah_anggota' => $jumlahAnggota,
                    'suku_bunga_persen' => $sukuBunga,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Gagal getContractInfo: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal mengambil data dari kontrak.'], 500);
        }
    }

    public function getAnggotaDetail($alamat)
    {
        try {
            $anggotaData = null;
            $this->koperasiContract->at(config('services.infura.koperasi_address'))->call('dataAnggota', $alamat, function ($err, $result) use (&$anggotaData) {
                if ($err !== null) throw new \Exception($err->getMessage());
                $anggotaData = $result;
            });

            if (empty($anggotaData) || !isset($anggotaData['terdaftar'])) {
                if (isset($anggotaData['terdaftar']) && $anggotaData['terdaftar'] === false) {
                     return response()->json(['success' => true, 'data' => ['terdaftar' => false]]);
                }
                throw new \Exception('Kontrak tidak mengembalikan data anggota yang valid.');
            }

            $formattedData = [
                'terdaftar' => $anggotaData['terdaftar'],
                'nama' => $anggotaData['nama'],
                'simpanan_pokok' => $anggotaData['simpananPokok']->toString(),
                'simpanan_wajib' => $anggotaData['simpananWajib']->toString(),
                'simpanan_sukarela' => $anggotaData['simpananSukarela']->toString(),
                'memiliki_pinjaman_aktif' => $anggotaData['memilikiPinjamanAktif'],
            ];
            
            return response()->json(['success' => true, 'data' => $formattedData]);
        } catch (\Exception $e) {
            Log::error('Exception di getAnggotaDetail: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal mengambil data anggota. Cek laravel.log.'], 500);
        }
    }

    public function getPinjamanAktif($alamat)
    {
        $pinjaman = Pinjaman::where('peminjam', $alamat)
                            ->where('lunas', false)
                            ->orderBy('id', 'desc')
                            ->first();
        if ($pinjaman) {
            return response()->json(['success' => true, 'data' => $pinjaman]);
        }
        return response()->json(['success' => false, 'message' => 'Tidak ada pinjaman aktif ditemukan.'], 404);
    }

    public function getRiwayatPinjaman($alamat)
    {
        $riwayat = Pinjaman::where('peminjam', $alamat)
                            ->where('lunas', true)
                            ->orderBy('id', 'desc')
                            ->get();
        return response()->json(['success' => true, 'data' => $riwayat]);
    }

    public function getPinjamanPending()
    {
        $pending = Pinjaman::where('disetujui', false)
                            ->where('lunas', false)
                            ->orderBy('id', 'asc')
                            ->get();
        return response()->json(['success' => true, 'data' => $pending]);
    }
}