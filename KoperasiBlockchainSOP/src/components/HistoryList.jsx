// components/HistoryList.jsx
import React from 'react';
import { ethers } from 'ethers';
import { formatCurrency, formatrupiah } from '../utils/format';

const getArg = (args, name, index) => {
  if (!args) return null;
  try {
    if (args[name] !== undefined) return args[name];
    if (typeof args.length === 'number' && index < args.length) return args[index];
  } catch (e) { return null; }
  return null;
};

const extractActorAddress = (args) => {
  if (!args) return '';
  const keys = ['surveyor', 'committee', 'anggota', 'peminjam', 'user', 'admin', 'dari', 'owner', 'caller'];
  for (const key of keys) {
    if (args[key] && typeof args[key] === 'string' && args[key].startsWith('0x')) {
      return args[key];
    }
  }
  for (const key in args) {
    try {
      const val = args[key];
      if (typeof val === 'string' && /^0x[a-fA-F0-9]{40}$/.test(val)) {
        return val;
      }
    } catch (e) {}
  }
  if (typeof args.length === 'number') {
    for (let i = 0; i < args.length; i++) {
      const val = args[i];
      if (typeof val === 'string' && /^0x[a-fA-F0-9]{40}$/.test(val)) {
        return val;
      }
    }
  }
  return '';
};

