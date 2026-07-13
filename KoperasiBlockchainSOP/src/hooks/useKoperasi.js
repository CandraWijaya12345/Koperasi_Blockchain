// hooks/useKoperasi.js
import React, { useEffect, useState, useRef } from 'react';
import { ethers } from 'ethers';
import {
  CONTRACT_ADDRESS,
  rupiah_ADDRESS,
  DEPLOY_BLOCK,
  POLYGONSCAN_API_KEY,
  POLYGONSCAN_BASE_URL
} from '../utils/constants';
import { formatrupiah, parserupiah, formatCurrency } from '../utils/format';

import KoperasiABI from '../abi/koperasisimpanpinjambaru.json';
import IDRABI from '../abi/idrABI.json';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// [SECURITY] Authenticated fetch helper — attaches JWT token to all API requests
// No MetaMask popup needed — token is acquired once during login
const authFetch = async (url, options = {}, account = null) => {
  const addr = account ? account.toLowerCase() : null;
  const token = addr ? localStorage.getItem(`auth_token_${addr}`) : null;
  const headers = {
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  try {
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 && addr) {
      console.warn(`[Auth] 401 Unauthorized for address ${addr}. Clearing token...`);
      localStorage.removeItem(`auth_token_${addr}`);
      window.dispatchEvent(new CustomEvent('auth-unauthorized', { detail: { address: addr } }));
    }
    return res;
  } catch (err) {
    console.error("authFetch network error:", err);
    throw err;
  }
};

const cloneArgs = (args) => {
  if (!args) return {};
  try {
    let cloned;
    if (Array.isArray(args) || typeof args.length === 'number') {
      cloned = Array.from(args);
    } else {
      cloned = { ...args };
    }
    if (typeof args.toObject === 'function') {
      const obj = args.toObject();
      for (const key of Object.keys(obj)) {
        cloned[key] = obj[key];
      }
    }
    return cloned;
  } catch (e) {
    console.error("Failed to clone args:", e);
    return args;
  }
};

// [FIX] Polygon Amoy Gas Overrides (Min 25 Gwei Priority Fee needed, set high to process instantly)
const POLYGON_GAS_OPTIONS = {
  maxPriorityFeePerGas: ethers.parseUnits('100', 'gwei'), // Generous tip to miners to prevent stuck transactions
  maxFeePerGas: ethers.parseUnits('600', 'gwei') // High ceiling to process immediately even during surges
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

const ipfsNameCache = {};
const decryptionCache = {};

const fetchIPFSName = async (hash, address = "", accountAddr = null) => {
  if (!hash) return "";
  const addr = accountAddr ? accountAddr.toLowerCase() : null;
  const token = addr ? localStorage.getItem(`auth_token_${addr}`) : null;
  if (!token) {
    console.log(`[Auth] No token found for ${addr}. Skipping IPFS metadata API call.`);
    return "";
  }
  const cacheKey = `${hash}_${address.toLowerCase()}`;
  if (ipfsNameCache[cacheKey]) {
    return ipfsNameCache[cacheKey];
  }
  try {
    const res = await authFetch(`${window.API_BASE}/api/ipfs/metadata/${hash}/${address}`, {}, accountAddr);
    if (res.ok) {
      const data = await res.json();
      const nama = data.nama || "";
      if (nama) {
        ipfsNameCache[cacheKey] = nama;
      }
      return nama;
    }
  } catch (err) {
    console.warn("Failed to fetch IPFS metadata from backend:", err);
  }
  return "";
};

const decryptTextAPI = async (encryptedText, accountAddr = null) => {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
  const addr = accountAddr ? accountAddr.toLowerCase() : null;
  const token = addr ? localStorage.getItem(`auth_token_${addr}`) : null;
  if (!token) {
    console.log(`[Auth] No token found for ${addr}. Skipping decryption API call.`);
    return encryptedText;
  }
  if (decryptionCache[encryptedText]) {
    return decryptionCache[encryptedText];
  }
  try {
    const res = await authFetch(window.API_BASE + '/api/crypto/decrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: encryptedText })
    }, accountAddr);
    const data = await res.json();
    const decrypted = data.decrypted || encryptedText;
    if (decrypted && decrypted !== encryptedText) {
      decryptionCache[encryptedText] = decrypted;
    }
    return decrypted;
  } catch (err) {
    console.warn("Failed to decrypt text via API:", err);
    return encryptedText;
  }
};

