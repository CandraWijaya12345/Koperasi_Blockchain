// hooks/useKoperasi.js
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import {
  KOPERASI_CONTRACT_ADDRESS,
  IDRTOKEN_CONTRACT_ADDRESS,
} from '../utils/constants';
import { formatToken, parseToken, formatCurrency } from '../utils/format';

import KoperasiABI from '../abi/koperasisimpanpinjambaru.json';
import IDRTokenABI from '../abi/idrtokenbaru.json';

export const useKoperasi = (account) => {
  const [koperasiContract, setKoperasiContract] = useState(null);
  const [idrTokenContract, setIdrTokenContract] = useState(null);

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isPengurus, setIsPengurus] = useState(false);
  const [anggotaData, setAnggotaData] = useState(null);
  const [idrtBalance, setIdrtBalance] = useState('0');
  const [totalSimpanan, setTotalSimpanan] = useState('0');
  const [pinjamanAktif, setPinjamanAktif] = useState(null);
  const [history, setHistory] = useState([]);
  const [pendingLoanUser, setPendingLoanUser] = useState(null);
  const [pendingLoans, setPendingLoans] = useState([]);
  const [approvedTodayCount, setApprovedTodayCount] = useState(0);

  // Admin Data
  const [allLoans, setAllLoans] = useState({ pending: [], active: [], paid: [], rejected: [] });
  const [adminConfig, setAdminConfig] = useState({ bunga: 0, denda: 0 });

  // --- helper untuk approval token ---
  // --- helper untuk approval token ---
  // --- helper untuk approval token ---
  const handleApprove = async (amount, onProgress) => {
    if (!idrTokenContract || !account) return false;
    try {
      if (onProgress) onProgress('Meminta izin penggunaan token...');
      const allowance = await idrTokenContract.allowance(
        account,
        KOPERASI_CONTRACT_ADDRESS
      );
      if (allowance < amount) {
        if (onProgress) onProgress('Menunggu konfirmasi approval di wallet...');
        const tx = await idrTokenContract.approve(
          KOPERASI_CONTRACT_ADDRESS,
          amount
        );
        if (onProgress) onProgress('Menunggu transaksi approval dikonfirmasi...');
        await tx.wait();
      }
      if (onProgress) onProgress('Approval berhasil!');
      return true;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Helper: Cek Saldo User Sebelum Transaksi
  const checkBalance = async (requiredAmount) => {
    if (!idrTokenContract || !account) throw new Error("Wallet belum terhubung");
    const bal = await idrTokenContract.balanceOf(account);
    if (bal < requiredAmount) {
      throw new Error(`Saldo IDRT Kurang! Butuh ${formatToken(requiredAmount)} IDRT, Saldo Anda: ${formatToken(bal)}`);
    }
  };

  // --- history user ---
  const fetchHistory = async (addr, kop) => {
    if (!addr || !kop) return;
    try {
      // Karena parameter address di event Pinjaman tidak indexed, kita fetch semua lalu filter manual
      const filterSimpanan = kop.filters.SimpananMasuk(null);
      const filterTarik = kop.filters.PenarikanSukses(null);
      const filterAjukan = kop.filters.PinjamanDiajukan(null, null);
      const filterDisetujui = kop.filters.PinjamanDisetujui(null, null);
      const filterBayar = kop.filters.AngsuranDibayar(null, null);
      const filterLunas = kop.filters.PinjamanLunas(null, null);
      const filterDitolak = kop.filters.PinjamanDitolak(null, null);

      const [
        allSimpanan,
        allTarik,
        allAjukan,
        allDisetujui,
        allBayar,
        allLunas,
        allDitolak
      ] = await Promise.all([
        kop.queryFilter(filterSimpanan, 0, 'latest'),
        kop.queryFilter(filterTarik, 0, 'latest'),
        kop.queryFilter(filterAjukan, 0, 'latest'),
        kop.queryFilter(filterDisetujui, 0, 'latest'),
        kop.queryFilter(filterBayar, 0, 'latest'),
        kop.queryFilter(filterLunas, 0, 'latest'),
        kop.queryFilter(filterDitolak, 0, 'latest'),
      ]);

      // Filter manual by address (safe comparison)
      const userAddr = addr.toLowerCase();
      const logSimpanan = allSimpanan.filter(l => l.args.dari.toLowerCase() === userAddr);
      const logTarik = allTarik.filter(l => l.args.oleh.toLowerCase() === userAddr);
      const logAjukan = allAjukan.filter(l => l.args.peminjam.toLowerCase() === userAddr);
      const logDisetujui = allDisetujui.filter(l => l.args.peminjam.toLowerCase() === userAddr);
      const logBayar = allBayar.filter(l => l.args.peminjam.toLowerCase() === userAddr);
      const logLunas = allLunas.filter(l => l.args.peminjam.toLowerCase() === userAddr);
      const logDitolak = allDitolak.filter(l => l.args.peminjam.toLowerCase() === userAddr);

      const allLogs = [
        ...logSimpanan,
        ...logTarik,
        ...logAjukan,
        ...logDisetujui,
        ...logBayar,
        ...logLunas,
        ...logDitolak,
      ];
      // Fetch timestamps for all logs
      const allLogsWithTime = await Promise.all(allLogs.map(async (l) => {
        let ts;
        // If event has valid 'waktu' arg, use it. But safer to assume most don't or fallback.
        // Ethers Result access: l.args.waktu might be undefined if not in ABI.
        if (l.args.waktu) {
          ts = Number(l.args.waktu);
        } else {
          try {
            const block = await l.getBlock();
            ts = block.timestamp;
          } catch (e) {
            console.error("Err fetch block history:", e);
            ts = 0;
          }
        }
        l.extractedTimestamp = ts;
        return l;
      }));

      // Sort by timestamp if available, else blockNumber logic
      allLogsWithTime.sort((a, b) => {
        if (b.extractedTimestamp !== a.extractedTimestamp) {
          return b.extractedTimestamp - a.extractedTimestamp;
        }
        if (b.blockNumber !== a.blockNumber) {
          return b.blockNumber - a.blockNumber;
        }
        return b.transactionIndex - a.transactionIndex;
      });

      setHistory(allLogsWithTime);

      // pending loan user
      try {
        const approvedIdsUser = new Set(
          logDisetujui.map((l) => Number(l.args.id))
        );
        const lunasIdsUser = new Set(
          logLunas.map((l) => Number(l.args.id))
        );
        const ditolakIdsUser = new Set(
          logDitolak.map((l) => Number(l.args.id))
        );

        const pendingUser = logAjukan.filter((l) => {
          if (l.args.id === undefined) return false;
          const id = Number(l.args.id);
          return !approvedIdsUser.has(id) && !lunasIdsUser.has(id) && !ditolakIdsUser.has(id);
        });

        pendingUser.sort((a, b) => b.blockNumber - a.blockNumber);

        const latestPending = pendingUser[0];
        if (latestPending) {
          // Fetch timestamp for the latest pending loan
          try {
            if (latestPending.args.waktu) {
              latestPending.extractedTimestamp = Number(latestPending.args.waktu);
            } else {
              const block = await latestPending.getBlock();
              latestPending.extractedTimestamp = block.timestamp;
            }
          } catch (e) {
            console.error("Err fetch block pending user:", e);
            latestPending.extractedTimestamp = 0;
          }
        }

        setPendingLoanUser(latestPending || null);
      } catch (e) {
        console.error('Gagal olah pending user:', e);
        setPendingLoanUser(null);
      }
      setMessage('');
    } catch (err) {
      console.error('Gagal ambil history:', err);
      setMessage('Gagal mengambil riwayat');
    }
  };


  // --- ADMIN: Fetch All Loans via Events ---
  const fetchAllLoansAdmin = async (kop) => {
    if (!kop) return;
    try {
      const filterAjukan = kop.filters.PinjamanDiajukan(null, null);
      const filterDisetujui = kop.filters.PinjamanDisetujui(null, null);
      const filterLunas = kop.filters.PinjamanLunas(null, null);
      const filterDitolak = kop.filters.PinjamanDitolak(null, null);

      const [logsAjukan, logsDisetujui, logsLunas, logsDitolak] = await Promise.all([
        kop.queryFilter(filterAjukan, 0, 'latest'),
        kop.queryFilter(filterDisetujui, 0, 'latest'),
        kop.queryFilter(filterLunas, 0, 'latest'),
        kop.queryFilter(filterDitolak, 0, 'latest'),
      ]);

      // Normalize logs with timestamps
      const enhanceLogs = async (logs) => {
        return Promise.all(logs.map(async (l) => {
          let ts = 0;
          if (l.args.waktu) ts = Number(l.args.waktu);
          else if (l.args.jatuhTempo) ts = Number(l.args.jatuhTempo); // for Disetujui (it has jatuhTempo, not waktu)
          else {
            try { const b = await l.getBlock(); ts = b.timestamp; } catch (e) { ts = 0; }
          }
          l.extractedTimestamp = ts;
          return l;
        }));
      };

      const [enhancedAjukan, enhancedDisetujui, enhancedLunas, enhancedDitolak] = await Promise.all([
        enhanceLogs(logsAjukan),
        enhanceLogs(logsDisetujui),
        enhanceLogs(logsLunas),
        enhanceLogs(logsDitolak)
      ]);

      // Sets of IDs
      const approvedIds = new Set(logsDisetujui.map(l => Number(l.args.id)));
      const lunasIds = new Set(logsLunas.map(l => Number(l.args.id)));
      const ditolakIds = new Set(logsDitolak.map(l => Number(l.args.id)));

      // Categorize
      const pending = enhancedAjukan.filter(l => {
        const id = Number(l.args.id);
        return !approvedIds.has(id) && !lunasIds.has(id) && !ditolakIds.has(id);
      }).sort((a, b) => b.extractedTimestamp - a.extractedTimestamp);

      const active = enhancedDisetujui.filter(l => {
        const id = Number(l.args.id);
        return approvedIds.has(id) && !lunasIds.has(id); // Approved but not Lunas
      }).sort((a, b) => b.extractedTimestamp - a.extractedTimestamp);

      const paid = enhancedLunas.sort((a, b) => b.extractedTimestamp - a.extractedTimestamp);
      const rejected = enhancedDitolak.sort((a, b) => b.extractedTimestamp - a.extractedTimestamp);
      setAllLoans({ pending, active, paid, rejected });
      setPendingLoans(pending); // Keep this for backward compat if needed

      // Count Approved Today
      const now = new Date();
      const options = { timeZone: 'Asia/Makassar', year: 'numeric', month: 'numeric', day: 'numeric' };
      const todayStr = now.toLocaleDateString('id-ID', options);
      let todayCount = 0;
      enhancedDisetujui.forEach(l => {
        const d = new Date(l.extractedTimestamp * 1000);
        if (d.toLocaleDateString('id-ID', options) === todayStr) todayCount++;
      });
      setApprovedTodayCount(todayCount);

    } catch (err) {
      console.error('Gagal fetch all loans:', err);
    }
  };

  // --- ADMIN: SHU & FUNDS ---
  const [adminStats, setAdminStats] = useState({
    profitBelumDibagi: 0,
    totalSHUDibagikan: 0,
    totalSimpanan: 0,
    contractBalance: 0
  });

  const [shuHistory, setShuHistory] = useState([]);

  const fetchSHUHistory = async (kop) => {
    if (!kop) return;
    try {
      const filter = kop.filters.SHUDidistribusikan(null, null);
      const logs = await kop.queryFilter(filter, 0, 'latest');

      const historyWithTime = await Promise.all(logs.map(async (l) => {
        let ts = 0;
        if (l.args.waktu) ts = Number(l.args.waktu);
        else {
          try { const b = await l.getBlock(); ts = b.timestamp; } catch (e) { ts = 0; }
        }
        return {
          total: l.args.totalSHUBaru, // or args[0]
          timestamp: ts,
          txHash: l.transactionHash
        };
      }));

      historyWithTime.sort((a, b) => b.timestamp - a.timestamp);
      historyWithTime.sort((a, b) => b.timestamp - a.timestamp);
      setShuHistory(historyWithTime);
    } catch (e) {
      console.error("Gagal fetch history SHU:", e);
    }
  };

  // --- ADMIN: Simpanan Wajib Monitoring ---
  const [allSimpananLogs, setAllSimpananLogs] = useState([]);

  const fetchAllSimpananLogs = async (kop) => {
    if (!kop) return;
    try {
      const filter = kop.filters.SimpananMasuk(null);
      const logs = await kop.queryFilter(filter, 0, 'latest');

      const enhanced = await Promise.all(logs.map(async (l) => {
        let ts = 0;
        if (l.args.waktu) ts = Number(l.args.waktu);
        else {
          try { const b = await l.getBlock(); ts = b.timestamp; } catch { ts = 0; }
        }
        return {
          dari: l.args.dari,
          jenis: l.args.jenisSimpanan, // or l.args[2]
          jumlah: l.args.jumlah,
          timestamp: ts
        };
      }));
      setAllSimpananLogs(enhanced);
    } catch (e) {
      console.error("Gagal fetch all simpanan:", e);
    }
  };

  const fetchAdminStats = async (kop, token) => {
    if (!kop || !token) return;
    try {
      const profit = await kop.profitBelumDibagi();
      const shared = await kop.totalSHUDibagikan();
      const totalSimp = await kop.totalSimpananSeluruhAnggota();
      const bal = await token.balanceOf(KOPERASI_CONTRACT_ADDRESS);

      setAdminStats({
        profitBelumDibagi: formatToken(profit),
        totalSHUDibagikan: formatToken(shared),
        totalSimpanan: formatToken(totalSimp),
        contractBalance: formatToken(bal),
        // raw values for calculation
        rawProfit: profit,
        rawTotalSimpanan: totalSimp
      });

      await fetchSHUHistory(kop);
    } catch (e) {
      console.error("Gagal fetch admin stats:", e);
    }
  };

  const bagikanSHU = async (onProgress) => {
    if (!koperasiContract || !idrTokenContract) throw new Error("Kontrak belum siap");

    try {
      if (onProgress) onProgress("Memeriksa profit & likuiditas...");
      const profit = await koperasiContract.profitBelumDibagi();
      if (Number(profit) <= 0) throw new Error("Belum ada profit untuk dibagikan.");

      const bal = await idrTokenContract.balanceOf(koperasiContract.target);
      if (bal < profit) {
        throw new Error(`Likuiditas Kurang! Profit: ${formatToken(profit)}, Saldo Kontrak: ${formatToken(bal)}. Silahkan tambah likuiditas.`);
      }

      if (onProgress) onProgress("Membagikan SHU...");
      const tx = await koperasiContract.bagikanSHU();
      if (onProgress) onProgress("Menunggu konfirmasi...");
      await tx.wait();
      await fetchAdminStats(koperasiContract, idrTokenContract);
      return tx;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const emergencyWithdraw = async (tokenAddr, amountStr, onProgress) => {
    if (!koperasiContract || !idrTokenContract) throw new Error("Kontrak belum siap");
    try {
      const amount = parseToken(amountStr);

      // Cek saldo kontrak dulu
      if (onProgress) onProgress("Memeriksa saldo kontrak...");
      const bal = await idrTokenContract.balanceOf(koperasiContract.target);
      if (bal < amount) {
        throw new Error(`Saldo Kontrak Kurang! Saldo: ${formatToken(bal)}, Tarik: ${formatToken(amount)}`);
      }

      if (onProgress) onProgress("Menarik dana...");
      const tx = await koperasiContract.emergencyWithdraw(tokenAddr, amount);
      if (onProgress) onProgress("Menunggu konfirmasi...");
      await tx.wait();
      await fetchAdminStats(koperasiContract, idrTokenContract);
      return tx;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const fetchAdminConfig = async (kop) => {
    if (!kop) return;
    try {
      const bunga = await kop.sukuBungaBulanPersen();
      const denda = await kop.dendaHarianPermil();
      setAdminConfig({
        bunga: Number(bunga),
        denda: Number(denda)
      });
    } catch (e) {
      console.error("Gagal fetch config:", e);
    }
  };

  // --- Actions Admin ---
  const setSukuBunga = async (persen, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");
    if (onProgress) onProgress("Mengupdate suku bunga...");
    const tx = await koperasiContract.setSukuBunga(persen);
    if (onProgress) onProgress("Menunggu konfirmasi...");
    await tx.wait();
    await fetchAdminConfig(koperasiContract);
    return tx;
  };

  const setDendaHarian = async (permil, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");
    if (onProgress) onProgress("Mengupdate denda harian...");
    const tx = await koperasiContract.setDendaHarian(permil);
    if (onProgress) onProgress("Menunggu konfirmasi...");
    await tx.wait();
    await fetchAdminConfig(koperasiContract);
    return tx;
  };



  // --- data utama user ---
  const fetchUserData = async (addr, kop, token) => {
    if (!addr || !kop || !token) return;
    try {
      setMessage('Memuat data...');
      const balance = await token.balanceOf(addr);
      setIdrtBalance(formatToken(balance));

      const pengurus = await kop.isPengurus(addr);
      setIsPengurus(pengurus);

      const data = await kop.dataAnggota(addr);
      setAnggotaData(data);

      if (data.terdaftar) {
        // const simpanan = await kop.getTotalSimpananAnggota(addr); // Function removed in new ABI
        const total = data.simpananPokok + data.simpananWajib + data.simpananSukarela;
        setTotalSimpanan(formatToken(total));

        const idPinjamanAktif = await kop.idPinjamanAktifAnggota(addr);
        if (Number(idPinjamanAktif) > 0) {
          const pinjaman = await kop.dataPinjaman(idPinjamanAktif);
          // Map enum status to booleans for UI compatibility
          // Status: 0=Diajukan, 1=Disetujui, 2=Lunas, 3=Ditolak
          const st = Number(pinjaman.status);
          const mappedPinjaman = {
            id: pinjaman.id || pinjaman[0],
            peminjam: pinjaman.peminjam || pinjaman[1],
            jumlahPinjaman: pinjaman.jumlahPinjaman || pinjaman[2],
            jumlahHarusDikembalikan: pinjaman.jumlahHarusDikembalikan || pinjaman[3],
            sudahDibayar: pinjaman.sudahDibayar || pinjaman[4],
            tenorBulan: pinjaman.tenorBulan || pinjaman[5],
            waktuJatuhTempo: pinjaman.waktuJatuhTempo || pinjaman[6],
            bungaPersenSaatIni: pinjaman.bungaPersenSaatIni || pinjaman[7],
            terakhirDendaDiupdate: pinjaman.terakhirDendaDiupdate || pinjaman[8],
            status: st,
            lunas: st === 2,
            disetujui: st === 1 || st === 2
          };

          // Only treat as Active Loan if Status is Disetujui (1) or Lunas (2)
          // If Pending (0) or Rejected (3), do not set as pinjamanAktif
          if (st === 1 || st === 2) {
            setPinjamanAktif(mappedPinjaman);
          } else {
            setPinjamanAktif(null);
          }
        } else {
          setPinjamanAktif(null);
        }

        await fetchHistory(addr, kop);
      } else {
        setPinjamanAktif(null);
        setPendingLoanUser(null);
      }

      if (pengurus) {
        await fetchAllLoansAdmin(kop);
      } else {
        setPendingLoans([]);
      }

      setMessage('');
    } catch (err) {
      console.error(err);
      setMessage('Gagal mengambil data: ' + (err.data?.message || err.message));
    }
  };

  // --- fetch all members (admin) ---
  const [memberList, setMemberList] = useState([]);

  const fetchAllMembers = async (kop) => {
    if (!kop) return;
    try {
      const count = await kop.jumlahAnggota();
      const total = Number(count);
      const members = [];
      for (let i = 0; i < total; i++) {
        const addr = await kop.listAlamatAnggota(i);
        const data = await kop.dataAnggota(addr);
        // Ethers Result array-like structure needing explicit access or proper conversion
        members.push({
          address: addr,
          nama: data.nama,
          simpananPokok: data.simpananPokok,
          simpananWajib: data.simpananWajib,
          simpananSukarela: data.simpananSukarela,
          terdaftar: data.terdaftar
        });
      }
      setMemberList(members);
    } catch (err) {
      console.error('Gagal fetch member list:', err);
    }
  };

  const mintToken = async (to, amountStr, onProgress) => {
    if (!idrTokenContract) throw new Error("Kontrak belum siap");
    try {
      const amount = parseToken(amountStr);
      if (onProgress) onProgress('Meminta konfirmasi minting...');
      const tx = await idrTokenContract.mint(to, amount);
      if (onProgress) onProgress('Menunggu transaksi minting dikonfirmasi...');
      await tx.wait();

      // Refresh data
      if (to === account) {
        const bal = await idrTokenContract.balanceOf(account);
        setIdrtBalance(formatToken(bal));
      }
      return tx;
    } catch (err) {
      console.error('Minting gagal:', err);
      throw err;
    }
  };

  // --- inisialisasi kontrak ketika account ada ---
  useEffect(() => {
    const init = async () => {
      if (!account || !window.ethereum) return;
      setIsLoading(true);
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const kop = new ethers.Contract(
          KOPERASI_CONTRACT_ADDRESS,
          KoperasiABI.abi || KoperasiABI,
          signer
        );
        const token = new ethers.Contract(
          IDRTOKEN_CONTRACT_ADDRESS,
          IDRTokenABI.abi,
          signer
        );

        setKoperasiContract(kop);
        setIdrTokenContract(token);

        await fetchUserData(account, kop, token);

        // Check if admin, then fetch all members
        const isPengurusVal = await kop.isPengurus(account);
        if (isPengurusVal) {
          // Trigger Admin Fetches
          await fetchAllLoansAdmin(kop);
          await fetchAllMembers(kop);
          await fetchAllSimpananLogs(kop); // New
          await fetchAdminConfig(kop);
          await fetchAdminStats(kop, token);
        }

      } catch (err) {
        console.error('Gagal init koperasi:', err);
        setMessage('Gagal inisialisasi kontrak');
      } finally {
        setIsLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  // --- actions exposed ke UI ---

  const mintTesting = async () => {
    if (!idrTokenContract || !account) {
      setMessage('Hubungkan wallet terlebih dahulu');
      return;
    }
    setIsLoading(true);
    setMessage('Memproses minting...');
    try {
      const amount = parseToken('1000000');
      const tx = await idrTokenContract.mint(account, amount);
      await tx.wait();
      setMessage('Minting berhasil!');
      await fetchUserData(account, koperasiContract, idrTokenContract);
    } catch (err) {
      console.error(err);
      if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        setMessage('Minting dibatalkan');
      } else {
        setMessage('Minting gagal: ' + (err.data?.message || err.message));
      }
    }
    setIsLoading(false);
  };

  const daftarAnggota = async (nama, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");
    if (!nama) throw new Error("Nama tidak boleh kosong");

    try {
      const biayaPokok = await koperasiContract.SIMPANAN_POKOK();

      // 1. Cek Saldo User
      if (onProgress) onProgress('Memeriksa saldo wallet...');
      await checkBalance(biayaPokok);

      // 2. Approve
      const approve = await handleApprove(biayaPokok, onProgress);
      if (!approve) throw new Error("Approval gagal");

      if (onProgress) onProgress('Mengirim transaksi pendaftaran...');
      // Gas limit manual untuk cegah estimasi error
      const tx = await koperasiContract.daftarAnggota(nama, { gasLimit: 500000 });
      if (onProgress) onProgress('Menunggu konfirmasi pendaftaran...');
      await tx.wait();

      await fetchUserData(account, koperasiContract, idrTokenContract);
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const setorSimpananWajib = async (onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");

    try {
      if (onProgress) onProgress('Mengambil info biaya...');
      const jumlah = await koperasiContract.SIMPANAN_WAJIB();

      // 1. Cek Saldo User
      if (onProgress) onProgress('Memeriksa saldo wallet...');
      await checkBalance(jumlah);

      // 2. Approve
      const approve = await handleApprove(jumlah, onProgress);
      if (!approve) throw new Error("Approval gagal");

      if (onProgress) onProgress('Mengirim simpanan wajib...');
      const tx = await koperasiContract.setorSimpananWajib({ gasLimit: 500000 });
      if (onProgress) onProgress('Menunggu konfirmasi...');
      await tx.wait();

      await fetchUserData(account, koperasiContract, idrTokenContract);
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const setorSimpananSukarela = async (jumlahStr, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");

    try {
      const jumlah = parseToken(jumlahStr || '0');

      // 1. Cek Saldo User
      if (onProgress) onProgress('Memeriksa saldo wallet...');
      await checkBalance(jumlah);

      // 2. Approve
      const approve = await handleApprove(jumlah, onProgress);
      if (!approve) throw new Error("Approval gagal");

      if (onProgress) onProgress('Mengirim setoran...');
      const tx = await koperasiContract.setorSimpananSukarela(jumlah, { gasLimit: 500000 });
      if (onProgress) onProgress('Menunggu konfirmasi setoran...');
      await tx.wait();

      await fetchUserData(account, koperasiContract, idrTokenContract);
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const ajukanPinjaman = async (jumlahStr, tenorBulan, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");

    try {
      const jumlah = parseToken(jumlahStr || '0');
      const tenor = BigInt(tenorBulan || 12); // Default 12 bulan jika tidak ada

      // DATA BARU: Validasi Client-Side untuk mencegah error gas
      if (pinjamanAktif && (pinjamanAktif.lunas === false || pinjamanAktif.lunas === undefined)) {
        throw new Error('Anda masih memiliki pinjaman aktif!');
      }

      if (anggotaData) {
        const totalSimpanan = anggotaData.simpananPokok + anggotaData.simpananWajib + anggotaData.simpananSukarela;
        const limit = totalSimpanan * 3n;
        if (jumlah > limit) {
          throw new Error(`Melebihi limit! Maks 3x Simpanan (${formatToken(limit)} IDRT)`);
        }
      }

      if (onProgress) onProgress('Mengirim pengajuan pinjaman...');
      const tx = await koperasiContract.ajukanPinjaman(jumlah, tenor);
      if (onProgress) onProgress('Menunggu konfirmasi pengajuan...');
      await tx.wait();

      await fetchUserData(account, koperasiContract, idrTokenContract);
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const bayarAngsuran = async (jumlahStr, onProgress) => {
    if (!koperasiContract || !pinjamanAktif) throw new Error("Data tidak valid");

    try {
      const jumlah = parseToken(jumlahStr || '0');
      if (jumlah <= 0n) throw new Error('Jumlah harus lebih dari 0');

      const sisaUtang =
        pinjamanAktif.jumlahHarusDikembalikan - pinjamanAktif.sudahDibayar;
      if (jumlah > sisaUtang) {
        throw new Error('Jumlah melebihi sisa utang');
      }

      // 1. Cek Saldo User
      if (onProgress) onProgress('Memeriksa saldo wallet...');
      await checkBalance(jumlah);

      // 2. Approve
      const approve = await handleApprove(jumlah, onProgress);
      if (!approve) throw new Error("Approval gagal");

      if (onProgress) onProgress('Mengirim pembayaran...');
      const tx = await koperasiContract.bayarAngsuran(
        Number(pinjamanAktif.id),
        jumlah,
        { gasLimit: 600000 }
      );
      if (onProgress) onProgress('Menunggu konfirmasi pembayaran...');
      await tx.wait();

      await fetchUserData(account, koperasiContract, idrTokenContract);
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const tarikSimpanan = async (jumlahStr, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");

    try {
      const jumlah = parseToken(jumlahStr || '0');

      // Validasi basic client side
      if (anggotaData) {
        // Simpanan Wajib tidak bisa ditarik sembarangan (logic kontrak)
        // Simpanan Pokok hanya bisa ditarik saat keluar
        // Simpanan Sukarela bisa ditarik
        const sukarela = BigInt(anggotaData.simpananSukarela);
        if (jumlah > sukarela) {
          throw new Error(`Saldo Sukarela tidak cukup! Tersedia: ${formatToken(sukarela)}`);
        }
      }

      if (onProgress) onProgress('Mengirim permintaan penarikan...');
      // Panggil fungsi smart contract
      const tx = await koperasiContract.tarikSimpananSukarela(jumlah, { gasLimit: 500000 });

      if (onProgress) onProgress('Menunggu konfirmasi penarikan...');
      await tx.wait();

      await fetchUserData(account, koperasiContract, idrTokenContract);
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const setujuiPinjaman = async (idStr, onProgress) => {
    if (!koperasiContract || !idrTokenContract) throw new Error("Kontrak belum siap");

    try {
      // 1. Check Liquidity First
      if (onProgress) onProgress('Memeriksa likuiditas koperasi...');
      const loanData = await koperasiContract.dataPinjaman(idStr);
      const contractBalance = await idrTokenContract.balanceOf(koperasiContract.target);

      const needed = loanData.jumlahPinjaman; // BigInt
      if (contractBalance < needed) {
        throw new Error(`Likuiditas Koperasi Kurang! Butuh ${formatCurrency(formatToken(needed))} IDRT, Saldo: ${formatCurrency(formatToken(contractBalance))} IDRT. Silahkan 'Tambah Likuiditas' di menu Manajemen Dana.`);
      }

      // 2. Execute Approval
      if (onProgress) onProgress('Mengirim persetujuan...');
      // Note: Gas limit increased to handle complex state changes
      const tx = await koperasiContract.setujuiPinjaman(idStr, { gasLimit: 800000 });
      if (onProgress) onProgress('Menunggu konfirmasi persetujuan...');
      await tx.wait();

      await fetchUserData(account, koperasiContract, idrTokenContract);
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const tolakPinjaman = async (idStr, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");
    try {
      if (onProgress) onProgress('Mengirim penolakan...');
      const tx = await koperasiContract.tolakPinjaman(idStr);
      if (onProgress) onProgress('Menunggu konfirmasi penolakan...');
      await tx.wait();

      await fetchUserData(account, koperasiContract, idrTokenContract);
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const tambahLikuiditas = async (amountStr, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");
    try {
      const amount = parseToken(amountStr);

      // 1. Cek Saldo Admin
      if (onProgress) onProgress('Memeriksa saldo wallet...');
      await checkBalance(amount);

      // 2. Approve Token Transfer
      const approve = await handleApprove(amount, onProgress);
      if (!approve) throw new Error("Approval gagal");

      // 3. Execute Contract Call
      if (onProgress) onProgress('Menambah likuiditas...');
      const tx = await koperasiContract.tambahLikuiditas(amount, { gasLimit: 500000 });
      if (onProgress) onProgress('Menunggu konfirmasi...');
      await tx.wait();

      await fetchUserData(account, koperasiContract, idrTokenContract);
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const refresh = () => {
    if (account && koperasiContract && idrTokenContract) {
      fetchUserData(account, koperasiContract, idrTokenContract);
    }
  };

  return {
    message,
    isLoading,
    isPengurus,
    anggotaData,
    idrtBalance,
    totalSimpanan,
    pinjamanAktif,
    history,
    pendingLoanUser,
    pendingLoans,
    mintTesting,
    daftarAnggota,
    setorSimpananWajib,
    tarikSimpanan,
    setorSimpananSukarela,
    ajukanPinjaman,
    bayarAngsuran,
    setujuiPinjaman,
    tolakPinjaman,

    refresh,
    approvedTodayCount,

    // Admin Minting
    memberList,
    fetchAllMembers,
    mintToken,
    allSimpananLogs, // New
    fetchAllSimpananLogs, // New

    // Admin Config & All Loans
    allLoans,
    adminConfig,
    setSukuBunga,
    setDendaHarian,
    tambahLikuiditas,

    // SHU & FUNDS
    adminStats,
    shuHistory,
    bagikanSHU,
    emergencyWithdraw,
    refreshAdminStats: () => fetchAdminStats(koperasiContract, idrTokenContract)
  };
};