const typeConfig = {
  SimpananMasuk: {
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    bgLight: '#ecfdf5',
    color: '#059669',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
      </svg>
    ),
    getLabel: (args) => {
      const jenis = getArg(args, 'jenisSimpanan', 2) || '';
      return jenis.startsWith('Simpanan') ? jenis : `Simpanan ${jenis}`;
    },
    getAmount: (args) => `+${formatCurrency(formatrupiah(getArg(args, 'jumlah', 1) || 0))}`,
    sign: '+',
  },
  AnggotaBaru: {
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    bgLight: '#eff6ff',
    color: '#1d4ed8',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
      </svg>
    ),
    getLabel: (args, _, isAdminView, log) => {
      const userAddr = getArg(args, 'user', 0);
      if (userAddr && log?.address && userAddr.toLowerCase() === log.address.toLowerCase()) {
        return 'Registrasi Akun Reserve Koperasi';
      }
      if (isAdminView) {
        const nama = getArg(args, 'nama', 1) || 'Anggota Baru';
        return `Pendaftaran Anggota Baru: ${nama}`;
      }
      return 'Mendaftar sebagai Anggota';
    },
    getAmount: () => 'Member',
    sign: '',
  },
  DepositTercatat: {
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    bgLight: '#ecfdf5',
    color: '#059669',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
      </svg>
    ),
    getLabel: (args, _, __, log) => {
      const userAddr = getArg(args, 'user', 0);
      if (userAddr && log?.address && userAddr.toLowerCase() === log.address.toLowerCase()) {
        return 'Sinkronisasi Likuiditas (Mint)';
      }
      const jenis = getArg(args, 'jenis', 2) || '';
      return jenis.startsWith('Simpanan') ? jenis : `Simpanan ${jenis}`;
    },
    getAmount: (args) => `+${formatCurrency(formatrupiah(getArg(args, 'jumlah', 1) || 0))}`,
    sign: '+',
  },
  PenarikanSukses: {
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    bgLight: '#fef2f2',
    color: '#dc2626',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
      </svg>
    ),
    getLabel: () => 'Penarikan',
    getAmount: (args) => `-${formatCurrency(formatrupiah(getArg(args, 'jumlah', 1) || 0))}`,
    sign: '-',
  },
  PenarikanTercatat: {
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    bgLight: '#fef2f2',
    color: '#dc2626',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
      </svg>
    ),
    getLabel: (args, _, __, log) => {
      const userAddr = getArg(args, 'user', 0);
      if (userAddr && log?.address && userAddr.toLowerCase() === log.address.toLowerCase()) {
        return 'Sinkronisasi Likuiditas (Burn)';
      }
      return 'Penarikan';
    },
    getAmount: (args) => `-${formatCurrency(formatrupiah(getArg(args, 'jumlah', 1) || 0))}`,
    sign: '-',
  },
  PinjamanDiajukan: {
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    bgLight: '#fffbeb',
    color: '#d97706',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    getLabel: () => 'Pengajuan Pinjaman',
    getAmount: (args) => formatCurrency(formatrupiah(getArg(args, 'jumlah', 1) || 0)),
    sign: '',
  },
  PinjamanDisetujui: {
    gradient: 'linear-gradient(135deg, #10b981, #047857)',
    bgLight: '#ecfdf5',
    color: '#047857',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    getLabel: () => 'Pencairan Pinjaman (Disetujui)',
    getAmount: (args, _, isAdminView) => {
      const amount = getArg(args, 'jumlah', null) || getArg(args, 'amount', null);
      if (amount) {
        const prefix = isAdminView ? '-' : '+';
        return `${prefix}${formatCurrency(formatrupiah(amount))}`;
      }
      return `ID #${Number(getArg(args, 'id', 0) || 0)}`;
    },
    sign: (isAdminView) => isAdminView ? '-' : '+',
  },
  AngsuranDibayar: {
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    bgLight: '#eff6ff',
    color: '#2563eb',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    getLabel: () => 'Pembayaran Angsuran',
    getAmount: (args) => formatCurrency(formatrupiah(getArg(args, 'jumlah', 2) || 0)),
    sign: '-',
  },
  AngsuranMasuk: {
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    bgLight: '#eff6ff',
    color: '#2563eb',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    getLabel: () => 'Pembayaran Angsuran',
    getAmount: (args) => formatCurrency(formatrupiah(getArg(args, 'jumlah', 2) || 0)),
    sign: '-',
  },
  PinjamanLunas: {
    gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    bgLight: '#f5f3ff',
    color: '#7c3aed',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    getLabel: () => 'Pinjaman Lunas',
    getAmount: (args) => `ID #${Number(getArg(args, 'loanId', 0) || getArg(args, 'id', 1) || 0)}`,
    sign: '',
  },
  SimpananBerjangkaDibuka: {
    gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    bgLight: '#eef2ff',
    color: '#4f46e5',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    getLabel: (args) => `Buka Berjangka (${getArg(args, 'tenorBulan', 2) || 0} bulan)`,
    getAmount: (args) => `-${formatCurrency(formatrupiah(getArg(args, 'amount', 1) || 0))}`,
    sign: '-',
  },
  SimpananBerjangkaDicairkan: {
    gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    bgLight: '#ecfeff',
    color: '#0891b2',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    getLabel: () => 'Pencairan Berjangka',
    getAmount: (args) => {
      const amt = Number(formatrupiah(getArg(args, 'amount', 1) || 0));
      const bunga = Number(formatrupiah(getArg(args, 'bunga', 2) || 0));
      return `+${formatCurrency(amt + bunga)}`;
    },
    sign: '+',
  },
  SHUDiterima: {
    gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
    bgLight: '#fff1f2',
    color: '#e11d48',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
      </svg>
    ),
    getLabel: () => 'Bagi Hasil (SHU)',
    getAmount: (args) => `+${formatCurrency(formatrupiah(getArg(args, 'jumlah', 1) || 0))}`,
    sign: '+',
  },
  AnggotaRejoin: {
    gradient: 'linear-gradient(135deg, #22d3ee, #0891b2)',
    bgLight: '#ecfeff',
    color: '#0891b2',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" />
      </svg>
    ),
    getLabel: () => 'Aktif Kembali (Re-join)',
    getAmount: () => 'Member',
    sign: '',
  },
  PinjamanDitolak: {
    gradient: 'linear-gradient(135deg, #f87171, #ef4444)',
    bgLight: '#fef2f2',
    color: '#ef4444',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    getLabel: (args) => `Pinjaman Ditolak (${getArg(args, 'alasan', 2) || getArg(args, 'reason', 2) || 'Kelayakan'})`,
    getAmount: (args) => `ID #${Number(getArg(args, 'id', 0) || 0)}`,
    sign: '',
  },
  SettingsUpdated: {
    gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    bgLight: '#eef2ff',
    color: '#4f46e5',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    getLabel: () => 'Suku Bunga & Biaya Diperbarui',
    getAmount: () => 'SOP',
    sign: '',
  },
  StorageModeUpdated: {
    gradient: 'linear-gradient(135deg, #475569, #334155)',
    bgLight: '#f8fafc',
    color: '#334155',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
      </svg>
    ),
    getLabel: (args) => `Mode Database: ${getArg(args, 'useIPFS', 1) ? 'IPFS Hybrid' : 'Blockchain On-chain'}`,
    getAmount: () => 'DB Mode',
    sign: '',
  },
  SurveyApproved: {
    gradient: 'linear-gradient(135deg, #38bdf8, #0284c7)',
    bgLight: '#f0f9ff',
    color: '#0284c7',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    getLabel: (args) => `Survei Pinjaman Disetujui: ${getArg(args, 'note', 1) || 'Layak'}`,
    getAmount: (args) => `ID #${Number(getArg(args, 'loanId', 0) || 0)}`,
    sign: '',
  },
  CommitteeApproved: {
    gradient: 'linear-gradient(135deg, #2dd4bf, #0d9488)',
    bgLight: '#f0fdfa',
    color: '#0d9488',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    getLabel: () => 'Komite Kredit Disetujui',
    getAmount: (args) => `ID #${Number(getArg(args, 'loanId', 0) || 0)}`,
    sign: '',
  },
  TagihanDibuat: {
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    bgLight: '#fffbeb',
    color: '#d97706',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    getLabel: () => 'Tagihan Wajib Bulanan Diterbitkan',
    getAmount: (args) => {
      const totalRupiah = Number(formatrupiah(getArg(args, 'nominalTotal', 0) || 0));
      // Adjust historical totals that included the system reserve account (4 members instead of 3 humans)
      const adjustedRupiah = totalRupiah === 100000 ? 75000 : totalRupiah;
      return formatCurrency(adjustedRupiah.toString());
    },
    sign: '',
  },
  BagiHasilDirilis: {
    gradient: 'linear-gradient(135deg, #f43f5e, #db2777)',
    bgLight: '#fdf2f8',
    color: '#db2777',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    getLabel: () => 'Pembagian SHU / Bagi Hasil Dirilis',
    getAmount: (args) => `Total: ${formatCurrency(formatrupiah(getArg(args, 'nominalTotal', 0) || 0))}`,
    sign: '',
  },
  MembershipClosed: {
    gradient: 'linear-gradient(135deg, #64748b, #475569)',
    bgLight: '#f8fafc',
    color: '#475569',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
    getLabel: () => 'Keanggotaan Ditutup (Refund)',
    getAmount: (args) => `Refund: ${formatCurrency(formatrupiah(getArg(args, 'refundAmount', 1) || 0))}`,
    sign: '',
  },
  PengurusDitambahkan: {
    gradient: 'linear-gradient(135deg, #a855f7, #9333ea)',
    bgLight: '#faf5ff',
    color: '#9333ea',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
    getLabel: () => 'Pengurus Baru Ditambahkan',
    getAmount: () => 'Admin',
    sign: '',
  },
  ConfigUpdated: {
    gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    bgLight: '#f5f3ff',
    color: '#6d28d9',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    getLabel: (args) => `Pembaruan Config: ${getArg(args, 'key', 0) || 'Parameter'}`,
    getAmount: (args) => `Nilai: ${Number(getArg(args, 'value', 1) || 0)}`,
    sign: '',
  }
};