export const useKoperasi = (account) => {
  const [koperasiContract, setKoperasiContract] = useState(null);
  const [idrContract, setIdrContract] = useState(null);

  // Anti-Race Condition
  const activeAccount = useRef(account);
  useEffect(() => { activeAccount.current = account; }, [account]);

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // [FIX] Persist payment state across page refreshes (for Xendit redirect), scoped by account
  const [isPaymentLocked, setIsPaymentLocked] = useState(() => {
    const addr = account ? account.toLowerCase() : null;
    const key = addr ? `isPaymentLocked_${addr}` : 'isPaymentLocked';
    return sessionStorage.getItem(key) === 'true';
  });
  const [paymentSuccess, setPaymentSuccess] = useState(() => {
    const addr = account ? account.toLowerCase() : null;
    const key = addr ? `paymentSuccess_${addr}` : 'paymentSuccess';
    return sessionStorage.getItem(key) === 'true';
  });
  const [paymentType, setPaymentType] = useState(() => {
    const addr = account ? account.toLowerCase() : null;
    const key = addr ? `paymentType_${addr}` : 'paymentType';
    return sessionStorage.getItem(key) || 'simpanan';
  });
  const [paymentBaseline, setPaymentBaseline] = useState(() => {
    const addr = account ? account.toLowerCase() : null;
    const key = addr ? `paymentBaseline_${addr}` : 'paymentBaseline';
    return BigInt(sessionStorage.getItem(key) || '0');
  });

  // [BARU] Status Kesehatan Backend (Xendit, Tunnel & Blockchain)
  const [systemStatus, setSystemStatus] = useState({
    xendit: 'UNKNOWN',
    tunnel: 'UNKNOWN',
    blockchain: 'UNKNOWN',
    adminBalance: '0',
    webhookMismatch: false,
    currentUrl: ''
  });

  // [BARU] Watchdog NGrok: Deteksi perubahan Tunnel URL secara dinamis
  const lastTunnelUrl = useRef('');
  useEffect(() => {
    if (systemStatus.currentUrl && lastTunnelUrl.current && systemStatus.currentUrl !== lastTunnelUrl.current) {
      console.warn("[Watchdog] NGrok URL Changed! Syncing environment...");
      // Auto-refresh to ensure all components and relative links are updated
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
    if (systemStatus.currentUrl) {
      lastTunnelUrl.current = systemStatus.currentUrl;
    }
  }, [systemStatus.currentUrl]);

  // Ref-based account tracking to prevent cross-account state contamination during switches
  const stateAccountRef = useRef(account);

  useEffect(() => {
    if (account) {
      const addrLower = account.toLowerCase();
      setIsPaymentLocked(sessionStorage.getItem(`isPaymentLocked_${addrLower}`) === 'true');
      setPaymentSuccess(sessionStorage.getItem(`paymentSuccess_${addrLower}`) === 'true');
      setPaymentType(sessionStorage.getItem(`paymentType_${addrLower}`) || 'simpanan');
      setPaymentBaseline(BigInt(sessionStorage.getItem(`paymentBaseline_${addrLower}`) || '0'));
      stateAccountRef.current = account;
    } else {
      setIsPaymentLocked(false);
      setPaymentSuccess(false);
      setPaymentType('simpanan');
      setPaymentBaseline(0n);
      stateAccountRef.current = null;
    }
  }, [account]);

  useEffect(() => {
    if (account && stateAccountRef.current && account.toLowerCase() === stateAccountRef.current.toLowerCase()) {
      const addrLower = account.toLowerCase();
      sessionStorage.setItem(`isPaymentLocked_${addrLower}`, isPaymentLocked);
      sessionStorage.setItem(`paymentType_${addrLower}`, paymentType);
      sessionStorage.setItem(`paymentSuccess_${addrLower}`, paymentSuccess);
      sessionStorage.setItem(`paymentBaseline_${addrLower}`, paymentBaseline.toString());
    }
  }, [isPaymentLocked, paymentType, paymentSuccess, paymentBaseline, account]);

  const [isPengurus, setIsPengurus] = useState(false);
  const [anggotaData, setAnggotaData] = useState(null);
  const [idrBalance, setIdrBalance] = useState('0');
  const [totalSimpanan, setTotalSimpanan] = useState('0');
  const [pinjamanAktif, setPinjamanAktif] = useState(null);
  const [history, setHistory] = useState([]);
  const [pendingLoanUser, setPendingLoanUser] = useState(null);
  const [pendingLoans, setPendingLoans] = useState([]);
  const [approvedTodayCount, setApprovedTodayCount] = useState(0);
  const [joiningDate, setJoiningDate] = useState(null);
  const [userTimeDeposits, setUserTimeDeposits] = useState([]);

  // Admin Data
  const [allLoans, setAllLoans] = useState({ pending: [], active: [], paid: [], rejected: [] });
  const [adminConfig, setAdminConfig] = React.useState({
    bunga: 9,
    bungaPinjaman: 12,
    denda: 1,
    pokok: 0,
    wajib: 0,
    feeAdmin: 0,
    feeProvisi: 0,
    feeResiko: 0,
    deductUpfront: false,
    useIPFSStorage: false
  });

  const targetSettingsRef = useRef(null);

  // --- helper untuk approval rupiah ---
  const handleApprove = async (amount, onProgress) => {
    if (!idrContract || !account) return false;
    try {
      if (onProgress) onProgress('Meminta izin penggunaan rupiah...');
      const allowance = await idrContract.allowance(
        account,
        CONTRACT_ADDRESS
      );
      if (allowance < amount) {
        if (onProgress) onProgress('Menunggu konfirmasi approval di wallet...');
        const tx = await idrContract.approve(
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
    if (!idrContract || !account) throw new Error("Wallet belum terhubung");
    const bal = await idrContract.balanceOf(account);
    if (bal < requiredAmount) {
      throw new Error(`Saldo Rupiah Kurang! Butuh ${formatCurrency(formatrupiah(requiredAmount))}, Saldo Anda: ${formatCurrency(formatrupiah(bal))} `);
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
      const allBaru = [];

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
        else if (name === 'AnggotaBaru') allBaru.push(l);
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
      const logBaru = allBaru.filter(l => getLogUser(l) === userAddr);

      // [BARU] Extract Join Date
      if (logBaru.length > 0) {
        const firstJoin = logBaru[0];
        const ts = Number(firstJoin.args.timestamp || firstJoin.args[2] || 0);
        if (ts > 0) setJoiningDate(ts);
      }

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
        ...logBaru,
        // ...logSHU, (Hidden for presentation)
        ...logMemberUpdates
      ];

      // Map ID -> Amount from allAjukan
      const userLoanAmounts = {};
      allAjukan.forEach(l => {
        if (l.args) {
          const id = Number(l.args.id || l.args[0]);
          const jumlah = l.args.jumlah || l.args[2];
          if (id && jumlah) {
            userLoanAmounts[id] = jumlah;
          }
        }
      });

      // Fetch timestamps for all logs
      const allLogsWithTime = await Promise.all(allLogs.map(async (logObj) => {
        const l = {
          ...logObj,
          args: cloneArgs(logObj.args)
        };
        let ts;
        const name = l.fragment?.name || l.eventName;

        // Inject loan amount to related events
        if (name === 'PinjamanDisetujui') {
          const loanId = Number(l.args.id || l.args[0]);
          if (userLoanAmounts[loanId]) {
            l.args.jumlah = userLoanAmounts[loanId];
          }
        } else if (name === 'PinjamanLunas' || name === 'PinjamanDitolak') {
          const loanId = Number(l.args.loanId || l.args.id || l.args[0] || l.args[1]);
          if (userLoanAmounts[loanId]) {
            l.args.jumlah = userLoanAmounts[loanId];
          }
        }

        // Decrypt name if AnggotaBaru
        if (name === 'AnggotaBaru') {
          let rawNama = l.args.nama || l.args[1] || "";
          const userAddress = l.args.user || l.args[0];
          if (rawNama === 'IPFS_USER' && userAddress && kop) {
            try {
              const member = await kop.dataAnggota(userAddress);
              const profileHash = member.profileHash || member[3];
              if (profileHash) {
                rawNama = await fetchIPFSName(profileHash, userAddress, addr);
              }
            } catch (e) {
              console.warn("Failed to fetch name from IPFS for user:", userAddress, e);
            }
          } else if (rawNama.includes(':')) {
            rawNama = await decryptTextAPI(rawNama, addr);
          }
          l.args.nama = rawNama || "IPFS_USER";
        }

        // Accurate timestamp extraction from args
        if (name === 'DepositTercatat') ts = Number(l.args[3] || l.args.waktu);
        else if (name === 'PenarikanTercatat') ts = Number(l.args[2] || l.args.waktu);
        else if (name === 'PinjamanLunas') ts = Number(l.args[2] || l.args.waktu);
        else if (name === 'SimpananBerjangkaDibuka') ts = Number(l.args[3] || l.args.waktu);
        else if (name === 'SimpananBerjangkaDicairkan') ts = Number(l.args[3] || l.args.waktu);
        else if (name === 'SHUDiterima') ts = Number(l.args[2] || l.args.waktu);
        else if (name === 'AnggotaBaru') ts = Number(l.args[2] || l.args.waktu || l.args.timestamp);
        else if (l.args.timestamp) ts = Number(l.args.timestamp);
        else if (l.args.waktu) ts = Number(l.args.waktu);
        else {
          try {
            const block = await logObj.getBlock();
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

          // [FIX] Real-time State Verification for User's Pending Loan
          // Query the blockchain directly to fetch the actual status to prevent status-overwrite bug
          let realStatus = 0;
          try {
            const loanId = Number(latestPending.args.id);
            const loanData = await kop.dataPinjaman(loanId);
            realStatus = Number(loanData.status !== undefined ? loanData.status : loanData[7]);
          } catch (err) {
            console.warn("Failed to fetch real-time loan status in history sync:", err);
          }

          // Return plain cloned object to bypass read-only Ethers v6 freeze and keep both args & status intact
          setPendingLoanUser({
            ...latestPending,
            status: realStatus
          });
        } else {
          setPendingLoanUser(null);
        }
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
      logsAjukan.forEach(l => {
        if (l.args && l.args.id) loanAmounts[Number(l.args.id)] = l.args.jumlah;
      });

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

        // Return plain JS object to bypass read-only/frozen Ethers v6 Log object
        return {
          ...l,
          status: status
        };
      }));

      pending.sort((a, b) => b.extractedTimestamp - a.extractedTimestamp);

      const active = enhancedDisetujui.filter(l => {
        const id = Number(l.args.id);
        return !lunasIds.has(id);
      }).map(l => {
        const id = Number(l.args.id);
        // Return plain JS object to bypass read-only/frozen Ethers v6 Log object
        return {
          ...l,
          amountOverride: loanAmounts[id] || 0n,
          jatuhTempoProp: l.args.jatubTempo || l.args.jatuhTempo || 0
        };
      }).sort((a, b) => b.extractedTimestamp - a.extractedTimestamp);

      const paid = enhancedLunas.map(l => {
        const id = Number(l.args.loanId || l.args.id);
        // Return plain JS object to bypass read-only/frozen Ethers v6 Log object
        return {
          ...l,
          amountOverride: loanAmounts[id] || 0n
        };
      }).sort((a, b) => b.extractedTimestamp - a.extractedTimestamp);
      
      const rejected = enhancedDitolak.map(l => ({ ...l })).sort((a, b) => b.extractedTimestamp - a.extractedTimestamp);

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

  const fetchAllGlobalLogs = React.useCallback(async (kop) => {
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
        'PinjamanDitolak',
        'SettingsUpdated',
        'StorageModeUpdated',
        'SurveyApproved',
        'CommitteeApproved',
        'TagihanDibuat',
        'BagiHasilDirilis',
        'MembershipClosed',
        'PengurusDitambahkan',
        'ConfigUpdated',
        'AnggotaBaru',
        'AnggotaRejoin'
      ];

      // Map ID -> Amount from allLogsRaw (PinjamanDiajukan)
      const globalLoanAmounts = {};
      allLogsRaw.forEach(l => {
        if (l.fragment?.name === 'PinjamanDiajukan' && l.args) {
          const id = Number(l.args.id || l.args[0]);
          const jumlah = l.args.jumlah || l.args[2];
          if (id && jumlah) {
            globalLoanAmounts[id] = jumlah;
          }
        }
      });

      // Filter and Enhance with Accurate Timestamps (Consistent with User History)
      const filtered = allLogsRaw.filter(l =>
        l.fragment && relevantEvents.includes(l.fragment.name)
      );

      const enhanced = await Promise.all(filtered.map(async (logObj) => {
        const l = {
          ...logObj,
          args: cloneArgs(logObj.args)
        };
        let ts;
        const name = l.fragment?.name || l.eventName;

        // Inject loan amount to related events
        if (name === 'PinjamanDisetujui') {
          const loanId = Number(l.args.id || l.args[0]);
          if (globalLoanAmounts[loanId]) {
            l.args.jumlah = globalLoanAmounts[loanId];
          }
        } else if (name === 'PinjamanLunas' || name === 'PinjamanDitolak') {
          const loanId = Number(l.args.loanId || l.args.id || l.args[0] || l.args[1]);
          if (globalLoanAmounts[loanId]) {
            l.args.jumlah = globalLoanAmounts[loanId];
          }
        }

        // Decrypt name if AnggotaBaru
        if (name === 'AnggotaBaru') {
          let rawNama = l.args.nama || l.args[1] || "";
          const userAddress = l.args.user || l.args[0];
          if (rawNama === 'IPFS_USER' && userAddress && activeKop) {
            try {
              const member = await activeKop.dataAnggota(userAddress);
              const profileHash = member.profileHash || member[3];
              if (profileHash) {
                rawNama = await fetchIPFSName(profileHash, userAddress, account);
              }
            } catch (e) {
              console.warn("Failed to fetch name from IPFS for user:", userAddress, e);
            }
          } else if (rawNama.includes(':')) {
            rawNama = await decryptTextAPI(rawNama, account);
          }
          l.args.nama = rawNama || "IPFS_USER";
        }

        // Extract timestamp from args if available (same as fetchHistory)
        if (name === 'DepositTercatat') ts = Number(l.args[3] || l.args.waktu);
        else if (name === 'PenarikanTercatat') ts = Number(l.args[2] || l.args.waktu);
        else if (name === 'PinjamanLunas') ts = Number(l.args[2] || l.args.waktu);
        else if (name === 'AnggotaBaru') ts = Number(l.args[2] || l.args.waktu || l.args.timestamp);
        else if (l.args && l.args.waktu) {
          ts = Number(l.args.waktu);
        } else {
          // Fallback to extractedTimestamp or provider block
          ts = l.extractedTimestamp || l.timestamp || 0;
          if (ts === 0) {
            try {
              const block = await logObj.getBlock();
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
  }, [koperasiContract]);

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

  const fetchAdminStats = async (kop, idr) => {
    if (!kop || !idr) return;
    try {
      const profit = await kop.profitBelumDibagi();
      const shared = await kop.totalSHUDibagikan();
      const totalSimp = await kop.totalSimpananSeluruhAnggota();
      const bal = await idr.balanceOf(CONTRACT_ADDRESS);

      // Fetch Balances (Xendit + Admin POL)
      let midtransBal = '0';
      let adminPol = '0';
      try {
        const res = await authFetch(window.API_BASE + '/api/balance', {}, account);
        const data = await res.json();
        if (data.success) {
          midtransBal = data.balance;
          adminPol = data.adminPolBalance || '0';
        }
      } catch (err) {
        console.warn("Gagal fetch midtrans balance:", err);
      }

      setAdminStats({
        profitBelumDibagi: formatrupiah(profit),
        totalSHUDibagikan: formatrupiah(shared),
        totalSimpanan: formatrupiah(totalSimp),
        contractBalance: formatrupiah(bal),
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

  const emergencyWithdraw = async (idrAddr, amountStr, onProgress) => {
    throw new Error("Fitur Emergency Withdraw tidak tersedia di Smart Contract ini.");
  };

  const fetchAdminConfig = async (kop) => {
    if (!kop) return;
    try {
      const [bSimpanan, bPinjaman, denda, settsRaw, ipfsMode] = await Promise.all([
        kop.bungaSimpananTahunanPersen(),
        kop.bungaPinjamanTahunanPersen(),
        kop.dendaHarianPermil(),
        kop.settings(),
        kop.useIPFSStorage()
      ]);

      console.log("[Admin] DIAGNOSTIC: Settings and storage mode fetched from Blockchain.");
      const setts = settsRaw;

      const blockchainConfig = {
        bunga: Number(bSimpanan),
        bungaPinjaman: Number(bPinjaman),
        denda: Number(denda),
        pokok: Number(formatrupiah(setts[4])),
        wajib: Number(formatrupiah(setts[5])), // Admission Fee
        minSaldo: Number(formatrupiah(setts[6])),
        feeAdmin: Number(formatrupiah(setts[7])),
        feeProvisi: Number(setts[8]),
        feeResiko: Number(setts[9]),
        deductUpfront: !!setts[2],
        useIPFSStorage: ipfsMode
      };

      // Check if blockchain matches our target settings (to detect RPC lag)
      let matchesTarget = true;
      if (targetSettingsRef.current) {
        const target = targetSettingsRef.current;
        if (target.bungaSimpanan !== undefined && blockchainConfig.bunga !== target.bungaSimpanan) matchesTarget = false;
        if (target.bungaPinjaman !== undefined && blockchainConfig.bungaPinjaman !== target.bungaPinjaman) matchesTarget = false;
        if (target.dendaHarian !== undefined && blockchainConfig.denda !== target.dendaHarian) matchesTarget = false;
        if (target.pokok !== undefined && blockchainConfig.pokok !== target.pokok) matchesTarget = false;
        if (target.wajib !== undefined && blockchainConfig.wajib !== target.wajib) matchesTarget = false;
        if (target.minSaldo !== undefined && blockchainConfig.minSaldo !== target.minSaldo) matchesTarget = false;
        if (target.feeAdmin !== undefined && blockchainConfig.feeAdmin !== target.feeAdmin) matchesTarget = false;
        if (target.feeProvisi !== undefined && blockchainConfig.feeProvisi !== target.feeProvisi) matchesTarget = false;
        if (target.feeResiko !== undefined && blockchainConfig.feeResiko !== target.feeResiko) matchesTarget = false;
        if (target.deductUpfront !== undefined && blockchainConfig.deductUpfront !== target.deductUpfront) matchesTarget = false;
        if (target.useIPFSStorage !== undefined && blockchainConfig.useIPFSStorage !== target.useIPFSStorage) matchesTarget = false;

        if (!matchesTarget) {
          console.log("[Admin] RPC node lag detected. Blockchain settings do not match target settings yet. Keeping optimistic settings and scheduling retry...");
          
          setAdminConfig(prev => {
            const merged = { ...blockchainConfig, ...prev };
            // Ensure target values are strictly preserved
            if (target.bungaSimpanan !== undefined) merged.bunga = target.bungaSimpanan;
            if (target.bungaPinjaman !== undefined) merged.bungaPinjaman = target.bungaPinjaman;
            if (target.dendaHarian !== undefined) merged.denda = target.dendaHarian;
            if (target.pokok !== undefined) merged.pokok = target.pokok;
            if (target.wajib !== undefined) merged.wajib = target.wajib;
            if (target.minSaldo !== undefined) merged.minSaldo = target.minSaldo;
            if (target.feeAdmin !== undefined) merged.feeAdmin = target.feeAdmin;
            if (target.feeProvisi !== undefined) merged.feeProvisi = target.feeProvisi;
            if (target.feeResiko !== undefined) merged.feeResiko = target.feeResiko;
            if (target.deductUpfront !== undefined) merged.deductUpfront = target.deductUpfront;
            if (target.useIPFSStorage !== undefined) merged.useIPFSStorage = target.useIPFSStorage;
            return merged;
          });

          // Schedule a retry
          setTimeout(() => fetchAdminConfig(kop), 3000);
          return;
        } else {
          console.log("[Admin] Blockchain settings matched target settings! Clearing target reference.");
          targetSettingsRef.current = null;
        }
      }

      setAdminConfig(blockchainConfig);
    } catch (e) {
      // [FIX] Silent fail for rate limiting/missing revert data. Polling will recover it.
      if (e.code === 'CALL_EXCEPTION' || e.message?.includes('rate limit')) {
        console.warn("[Admin] fetchAdminConfig RPC Busy/Exception. Skipping real-time update, fallback to polling.");
      } else {
        console.error("Gagal fetch config:", e);
      }
    }
  };

  const updateGlobalSettings = async (params, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");
    try {
      if (onProgress) onProgress("Mengupdate pengaturan global (Zero Gas)...");
      console.log("[Admin] DIAGNOSTIC: Sending Payload to Server:", JSON.stringify({ params }));
      const response = await authFetch(window.API_BASE + '/api/gov/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params })
      }, account);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Gagal update settings");

      // Set target settings ref for checking laggy RPC reads
      const target = {
        bungaSimpanan: params.bungaSimpanan !== undefined ? Number(params.bungaSimpanan) : undefined,
        bungaPinjaman: params.bungaPinjaman !== undefined ? Number(params.bungaPinjaman) : undefined,
        dendaHarian: params.dendaHarian !== undefined ? Number(params.dendaHarian) : undefined,
        pokok: params.pokok !== undefined ? Number(params.pokok) : undefined,
        wajib: params.wajib !== undefined ? Number(params.wajib) : undefined,
        minSaldo: params.minSaldo !== undefined ? Number(params.minSaldo) : undefined,
        feeAdmin: params.feeAdmin !== undefined ? Number(params.feeAdmin) : undefined,
        feeProvisi: params.feeProvisi !== undefined ? Number(params.feeProvisi) : undefined,
        feeResiko: params.feeResiko !== undefined ? Number(params.feeResiko) : undefined,
        deductUpfront: params.deductUpfront !== undefined ? !!params.deductUpfront : undefined
      };
      targetSettingsRef.current = {
        ...targetSettingsRef.current,
        ...target
      };

      // Optimistic update of adminConfig state
      setAdminConfig(prev => ({
        ...prev,
        bunga: params.bungaSimpanan !== undefined ? Number(params.bungaSimpanan) : prev.bunga,
        bungaPinjaman: params.bungaPinjaman !== undefined ? Number(params.bungaPinjaman) : prev.bungaPinjaman,
        denda: params.dendaHarian !== undefined ? Number(params.dendaHarian) : prev.denda,
        pokok: params.pokok !== undefined ? Number(params.pokok) : prev.pokok,
        wajib: params.wajib !== undefined ? Number(params.wajib) : prev.wajib,
        minSaldo: params.minSaldo !== undefined ? Number(params.minSaldo) : prev.minSaldo,
        feeAdmin: params.feeAdmin !== undefined ? Number(params.feeAdmin) : prev.feeAdmin,
        feeProvisi: params.feeProvisi !== undefined ? Number(params.feeProvisi) : prev.feeProvisi,
        feeResiko: params.feeResiko !== undefined ? Number(params.feeResiko) : prev.feeResiko,
        deductUpfront: params.deductUpfront !== undefined ? !!params.deductUpfront : prev.deductUpfront
      }));

      if (onProgress) onProgress("Berhasil update pengaturan!");

      // [FIX] Add a small delay to allow blockchain state to propagate
      if (onProgress) onProgress("Menyinkronkan data terbaru...");
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Explicit refresh to ensure UI sync
      await fetchAdminConfig(koperasiContract);
    } catch (e) {
      console.error("Gagal update settings:", e);
      throw e;
    }
  };

  const changeStorageMode = async (targetMode, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");
    try {
      if (onProgress) onProgress("Menunggu konfirmasi transaksi di wallet...");
      console.log(`[Admin] Mengubah mode penyimpanan ke: ${targetMode ? "IPFS" : "ON-CHAIN"}...`);
      
      const tx = await koperasiContract.setStorageMode(targetMode, POLYGON_GAS_OPTIONS);
      
      if (onProgress) onProgress("Menunggu transaksi dikonfirmasi di blockchain...");
      await tx.wait();
      
      // Set target storage mode ref
      targetSettingsRef.current = {
        ...targetSettingsRef.current,
        useIPFSStorage: targetMode
      };

      // Optimistic update of adminConfig state
      setAdminConfig(prev => ({
        ...prev,
        useIPFSStorage: targetMode
      }));

      if (onProgress) onProgress("Mode penyimpanan berhasil diperbarui!");
      
      // Delay kecil agar blockchain state sinkron
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Refresh admin configuration state
      await fetchAdminConfig(koperasiContract);
    } catch (e) {
      console.error("Gagal mengubah mode penyimpanan:", e);
      throw e;
    }
  };

  const closeMembership = async (memberAddress, onProgress) => {
    try {
      if (onProgress) onProgress("Menutup keanggotaan (Zero Gas)...");
      const response = await authFetch(window.API_BASE + '/api/admin/close-membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberAddress })
      }, account);
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
      const response = await authFetch(window.API_BASE + '/api/loan/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId, note })
      }, account);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Gagal approve survey");
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const approveCommittee = async (loanId, onProgress) => {
    try {
      if (onProgress) onProgress('Memproses Persetujuan Komite (Admin)...');
      const response = await authFetch(window.API_BASE + '/api/loan/committee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId })
      }, account);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Gagal approve komite");
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const generateMonthlyBills = async (amount, onProgress) => {
    try {
      if (onProgress) onProgress('Menghasilkan tagihan bulanan massal...');
      const response = await authFetch(window.API_BASE + '/api/gov/generate-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      }, account);
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
      const response = await authFetch(window.API_BASE + '/api/gov/release-sharing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage })
      }, account);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Gagal bagi hasil");
      triggerTripleSync();
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const res = await authFetch(window.API_BASE + '/api/health', {}, account);
      const data = await res.json();
      if (data) {
        setSystemStatus({
          xendit: data.xendit || 'OFFLINE',
          tunnel: data.tunnel || 'OFFLINE',
          blockchain: data.blockchain || 'OFFLINE',
          adminBalance: data.adminBalance || '0',
          webhookMismatch: !!data.webhookMismatch,
          currentUrl: data.currentUrl || ''
        });
      }
    } catch (e) {
      setSystemStatus({
        xendit: 'OFFLINE',
        tunnel: 'OFFLINE',
        blockchain: 'OFFLINE',
        adminBalance: '0',
        webhookMismatch: false,
        currentUrl: ''
      });
    }
  };

  const confirmWebhookUpdate = async (url) => {
    try {
      const res = await authFetch(window.API_BASE + '/api/health/confirm-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      }, account);
      const data = await res.json();
      if (data.success) {
        await fetchSystemStatus();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const triggerTripleSync = () => {
    console.log("[Sync] Triggering Triple-Sync Strategy (2s, 8s, 18s)...");
    fetchSystemStatus(); // Check health on sync
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

  const fetchUserData = async (addr, kop, idr) => {
    if (!addr || !kop || !idr) return;

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

      const balance = await idr.balanceOf(addr);
      setIdrBalance(formatrupiah(balance));

      const pengurus = await kop.isPengurus(addr);
      setIsPengurus(pengurus);

      const data = await kop.dataAnggota(addr);

      let rawNama = data.nama || data[2] || "";
      if (rawNama.includes(':')) {
        rawNama = await decryptTextAPI(rawNama, addr);
      }
      const rawProfileHash = data.profileHash || data[3] || "";
      if (rawNama === "" && rawProfileHash) {
        const ipfsName = await fetchIPFSName(rawProfileHash, addr, addr);
        if (ipfsName) rawNama = ipfsName;
      }

      let rawNoHP = data.noHP || data[10] || "";
      let rawNoKTP = data.noKTP || data[11] || "";
      let rawAlamat = data.alamat || data[12] || "";
      let rawGender = data.gender || data[13] || "";
      let rawJob = data.job || data[14] || "";
      let rawEmergency = data.emergency || data[15] || "";

      if (rawNoHP && rawNoHP.includes(':')) rawNoHP = await decryptTextAPI(rawNoHP, addr);
      if (rawNoKTP && rawNoKTP.includes(':')) rawNoKTP = await decryptTextAPI(rawNoKTP, addr);
      if (rawAlamat && rawAlamat.includes(':')) rawAlamat = await decryptTextAPI(rawAlamat, addr);
      if (rawGender && rawGender.includes(':')) rawGender = await decryptTextAPI(rawGender, addr);
      if (rawJob && rawJob.includes(':')) rawJob = await decryptTextAPI(rawJob, addr);
      if (rawEmergency && rawEmergency.includes(':')) rawEmergency = await decryptTextAPI(rawEmergency, addr);

      const formattedData = {
        terdaftar: data.terdaftar || data[0],
        status: Number(data.status !== undefined ? data.status : data[1]),
        nama: rawNama,
        profileHash: rawProfileHash, // Hash IPFS
        simpananPokok: data.simpananPokok || data[4] || 0n,
        simpananWajib: data.simpananWajib || data[5] || 0n,
        simpananSukarela: data.simpananSukarela || data[6] || 0n,
        shuSudahDiambil: data.shuSudahDiambil || data[7] || 0n,
        branchId: Number(data.branchID !== undefined ? data.branchID : data[8]),
        limitPinjaman: data.limitPinjaman || data[9] || 0n,
        currentBilling: await kop.tagihanWajib(addr),
        noHP: rawNoHP,
        noKTP: rawNoKTP,
        alamat: rawAlamat,
        gender: rawGender,
        job: rawJob,
        emergency: rawEmergency
      };

      setAnggotaData(formattedData);

      if (formattedData.terdaftar) {
        // [SYNC] Fetch Time Deposits to calculate Total Equity (Loan Limit baseline)
        const deposits = await fetchUserTimeDeposits(kop, addr);
        const totalBerjangka = deposits.reduce((sum, d) => d.active ? sum + BigInt(d.amount) : sum, 0n);
        setUserTimeDeposits(deposits);

        const totalEquity = BigInt(formattedData.simpananPokok) +
          BigInt(formattedData.simpananWajib) +
          BigInt(formattedData.simpananSukarela) +
          totalBerjangka;

        setTotalSimpanan(formatrupiah(totalEquity));

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

      // [FIX] Fetch tagihanWajib in parallel for each address
      const bills = await Promise.all(addrs.map(addr => kop.tagihanWajib(addr)));

      const members = await Promise.all(addrs.map(async (addr, i) => {
        let nama = data[i].nama || data[i][2] || "";
        let noHP = data[i].noHP || data[i][10] || "";
        let noKTP = data[i].noKTP || data[i][11] || "";
        let alamat = data[i].alamat || data[i][12] || "";
        let gender = data[i].gender || data[i][13] || "";
        let job = data[i].job || data[i][14] || "";
        let emergency = data[i].emergency || data[i][15] || "";

        if (nama.includes(':')) nama = await decryptTextAPI(nama, account);
        if (noHP.includes(':')) noHP = await decryptTextAPI(noHP, account);
        if (noKTP.includes(':')) noKTP = await decryptTextAPI(noKTP, account);
        if (alamat.includes(':')) alamat = await decryptTextAPI(alamat, account);
        if (gender.includes(':')) gender = await decryptTextAPI(gender, account);
        if (job.includes(':')) job = await decryptTextAPI(job, account);
        if (emergency.includes(':')) emergency = await decryptTextAPI(emergency, account);

        return {
          address: addr,
          nama: nama,
          isIPFSStorage: !(data[i].nama || data[i][2]),
          profileHash: data[i].profileHash || data[i][3] || "", // [BARU] Hash IPFS
          simpananPokok: data[i].simpananPokok,
          simpananWajib: data[i].simpananWajib,
          simpananSukarela: data[i].simpananSukarela,
          terdaftar: data[i].terdaftar,
          status: Number(data[i].status),
          branchId: Number(data[i].branchID),
          tagihanWajib: bills[i],
          noHP: noHP,
          noKTP: noKTP,
          alamat: alamat,
          gender: gender,
          job: job,
          emergency: emergency
        };
      }));

      setMemberList(members);

      // Staggered background lazy loading for IPFS names if blank on-chain
      members.forEach((m) => {
        if (!m.nama && m.profileHash) {
          fetchIPFSName(m.profileHash, m.address, account).then((ipfsName) => {
            if (ipfsName) {
              setMemberList((prevList) => {
                const newList = [...prevList];
                const idx = newList.findIndex(item => item.address.toLowerCase() === m.address.toLowerCase());
                if (idx !== -1) {
                  newList[idx] = { ...newList[idx], nama: ipfsName };
                }
                return newList;
              });
            }
          });
        }
      });
    } catch (err) {
      console.error('Gagal fetch member list via Batch:', err);
    }
  };

  const mintrupiah = async (to, amountStr, onProgress) => {
    if (!idrContract) throw new Error("Kontrak belum siap");
    try {
      const amount = parserupiah(amountStr);

      // Check Ownership
      const owner = await idrContract.owner();
      if (owner.toLowerCase() !== account.toLowerCase()) {
        throw new Error(`Gagal Mint: Wallet Anda (${account.slice(0, 6)}...) bukan Owner IDR rupiah! Owner: ${owner.slice(0, 6)}...`);
      }

      if (onProgress) onProgress('Meminta konfirmasi minting...');
      const tx = await idrContract.mint(to, amount, POLYGON_GAS_OPTIONS);
      if (onProgress) onProgress('Menunggu transaksi minting dikonfirmasi...');
      await tx.wait();

      // Refresh data
      if (to === account) {
        const bal = await idrContract.balanceOf(account);
        setIdrBalance(formatrupiah(bal));
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
        const idr = new ethers.Contract(
          rupiah_ADDRESS,
          IDRABI.abi || IDRABI,
          signer
        );

        setKoperasiContract(kop);
        setIdrContract(idr);

        await fetchUserData(account, kop, idr);

        // Fetch config (bunga/denda) as it affects all users
        await fetchAdminConfig(kop);

        // [FIX] Background Fetch for Admin Data (Non-blocking)
        // We check isPengurusVal from the contract directly or use the one set in fetchUserData
        const isPengurusVal = await kop.isPengurus(account);
        if (isPengurusVal) {
          console.log("Admin detected, starting staggered background data fetch...");
          setIsPengurus(true);

          // Staggered execution to respect RPC limits and avoid MetaMask 429
          setTimeout(() => fetchAllLoansAdmin(kop), 500);
          setTimeout(() => fetchAllMembers(kop), 1000);
          setTimeout(() => fetchAdminStats(kop, idr), 1500);
          setTimeout(() => fetchAllSimpananLogs(kop), 2000);
          setTimeout(() => fetchAllGlobalLogs(kop), 2500);
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
    if (!idrContract || !account) {
      setMessage('Hubungkan wallet terlebih dahulu');
      return;
    }
    setMessage('Memproses minting...');
    try {
      const amount = parserupiah('1000000');
      const tx = await idrContract.mint(account, amount, POLYGON_GAS_OPTIONS);
      await tx.wait();
      setMessage('Minting berhasil!');
      await fetchUserData(account, koperasiContract, idrContract);
    } catch (err) {
      console.error(err);
      if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        setMessage('Minting dibatalkan');
      } else {
        setMessage('Minting gagal: ' + (err.data?.message || err.message));
      }
    }
  };

  const daftarAnggota = async (params, onProgress) => {
    if (!account) throw new Error("Wallet belum terhubung");
    if (!params || !params.nama) throw new Error("Data pendaftaran tidak lengkap");

    try {
      if (onProgress) onProgress('Memproses pendaftaran...');
      // 1. Simpan Pending ke Server (agar data tidak hilang jika tab tertutup)
      console.log("[Daftar] Saving pending reg to server for:", account);
      const res = await authFetch(window.API_BASE + '/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params })
      }, account);
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
    }
  };

  // Helper: Call Xendit & Redirect
  const processXenditPayment = async (amountStr, isWajib, onProgress) => {
    if (!account) throw new Error("Wallet belum terhubung");

    try {
      if (onProgress) onProgress('Membuat Invoice Xendit...');

      // 1. Create Invoice via Backend
      const response = await authFetch(window.API_BASE + '/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: account,
          amount: amountStr,
          isWajib: isWajib
        })
      }, account);

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Gagal membuat invoice");
      }

      const invoiceUrl = data.invoiceUrl;
      console.log("Xendit Invoice URL:", invoiceUrl);

      // [FIX] Determine actual type
      const actualType = isWajib === 'POKOK' ? 'POKOK' : (isWajib ? 'wajib' : 'simpanan');

      if (onProgress) onProgress('Halaman pembayaran disiapkan. Menunggu verifikasi otomatis...');

      // [CRITICAL] Synchronous persistence to prevent race condition on refresh/redirect
      let baseline = "0";
      try {
        if (koperasiContract) {
          const member = await koperasiContract.dataAnggota(account);
          if (actualType === 'wajib') {
            baseline = member.simpananWajib.toString();
          } else if (actualType === 'simpanan') {
            baseline = member.simpananSukarela.toString();
          } else if (actualType === 'POKOK') {
            baseline = member.simpananPokok.toString();
          } else if (idrContract) {
             const b = await idrContract.balanceOf(account);
             baseline = b.toString();
          }
        }
      } catch (e) { console.warn("Failed to capture pre-payment baseline:", e); }

      const addrLower = account.toLowerCase();
      sessionStorage.setItem(`isPaymentLocked_${addrLower}`, 'true');
      sessionStorage.setItem(`paymentType_${addrLower}`, actualType);
      sessionStorage.setItem(`paymentBaseline_${addrLower}`, baseline);
      sessionStorage.setItem(`paymentSuccess_${addrLower}`, 'false');
      sessionStorage.setItem(`activeExternalId_${addrLower}`, data.externalId || '');

      setPaymentType(actualType);
      setPaymentBaseline(BigInt(baseline));
      setIsPaymentLocked(true);
      paymentChannel.postMessage({ type: 'PAYMENT_LOCKED', account });

      // [FIX] Return result directly from async function
      return { success: true, invoiceUrl: data.invoiceUrl, externalId: data.externalId };

    } catch (err) {
      console.error(err);
      throw err;
    }
  };



  const bayarSimpananWajib = async (onProgress) => {
    // 25.000 (Example) - Now uses dynamic billing amount if available
    const amount = anggotaData?.currentBilling || parserupiah('25000');
    return processXenditPayment(formatrupiah(amount), true, onProgress);
  };

  // NEW: Internal Ledger Payment (Balance -> Billing)
  const bayarSimpananWajibInternal = async (onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");
    try {
      const billAmount = anggotaData?.currentBilling || 0n;
      const hasActiveBill = billAmount > 0n;
      // [FIX] If no bill, show 0 to avoid "disuruh bayar 50rb" confusion when status is actually Lunas
      const displayAmount = hasActiveBill
        ? Number(formatrupiah(billAmount))
        : 0;

      const sukarela = BigInt(anggotaData?.simpananSukarela || 0);
      if (sukarela < billAmount) {
        throw new Error(`Saldo Sukarela tidak cukup! Butuh ${formatCurrency(formatrupiah(billAmount))}.`);
      }

      if (onProgress) onProgress('Memproses pembayaran internal (Blockchain Ledger)...');
      const tx = await koperasiContract.bayarTagihanWajib(billAmount, POLYGON_GAS_OPTIONS);

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
      const jumlah = parserupiah(jumlahStr || '0');
      const tenor = parseInt(tenorBulan || 12);

      if (pinjamanAktif && (pinjamanAktif.lunas === false || pinjamanAktif.lunas === undefined)) {
        throw new Error('Anda masih memiliki pinjaman aktif!');
      }

      if (anggotaData) {
        // [FIX] Explicit BigInt conversion to prevent TypeError (mixed types)
        const pokok = BigInt(anggotaData.simpananPokok || 0);
        const wajib = BigInt(anggotaData.simpananWajib || 0);
        const sukarela = BigInt(anggotaData.simpananSukarela || 0);

        const totalBerjangka = userTimeDeposits.reduce((sum, d) => d.active ? sum + BigInt(d.amount) : sum, 0n);
        const totalEquity = pokok + wajib + sukarela + totalBerjangka;
        const limit = totalEquity * 3n;

        const amountBigInt = parserupiah(jumlahStr);
        if (amountBigInt > limit) {
          throw new Error(`Melebihi limit! Maks 3x Simpanan (${formatCurrency(formatrupiah(limit))})`);
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
        await authFetch(window.API_BASE + '/api/loan/save-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: account,
            loanAmount: jumlahStr,
            bank: bank,
            accountNumber: accountNumber
          })
        }, account);
      } catch (saveErr) {
        console.error("Failed to save loan details:", saveErr);
        // Don't fail the whole process if this fails, but it's risky.
      }

      triggerTripleSync();
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
    const sisaIDR = Math.ceil(Number(formatrupiah(sisaHutang)));
    const inputIDR = Number(jumlahStr);

    if (inputIDR > sisaIDR) {
      throw new Error(`Jumlah melebihi sisa hutang! Sisa: ${formatCurrency(sisaIDR.toString())}`);
    }

    try {
      if (onProgress) onProgress('Membuat Invoice Xendit untuk Angsuran...');

      // 1. Create Xendit Invoice for Repayment
      const response = await authFetch(window.API_BASE + '/api/payment/repay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: account,
          loanId: pinjamanAktif.id.toString(),
          amount: jumlahStr
        })
      }, account);

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Gagal membuat invoice angsuran");
      }

      if (onProgress) onProgress('Halaman pembayaran Xendit telah disiapkan.');

      const baseline = sudahBayar.toString();

      // [CRITICAL] Synchronous persistence to prevent race condition on refresh/redirect
      const addrLower = account.toLowerCase();
      sessionStorage.setItem(`isPaymentLocked_${addrLower}`, 'true');
      sessionStorage.setItem(`paymentType_${addrLower}`, 'angsuran');
      sessionStorage.setItem(`paymentBaseline_${addrLower}`, baseline);
      sessionStorage.setItem(`paymentSuccess_${addrLower}`, 'false');
      sessionStorage.setItem(`activeExternalId_${addrLower}`, data.externalId || '');

      setPaymentType('angsuran');
      setPaymentBaseline(BigInt(baseline));
      setIsPaymentLocked(true);

      // [FIX] Return invoiceUrl for Iframe support
      return { status: 'redirected_to_xendit', invoiceUrl: data.invoiceUrl, externalId: data.externalId };
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const bayarAngsuranInternal = async (jumlahStr, onProgress) => {
    if (!koperasiContract || !pinjamanAktif) throw new Error("Data tidak valid");
    try {
      const amount = parserupiah(jumlahStr || '0');
      const sukarela = BigInt(anggotaData?.simpananSukarela || 0);

      if (sukarela < amount) {
        throw new Error(`Saldo Sukarela tidak cukup! Butuh ${formatCurrency(jumlahStr)}.`);
      }

      if (onProgress) onProgress('Memproses pelunasan internal (Blockchain Ledger)...');
      const tx = await koperasiContract.bayarAngsuranInternal(pinjamanAktif.id, amount, POLYGON_GAS_OPTIONS);

      if (onProgress) onProgress('Menunggu konfirmasi pelunasan...');
      await tx.wait();

      triggerTripleSync();
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const openSimpananBerjangka = async (amountStr, tenorBulan, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");
    try {
      const amount = parserupiah(amountStr || '0');
      if (onProgress) onProgress('Membuka simpanan berjangka (Internal Transfer)...');

      const tx = await koperasiContract.openSimpananBerjangka(amount, tenorBulan, POLYGON_GAS_OPTIONS);

      if (onProgress) onProgress('Menunggu konfirmasi blockchain...');
      await tx.wait();

      triggerTripleSync();
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const cairkanSimpananBerjangka = async (index, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");
    try {
      if (onProgress) onProgress('Memproses pencairan tabungan berjangka...');
      const tx = await koperasiContract.cairkanSimpananBerjangka(index, POLYGON_GAS_OPTIONS);

      if (onProgress) onProgress('Menunggu konfirmasi pencairan...');
      await tx.wait();

      triggerTripleSync();
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const tarikSimpanan = async (jumlahStr, bank, rekening, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");

    try {
      const jumlah = parserupiah(jumlahStr || '0');

      // Validasi basic client side
      if (anggotaData) {
        const sukarela = BigInt(anggotaData.simpananSukarela);
        if (jumlah > sukarela) {
          throw new Error(`Saldo Sukarela tidak cukup! Tersedia: ${formatrupiah(sukarela)} `);
        }
      }

      if (onProgress) onProgress('Mengirim permintaan penarikan (Zero Gas)...');

      const response = await authFetch(window.API_BASE + '/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: account,
          amount: jumlahStr,
          bank: bank,
          accountNumber: rekening
        })
      }, account);

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
    if (!koperasiContract || !idrContract) throw new Error("Kontrak belum siap");

    try {
      // 1. Check Liquidity First via Server (Source of Truth)
      if (onProgress) onProgress('Memeriksa likuiditas koperasi...');
      const loanData = await koperasiContract.dataPinjaman(idStr);

      const res = await authFetch(window.API_BASE + '/api/balance', {}, account);
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
        throw new Error(`Likuiditas Koperasi Kurang! Butuh ${formatCurrency(formatrupiah(needed))}, Saldo: ${formatCurrency(formatrupiah(effectiveBalance))}. Silahkan 'Tambah Likuiditas' di menu Manajemen Dana.`);
      }

      // 2. Execute Approval & Disbursement via Server
      if (onProgress) onProgress('Memproses Persetujuan & Pencairan...');

      const response = await authFetch(window.API_BASE + '/api/loan/approve-disburse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: idStr,
          userAddress: loanData.peminjam // Contract provides borrower address
        })
      }, account);

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

      const response = await authFetch(window.API_BASE + '/api/loan/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: idStr,
          reason: reason
        })
      }, account);

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
    if (!account) return;
    const addr = account.toLowerCase();
    const token = localStorage.getItem(`auth_token_${addr}`);
    if (!token) return;
    try {
      const res = await authFetch(window.API_BASE + '/api/balance', {}, account);
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
    if (!koperasiContract || !idrContract) throw new Error("Kontrak belum siap");
    try {
      if (onProgress) onProgress('Memeriksa saldo Xendit & Blockchain...');

      if (onProgress) onProgress('Meminta Server untuk Sinkronisasi...');

      const response = await authFetch(window.API_BASE + '/api/sync-liquidity', {
        method: 'POST'
      }, account);
      const syncData = await response.json();
      if (!syncData.success) throw new Error(syncData.error || "Gagal sinkronisasi via server");

      if (onProgress) onProgress('Sinkronisasi selesai!');

      // [FIX] TripleSync for consistency during UAT
      triggerTripleSync();
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
  }, [isPengurus, koperasiContract, idrContract]);

  const tambahLikuiditas = async (amountStr, onProgress) => {
    if (!koperasiContract) throw new Error("Kontrak belum siap");
    try {
      const amount = parserupiah(amountStr);

      // 1. Cek Saldo Admin
      if (onProgress) onProgress('Memeriksa saldo wallet...');
      await checkBalance(amount);

      // 2. Approve rupiah Transfer
      // [FIX] Force Gas Price
      const approve = await handleApprove(amount, onProgress);
      if (!approve) throw new Error("Approval gagal");

      // 3. Execute Contract Call
      if (onProgress) onProgress('Menambah likuiditas...');
      // [FIX] Force Gas Price
      const tx = await koperasiContract.tambahLikuiditas(amount, POLYGON_GAS_OPTIONS);
      if (onProgress) onProgress('Menunggu konfirmasi...');
      await tx.wait();

      await fetchUserData(account, koperasiContract, idrContract);
      return tx;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const refresh = React.useCallback(() => {
    if (account && koperasiContract && idrContract) {
      fetchUserData(account, koperasiContract, idrContract);
      fetchSystemStatus(); // Refresh health status too

      // [FIX] Also refresh admin-only data if user is an admin
      if (isPengurus) {
        console.log("[Refresh] Admin detected, refreshing member list and loans...");
        fetchAllMembers(koperasiContract);
        fetchAllLoansAdmin(koperasiContract);
        fetchAdminStats(koperasiContract, idrContract);
      }
    }
  }, [account, koperasiContract, idrContract, isPengurus]);

  const refreshTimeout = React.useRef(null);
  const debounceRefresh = React.useCallback(() => {
    if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    refreshTimeout.current = setTimeout(() => {
      console.log("[Blockchain] Debounced refresh executing...");
      refresh();
    }, 1500); // 1.5s delay to let block propagation settle
  }, [refresh]);

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
      window.history.replaceState({}, document.title, window.location.pathname);
      
      const isIframe = window.self !== window.top;
      if (isIframe) {
        console.log("[Payment] Success redirect detected inside IFRAME. Notifying parent window...");
        try {
          // Notify parent window directly
          window.parent.postMessage({ type: 'PAYMENT_SUCCESS_IFRAME' }, '*');
        } catch (e) {
          console.warn("Failed to send postMessage to parent:", e);
        }
        try {
          // Notify other contexts via BroadcastChannel
          paymentChannel.postMessage({ type: 'PAYMENT_SUCCESS' });
        } catch (e) {
          console.warn("Failed to send BroadcastChannel sync:", e);
        }
        return;
      }

      const lastProcessedTime = sessionStorage.getItem('last_processed_payment');
      const now = Date.now();

      if (!lastProcessedTime || (now - Number(lastProcessedTime) > 10000)) {
        console.log("[Payment] Redirect success detected. Locking UI...");
        setIsPaymentLocked(true);
        sessionStorage.setItem('last_processed_payment', now.toString());
      }
    }

    // 2. [FIXED] Blockchain Real-time Wildcard Event Listener (RPC Efficient)
    if (account && koperasiContract) {
      console.log("[Blockchain] Attaching optimized Wildcard Event Listener...");

      // We use a single filter instead of 10+ to avoid "RPC Rate Limited" on MetaMask
      koperasiContract.on("*", (event) => {
        try {
          const name = event.fragment?.name;
          const args = event.args;
          if (!name) return;

          // 1. Global Events (Always Refresh)
          const globalEvents = ["TagihanDibuat", "BagiHasilDirilis", "SettingsUpdated", "SurveyApproved", "CommitteeApproved", "LiquiditySynced"];

          // 2. Personal Events (Refresh only if it belongs to current user)
          const personalEvents = ["PinjamanDisetujui", "PinjamanDitolak", "PinjamanLunas", "AnggotaBaru", "AnggotaRejoin", "DepositTercatat", "PenarikanTercatat", "SimpananBerjangkaDibuka", "SimpananBerjangkaDicairkan", "SHUDiterima", "AngsuranMasuk"];

          let shouldRefresh = globalEvents.includes(name);

          if (!shouldRefresh && personalEvents.includes(name) && args) {
            // Check various possible argument names for addresses
            const relevantAddress = (args.user || args.peminjam || args.anggota || args.member || args[0])?.toString().toLowerCase();
            if (relevantAddress === account.toLowerCase()) {
              shouldRefresh = true;
            }
          }

          if (shouldRefresh) {
            console.log(`[Event] Relevant blockchain event detected: ${name}. Scheduling refresh...`);
            if (name === "SettingsUpdated") fetchAdminConfig(koperasiContract);
            debounceRefresh();
          }
        } catch (err) {
          console.warn("[Blockchain] Listener error (swallowed):", err);
        }
      });

      // 3. [NEW] Slow Polling Fallback (Every 60s)
      const slowPoll = setInterval(refresh, 60000);

      // Cleanup on unmount or account change
      return () => {
        console.log("[Blockchain] Removing Event Listeners...");
        koperasiContract.removeAllListeners();
        clearInterval(slowPoll);
        if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
      };
    }

    // 4. Listen for messages from other tabs
    const handleMessage = (event) => {
      if (event.data.account && account && event.data.account.toLowerCase() !== account.toLowerCase()) {
        return;
      }
      if (event.data.type === 'PAYMENT_LOCKED') {
        setIsPaymentLocked(true);
      } else if (event.data.type === 'PAYMENT_SUCCESS') {
        setIsPaymentLocked(false);
        setPaymentSuccess(true);
        triggerTripleSync();
      }
    };

    paymentChannel.onmessage = handleMessage;
  }, [account, koperasiContract, paymentChannel, refresh]);

  // 3. [NEW] ROBUST REAL-TIME POLLING for Payment Status
  useEffect(() => {
    let interval;
    let isMounted = true;

    const startPolling = async () => {
      if (!isPaymentLocked || !account || !koperasiContract || !idrContract) return;

      console.log(`[Polling] Initializing baseline for ${paymentType}...`);

      let baselineValue = paymentBaseline;
      const addrLower = account.toLowerCase();

      try {
        // Fetch BASELINE if not already set (e.g. if we missed the pre-payment capture)
        if (sessionStorage.getItem(`paymentBaseline_${addrLower}`) === null || sessionStorage.getItem(`paymentBaseline_${addrLower}`) === undefined) {
          if (paymentType === 'simpanan' || paymentType === 'POKOK' || paymentType === 'wajib') {
            const member = await koperasiContract.dataAnggota(account);
            if (paymentType === 'wajib') {
              baselineValue = BigInt(member.simpananWajib.toString());
            } else if (paymentType === 'simpanan') {
              baselineValue = BigInt(member.simpananSukarela.toString());
            } else if (paymentType === 'POKOK') {
              baselineValue = BigInt(member.simpananPokok.toString());
            }
          } else {
            const id = await koperasiContract.idPinjamanAktifAnggota(account);
            if (Number(id) > 0) {
              const loan = await koperasiContract.dataPinjaman(id);
              baselineValue = loan.sudahDibayar || loan[4];
            }
          }
          setPaymentBaseline(baselineValue);
          sessionStorage.setItem(`paymentBaseline_${addrLower}`, baselineValue.toString());
        }

        console.log(`[Polling] Baseline set: ${baselineValue.toString()}. Waiting for increase...`);

        // [NEW] "Already Finished" check to prevent infinite lock if transaction settled during redirect
        let alreadyFinished = false;
        if (paymentType === 'POKOK') {
          const member = await koperasiContract.dataAnggota(account);
          const isReg = member.terdaftar || (typeof member[0] === 'boolean' && member[0]);
          const simpananPokok = BigInt(member.simpananPokok.toString());
          if (isReg && (simpananPokok > baselineValue)) alreadyFinished = true;
        } else if (paymentType === 'simpanan' || paymentType === 'wajib') {
          const member = await koperasiContract.dataAnggota(account);
          const currentBal = paymentType === 'wajib' ? member.simpananWajib : member.simpananSukarela;
          if (BigInt(currentBal.toString()) > baselineValue) alreadyFinished = true;
        } else if (paymentType === 'angsuran') {
          const id = await koperasiContract.idPinjamanAktifAnggota(account);
          if (Number(id) > 0) {
            const loan = await koperasiContract.dataPinjaman(id);
            const currentRepaid = (loan.sudahDibayar || loan[4]);
            if (BigInt(currentRepaid.toString()) > baselineValue) alreadyFinished = true;
          } else {
            // [FALLBACK] If no active loan but we were paying one, it might be finished
            const member = await koperasiContract.dataAnggota(account);
            if (Number(member.idPinjamanAktif || member[11]) === 0) alreadyFinished = true;
          }
        }

        if (alreadyFinished) {
          console.log("[Polling] SUCCESS! Blockchain already reflected the change.");
          await fetchUserData(account, koperasiContract, idrContract);
          setPaymentSuccess(true);
          setIsPaymentLocked(false);
          const addrLower = account.toLowerCase();
          sessionStorage.removeItem(`isPaymentLocked_${addrLower}`);
          sessionStorage.removeItem(`paymentBaseline_${addrLower}`);
          triggerTripleSync();
          return;
        }

        if (!isMounted) return;

        interval = setInterval(async () => {
          try {
            let successTriggered = false;

            if (paymentType === 'simpanan' || paymentType === 'POKOK' || paymentType === 'wajib') {
              const member = await koperasiContract.dataAnggota(account);

              if (paymentType === 'POKOK') {
                const isReg = member.terdaftar || (typeof member[0] === 'boolean' && member[0]);
                const simpananPokok = BigInt(member.simpananPokok.toString());
                if (isReg && (simpananPokok > baselineValue)) {
                  console.log("[Polling] Registration & Pokok Deposit confirmed on blockchain.");
                  successTriggered = true;
                }
              } else {
                const bal = paymentType === 'wajib' ? member.simpananWajib : member.simpananSukarela;
                if (BigInt(bal.toString()) > baselineValue) successTriggered = true;
              }
            } else {
              // Repayment check
              const id = await koperasiContract.idPinjamanAktifAnggota(account);
              console.log(`[Polling] Repayment check. Active Loan ID: ${id}. Waiting > ${baselineValue.toString()}`);
              if (Number(id) > 0) {
                const loan = await koperasiContract.dataPinjaman(id);
                const currentRepaid = BigInt((loan.sudahDibayar || loan[4]).toString());
                console.log(`[Polling] Current Repaid: ${currentRepaid.toString()}`);
                if (currentRepaid > baselineValue) successTriggered = true;
              } else {
                // [FALLBACK] If loan is gone, it's likely finished/success
                console.log("[Polling] Active loan ID is 0. Assuming repayment success (loan finished).");
                successTriggered = true;
              }
            }

            if (successTriggered && isMounted) {
              console.log(`[Polling] SUCCESS! ${paymentType} detected.`);
              clearInterval(interval);

              // [FIX] Immediate state refresh before unlocking
              await fetchUserData(account, koperasiContract, idrContract);

              setPaymentSuccess(true);
              setIsPaymentLocked(false);

              // [NEW] Clear persistence once done
              const addrLower = account.toLowerCase();
              sessionStorage.removeItem(`isPaymentLocked_${addrLower}`);
              sessionStorage.removeItem(`paymentType_${addrLower}`);
              sessionStorage.removeItem(`paymentBaseline_${addrLower}`);

              // [FIX] Unified Triple-Sync Strategy for final consistency
              triggerTripleSync();
            }
          } catch (pollErr) {
            console.warn("[Polling] Tick error:", pollErr);
          }
        }, 2000); // Polling frequency 2s
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
  }, [isPaymentLocked, account, paymentType, koperasiContract, idrContract]);

  const cancelPayment = () => {
    setIsPaymentLocked(false);
    setPaymentSuccess(false);
    if (account) {
      const addrLower = account.toLowerCase();
      sessionStorage.removeItem(`isPaymentLocked_${addrLower}`);
      sessionStorage.removeItem(`paymentType_${addrLower}`);
      sessionStorage.removeItem(`paymentBaseline_${addrLower}`);
      sessionStorage.removeItem(`paymentSuccess_${addrLower}`);
      sessionStorage.removeItem(`last_processed_payment_${addrLower}`);
      sessionStorage.removeItem(`activeExternalId_${addrLower}`);
    } else {
      sessionStorage.removeItem('isPaymentLocked');
      sessionStorage.removeItem('paymentType');
      sessionStorage.removeItem('paymentBaseline');
      sessionStorage.removeItem('paymentSuccess');
      sessionStorage.removeItem('last_processed_payment');
      sessionStorage.removeItem('activeExternalId');
    }
    console.log("[Payment] Manual reset triggered. All payment states cleared.");
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
    idrBalance,
    totalSimpanan,
    pinjamanAktif,
    history,
    joiningDate,
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
    cancelPayment,

    refresh,
    approvedTodayCount,

    // Admin Minting
    memberList,
    fetchAllMembers,
    mintrupiah,
    allSimpananLogs,
    fetchAllSimpananLogs,

    // Admin Config & All Loans
    allLoans,
    adminConfig,
    changeStorageMode,
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
    refreshAdminStats: () => fetchAdminStats(koperasiContract, idrContract),
    systemStatus,
    fetchSystemStatus,
    confirmWebhookUpdate,
    updateGlobalSettings: async (newParams, onProgress) => {
      // [FIX] Map 'wajib' back to 'adm' for blockchain/server consistency
      const mappedParams = {
        ...newParams,
        adm: newParams.wajib
      };
      return updateGlobalSettings(mappedParams, onProgress);
    }
  };
};
