// hooks/useKoperasi.js
import React, { useEffect, useState, useRef } from 'react';
import { ethers } from 'ethers';
import {
  KOPERASI_CONTRACT_ADDRESS,
  IDRTOKEN_CONTRACT_ADDRESS,
  DEPLOY_BLOCK,
  POLYGONSCAN_API_KEY,
  POLYGONSCAN_BASE_URL
} from '../utils/constants';
import { formatToken, parseToken, formatCurrency } from '../utils/format';

import KoperasiABI from '../abi/koperasisimpanpinjambaru.json';
import IDRTokenABI from '../abi/idrtokenbaru.json';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchLogsViaScanner = async (kop, filter, startBlock, retryCount = 0) => {
  try {
    if (!POLYGONSCAN_API_KEY || POLYGONSCAN_API_KEY === 'YOUR_API_KEY') {
      console.warn("Polygonscan API Key missing. Falling back to slow chunked fetch.");
      return await fetchLogsChunked(kop, filter, startBlock);
    }

    const address = KOPERASI_CONTRACT_ADDRESS;
    let url = `${POLYGONSCAN_BASE_URL}?chainid=80002&module=logs&action=getLogs&fromBlock=${startBlock}&toBlock=latest&address=${address}&apikey=${POLYGONSCAN_API_KEY}`;

    // Jika filter spesifik (bukan wildcard "*"), tambahkan topic0 agar hasil lebih akurat
    if (filter !== "*" && filter.topics && filter.topics[0]) {
      url += `&topic0=${filter.topics[0]}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== '1') {
      // Jika "No logs found", kembalikan array kosong, jangan error
      if (data.message === "No logs found") return [];

      // Handle Rate Limit (Max 5 req/sec)
      if (data.result && data.result.includes("rate limit") && retryCount < 2) {
        console.warn(`Polygonscan Rate Limit hit. Retrying in 1s... (${retryCount + 1}/2)`);
        await sleep(1000);
        return await fetchLogsViaScanner(kop, filter, startBlock, retryCount + 1);
      }

      console.error("Polygonscan API Error:", data.message, "-", data.result);
      return await fetchLogsChunked(kop, filter, startBlock);
    }

    const parsedLogs = data.result.map(log => {
      try {
        const parsed = kop.interface.parseLog({
          topics: log.topics,
          data: log.data
        });

        const ts = log.timeStamp ? parseInt(log.timeStamp, 16) : 0;

        return {
          ...log,
          fragment: parsed ? parsed.fragment : null,
          args: parsed ? parsed.args : null,
          blockNumber: parseInt(log.blockNumber, 16),
          transactionHash: log.transactionHash,
          // Ethers Log compatibility mocks
          timestamp: ts,
          extractedTimestamp: ts,
          getBlock: async () => ({ timestamp: ts })
        };
      } catch (e) {
        return null;
      }
    }).filter(l => l !== null);

    console.log(`Successfully fetched ${parsedLogs.length} logs via Polygonscan API (Filter: ${filter === "*" ? "Wildcard" : "Specific"})`);
    return parsedLogs;
  } catch (err) {
    console.error("fetchLogsViaScanner Error:", err);
    return await fetchLogsChunked(kop, filter, startBlock);
  }
};

const fetchLogsChunked = async (kop, filter, startBlock) => {
  try {
    const provider = kop.runner ? kop.runner.provider : kop.provider;
    const latestBlock = await provider.getBlockNumber();
    const chunkSize = 100; // MUST be 100 or less for Amoy public RPC
    const allLogs = [];
    for (let from = startBlock; from <= latestBlock; from += chunkSize) {
      let to = from + chunkSize - 1;
      if (to > latestBlock) to = latestBlock;

      let logs;
      let retries = 3;
      while (retries > 0) {
        try {
          logs = await kop.queryFilter(filter, from, to);
          break; // sukses
        } catch (err) {
          if (err.message?.includes('rate limit') || err.message?.includes('429')) {
            console.warn(`Rate limit kena di blok ${from}-${to}. Tunggu 2 detik...`);
            retries--;
            await sleep(2000);
          } else {
            throw err;
          }
        }
      }
      if (!logs) throw new Error("Terus-menerus rate limited");

      allLogs.push(...logs);
      await sleep(200); // Kasih jeda antar chunk agar tidak nge-spam
    }
    return allLogs;
  } catch (err) {
    console.error("fetchLogsChunked Error:", err);
    throw err;
  }
};

export const useKoperasi = (account) => {
  const [koperasiContract, setKoperasiContract] = useState(null);
  const [idrTokenContract, setIdrTokenContract] = useState(null);

  // Anti-Race Condition
  const activeAccount = useRef(account);
  useEffect(() => { activeAccount.current = account; }, [account]);

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentLocked, setIsPaymentLocked] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentType, setPaymentType] = useState('simpanan'); // 'simpanan' or 'angsuran'

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
          amount,
          { maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'), maxFeePerGas: ethers.parseUnits('40', 'gwei') }
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
      throw new Error(`Saldo IDRT Kurang! Butuh ${formatToken(requiredAmount)} IDRT, Saldo Anda: ${formatToken(bal)} `);
    }
  };

  // --- history user ---
  const fetchHistory = async (addr, kop) => {
    if (!addr || !kop) return;
    try {
      // [FIX] Updated Event Names & Arguments
      // DepositTercatat(user, amount, jenis, waktu)
      // PenarikanTercatat(user, amount, waktu)
      // AngsuranMasuk(id, peminjam, jumlah)

      // [OPTIMIZATION] FETCH SEKALI SAJA UNTUK SEMUA EVENT (SANGAT CEPAT!)
      // Menggunakan Polygonscan API jika tersedia
      const allLogsRaw = await fetchLogsViaScanner(kop, "*", DEPLOY_BLOCK);

      const allSimpanan = [];
      const allTarik = [];
      const allAjukan = [];
      const allDisetujui = [];
      const allBayar = [];
      const allLunas = [];
      const allDitolak = [];

      for (const l of allLogsRaw) {
        if (!l.fragment?.name) continue;
        const name = l.fragment.name;
        if (name === 'DepositTercatat') allSimpanan.push(l);
        else if (name === 'PenarikanTercatat') allTarik.push(l);
        else if (name === 'PinjamanDiajukan') allAjukan.push(l);
        else if (name === 'PinjamanDisetujui') allDisetujui.push(l);
        else if (name === 'AngsuranMasuk') allBayar.push(l);
        else if (name === 'PinjamanLunas') allLunas.push(l);
        else if (name === 'PinjamanDitolak') allDitolak.push(l);
      }

      // Filter manual by address (safe comparison)
      const userAddr = addr.toLowerCase();

      // MAPPING LOGS
      const mapLog = (logs, type, userKey, amountKey, timeKey) => {
        return logs.filter(l => l.args[userKey].toLowerCase() === userAddr).map(l => ({
          ...l,
          typeDisplay: type, // Custom tag
          args: l.args // Keep original
        }));
      };

      // DepositTercatat: user (0), amount (1), jenis (2), waktu (3)
      const logSimpanan = allSimpanan.filter(l => l.args[0].toLowerCase() === userAddr);

      // PenarikanTercatat: user (0), amount (1), waktu (2)
      const logTarik = allTarik.filter(l => l.args[0].toLowerCase() === userAddr);

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
        // Try to get time from args based on event type
        // DepositTercatat -> args[3]
        // PenarikanTercatat -> args[2]
        // PinjamanLunas -> args[2]
        // PinjamanDisetujui -> args[2] (jatuhTempo, not exact time but close)
        // AngsuranMasuk -> NO time in args, need block
        if (l.fragment.name === 'DepositTercatat') ts = Number(l.args[3]);
        else if (l.fragment.name === 'PenarikanTercatat') ts = Number(l.args[2]);
        else if (l.fragment.name === 'PinjamanLunas') ts = Number(l.args[2]);
        else if (l.args.waktu) {
          ts = Number(l.args.waktu);
        } else {
          try {
            const block = await l.getBlock();
            ts = block.timestamp;
          } catch (e) {
            console.error("Err fetch block history:", e);
            ts = Date.now() / 1000; // Fallback
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
      // [OPTIMIZATION] FETCH SEKALI SAJA UNTUK SEMUA EVENT
      const allLogsRaw = await fetchLogsViaScanner(kop, "*", DEPLOY_BLOCK);

      const logsAjukan = [];
      const logsDisetujui = [];
      const logsLunas = [];
      const logsDitolak = [];

      for (const l of allLogsRaw) {
        if (!l.fragment?.name) continue;
        const name = l.fragment.name;
        if (name === 'PinjamanDiajukan') logsAjukan.push(l);
        else if (name === 'PinjamanDisetujui') logsDisetujui.push(l);
        else if (name === 'PinjamanLunas') logsLunas.push(l);
        else if (name === 'PinjamanDitolak') logsDitolak.push(l);
      }

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

      // Map ID -> Amount (from PinjamanDiajukan)
      const loanAmounts = {};
      logsAjukan.forEach(l => {
        const id = Number(l.args.id);
        loanAmounts[id] = l.args.jumlah;
      });

      // Categorize
      const pending = enhancedAjukan.filter(l => {
        const id = Number(l.args.id);
        return !approvedIds.has(id) && !lunasIds.has(id) && !ditolakIds.has(id);
      }).sort((a, b) => b.extractedTimestamp - a.extractedTimestamp);

      const active = enhancedDisetujui.filter(l => {
        const id = Number(l.args.id);
        return approvedIds.has(id) && !lunasIds.has(id); // Approved but not Lunas
      }).map(l => {
        // Inject jumlah from lookup
        const id = Number(l.args.id);
        // Clone args to avoid mutation issues if it's frozen, 
        // but Ethers args are usually array-like. 
        // Safer to add a top-level property 'jumlah' or modify 'args' if possible.
        // Let's modify the object we are returning directly.
        // We can't easily modify l.args if it's a Result object.
        // So we treat 'l' as the base, and we'll ensure the UI looks for 'customJumlah' or validates args.

        // Actually, let's just make a new object wrapper or attach to l
        l.amountOverride = loanAmounts[id] || 0n;
        return l;
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
      // [FIX] Event SHUDidistribusikan not found in ABI. Disabling fetch for now.
      /*
      const filter = kop.filters.SHUDidistribusikan(null, null);
      const logs = await fetchLogsViaScanner(kop, filter, DEPLOY_BLOCK);
      const hist = await Promise.all(logs.map(async (l) => {
        const block = await l.getBlock();
        return {
          id: l.transactionHash,
          tanggal: new Date(block.timestamp * 1000).toLocaleDateString(),
          totalSHU: formatCurrency(Number(l.args.totalSHU)),
          shuPerAnggota: formatCurrency(Number(l.args.shuPerAnggota))
        };
      }));
      setSHUHistory(hist);
      */
      setShuHistory([]); // Empty for now
    } catch (e) {
      console.error("Gagal fetch history SHU:", e);
    }
  };

  // --- ADMIN: Global Transaction History ---
  const [allGlobalLogs, setAllGlobalLogs] = useState([]);

  const fetchAllGlobalLogs = async (kop) => {
    // Robustly identify the contract object (passed explicitly or from hook state)
    const activeKop = (kop && kop.interface) ? kop : koperasiContract;
    if (!activeKop) return;

    try {
      console.log("[Admin] Fetching all global logs (Global Scan)...");
      const allLogsRaw = await fetchLogsViaScanner(activeKop, "*", DEPLOY_BLOCK);

      const relevantEvents = [
        'DepositTercatat',
        'PenarikanTercatat',
        'PinjamanDiajukan',
        'PinjamanDisetujui',
        'AngsuranMasuk',
        'PinjamanLunas',
        'PinjamanDitolak'
      ];

      // Filter and Enhance with Accurate Timestamps (Consistent with User History)
      const filtered = allLogsRaw.filter(l => 
        l.fragment && relevantEvents.includes(l.fragment.name)
      );

      const enhanced = await Promise.all(filtered.map(async (l) => {
        let ts;
        const name = l.fragment.name;

        // Extract timestamp from args if available (same as fetchHistory)
        if (name === 'DepositTercatat') ts = Number(l.args[3]);
        else if (name === 'PenarikanTercatat') ts = Number(l.args[2]);
        else if (name === 'PinjamanLunas') ts = Number(l.args[2]);
        else if (l.args && l.args.waktu) {
          ts = Number(l.args.waktu);
        } else {
          // Fallback to extractedTimestamp or provider block
          ts = l.extractedTimestamp || l.timestamp || 0;
          if (ts === 0) {
            try {
              const block = await l.getBlock();
              ts = block.timestamp;
            } catch (e) {
              ts = Date.now() / 1000;
            }
          }
        }
        
        l.extractedTimestamp = ts;
        return l;
      }));

      // Sort logs dari terbaru ke terlama
      const sorted = enhanced.sort((a, b) => {
        if (b.extractedTimestamp !== a.extractedTimestamp) {
          return b.extractedTimestamp - a.extractedTimestamp;
        }
        if (b.blockNumber !== a.blockNumber) {
          return b.blockNumber - a.blockNumber;
        }
        return (b.transactionIndex || 0) - (a.transactionIndex || 0) || ((b.logIndex || 0) - (a.logIndex || 0));
      });

      setAllGlobalLogs(sorted);
    } catch (e) {
      console.error("Gagal fetch all global logs:", e);
    }
  };

  // --- ADMIN: Simpanan Logs ---
  const [allSimpananLogs, setAllSimpananLogs] = useState([]);

  const fetchAllSimpananLogs = async (kop) => {
    const activeKop = (kop && kop.interface) ? kop : koperasiContract;
    if (!activeKop) return;
    try {
      const filter = activeKop.filters.DepositTercatat(null);
      const logs = await fetchLogsViaScanner(activeKop, filter, DEPLOY_BLOCK);

      const enhanced = await Promise.all(logs.map(async (l) => {
        let ts = 0;
        // Defensive access to args
        if (l.args) {
          try {
            if (l.args.waktu !== undefined) ts = Number(l.args.waktu);
            else if (typeof l.args.length === 'number' && l.args.length > 3) ts = Number(l.args[3]);
          } catch (err) { ts = 0; }
        }

        if (ts === 0) {
          try { const b = await l.getBlock(); ts = b.timestamp; } catch { ts = 0; }
        }

        // Extremely safe extraction to prevent "out of result range" errors
        const getArg = (name, index) => {
          if (!l.args) return null;
          try {
            if (l.args[name] !== undefined) return l.args[name];
            if (typeof l.args.length === 'number' && index < l.args.length) return l.args[index];
          } catch (e) { return null; }
          return null;
        };

        return {
          dari: String(getArg('user', 0) || '0x0000000000000000000000000000000000000000'),
          jenis: String(getArg('jenis', 2) || 'Lainnya'),
          jumlah: getArg('jumlah', 1) || 0n,
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

      // Fetch Balances (Xendit + Admin POL)
      let midtransBal = '0';
      let adminPol = '0';
      try {
        const res = await fetch('http://localhost:5000/api/balance');
        const data = await res.json();
        if (data.success) {
          midtransBal = data.balance;
          adminPol = data.adminPolBalance || '0';
        }
      } catch (err) {
        console.warn("Gagal fetch midtrans balance:", err);
      }

      setAdminStats({
        profitBelumDibagi: formatToken(profit),
        totalSHUDibagikan: formatToken(shared),
        totalSimpanan: formatToken(totalSimp),
        contractBalance: formatToken(bal),
        xenditBalance: midtransBal,
        adminPolBalance: adminPol, // Added POL balance
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

      const totalSimp = await koperasiContract.totalSimpananSeluruhAnggota();
      if (Number(totalSimp) <= 0) {
        throw new Error("Total Simpanan 0, tidak bisa membagikan SHU tanpa anggota.");
      }

      const bal = await idrTokenContract.balanceOf(koperasiContract.target);
      if (bal < profit) {
        throw new Error(`Likuiditas Kurang! Profit: ${formatToken(profit)}, Saldo Kontrak: ${formatToken(bal)}. Silahkan tambah likuiditas.`);
      }

      if (onProgress) onProgress("Membagikan SHU...");
      // Add manual gas limit to prevent estimation errors
      const tx = await koperasiContract.bagikanSHU({ gasLimit: 500000, maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'), maxFeePerGas: ethers.parseUnits('40', 'gwei') });
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
        throw new Error(`Saldo Kontrak Kurang! Saldo: ${formatToken(bal)}, Tarik: ${formatToken(amount)} `);
      }

      // [FIX] Feature not available in current contract
      throw new Error("Fitur Emergency Withdraw tidak tersedia di Smart Contract ini.");

      /*
      if (onProgress) onProgress("Menarik dana...");
      const tx = await koperasiContract.emergencyWithdraw(tokenAddr, amount);
      if (onProgress) onProgress("Menunggu konfirmasi...");
      await tx.wait();
      await fetchAdminStats(koperasiContract, idrTokenContract);
      return tx;
      */
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const fetchAdminConfig = async (kop) => {
    if (!kop) return;
    try {
      const bungaSimpanan = await kop.bungaSimpananTahunanPersen();
      const bungaPinjaman = await kop.bungaPinjamanTahunanPersen();
      const denda = await kop.dendaHarianPermil();
      setAdminConfig({
        bunga: Number(bungaSimpanan),
        bungaPinjaman: Number(bungaPinjaman),
        denda: Number(denda)
      });
    } catch (e) {
      console.error("Gagal fetch config:", e);
    }
  };

  // --- Actions Admin ---
  const setSukuBunga = async (persen, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");
    if (onProgress) onProgress("Mengupdate suku bunga simpanan...");
    // [FIX] Match ABI: setBungaSimpanan
    const tx = await koperasiContract.setBungaSimpanan(persen, { maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'), maxFeePerGas: ethers.parseUnits('40', 'gwei') });
    if (onProgress) onProgress("Menunggu konfirmasi...");
    await tx.wait();

    // [FIX] Update state lokal manual agar UI langsung berubah (antisipasi RPC delay)
    setAdminConfig(prev => ({ ...prev, bunga: Number(persen) }));

    // Fetch ulang untuk sinkronisasi akhir (opsional, tapi good practice)
    setTimeout(() => fetchAdminConfig(koperasiContract), 2000);

    return tx;
  };

  const setDendaHarian = async (permil, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");
    if (onProgress) onProgress("Mengupdate denda harian...");
    const tx = await koperasiContract.setDendaHarian(permil, { maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'), maxFeePerGas: ethers.parseUnits('40', 'gwei') });
    if (onProgress) onProgress("Menunggu konfirmasi...");
    await tx.wait();

    // [FIX] Update state lokal manual
    setAdminConfig(prev => ({ ...prev, denda: Number(permil) }));

    setTimeout(() => fetchAdminConfig(koperasiContract), 2000);

    return tx;
  };



  // --- data utama user ---
  const triggerTripleSync = () => {
    console.log("[Sync] Triggering Triple-Sync Strategy (2s, 8s, 18s)...");
    setTimeout(refresh, 2000);
    setTimeout(refresh, 8000);
    setTimeout(refresh, 18000);
  };

  const fetchUserData = async (addr, kop, token) => {
    if (!addr || !kop || !token) return;

    // [FIX] Race Condition Check
    // If we are fetching for "addr" but the user has already switched to "activeAccount.current" (diff),
    // then ABORT this old fetch.
    if (addr.toLowerCase() !== (activeAccount.current || '').toLowerCase()) {
      console.warn(`Race condition avoided: Fetch for ${addr} aborted (Current: ${activeAccount.current})`);
      return;
    }

    try {
      setMessage('Memuat data...');
      const balance = await token.balanceOf(addr);
      setIdrtBalance(formatToken(balance));

      const pengurus = await kop.isPengurus(addr);
      setIsPengurus(pengurus);

      const data = await kop.dataAnggota(addr);

      // [FIX] Explicitly structure data to avoid proxy/spread issues with Ethers Result
      // [FIX] Virtual Split: Registration Fee (Pokok) is 100k, physically stored in Wajib in the contract.
      const POKOK_RAW = 100000n * (10n ** 18n); 
      let sPokok = 0n;
      let sWajib = data.simpananWajib || 0n;

      if (data.terdaftar) {
        if (sWajib >= POKOK_RAW) {
          sPokok = POKOK_RAW;
          sWajib = sWajib - POKOK_RAW;
        } else {
          sPokok = sWajib;
          sWajib = 0n;
        }
      }

      const formattedData = {
        terdaftar: data.terdaftar,
        nama: data.nama,
        simpananPokok: sPokok,
        simpananWajib: sWajib,
        simpananSukarela: data.simpananSukarela || 0n,
        shuSudahDiambil: data.shuSudahDiambil || 0n
      };

      setAnggotaData(formattedData);

      if (formattedData.terdaftar) {
        // [FIX] Calculate total of all savings using the consolidated virtual fields
        const total = BigInt(formattedData.simpananPokok) + BigInt(formattedData.simpananWajib) + BigInt(formattedData.simpananSukarela);
        setTotalSimpanan(formatToken(total));

        const idPinjamanAktif = await kop.idPinjamanAktifAnggota(addr);
        if (Number(idPinjamanAktif) > 0) {
          const pinjaman = await kop.dataPinjaman(idPinjamanAktif);
          // [FIX] Match struct Pinjaman in Reconstructed_KoperasiSimpanPinjam.sol
          // struct Pinjaman { uint256 id; address peminjam; uint256 jumlahPinjaman; 
          // uint256 totalHarusDibayar; uint256 sudahDibayar; uint256 tenorBulan; 
          // uint256 waktuJatuhTempo; StatusPinjaman status; }

          const mappedPinjaman = {
            id: pinjaman.id || pinjaman[0],
            peminjam: pinjaman.peminjam || pinjaman[1],
            jumlahPinjaman: pinjaman.jumlahPinjaman || pinjaman[2],
            jumlahHarusDikembalikan: pinjaman.totalHarusDibayar || pinjaman[3],
            sudahDibayar: pinjaman.sudahDibayar || pinjaman[4],
            tenorBulan: pinjaman.tenorBulan || pinjaman[5],
            waktuJatuhTempo: pinjaman.waktuJatuhTempo || pinjaman[6],
            // Field 7 is status (Enum/Uint)
            status: Number(pinjaman.status || pinjaman[7]),

            // These fields do not exist in the current contract struct, set defaults
            bungaPersenSaatIni: 0n,
            terakhirDendaDiupdate: 0n,

            lunas: Number(pinjaman.status || pinjaman[7]) === 2,
            disetujui: Number(pinjaman.status || pinjaman[7]) === 1 || Number(pinjaman.status || pinjaman[7]) === 2
          };

          const st = Number(mappedPinjaman.status);

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
        // Double check before admin fetch
        if (addr.toLowerCase() !== (activeAccount.current || '').toLowerCase()) return;
        await fetchAllLoansAdmin(kop);
      } else {
        setPendingLoans([]);
      }

      // Final check before clearing loading message
      if (addr.toLowerCase() === (activeAccount.current || '').toLowerCase()) {
        setMessage('');
      }
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

      // Check Ownership
      const owner = await idrTokenContract.owner();
      if (owner.toLowerCase() !== account.toLowerCase()) {
        throw new Error(`Gagal Mint: Wallet Anda (${account.slice(0, 6)}...) bukan Owner IDR Token! Owner: ${owner.slice(0, 6)}...`);
      }

      if (onProgress) onProgress('Meminta konfirmasi minting...');
      const tx = await idrTokenContract.mint(to, amount, { maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'), maxFeePerGas: ethers.parseUnits('40', 'gwei') });
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
    // [FIX] Strict Reset State synchronously
    setAnggotaData(null);
    setHistory([]);
    setPinjamanAktif(null);
    setIsPengurus(false);
    setMessage('');
    setPendingLoans([]);
    setAdminStats({}); // Clear admin stats

    const init = async () => {
      if (!account || !window.ethereum) return;
      setIsLoading(true);
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);

        // [FIX] Check Network (Polygon Amoy Chain ID: 80002)
        const network = await provider.getNetwork();
        if (network.chainId !== 80002n) {
          throw new Error("Wrong Network! Please switch to Polygon Amoy (Chain ID: 80002)");
        }

        // [FIX] Explicitly request signer for confirmed account
        const signer = await provider.getSigner();
        const signerAddr = await signer.getAddress();

        // Double check against prop
        if (signerAddr.toLowerCase() !== account.toLowerCase()) {
          console.warn("Signer mismatch, waiting for sync...");
          return;
        }

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

        // Fetch config (bunga/denda) as it affects all users
        await fetchAdminConfig(kop);

        // [FIX] Background Fetch for Admin Data (Non-blocking)
        // We check isPengurusVal from the contract directly or use the one set in fetchUserData
        const isPengurusVal = await kop.isPengurus(account);
        if (isPengurusVal) {
          console.log("Admin detected, starting background data fetch...");
          // Do NOT await these, let them run in background so UI can load
          fetchAllLoansAdmin(kop);
          fetchAllMembers(kop);
          fetchAllSimpananLogs(kop);
          fetchAdminStats(kop, token);
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
      const tx = await idrTokenContract.mint(account, amount, { maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'), maxFeePerGas: ethers.parseUnits('40', 'gwei') });
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

  const daftarAnggota = async (nama, ktpLink = "ipfs://QmDummyHash", onProgress) => {
    if (!account) throw new Error("Wallet belum terhubung");
    if (!nama) throw new Error("Nama tidak boleh kosong");

    try {
      // 1. Register to Blockchain via Backend FIRST
      if (onProgress) onProgress('Mendaftarkan via Admin (Zero Gas)...');

      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: account,
          name: nama,
          ktpLink: ktpLink
        })
      });

      const data = await response.json();
      if (!data.success) {
        // If error is "already registered", ignore and proceed to payment
        if (data.error && data.error.includes("sudah terdaftar")) {
          console.warn("User already registered, proceeding to payment...");
        } else {
          throw new Error(data.error || "Gagal mendaftar");
        }
      }

      if (onProgress) onProgress('Pendaftaran Akun Sukses! Lanjut Pembayaran Simpanan Pokok...');

      // 2. Payment Simpanan Pokok (Wajib di awal) - Misal Rp 100.000
      // Gunakan isWajib=true agar tercatat sebagai simpanan wajib/pokok
      if (onProgress) onProgress('Memproses Pembayaran Simpanan Pokok (Rp 100.000)...');

      // Call Helper Payment
      // Note: We use '100000' hardcoded or from config if available.
      const paymentResult = await processXenditPayment('100000', true, onProgress);

      if (onProgress) onProgress('Pendaftaran Selesai! Menunggu pembayaran pada modal...');

      return { ...data, ...paymentResult };
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Helper: Call Xendit & Redirect
  const processXenditPayment = async (amountStr, isWajib, onProgress) => {
    if (!account) throw new Error("Wallet belum terhubung");

    try {
      if (onProgress) onProgress('Membuat Invoice Xendit...');

      // 1. Create Invoice via Backend
      const response = await fetch('http://localhost:5000/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: account,
          amount: amountStr,
          isWajib: isWajib
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Gagal membuat invoice");
      }

      const invoiceUrl = data.invoiceUrl;
      console.log("Xendit Invoice URL:", invoiceUrl);

      setPaymentType('simpanan');
      if (onProgress) onProgress('Halaman pembayaran disiapkan. Menunggu verifikasi otomatis...');

      setIsPaymentLocked(true);
      paymentChannel.postMessage({ type: 'PAYMENT_LOCKED' });

      // [FIX] Return result directly from async function
      return { success: true, invoiceUrl: data.invoiceUrl, externalId: data.externalId };

    } catch (err) {
      console.error(err);
      throw err;
    }
  };



  const bayarSimpananWajib = async (onProgress) => {
    // 25.000 (Example)
    return processXenditPayment('25000', true, onProgress);
  };

  const bayarSimpananSukarela = async (jumlahStr, onProgress) => {
    return processXenditPayment(jumlahStr, false, onProgress);
  };

  const ajukanPinjaman = async (jumlahStr, tenorBulan, bank, accountNumber, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");

    try {
      const jumlah = parseToken(jumlahStr || '0');
      const tenor = parseInt(tenorBulan || 12);

      if (pinjamanAktif && (pinjamanAktif.lunas === false || pinjamanAktif.lunas === undefined)) {
        throw new Error('Anda masih memiliki pinjaman aktif!');
      }

      if (anggotaData) {
        // [FIX] Explicit BigInt conversion to prevent TypeError (mixed types)
        const pokok = BigInt(anggotaData.simpananPokok || 0);
        const wajib = BigInt(anggotaData.simpananWajib || 0);
        const sukarela = BigInt(anggotaData.simpananSukarela || 0);

        const totalSimpanan = pokok + wajib + sukarela;
        const limit = totalSimpanan * 3n; // Use 3n literal

        const amountBigInt = parseToken(jumlahStr);
        if (amountBigInt > limit) {
          throw new Error(`Melebihi limit! Maks 3x Simpanan(${formatToken(limit)} IDRT)`);
        }
      }

      if (onProgress) onProgress('Mengirim pengajuan pinjaman (MetaMask)...');
      // Direct Blockchain Call (User pays gas)
      const tx = await koperasiContract.ajukanPinjaman(jumlah, tenor, { gasLimit: 500000, maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'), maxFeePerGas: ethers.parseUnits('40', 'gwei') });

      if (onProgress) onProgress('Menunggu konfirmasi blockchain...');
      await tx.wait();

      // NEW: Save Bank Details to Server
      if (onProgress) onProgress('Menyimpan detail pencairan...');
      try {
        await fetch('http://localhost:5000/api/loan/save-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: account,
            loanAmount: jumlahStr,
            bank: bank,
            accountNumber: accountNumber
          })
        });
      } catch (saveErr) {
        console.error("Failed to save loan details:", saveErr);
        // Don't fail the whole process if this fails, but it's risky.
      }

      await fetchUserData(account, koperasiContract, idrTokenContract);
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const bayarAngsuran = async (jumlahStr, onProgress) => {
    if (!pinjamanAktif || !account) throw new Error("Data tidak valid");

    // Validate: cannot pay more than remaining balance
    const totalHarus = BigInt(pinjamanAktif.jumlahHarusDikembalikan || 0);
    const sudahBayar = BigInt(pinjamanAktif.sudahDibayar || 0);
    const sisaHutang = totalHarus - sudahBayar;
    const sisaIDR = Math.ceil(Number(formatToken(sisaHutang)));
    const inputIDR = Number(jumlahStr);

    if (inputIDR > sisaIDR) {
      throw new Error(`Jumlah melebihi sisa hutang! Sisa: ${formatCurrency(sisaIDR.toString())} IDRT`);
    }

    try {
      if (onProgress) onProgress('Membuat Invoice Xendit untuk Angsuran...');

      // 1. Create Xendit Invoice for Repayment
      const response = await fetch('http://localhost:5000/api/payment/repay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: account,
          loanId: pinjamanAktif.id.toString(),
          amount: jumlahStr
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Gagal membuat invoice angsuran");
      }

      if (onProgress) onProgress('Halaman pembayaran Xendit telah disiapkan.');

      setPaymentType('angsuran');
      setIsPaymentLocked(true);

      // [FIX] Return invoiceUrl for Iframe support
      return { status: 'redirected_to_xendit', invoiceUrl: data.invoiceUrl };
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const tarikSimpanan = async (jumlahStr, bank, rekening, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");

    try {
      const jumlah = parseToken(jumlahStr || '0');

      // Validasi basic client side
      if (anggotaData) {
        const sukarela = BigInt(anggotaData.simpananSukarela);
        if (jumlah > sukarela) {
          throw new Error(`Saldo Sukarela tidak cukup! Tersedia: ${formatToken(sukarela)} `);
        }
      }

      if (onProgress) onProgress('Mengirim permintaan penarikan (Zero Gas)...');

      const response = await fetch('http://localhost:5000/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: account,
          amount: jumlahStr,
          bank: bank,
          accountNumber: rekening
        })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Gagal menarik saldo");

      if (onProgress) onProgress('Penarikan Berhasil!');

      // [FIX] Triple-Sync Strategy for Withdrawals (2s, 8s, 18s)
      triggerTripleSync();

      // Simulate receipt object for compatibility if needed, or just return hash
      const tx = { hash: data.txHash, wait: async () => true };
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const setujuiPinjaman = async (idStr, onProgress) => {
    if (!koperasiContract || !idrTokenContract) throw new Error("Kontrak belum siap");

    try {
      // 1. Check Liquidity First via Server (Source of Truth)
      if (onProgress) onProgress('Memeriksa likuiditas koperasi...');
      const loanData = await koperasiContract.dataPinjaman(idStr);

      const res = await fetch('http://localhost:5000/api/balance');
      const data = await res.json();

      // Safety check: if server is old or returns invalid data
      const contractBalanceStr = (data.success && data.contractBalance) ? data.contractBalance : '0';
      const contractBalance = BigInt(contractBalanceStr);

      const needed = loanData.jumlahPinjaman; // BigInt

      // FALLBACK: If Server is old (contractBalance is 0) but Xendit has funds, allow it.
      // We assume AutoSync is working or will work.
      let effectiveBalance = contractBalance;
      if (contractBalance === 0n && data.success) {
        const xenditRaw = BigInt((data.xenditBalance || data.balance || 0).toString());
        // CRITICAL FIX: Convert Xendit IDR (Raw) to Wei (18 decimals) for comparison
        const xenditWei = xenditRaw * 1000000000000000000n;

        if (xenditWei >= needed) {
          console.warn("Using Xendit Balance as Proxy (Server process outdated). Converted to Wei: " + xenditWei);
          effectiveBalance = xenditWei;
        }
      }

      if (effectiveBalance < needed) {
        throw new Error(`Likuiditas Koperasi Kurang! Butuh ${formatCurrency(formatToken(needed))} IDRT, Saldo: ${formatCurrency(formatToken(effectiveBalance))} IDRT.Silahkan 'Tambah Likuiditas' di menu Manajemen Dana.`);
      }

      // 2. Execute Approval & Disbursement via Server
      if (onProgress) onProgress('Memproses Persetujuan & Pencairan...');

      const response = await fetch('http://localhost:5000/api/loan/approve-disburse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: idStr,
          userAddress: loanData.peminjam // Contract provides borrower address
        })
      });

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || "Gagal memproses persetujuan di server");
      }

      if (onProgress) onProgress('Penyaluran Dana Berhasil!');

      // [FIX] Triple-Sync Strategy for Admin (Loans sync: 2s, 8s, 18s)
      triggerTripleSync();

      // Simulate tx object
      const tx = { hash: resData.txHash, wait: async () => true };
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const tolakPinjaman = async (idStr, reason = "Ditolak Admin", onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");
    try {
      if (onProgress) onProgress('Mengirim penolakan...');
      // [FIX] Force Gas Price for Polygon Amoy (Min 25 Gwei -> Set 35 Gwei)
      const overrides = { maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'), maxFeePerGas: ethers.parseUnits('40', 'gwei') };

      // Contract expects: tolakPinjaman(uint256 id, string reason)
      const tx = await koperasiContract.tolakPinjaman(idStr, reason, overrides);
      if (onProgress) onProgress('Menunggu konfirmasi penolakan...');
      await tx.wait();

      // [FIX] Triple-Sync Strategy for Admin (Rejection sync: 2s, 8s, 18s)
      triggerTripleSync();

      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const [fundStats, setFundStats] = useState({ contractBalance: '0', xenditBalance: '0' });

  const fetchFundStats = async () => {
    // if (!koperasiContract || !idrTokenContract) return; // Not strictly needed for API call
    try {
      const res = await fetch('http://localhost:5000/api/balance');
      const data = await res.json();

      if (data.success) {
        setFundStats({
          contractBalance: data.contractBalance || '0',
          xenditBalance: (data.xenditBalance || data.balance || 0).toString()
        });
      }
    } catch (err) {
      console.error("Failed to fetch fund stats:", err);
    }
  };

  const syncLiquidity = async (onProgress) => {
    if (!koperasiContract || !idrTokenContract) throw new Error("Kontrak belum siap");
    try {
      if (onProgress) onProgress('Memeriksa saldo Xendit & Blockchain...');

      if (onProgress) onProgress('Meminta Server untuk Sinkronisasi...');

      const response = await fetch('http://localhost:5000/api/sync-liquidity', {
        method: 'POST'
      });
      const syncData = await response.json();
      if (!syncData.success) throw new Error(syncData.error || "Gagal sinkronisasi via server");

      if (onProgress) onProgress('Sinkronisasi selesai!');

      // Wait a bit for blockchain to update before fetching stats
      await new Promise(r => setTimeout(r, 2000));
      await fetchFundStats();
      return true;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Auto fetch stats on load
  useEffect(() => {
    if (isPengurus) {
      fetchFundStats();
    }
  }, [isPengurus, koperasiContract, idrTokenContract]);

  const tambahLikuiditas = async (amountStr, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");
    try {
      const amount = parseToken(amountStr);

      // 1. Cek Saldo Admin
      if (onProgress) onProgress('Memeriksa saldo wallet...');
      await checkBalance(amount);

      // 2. Approve Token Transfer
      // [FIX] Force Gas Price
      const approve = await handleApprove(amount, onProgress);
      if (!approve) throw new Error("Approval gagal");

      // 3. Execute Contract Call
      if (onProgress) onProgress('Menambah likuiditas...');
      // [FIX] Force Gas Price
      const overrides = { gasLimit: 500000, maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'), maxFeePerGas: ethers.parseUnits('40', 'gwei') };
      const tx = await koperasiContract.tambahLikuiditas(amount, overrides);
      if (onProgress) onProgress('Menunggu konfirmasi...');
      await tx.wait();

      await fetchUserData(account, koperasiContract, idrTokenContract);
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const refresh = React.useCallback(() => {
    if (account && koperasiContract && idrTokenContract) {
      fetchUserData(account, koperasiContract, idrTokenContract);
    }
  }, [account, koperasiContract, idrTokenContract]);

  // Payment Sync Channel
  const paymentChannel = React.useMemo(() => {
    try {
      return new BroadcastChannel('koperasi_payment_sync');
    } catch (e) {
      console.warn("BroadcastChannel not supported or failed:", e);
      return { postMessage: () => { }, close: () => { }, onmessage: null };
    }
  }, []);

  React.useEffect(() => {
    // 1. Detect Status from URL (for redirected tab)
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setPaymentSuccess(true);
      setIsPaymentLocked(false);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 2. Listen for messages from other tabs
    const handleMessage = (event) => {
      if (event.data.type === 'PAYMENT_LOCKED') {
        setIsPaymentLocked(true);
      } else if (event.data.type === 'PAYMENT_SUCCESS') {
        setIsPaymentLocked(false);
        setPaymentSuccess(true);
        triggerTripleSync(); // Use TripleSync for broadcasted success
      }
    };

    paymentChannel.onmessage = handleMessage;
  }, [paymentChannel, refresh]);

  // 3. [NEW] ROBUST REAL-TIME POLLING for Payment Status
  useEffect(() => {
    let interval;
    let isMounted = true;

    const startPolling = async () => {
      if (!isPaymentLocked || !account || !koperasiContract || !idrTokenContract) return;

      console.log(`[Polling] Initializing baseline for ${paymentType}...`);

      let baselineValue = 0n;

      try {
        // Fetch BASELINE directly from blockchain at the moment of locking
        if (paymentType === 'simpanan') {
          baselineValue = await idrTokenContract.balanceOf(account);
        } else {
          const id = await koperasiContract.idPinjamanAktifAnggota(account);
          if (Number(id) > 0) {
            const loan = await koperasiContract.dataPinjaman(id);
            baselineValue = loan.sudahDibayar || loan[4]; // Handle struct/array
          }
        }

        console.log(`[Polling] Baseline set: ${baselineValue.toString()}. Waiting for increase...`);

        if (!isMounted) return;

        interval = setInterval(async () => {
          try {
            let currentValue = 0n;
            let successTriggered = false;

            if (paymentType === 'simpanan') {
              currentValue = await idrTokenContract.balanceOf(account);
              if (currentValue > baselineValue) successTriggered = true;
            } else {
              const id = await koperasiContract.idPinjamanAktifAnggota(account);
              if (Number(id) > 0) {
                const loan = await koperasiContract.dataPinjaman(id);
                currentValue = loan.sudahDibayar || loan[4];
                if (currentValue > baselineValue) successTriggered = true;
              }
            }

            if (successTriggered && isMounted) {
              console.log(`[Polling] SUCCESS! ${paymentType} detected. ${baselineValue} -> ${currentValue}`);
              clearInterval(interval);
              setPaymentSuccess(true);
              setIsPaymentLocked(false);

              // [FIX] Unified Triple-Sync Strategy
              triggerTripleSync();
            }
          } catch (pollErr) {
            console.warn("[Polling] Tick error:", pollErr);
          }
        }, 5000); // Poll every 5 seconds
      } catch (baseErr) {
        console.error("[Polling] Failed to set baseline:", baseErr);
      }
    };

    if (isPaymentLocked) {
      startPolling();
    }

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaymentLocked, account, paymentType, koperasiContract, idrTokenContract]);

  const cancelPayment = () => {
    setIsPaymentLocked(false);
    setPaymentSuccess(false);
    // [FIX] Jangan pasang pesan global di sini agar formulir bisa menangani sendiri secara lokal.
    // Hapus: setMessage("Pembayaran dibatalkan oleh pengguna.");
  };

  return {
    message,
    isLoading,
    isPaymentLocked,
    paymentSuccess,
    setPaymentSuccess,
    paymentType,
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
    setorSimpananWajib: bayarSimpananWajib, // Alias for compatibility
    tarikSimpanan,
    setorSimpananSukarela: bayarSimpananSukarela, // Alias for compatibility
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
    triggerTripleSync,

    // SHU & FUNDS
    adminStats,
    shuHistory,
    bagikanSHU,
    allGlobalLogs,
    fetchAllGlobalLogs,
    emergencyWithdraw,
    syncLiquidity,
    cancelPayment,
    refreshAdminStats: () => fetchAdminStats(koperasiContract, idrTokenContract)
  };
};