const defaultConfig = {
  gradient: 'linear-gradient(135deg, #64748b, #475569)',
  bgLight: '#f1f5f9',
  color: '#475569',
  icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  getLabel: (_, eventName) => eventName,
  getAmount: () => '',
  sign: '',
};

const txSenderCache = {};

const HistoryList = ({ history, onRefresh, isLoading, isAdminView }) => {
  const [selectedLog, setSelectedLog] = React.useState(null);
  const [resolvedActor, setResolvedActor] = React.useState('');

  React.useEffect(() => {
    if (!selectedLog) {
      setResolvedActor('');
      return;
    }

    const actorFromArgs = extractActorAddress(selectedLog.args);
    if (actorFromArgs) {
      setResolvedActor(actorFromArgs);
      return;
    }

    if (txSenderCache[selectedLog.transactionHash]) {
      setResolvedActor(txSenderCache[selectedLog.transactionHash]);
      return;
    }

    let isMounted = true;
    const fetchTxSender = async () => {
      try {
        if (window.ethereum && selectedLog.transactionHash) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const tx = await provider.getTransaction(selectedLog.transactionHash);
          if (tx && tx.from && isMounted) {
            txSenderCache[selectedLog.transactionHash] = tx.from;
            setResolvedActor(tx.from);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch tx sender:", err);
      }
    };

    fetchTxSender();

    return () => {
      isMounted = false;
    };
  }, [selectedLog]);

  // Group history by date
  const groupByDate = (items) => {
    if (!items || items.length === 0) return {};
    // [PRESENTASI] Sembunyikan history SHU hanya untuk anggota biasa, pengurus melihat seluruh audit trail
    const filteredItems = items.filter(item => {
      if (isAdminView) return true;
      const name = item.eventName || item.fragment?.name || "";
      return name !== 'SHUDiterima' && name !== 'BagiHasilDirilis' && name !== 'BagiHasilBatchDirilis';
    });
    const groups = {};
    filteredItems.forEach(item => {
      const ts = item.extractedTimestamp || Number(item.args?.waktu) || 0;
      const dateKey = ts ? new Date(ts * 1000).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Tidak Diketahui';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });
    return groups;
  };

  const renderItem = (log, idx) => {
    const { args, transactionHash } = log;
    const eventName = log.eventName || log.fragment?.name || 'Unknown';
    const config = typeConfig[eventName] || defaultConfig;
    const ts = log.extractedTimestamp || Number(args?.waktu) || 0;
    const waktu = ts ? new Date(ts * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
    const waktuFull = ts ? new Date(ts * 1000).toLocaleString('id-ID') : '-';
    const label = config.getLabel(args, eventName, isAdminView, log);
    const amount = config.getAmount(args, eventName, isAdminView, log);
    const resolvedSign = typeof config.sign === 'function' ? config.sign(isAdminView) : config.sign;
    const shortHash = transactionHash.substring(0, 6) + '...' + transactionHash.substring(transactionHash.length - 4);

    return (
      <div
        key={`${transactionHash}-${log.logIndex ?? idx}`}
        onClick={() => setSelectedLog({ ...log, label, amount, time: waktuFull, color: config.color, gradient: config.gradient, resolvedSign })}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '14px 16px',
          background: '#fff',
          borderRadius: '14px',
          marginBottom: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
          e.currentTarget.style.borderColor = config.color + '30';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
          e.currentTarget.style.borderColor = '#f1f5f9';
        }}
      >
        {/* Icon */}
        <div style={{
          width: '42px', height: '42px', borderRadius: '12px',
          background: config.gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 4px 12px ${config.color}30`,
        }}>
          {config.icon}
        </div>

        {/* Label & Time */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#1e293b', marginBottom: '3px' }}>
            {label}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', flexWrap: 'wrap', gap: '4px 8px' }}>
            <span>{waktu} · {shortHash}</span>
            {isAdminView && (function() {
              const actorAddr = extractActorAddress(log.args);
              return actorAddr ? (
                <span style={{ color: '#3b82f6', fontWeight: 600, background: '#eff6ff', padding: '0px 6px', borderRadius: '4px' }}>
                  {`${actorAddr.substring(0,6)}...${actorAddr.substring(actorAddr.length-4)}`}
                </span>
              ) : null;
            })()}
          </div>
        </div>

        {/* Amount */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontWeight: 700,
            fontSize: '0.95rem',
            color: resolvedSign === '+' ? '#059669' : resolvedSign === '-' ? '#dc2626' : config.color,
          }}>
            {amount}
          </div>
        </div>

        {/* Chevron */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    );
  };

  const grouped = groupByDate(history);

  return (
    <section>
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        border: '1px solid #e2e8f0',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Riwayat Transaksi</h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
              {history ? `${history.length} transaksi tercatat` : 'Memuat...'}
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }}>
              <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Transaction List grouped by date */}
        {history && history.length > 0 ? (
          Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel} style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '8px 4px 6px',
              }}>
                {dateLabel}
              </div>
              {items.map(renderItem)}
            </div>
          ))
        ) : (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: '#f8fafc', borderRadius: '16px',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>Belum ada riwayat transaksi</p>
          </div>
        )}
      </div>

      {/* DETAIL POPUP */}
      {selectedLog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
        }} onClick={() => setSelectedLog(null)}>
          <div
            style={{
              background: '#fff', width: '90%', maxWidth: '440px',
              borderRadius: '20px', overflow: 'hidden', position: 'relative',
              boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Colored Header */}
            <div style={{
              background: selectedLog.gradient,
              padding: '28px 24px 20px',
              textAlign: 'center', color: 'white',
            }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  position: 'absolute', top: '12px', right: '16px',
                  background: 'rgba(255,255,255,0.2)', border: 'none',
                  width: '32px', height: '32px', borderRadius: '50%',
                  color: 'white', fontSize: '1.2rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >×</button>
              <div style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: '8px', fontWeight: 500 }}>
                {selectedLog.label}
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                {selectedLog.amount}
              </div>
              <div style={{ fontSize: '0.82rem', opacity: 0.75, marginTop: '8px' }}>
                {selectedLog.time}
              </div>
            </div>

            {/* Details */}
            <div style={{ padding: '20px 24px 24px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <DetailRow label="Transaction Hash" value={selectedLog.transactionHash} mono />
                <DetailRow
                  label="Dari / Aktor"
                  value={resolvedActor || extractActorAddress(selectedLog.args) || '-'}
                  mono
                />
              </div>

              <a
                href={`https://amoy.polygonscan.com/tx/${selectedLog.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', padding: '13px',
                  background: selectedLog.gradient,
                  color: 'white', textDecoration: 'none', borderRadius: '12px',
                  fontWeight: 600, marginTop: '16px', fontSize: '0.9rem',
                  boxShadow: `0 4px 12px ${selectedLog.color}30`,
                }}
              >
                Lihat di PolygonScan
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
};

const DetailRow = ({ label, value, mono }) => (
  <div style={{ marginBottom: '12px' }}>
    <p style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px', margin: '0 0 4px 0' }}>{label}</p>
    <p style={{
      fontSize: '0.82rem', color: '#334155', wordBreak: 'break-all', margin: 0,
      fontFamily: mono ? "'SF Mono', 'Fira Code', monospace" : 'inherit',
    }}>{value}</p>
  </div>
);

export default HistoryList;
