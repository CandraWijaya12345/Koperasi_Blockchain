<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Web3\Web3;
use Web3\Contract;
use Web3\Providers\HttpProvider;
use Web3\RequestManagers\HttpRequestManager;
use App\Models\Pinjaman;
use Illuminate\Support\Facades\Log;

class ListenBlockchainEvents extends Command
{
    protected $signature = 'app:listen-blockchain-events';
    protected $description = 'Listen for smart contract events and sync to the database';

    public function handle()
    {
        $this->info("Memulai Event Listener...");

        try {
            $web3 = new Web3(new HttpProvider(new HttpRequestManager(config('services.infura.sepolia_url'), 30)));
            $koperasiAbi = file_get_contents(storage_path('app/abis/KoperasiSimpanPinjam.json'));
            $contract = new Contract($web3->provider, json_decode($koperasiAbi));
            $contractAddress = config('services.infura.koperasi_address');

            // Event signature for PinjamanDiajukan(uint256,address,uint256)
            $eventTopic = $web3->utils->sha3('PinjamanDiajukan(uint256,address,uint256)');
            $this->info("Mendengarkan event: PinjamanDiajukan");
            $this->line("Topic Hash: " . $eventTopic);

            // Memulai pemindaian dari blok saat ini
            $lastCheckedBlock = null;
            $web3->eth->blockNumber(function ($err, $blockNumber) use (&$lastCheckedBlock) {
                if ($err) {
                    $this->error("Tidak bisa mendapatkan nomor blok awal: " . $err->getMessage());
                    return;
                }
                $lastCheckedBlock = $blockNumber->toString();
                $this->info("Memulai pemindaian dari blok: " . $lastCheckedBlock);
            });

            if (!$lastCheckedBlock) {
                $this->error("Gagal memulai listener. Cek koneksi RPC.");
                return 1;
            }

            while (true) {
                $this->line("Memeriksa blok baru...");
                $web3->eth->getLogs([
                    'fromBlock' => '0x' . dechex($lastCheckedBlock + 1),
                    'toBlock' => 'latest',
                    'address' => $contractAddress,
                    'topics' => [$eventTopic]
                ], function ($err, $logs) {
                    if ($err !== null) {
                        $this->error("Error saat getLogs: " . $err->getMessage());
                        return;
                    }

                    if (count($logs) > 0) {
                        $this->info(count($logs) . " event baru ditemukan!");
                        foreach ($logs as $log) {
                            // topic[0] adalah signature, topic[1] adalah argumen indexed pertama, dst.
                            $idPinjaman = hexdec($log->topics[1]);
                            $this->info("Memproses event untuk Pinjaman ID: " . $idPinjaman);
                            $this->callDataPinjaman($idPinjaman);
                        }
                    }
                });

                // Perbarui nomor blok terakhir yang diperiksa
                $web3->eth->blockNumber(function ($err, $blockNumber) use (&$lastCheckedBlock) {
                    if ($err == null && $blockNumber) {
                        $newestBlock = $blockNumber->toString();
                        if ($newestBlock > $lastCheckedBlock) {
                            $lastCheckedBlock = $newestBlock;
                            $this->comment("Posisi blok diperbarui ke: " . $lastCheckedBlock);
                        }
                    }
                });

                sleep(15); // Tunggu 15 detik sebelum memeriksa lagi
            }
        } catch (\Exception $e) {
            $this->error("Listener berhenti karena error fatal: " . $e->getMessage());
            Log::error($e);
            return 1;
        }
    }

    private function callDataPinjaman($id)
    {
        try {
            $web3 = new Web3(new HttpProvider(new HttpRequestManager(config('services.infura.sepolia_url'), 30)));
            $koperasiAbi = file_get_contents(storage_path('app/abis/KoperasiSimpanPinjam.json'));
            $contract = new Contract($web3->provider, json_decode($koperasiAbi));

            $contract->at(config('services.infura.koperasi_address'))->call('dataPinjaman', $id, function ($err, $pinjamanData) use ($id) {
                if ($err) {
                    $this->error("Gagal mengambil detail pinjaman ID " . $id . ": " . $err->getMessage());
                    return;
                }

                if (!empty($pinjamanData) && isset($pinjamanData['peminjam'])) {
                    $this->info("Menyimpan detail Pinjaman ID " . $id . " ke database...");
                    try {
                        Pinjaman::updateOrCreate(
                            ['id' => $id],
                            [
                                'peminjam' => $pinjamanData['peminjam'],
                                'jumlahPinjaman' => $pinjamanData['jumlahPinjaman']->toString(),
                                'jumlahHarusDikembalikan' => $pinjamanData['jumlahHarusDikembalikan']->toString(),
                                'sudahDibayar' => $pinjamanData['sudahDibayar']->toString(),
                                'lunas' => $pinjamanData['lunas'],
                                'disetujui' => $pinjamanData['disetujui'],
                            ]
                        );
                        $this->info("Pinjaman ID " . $id . " berhasil disimpan.");
                    } catch (\Exception $dbException) {
                        $this->error("Gagal menyimpan ke database untuk ID " . $id . ": " . $dbException->getMessage());
                        Log::error($dbException);
                    }
                } else {
                    $this->warn("Data pinjaman kosong diterima dari kontrak untuk ID " . $id);
                }
            });
        } catch (\Exception $e) {
            $this->error("Exception di callDataPinjaman untuk ID " . $id . ": " . $e->getMessage());
            Log::error($e);
        }
    }
}
