// hooks/useKoperasi.js
import React, { useEffect, useState, useRef } from 'react';
import { ethers } from 'ethers';
import {
  CONTRACT_ADDRESS,
  TOKEN_ADDRESS,
  DEPLOY_BLOCK,
  POLYGONSCAN_API_KEY,
  POLYGONSCAN_BASE_URL
} from '../utils/constants';
import { formatToken, parseToken, formatCurrency } from '../utils/format';

import KoperasiABI from '../abi/koperasisimpanpinjambaru.json';
import IDRTokenABI from '../abi/idrtokenbaru.json';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// [FIX] Polygon Amoy Gas Overrides (Min 25 Gwei Priority Fee needed)
const POLYGON_GAS_OPTIONS = {
  maxPriorityFeePerGas: ethers.parseUnits('35', 'gwei'),
  maxFeePerGas: ethers.parseUnits('50', 'gwei')
};

const fetchLogsViaScanner = async (kop, filter, startBlock, retryCount = 0) => {
  try {
    if (!POLYGONSCAN_API_KEY || POLYGONSCAN_API_KEY === 'YOUR_API_KEY') {
      console.warn("Polygonscan API Key missing. Falling back to slow chunked fetch.");
      return await fetchLogsChunked(kop, filter, startBlock);
    }

    const address = CONTRACT_ADDRESS;
    let url = `${POLYGONSCAN_BASE_URL}?chainid=80002&module=logs&action=getLogs&fromBlock=${startBlock}&toBlock=latest&address=${address}&apikey=${POLYGONSCAN_API_KEY}`;

    // Jika filter spesifik (bukan wildcard "*"), tambahkan topic0 agar hasil lebih akurat
    if (filter !== "*" && filter.topics && filter.topics[0]) {
      url += `&topic0=${filter.topics[0]}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== '1') {
      // Jika "No logs/records found", kembalikan array kosong, jangan error
      if (data.message === "No logs found" || data.message === "No records found") return [];

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
  const [userTimeDeposits, setUserTimeDeposits] = useState([]);

  // Admin Data
  const [allLoans, setAllLoans] = useState({ pending: [], active: [], paid: [], rejected: [] });
  const [adminConfig, setAdminConfig] = useState({ bunga: 0, bungaPinjaman: 0, denda: 0, pokok: 0, adm: 0 });

  // --- helper untuk approval token ---
  const handleApprove = async (amount, onProgress) => {
    if (!idrTokenContract || !account) return false;
    try {
      if (onProgress) onProgress('Meminta izin penggunaan token...');
      const allowance = await idrTokenContract.allowance(
        account,
        CONTRACT_ADDRESS
      );
      if (allowance < amount) {
        if (onProgress) onProgress('Menunggu konfirmasi approval di wallet...');
        const tx = await idrTokenContract.approve(
          CONTRACT_ADDRESS,
          amount,
          POLYGON_GAS_OPTIONS
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
      const allBerjangkaBuka = [];
      const allBerjangkaCair = [];
      const allSHU = [];
      const allMemberUpdates = [];

      for (const l of allLogsRaw) {
        if (!l.fragment?.name) continue;
        const name = l.fragment.name;
        l.eventName = name; // [FIX] Ensure explicit name for HistoryList

        if (name === 'DepositTercatat') allSimpanan.push(l);
        else if (name === 'PenarikanTercatat') allTarik.push(l);
        else if (name === 'PinjamanDiajukan') allAjukan.push(l);
        else if (name === 'PinjamanDisetujui') allDisetujui.push(l);
        else if (name === 'AngsuranMasuk') allBayar.push(l);
        else if (name === 'PinjamanLunas') allLunas.push(l);
        else if (name === 'PinjamanDitolak') allDitolak.push(l);
        else if (name === 'SimpananBerjangkaDibuka') allBerjangkaBuka.push(l);
        else if (name === 'SimpananBerjangkaDicairkan') allBerjangkaCair.push(l);
        else if (name === 'SHUDiterima') allSHU.push(l);
        else if (name === 'AnggotaRejoin' || name === 'MemberProfileUpdated') allMemberUpdates.push(l);
      }

      // Filter manual by address (safe comparison)
      const userAddr = addr.toLowerCase();

      // [HELPER] Robust User Identification in Logs
      const getLogUser = (l) => {
        if (!l.args) return "";
        const a = l.args;
        // Check named properties first (most reliable), then positional index 0 or 1
        const addrCandidate = a.peminjam || a.user || a.member || a.anggota || a[0] || a[1] || "";
        return typeof addrCandidate === 'string' ? addrCandidate.toLowerCase() : "";
      };

      // MAPPING LOGS WITH ROBUST FILTERING
      const logSimpanan = allSimpanan.filter(l => getLogUser(l) === userAddr);
      const logTarik = allTarik.filter(l => getLogUser(l) === userAddr);
      const logAjukan = allAjukan.filter(l => getLogUser(l) === userAddr);
      const logDisetujui = allDisetujui.filter(l => getLogUser(l) === userAddr);
      const logBayar = allBayar.filter(l => getLogUser(l) === userAddr);
      const logLunas = allLunas.filter(l => getLogUser(l) === userAddr);
      const logDitolak = allDitolak.filter(l => getLogUser(l) === userAddr);
      const logBerjangkaBuka = allBerjangkaBuka.filter(l => getLogUser(l) === userAddr);
      const logBerjangkaCair = allBerjangkaCair.filter(l => getLogUser(l) === userAddr);
      const logSHU = allSHU.filter(l => getLogUser(l) === userAddr);
      const logMemberUpdates = allMemberUpdates.filter(l => getLogUser(l) === userAddr);

      const allLogs = [
        ...logSimpanan,
        ...logTarik,
        ...logAjukan,
        ...logDisetujui,
        ...logBayar,
        ...logLunas,
        ...logDitolak,
        ...logBerjangkaBuka,
        ...logBerjangkaCair,
        ...logSHU,
        ...logMemberUpdates
      ];

      // Fetch timestamps for all logs
      const allLogsWithTime = await Promise.all(allLogs.map(async (l) => {
        let ts;
        const name = l.fragment.name;
        
        // Accurate timestamp extraction from args
        if (name === 'DepositTercatat') ts = Number(l.args[3]);
        else if (name === 'PenarikanTercatat') ts = Number(l.args[2]);
        else if (name === 'PinjamanLunas') ts = Number(l.args[2]);
        else if (name === 'SimpananBerjangkaDibuka') ts = Number(l.args[3]);
        else if (name === 'SimpananBerjangkaDicairkan') ts = Number(l.args[3]);
        else if (name === 'SHUDiterima') ts = Number(l.args[2]);
        else if (l.args.timestamp) ts = Number(l.args.timestamp);
        else if (l.args.waktu) ts = Number(l.args.waktu);
        else {
          try {
            const block = await l.getBlock();
            ts = block.timestamp;
          } catch (e) {
            ts = Date.now() / 1000;
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
          logLunas.map((l) => Number(l.args.loanId ?? l.args.id))
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
      const logsSurvey = [];
      const logsCommittee = [];

      for (const l of allLogsRaw) {
        if (!l.fragment?.name) continue;
        const name = l.fragment.name;
        if (name === 'PinjamanDiajukan') logsAjukan.push(l);
        else if (name === 'PinjamanDisetujui') logsDisetujui.push(l);
        else if (name === 'PinjamanLunas') logsLunas.push(l);
        else if (name === 'PinjamanDitolak') logsDitolak.push(l);
        else if (name === 'SurveyApproved') logsSurvey.push(l);
        else if (name === 'CommitteeApproved') logsCommittee.push(l);
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
      const lunasIds = new Set(logsLunas.map(l => Number(l.args.loanId ?? l.args.id)));
      const ditolakIds = new Set(logsDitolak.map(l => Number(l.args.id)));

      // [ENHANCEMENT] Detailed Status Map for Pending Candidates
      // 0:Pending, 1:Surveyed, 2:CommitteeApproved
      const statusMap = {};
      logsSurvey.forEach(l => statusMap[Number(l.args.loanId)] = 1);
      logsCommittee.forEach(l => statusMap[Number(l.args.loanId)] = 2);

      // Map ID -> Amount (from PinjamanDiajukan)
      const loanAmounts = {};
      
      const pendingCandidates = enhancedAjukan.filter(l => {
        const id = Number(l.args.id);
        return !approvedIds.has(id) && !lunasIds.has(id) && !ditolakIds.has(id);
      });

      // [CRITICAL] Real-time State Verification for Pending Candidates
      // To prevent "execution reverted: Status must be Pending", we fetch the truth from the contract
      const pending = await Promise.all(pendingCandidates.map(async (l) => {
        const id = Number(l.args.id);
        let status = statusMap[id] || 0;
        
        try {
          // Verify with contract to ensure sync
          const data = await kop.dataPinjaman(id);
          status = Number(data.status); // Source of Truth
        } catch (e) {
          console.warn(`Failed to verify status for loan ${id}, using event data.`);
        }

        l.status = status;
        return l;
      }));

      pending.sort((a, b) => b.extractedTimestamp - a.extractedTimestamp);

      const active = enhancedDisetujui.filter(l => {
        const id = Number(l.args.id);
        return !lunasIds.has(id);
      }).map(l => {
        const id = Number(l.args.id);
        l.amountOverride = loanAmounts[id] || 0n;
        return l;
      }).sort((a, b) => b.extractedTimestamp - a.extractedTimestamp);

      const paid = enhancedLunas.sort((a, b) => b.extractedTimestamp - a.extractedTimestamp);
      const rejected = enhancedDitolak.sort((a, b) => b.extractedTimestamp - a.extractedTimestamp);
      
      setAllLoans({ pending, active, paid, rejected });
      setPendingLoans(pending);

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
      const bal = await token.balanceOf(CONTRACT_ADDRESS);

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

  // bagikanSHU deprecated - using releaseProfitSharing via API

  const emergencyWithdraw = async (tokenAddr, amountStr, onProgress) => {
    throw new Error("Fitur Emergency Withdraw tidak tersedia di Smart Contract ini.");
  };

  const fetchAdminConfig = async (kop) => {
    if (!kop) return;
    try {
      const [bSimpanan, bPinjaman, denda, settsRaw] = await Promise.all([
        kop.bungaSimpananTahunanPersen(),
        kop.bungaPinjamanTahunanPersen(),
        kop.dendaHarianPermil(),
        kop.settings()
      ]);
      
      console.log("[Admin] DIAGNOSTIC: Settings fetched from Blockchain.");

      // Ethers v6 Result to POJO
      const setts = typeof settsRaw.toObject === 'function' ? settsRaw.toObject() : settsRaw;

      setAdminConfig({
        bunga: Number(bSimpanan),
        bungaPinjaman: Number(bPinjaman),
        denda: Number(denda),
        // Indices map: [4] = Pokok, [5] = Adm
        pokok: Number(ethers.formatUnits(setts[4] || setts.nominalSimpananPokok || 0, 18)),
        adm: 0 // Hidden for JDCOOP compliance
      });
    } catch (e) {
      console.error("Gagal fetch config:", e);
    }
  };

  const updateGlobalSettings = async (params, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");
    try {
      if (onProgress) onProgress("Mengupdate pengaturan global (Zero Gas)...");
      console.log("[Admin] DIAGNOSTIC: Sending Payload to Server:", JSON.stringify({ params }));
      const response = await fetch('http://localhost:5000/api/gov/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Gagal update settings");
      if (onProgress) onProgress("Berhasil update pengaturan!");
      
      // [FIX] Add a small delay to allow blockchain state to propagate
      if (onProgress) onProgress("Menyinkronkan data terbaru...");
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Explicit refresh to ensure UI sync
      await fetchAdminConfig(koperasiContract);
    } catch (e) {
      console.error("Gagal update settings:", e);
      throw e;
    }
  };

  const closeMembership = async (memberAddress, onProgress) => {
    try {
      if (onProgress) onProgress("Menutup keanggotaan (Zero Gas)...");
      const response = await fetch('http://localhost:5000/api/admin/close-membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberAddress })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Gagal tutup keanggotaan");
      
      if (onProgress) onProgress("Sinkronisasi data...");
      await fetchAllMembers(koperasiContract);
    } catch (e) {
      console.error("Gagal tutup keanggotaan:", e);
      throw e;
    }
  };

  const approveSurvey = async (loanId, note, onProgress) => {
    try {
      if (onProgress) onProgress('Memproses Persetujuan Survey (Admin)...');
      const response = await fetch('http://localhost:5000/api/loan/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId, note })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Gagal approve survey");
      triggerTripleSync();
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const approveCommittee = async (loanId, onProgress) => {
    try {
      if (onProgress) onProgress('Memproses Persetujuan Komite (Admin)...');
      const response = await fetch('http://localhost:5000/api/loan/committee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Gagal approve komite");
      triggerTripleSync();
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const generateMonthlyBills = async (amount, onProgress) => {
    try {
      if (onProgress) onProgress('Menghasilkan tagihan bulanan massal...');
      const response = await fetch('http://localhost:5000/api/gov/generate-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Gagal generate bills");
      triggerTripleSync();
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const releaseProfitSharing = async (percentage, onProgress) => {
    try {
      if (onProgress) onProgress(`Membagikan SHU ${percentage}%...`);
      const response = await fetch('http://localhost:5000/api/gov/release-sharing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Gagal bagi hasil");
      triggerTripleSync();
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const triggerTripleSync = () => {
    console.log("[Sync] Triggering Triple-Sync Strategy (2s, 8s, 18s)...");
    setTimeout(refresh, 2000);
    setTimeout(refresh, 8000);
    setTimeout(refresh, 18000);
  };

  const fetchUserTimeDeposits = async (kop, userAddr) => {
    if (!kop || !userAddr) return [];
    try {
      // [FIX] Use High-Performance Batch Getter (No more execution reverted!)
      const data = await kop.getAllSimpananBerjangka(userAddr);
      
      const deposits = data.map((d, i) => ({
        index: i,
        amount: d.amount,
        lockUntil: Number(d.lockUntil),
        interestRate: d.interestRate,
        active: d.active
      }));
      
      return deposits;
    } catch (err) {
      console.error("Gagal fetch time deposits via Batch:", err);
      return [];
    }
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
      // [FIX] Always fetch global settings even for regular members to ensure UI sync
      fetchAdminConfig(kop);

      const balance = await token.balanceOf(addr);
      setIdrtBalance(formatToken(balance));

      const pengurus = await kop.isPengurus(addr);
      setIsPengurus(pengurus);

      const data = await kop.dataAnggota(addr);

      const formattedData = {
        terdaftar: data.terdaftar || data[0],
        status: Number(data.status !== undefined ? data.status : data[1]), 
        nama: data.nama || data[2],
        noHP: data.noHP || data[3],
        noKTP: data.noKTP || data[4],
        alamat: data.alamat || data[5],
        gender: data.jenisKelamin || data[6],
        job: data.pekerjaan || data[7],
        emergency: data.kontakDarurat || data[8],
        simpananPokok: data.simpananPokok || data[9] || 0n,
        simpananWajib: data.simpananWajib || data[10] || 0n,
        simpananSukarela: data.simpananSukarela || data[11] || 0n,
        shuSudahDiambil: data.shuSudahDiambil || data[12] || 0n,
        branchId: Number(data.branchID !== undefined ? data.branchID : data[13]),
        limitPinjaman: data.limitPinjaman || data[14] || 0n,
        currentBilling: await kop.tagihanWajib(addr)
      };

      setAnggotaData(formattedData);

      if (formattedData.terdaftar) {
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
            status: Number(pinjaman.status || pinjaman[7]),
            quality: Number(pinjaman.quality || pinjaman[8]), // Kolektibilitas enum
            isRestructured: pinjaman.isRestructured,
            surveyNote: pinjaman.surveyNote,

            lunas: Number(pinjaman.status || pinjaman[7]) === 4, // StatusPinjaman.Lunas
            disetujui: Number(pinjaman.status || pinjaman[7]) === 3, // StatusPinjaman.Aktif
          };

          const st = Number(mappedPinjaman.status);

          // StatusPinjaman: 0:Pending, 1:Surveyed, 2:CommitteeApproved, 3:Aktif, 4:Lunas, 5:Ditolak, 6:Macet
          if (st >= 0 && st <= 2) {
            setPendingLoanUser(mappedPinjaman);
            setPinjamanAktif(null);
          } else if (st === 3 || st === 4 || st === 6) {
            setPinjamanAktif(mappedPinjaman);
            setPendingLoanUser(null);
          } else {
            setPinjamanAktif(null);
            setPendingLoanUser(null);
          }
        } else {
          setPinjamanAktif(null);
          setPendingLoanUser(null);
        }

        await fetchHistory(addr, kop);
        
        const deposits = await fetchUserTimeDeposits(kop, addr);
        setUserTimeDeposits(deposits);
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
      // [FIX] Use High-Performance Batch Getter for Admin (Instant Load)
      const [addrs, data] = await kop.getAllMembers();
      
      const members = addrs.map((addr, i) => ({
        address: addr,
        nama: data[i].nama,
        simpananPokok: data[i].simpananPokok,
        simpananWajib: data[i].simpananWajib,
        simpananSukarela: data[i].simpananSukarela,
        terdaftar: data[i].terdaftar,
        status: Number(data[i].status), 
        branchId: Number(data[i].branchID)
      }));
      
      setMemberList(members);
    } catch (err) {
      console.error('Gagal fetch member list via Batch:', err);
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
          CONTRACT_ADDRESS,
          KoperasiABI.abi || KoperasiABI,
          signer
        );
        const token = new ethers.Contract(
          TOKEN_ADDRESS,
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

  const daftarAnggota = async (params, onProgress) => {
    if (!account) throw new Error("Wallet belum terhubung");
    if (!params || !params.nama) throw new Error("Data pendaftaran tidak lengkap");

    try {
      setIsLoading(true);
      if (onProgress) onProgress('Memproses pendaftaran...');
      // 1. Simpan Pending ke Server (agar data tidak hilang jika tab tertutup)
      console.log("[Daftar] Saving pending reg to server for:", account);
      const res = await fetch('http://localhost:5000/api/admin/pending-pendaftaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address: account, 
          params: params 
        })
      });
      const data = await res.json();
      if (!data.success) {
        // [FIX] If already registered on blockchain but not in DB, it's okay to proceed to payment
        if (data.error && data.error.includes("telah terdaftar")) {
           console.warn("[Daftar] User already exists in DB, proceeding to payment refresh logic.");
        } else {
          throw new Error(data.error || "Gagal mendaftar");
        }
      }

      if (onProgress) onProgress('Data pendaftaran tersimpan di sistem! Lanjut ke Pembayaran...');
      const pokokAmount = adminConfig?.pokok ? adminConfig.pokok.toString() : '100000';
      if (onProgress) onProgress(`Memproses Invoice Pembayaran Simpanan Pokok (Rp ${formatCurrency(pokokAmount)})...`);
      
      const paymentResult = await processXenditPayment(pokokAmount, 'POKOK', onProgress);
      if (onProgress) onProgress('Pendaftaran Selesai! Silakan selesaikan pembayaran.');

      return { ...data, ...paymentResult };
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
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
    // 25.000 (Example) - Now uses dynamic billing amount if available
    const amount = anggotaData?.currentBilling || parseToken('25000');
    return processXenditPayment(formatToken(amount), true, onProgress);
  };

  // NEW: Internal Ledger Payment (Balance -> Billing)
  const bayarSimpananWajibInternal = async (onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");
    try {
      const amount = anggotaData?.currentBilling || 0n;
      if (amount === 0n) throw new Error("Tidak ada tagihan aktif.");

      const sukarela = BigInt(anggotaData?.simpananSukarela || 0);
      if (sukarela < amount) {
        throw new Error(`Saldo Sukarela tidak cukup! Butuh ${formatCurrency(formatToken(amount))} IDRT.`);
      }

      if (onProgress) onProgress('Memproses pembayaran internal (Blockchain Ledger)...');
      const tx = await koperasiContract.bayarTagihanWajib(amount, POLYGON_GAS_OPTIONS);
      
      if (onProgress) onProgress('Menunggu konfirmasi ledger...');
      await tx.wait();
      
      await refresh();
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const bayarSimpananSukarela = async (jumlahStr, onProgress) => {
    return processXenditPayment(jumlahStr, false, onProgress);
  };

  const ajukanPinjaman = async (jumlahStr, tenorBulan, bank, accountNumber, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");

    try {
      setIsLoading(true);
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
      const tx = await koperasiContract.ajukanPinjaman(jumlah, tenor, { 
        ...POLYGON_GAS_OPTIONS,
        gasLimit: 600000 
      });

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
    } finally {
      setIsLoading(false);
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

  const bayarAngsuranInternal = async (jumlahStr, onProgress) => {
    if (!koperasiContract || !pinjamanAktif) throw new Error("Data tidak valid");
    try {
      const amount = parseToken(jumlahStr || '0');
      const sukarela = BigInt(anggotaData?.simpananSukarela || 0);

      if (sukarela < amount) {
        throw new Error(`Saldo Sukarela tidak cukup! Butuh ${formatCurrency(jumlahStr)} IDRT.`);
      }

      if (onProgress) onProgress('Memproses pelunasan internal (Blockchain Ledger)...');
      const tx = await koperasiContract.bayarAngsuranInternal(pinjamanAktif.id, amount, POLYGON_GAS_OPTIONS);
      
      if (onProgress) onProgress('Menunggu konfirmasi pelunasan...');
      await tx.wait();
      
      await refresh();
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const openSimpananBerjangka = async (amountStr, tenorBulan, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");
    try {
      setIsLoading(true);
      const amount = parseToken(amountStr || '0');
      if (onProgress) onProgress('Membuka simpanan berjangka (Internal Transfer)...');
      
      const tx = await koperasiContract.openSimpananBerjangka(amount, tenorBulan, POLYGON_GAS_OPTIONS);
      
      if (onProgress) onProgress('Menunggu konfirmasi blockchain...');
      await tx.wait();
      
      await refresh(); // Refresh all data
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cairkanSimpananBerjangka = async (index, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");
    try {
      setIsLoading(true);
      if (onProgress) onProgress('Memproses pencairan tabungan berjangka...');
      const tx = await koperasiContract.cairkanSimpananBerjangka(index, POLYGON_GAS_OPTIONS);
      
      if (onProgress) onProgress('Menunggu konfirmasi pencairan...');
      await tx.wait();
      
      await refresh();
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const tarikSimpanan = async (jumlahStr, bank, rekening, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");

    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
    try {
      if (onProgress) onProgress('Mengirim penolakan ke server (Zero Gas)...');

      const response = await fetch('http://localhost:5000/api/loan/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: idStr,
          reason: reason
        })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Gagal memproses penolakan di server");

      if (onProgress) onProgress('Penolakan berhasil dicatat!');
      triggerTripleSync();

      return { hash: data.txHash, wait: async () => true };
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
      setIsLoading(true);
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
      const tx = await koperasiContract.tambahLikuiditas(amount, POLYGON_GAS_OPTIONS);
      if (onProgress) onProgress('Menunggu konfirmasi...');
      await tx.wait();

      await fetchUserData(account, koperasiContract, idrTokenContract);
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
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
    const paymentStatus = params.get('payment');
    
    if (paymentStatus === 'success') {
      // Clean URL IMMEDIATELY to prevent loop before state takes effect
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // OPTIONAL: use session storage to ensure we only trigger the effect ONCE per refresh
      const lastProcessedTime = sessionStorage.getItem('last_processed_payment');
      const now = Date.now();
      
      // Only trigger if not processed in the last 10 seconds (prevents double fire)
      if (!lastProcessedTime || (now - Number(lastProcessedTime) > 10000)) {
        console.log("[Payment] Success detected from URL, setting state...");
        setPaymentSuccess(true);
        setIsPaymentLocked(false);
        sessionStorage.setItem('last_processed_payment', now.toString());

        // [FIX] Trigger Aggressive Triple-Sync to catch late blockchain confirmations
        triggerTripleSync();
      }
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
            let successTriggered = false;

            if (paymentType === 'simpanan' || paymentType === 'POKOK') {
              // [FIX] For Registration (Pokok), explicitly check the 'terdaftar' status in addition to balance
              const [currentBalance, member] = await Promise.all([
                  idrTokenContract.balanceOf(account),
                  koperasiContract.dataAnggota(account)
              ]);

              if (paymentType === 'POKOK') {
                  if (member.terdaftar || (typeof member[0] === 'boolean' && member[0])) {
                      console.log("[Polling] Registration confirmed ACTIVE on blockchain.");
                      successTriggered = true;
                  }
              } else {
                  if (currentBalance > baselineValue) successTriggered = true;
              }
            } else {
              // Repayment check
              const id = await koperasiContract.idPinjamanAktifAnggota(account);
              if (Number(id) > 0) {
                const loan = await koperasiContract.dataPinjaman(id);
                const currentRepaid = loan.sudahDibayar || loan[4];
                if (currentRepaid > baselineValue) successTriggered = true;
              }
            }

            if (successTriggered && isMounted) {
              console.log(`[Polling] SUCCESS! ${paymentType} detected.`);
              clearInterval(interval);
              
              // [FIX] Immediate state refresh before unlocking
              await fetchUserData(account, koperasiContract, idrTokenContract);
              
              setPaymentSuccess(true);
              setIsPaymentLocked(false);

              // [FIX] Unified Triple-Sync Strategy for final consistency
              triggerTripleSync();
            }
          } catch (pollErr) {
            console.warn("[Polling] Tick error:", pollErr);
          }
        }, 4000); // Polling frequency 4s
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
    userTimeDeposits,
    pendingLoanUser,
    pendingLoans,
    mintTesting,
    daftarAnggota,
    setorSimpananWajib: bayarSimpananWajib,
    bayarSimpananWajibInternal,
    tarikSimpanan,
    setorSimpananSukarela: bayarSimpananSukarela,
    ajukanPinjaman,
    openSimpananBerjangka,
    bayarAngsuran,
    setujuiPinjaman,
    tolakPinjaman,
    approveSurvey,
    approveCommittee,
    bayarAngsuranInternal,
    cairkanSimpananBerjangka,

    refresh,
    approvedTodayCount,

    // Admin Minting
    memberList,
    fetchAllMembers,
    mintToken,
    allSimpananLogs,
    fetchAllSimpananLogs,

    // Admin Config & All Loans
    allLoans,
    adminConfig,
    updateGlobalSettings,
    tambahLikuiditas,
    triggerTripleSync,

    // SHU & FUNDS
    adminStats,
    shuHistory,
    generateMonthlyBills,
    releaseProfitSharing,
    allGlobalLogs,
    fetchAllGlobalLogs,
    closeMembership,
    emergencyWithdraw,
    syncLiquidity,
    cancelPayment,
    refreshAdminStats: () => fetchAdminStats(koperasiContract, idrTokenContract)
  };
};
