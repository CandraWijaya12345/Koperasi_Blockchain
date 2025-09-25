// src/Koperasi.jsx

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import KoperasiInfo from './KoperasiInfo';
import './Koperasi.css';

// Impor dan konstanta
import KOPERASI_ABI from './config/KoperasiSimpanPinjam.json';
import TOKEN_ABI from './config/IDRToken.json';

const KOPERASI_ADDRESS = "0xc97a30769b0A74fE0Dc2B4F95c19c17d326ACccc";
const TOKEN_ADDRESS = "0x8487cE53Ff7DC0228A15f75856A0268F670F931a";
const SIMPANAN_POKOK = ethers.parseUnits("100000", 18);
const SIMPANAN_WAJIB = ethers.parseUnits("25000", 18);

function Koperasi() {
  // State
  const [akun, setAkun] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [dataAnggota, setDataAnggota] = useState(null);
  const [saldoToken, setSaldoToken] = useState("0");
  const [dataPinjaman, setDataPinjaman] = useState(null);
  const [riwayatPinjaman, setRiwayatPinjaman] = useState([]);
  const [nama, setNama] = useState("");
  const [jumlahSetoran, setJumlahSetoran] = useState("");
  const [jumlahPinjaman, setJumlahPinjaman] = useState("");
  const [jumlahTarik, setJumlahTarik] = useState("");
  const [jumlahAngsuran, setJumlahAngsuran] = useState("");
  const [owner, setOwner] = useState(null);
  const [mintAddress, setMintAddress] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [pinjamanPending, setPinjamanPending] = useState([]);

  const muatDataAnggota = async (provider, akun) => {
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/anggota/${akun}`);
      const result = await response.json();
      if (result.success && result.data.terdaftar) {
        setDataAnggota(result.data);
        if (result.data.memiliki_pinjaman_aktif) {
          try {
            const pinjamanResponse = await fetch(`http://127.0.0.1:8000/api/pinjaman/aktif/${akun}`);
            const pinjamanResult = await pinjamanResponse.json();
            if (pinjamanResult.success) setDataPinjaman(pinjamanResult.data);
          } catch (e) {
            console.error("Gagal mengambil data pinjaman aktif:", e);
            setDataPinjaman(null);
          }
        } else {
          setDataPinjaman(null);
        }
      } else {
        setDataAnggota({ terdaftar: false });
      }
    } catch (error) {
      console.error("Gagal mengambil data dari API Laravel:", error);
      setDataAnggota({ terdaftar: false });
    }
    try {
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
      const saldo = await tokenContract.balanceOf(akun);
      setSaldoToken(ethers.formatUnits(saldo, 18));
    } catch (error) {
      console.error("Gagal mengambil saldo token:", error);
    }
    try {
      const riwayatResponse = await fetch(`http://127.0.0.1:8000/api/pinjaman/riwayat/${akun}`);
      const riwayatResult = await riwayatResponse.json();
      if (riwayatResult.success) setRiwayatPinjaman(riwayatResult.data);
    } catch (e) {
      console.error("Gagal mengambil riwayat pinjaman:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (provider && akun) {
      const getOwner = async () => {
        const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
        const contractOwner = await tokenContract.owner();
        setOwner(contractOwner);
      };
      getOwner();
      muatDataAnggota(provider, akun);
    }
  }, [provider, akun]);

  useEffect(() => {
    if (provider && akun && owner && akun.toLowerCase() === owner.toLowerCase()) {
      const muatPinjamanPending = async () => {
        try {
          const response = await fetch('http://127.0.0.1:8000/api/pinjaman/pending');
          const result = await response.json();
          if (result.success) setPinjamanPending(result.data);
        } catch (error) {
          console.error("Gagal mengambil pinjaman pending:", error);
        }
      };
      muatPinjamanPending();
    }
  }, [akun, owner, provider, loading]);

  async function hubungkanWallet() {
    if (window.ethereum && !isConnecting) {
      setIsConnecting(true);
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setProvider(provider);
        setAkun(accounts[0]);
      } catch (error) {
        console.error("Gagal menghubungkan wallet:", error);
        alert("Gagal menghubungkan wallet.");
      } finally {
        setIsConnecting(false);
      }
    } else {
      alert("Harap install MetaMask!");
    }
  }

  // === FUNGSI-FUNGSI TRANSAKSI ===
  async function handleApprove(jumlah) {
    if (!provider) { alert("Hubungkan wallet dulu!"); return false; }
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
      const tx = await tokenContract.approve(KOPERASI_ADDRESS, jumlah);
      await tx.wait();
      alert("Persetujuan (approve) berhasil!");
      setLoading(false);
      return true;
    } catch (error) {
      console.error("Gagal approve:", error);
      alert("Gagal memberikan persetujuan.");
      setLoading(false);
      return false;
    }
  }

  async function handleDaftar() {
    if (!nama) return alert("Nama tidak boleh kosong.");
    setLoading(true);
    try {
      const approveSukses = await handleApprove(SIMPANAN_POKOK);
      if (!approveSukses) { setLoading(false); return; }
      const signer = await provider.getSigner();
      const koperasiContract = new ethers.Contract(KOPERASI_ADDRESS, KOPERASI_ABI, signer);
      const txDaftar = await koperasiContract.daftarAnggota(nama);
      await txDaftar.wait();
      alert("Selamat, Anda berhasil terdaftar!");
      muatDataAnggota(provider, akun);
    } catch (error) {
      console.error("Proses pendaftaran gagal:", error);
    }
    setLoading(false);
  }

  async function handleSetorWajib() {
    setLoading(true);
    try {
      const approveSukses = await handleApprove(SIMPANAN_WAJIB);
      if (!approveSukses) { setLoading(false); return; }
      const signer = await provider.getSigner();
      const koperasiContract = new ethers.Contract(KOPERASI_ADDRESS, KOPERASI_ABI, signer);
      const tx = await koperasiContract.setorSimpananWajib();
      await tx.wait();
      alert("Setoran wajib berhasil!");
      muatDataAnggota(provider, akun);
    } catch (error) {
      console.error("Gagal setor wajib:", error);
      alert("Gagal melakukan setoran wajib.");
    }
    setLoading(false);
  }

  async function handleSetorSukarela() {
    if (!jumlahSetoran || parseFloat(jumlahSetoran) <= 0) return alert("Jumlah setoran tidak valid.");
    setLoading(true);
    try {
      const jumlahBN = ethers.parseUnits(jumlahSetoran, 18);
      const approveSukses = await handleApprove(jumlahBN);
      if (!approveSukses) { setLoading(false); return; }
      const signer = await provider.getSigner();
      const koperasiContract = new ethers.Contract(KOPERASI_ADDRESS, KOPERASI_ABI, signer);
      const tx = await koperasiContract.setorSimpananSukarela(jumlahBN);
      await tx.wait();
      alert("Setoran sukarela berhasil!");
      muatDataAnggota(provider, akun);
    } catch (error) {
      console.error("Gagal setor sukarela:", error);
      alert("Gagal melakukan setoran sukarela.");
    }
    setLoading(false);
  }

  async function handleAjukanPinjaman() {
    if (!jumlahPinjaman || parseFloat(jumlahPinjaman) <= 0) return alert("Jumlah pinjaman tidak valid.");
    setLoading(true);
    try {
      const jumlahBN = ethers.parseUnits(jumlahPinjaman, 18);
      const signer = await provider.getSigner();
      const koperasiContract = new ethers.Contract(KOPERASI_ADDRESS, KOPERASI_ABI, signer);
      const tx = await koperasiContract.ajukanPinjaman(jumlahBN);
      await tx.wait();
      alert("Pengajuan pinjaman berhasil dikirim! Mohon tunggu persetujuan admin.");
      muatDataAnggota(provider, akun);
    } catch (error) {
      console.error("Gagal mengajukan pinjaman:", error);
      alert("Gagal mengajukan pinjaman.");
    }
    setLoading(false);
  }

  async function handleTarikSukarela() {
    if (!jumlahTarik || parseFloat(jumlahTarik) <= 0) return alert("Jumlah penarikan tidak valid.");
    setLoading(true);
    try {
      const jumlahBN = ethers.parseUnits(jumlahTarik, 18);
      const signer = await provider.getSigner();
      const koperasiContract = new ethers.Contract(KOPERASI_ADDRESS, KOPERASI_ABI, signer);
      const tx = await koperasiContract.tarikSimpananSukarela(jumlahBN);
      await tx.wait();
      alert("Penarikan dana berhasil!");
      muatDataAnggota(provider, akun);
    } catch (error) {
      console.error("Gagal menarik dana:", error);
      alert("Gagal menarik dana.");
    }
    setLoading(false);
  }
  
  async function handleBayarAngsuran() {
    if (!jumlahAngsuran || parseFloat(jumlahAngsuran) <= 0) return alert("Jumlah angsuran tidak valid.");
    if (!dataPinjaman) return alert("Data pinjaman tidak ditemukan.");
    setLoading(true);
    try {
        const jumlahBN = ethers.parseUnits(jumlahAngsuran, 18);
        const approveSukses = await handleApprove(jumlahBN);
        if (!approveSukses) { setLoading(false); return; }
        const signer = await provider.getSigner();
        const koperasiContract = new ethers.Contract(KOPERASI_ADDRESS, KOPERASI_ABI, signer);
        const tx = await koperasiContract.bayarAngsuran(dataPinjaman.id, jumlahBN);
        await tx.wait();
        alert("Pembayaran angsuran berhasil!");
        muatDataAnggota(provider, akun);
    } catch (error) {
        console.error("Gagal bayar angsuran:", error);
        alert("Gagal membayar angsuran.");
    }
    setLoading(false);
  }

  async function handleMint() {
    if (!mintAddress || !mintAmount) return alert("Alamat dan jumlah harus diisi.");
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
      const amountBN = ethers.parseUnits(mintAmount, 18);
      const tx = await tokenContract.mint(mintAddress, amountBN);
      await tx.wait();
      alert(`Berhasil mengirim ${mintAmount} IDRT ke ${mintAddress}`);
    } catch (error) {
      console.error("Gagal mint:", error);
      alert("Gagal mengirim token.");
    }
    setLoading(false);
  }

  async function handleSetujuiPinjaman(idPinjaman) {
    if (!provider) return alert("Hubungkan wallet admin dulu!");
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const koperasiContract = new ethers.Contract(KOPERASI_ADDRESS, KOPERASI_ABI, signer);
      const tx = await koperasiContract.setujuiPinjaman(idPinjaman);
      await tx.wait();
      alert(`Pinjaman dengan ID ${idPinjaman} berhasil disetujui!`);
      muatDataAnggota(provider, akun);
    } catch (error) {
      console.error(`Gagal menyetujui pinjaman ${idPinjaman}:`, error);
      alert("Gagal menyetujui pinjaman.");
    }
    setLoading(false);
  }

  // === RENDER KOMPONEN ===
  const renderContent = () => {
    if (!akun) {
      return (
        <div>
          <hr />
          <p>Silakan hubungkan dompet MetaMask Anda untuk memulai.</p>
          <button onClick={hubungkanWallet} className="button-primary" disabled={isConnecting}>
            {isConnecting ? 'Menghubungkan...' : 'Hubungkan Wallet'}
          </button>
        </div>
      );
    }

    if (loading && !dataAnggota) {
        return <p>Memuat data anggota...</p>;
    }
    
    if (dataAnggota && dataAnggota.terdaftar) {
      return (
        <div>
          {owner && akun.toLowerCase() === owner.toLowerCase() && (
            <>
              <div className="card">
                <h3>Panel Admin: Mint Token</h3>
                <div className="form-group">
                  <input type="text" className="input-field" placeholder="Alamat penerima" value={mintAddress} onChange={(e) => setMintAddress(e.target.value)} />
                  <input type="text" className="input-field" placeholder="Jumlah token" value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} />
                  <button onClick={handleMint} className="button-primary" disabled={loading}>Mint Token</button>
                </div>
              </div>
              <div className="card">
                <h3>Panel Admin: Persetujuan Pinjaman</h3>
                {pinjamanPending.length > 0 ? (
                  <table className="riwayat-table">
                    <thead>
                      <tr>
                        <th>ID</th><th>Peminjam</th><th>Jumlah</th><th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pinjamanPending.map(p => (
                        <tr key={p.id}>
                          <td>{p.id}</td>
                          <td>{p.peminjam}</td>
                          <td>{ethers.formatUnits(p.jumlahPinjaman, 18)} IDRT</td>
                          <td>
                            <button onClick={() => handleSetujuiPinjaman(p.id)} className="button-primary" disabled={loading}>Setujui</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (<p>Tidak ada pengajuan pinjaman.</p>)}
              </div>
            </>
          )}

          <div className="card">
            <h3>Dasbor Anggota - {dataAnggota.nama}</h3>
            <p><strong>Alamat:</strong> {akun}</p>
            <p><strong>Saldo Dompet:</strong> {saldoToken} IDRT</p>
          </div>

          <div className="card">
            <h3>Rincian Simpanan</h3>
            <p>Simpanan Pokok: {ethers.formatUnits(dataAnggota.simpanan_pokok || "0", 18)} IDRT</p>
            <p>Simpanan Wajib: {ethers.formatUnits(dataAnggota.simpanan_wajib || "0", 18)} IDRT</p>
            <p>Simpanan Sukarela: {ethers.formatUnits(dataAnggota.simpanan_sukarela || "0", 18)} IDRT</p>
          </div>

          <div className="card">
              <h3>Aksi Simpanan</h3>
              <div className="form-group">
                  <button onClick={handleSetorWajib} className="button-primary" disabled={loading}>Setor Simpanan Wajib</button>
              </div>
              <div className="form-group">
                  <input type="number" className="input-field" placeholder="Jumlah setor sukarela" value={jumlahSetoran} onChange={(e) => setJumlahSetoran(e.target.value)} />
                  <button onClick={handleSetorSukarela} className="button-primary" disabled={loading}>Setor Sukarela</button>
              </div>
              <hr/>
              <div className="form-group">
                  <input type="number" className="input-field" placeholder="Jumlah tarik sukarela" value={jumlahTarik} onChange={(e) => setJumlahTarik(e.target.value)} />
                  <button onClick={handleTarikSukarela} className="button-primary" disabled={loading}>Tarik Saldo Sukarela</button>
              </div>
          </div>

          {dataAnggota.memiliki_pinjaman_aktif && dataPinjaman ? (
            <div className="card">
                <h3>Info Pinjaman Aktif (ID: {dataPinjaman.id})</h3>
                <p>Jumlah Pinjaman: {ethers.formatUnits(dataPinjaman.jumlahPinjaman, 18)} IDRT</p>
                <p>Total Harus Dikembalikan: {ethers.formatUnits(dataPinjaman.jumlahHarusDikembalikan, 18)} IDRT</p>
                <p>Sudah Dibayar: {ethers.formatUnits(dataPinjaman.sudahDibayar, 18)} IDRT</p>
                <div className="form-group">
                    <input type="number" className="input-field" placeholder="Jumlah angsuran" value={jumlahAngsuran} onChange={(e) => setJumlahAngsuran(e.target.value)} />
                    <button onClick={handleBayarAngsuran} className="button-primary" disabled={loading}>Bayar Angsuran</button>
                </div>
            </div>
          ) : (
            <div className="card">
                <h3>Aksi Pinjaman</h3>
                <div className="form-group">
                    <input type="number" className="input-field" placeholder="Jumlah pinjaman" value={jumlahPinjaman} onChange={(e) => setJumlahPinjaman(e.target.value)} />
                    <button onClick={handleAjukanPinjaman} className="button-primary" disabled={loading}>Ajukan Pinjaman</button>
                </div>
            </div>
          )}

          {riwayatPinjaman.length > 0 && (
            <div className="card">
                <h3>Riwayat Pinjaman (Lunas)</h3>
                <table className="riwayat-table">
                    <thead>
                        <tr>
                            <th>ID</th><th>Jumlah</th><th>Dikembalikan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {riwayatPinjaman.map(pinjaman => (
                            <tr key={pinjaman.id}>
                                <td>{pinjaman.id}</td>
                                <td>{ethers.formatUnits(pinjaman.jumlahPinjaman, 18)} IDRT</td>
                                <td>{ethers.formatUnits(pinjaman.jumlahHarusDikembalikan, 18)} IDRT</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="card">
        <h3>Formulir Pendaftaran Anggota</h3>
        <p>Anda belum terdaftar. Silakan isi nama untuk mendaftar.</p>
        <div className="form-group">
          <input type="text" className="input-field" placeholder="Masukkan nama Anda" value={nama} onChange={(e) => setNama(e.target.value)} disabled={loading} />
          <button onClick={handleDaftar} className="button-primary" disabled={loading}>
            {loading ? 'Memproses...' : 'Daftar Sekarang & Setor Simpanan Pokok'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="koperasi-container">
      <h1>Koperasi Digital</h1>
      <KoperasiInfo />
      {renderContent()}
    </div>
  );
}

export default Koperasi;