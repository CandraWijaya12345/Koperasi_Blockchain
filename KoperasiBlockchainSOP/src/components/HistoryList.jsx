// components/HistoryList.jsx
import React from 'react';
import { formatCurrency, formatToken } from '../utils/format';

const getArg = (args, name, index) => {
  if (!args) return null;
  try {
    if (args[name] !== undefined) return args[name];
    if (typeof args.length === 'number' && index < args.length) return args[index];
  } catch (e) { return null; }
  return null;
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
    getAmount: (args) => `+${formatCurrency(formatToken(getArg(args, 'jumlah', 1) || 0))}`,
    sign: '+',
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
    getLabel: (args) => {
      const jenis = getArg(args, 'jenis', 2) || '';
      return jenis.startsWith('Simpanan') ? jenis : `Simpanan ${jenis}`;
    },
    getAmount: (args) => `+${formatCurrency(formatToken(getArg(args, 'jumlah', 1) || 0))}`,
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
    getAmount: (args) => `-${formatCurrency(formatToken(getArg(args, 'jumlah', 1) || 0))}`,
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
    getLabel: () => 'Penarikan',
    getAmount: (args) => `-${formatCurrency(formatToken(getArg(args, 'jumlah', 1) || 0))}`,
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
    getAmount: (args) => formatCurrency(formatToken(getArg(args, 'jumlah', 1) || 0)),
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
    getLabel: () => 'Pinjaman Disetujui',
    getAmount: (args) => `ID #${Number(getArg(args, 'id', 0) || 0)}`,
    sign: '',
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
    getAmount: (args) => formatCurrency(formatToken(getArg(args, 'jumlah', 2) || 0)),
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
    getAmount: (args) => formatCurrency(formatToken(getArg(args, 'jumlah', 2) || 0)),
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
    getLabel: (args) => `Buka Berjangka (${getArg(args, 'tenorBulan', 2) || 0} bln)`,
    getAmount: (args) => `-${formatCurrency(formatToken(getArg(args, 'amount', 1) || 0))}`,
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
      const amt = Number(formatToken(getArg(args, 'amount', 1) || 0));
      const bunga = Number(formatToken(getArg(args, 'bunga', 2) || 0));
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
    getAmount: (args) => `+${formatCurrency(formatToken(getArg(args, 'jumlah', 1) || 0))}`,
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

const HistoryList = ({ history, onRefresh, isLoading, isAdminView }) => {
  const [selectedLog, setSelectedLog] = React.useState(null);

  // Group history by date
  const groupByDate = (items) => {
    if (!items || items.length === 0) return {};
    // [PRESENTASI] Sembunyikan history SHU
    const filteredItems = items.filter(item => {
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
    const label = config.getLabel(args, eventName);
    const amount = config.getAmount(args);
    const shortHash = transactionHash.substring(0, 6) + '...' + transactionHash.substring(transactionHash.length - 4);

    return (
      <div
        key={`${transactionHash}-${log.logIndex ?? idx}`}
        onClick={() => setSelectedLog({ ...log, label, amount, time: waktuFull, color: config.color, gradient: config.gradient })}
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
            {isAdminView && (
              <span style={{ color: '#3b82f6', fontWeight: 600, background: '#eff6ff', padding: '0px 6px', borderRadius: '4px' }}>
                {(function() {
                  const addr = log.args?.anggota || log.args?.peminjam || log.args?.user || log.args?.[0] || '';
                  return typeof addr === 'string' ? `${addr.substring(0,6)}...${addr.substring(addr.length-4)}` : '';
                })()}
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontWeight: 700,
            fontSize: '0.95rem',
            color: config.sign === '+' ? '#059669' : config.sign === '-' ? '#dc2626' : config.color,
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
                {selectedLog.args && (
                  <DetailRow
                    label="Dari / Aktor"
                    value={(function () {
                      const { eventName, args } = selectedLog;
                      if (!args) return '-';
                      if (getArg(args, 'anggota', null)) return getArg(args, 'anggota', 0);
                      if (getArg(args, 'peminjam', null)) return getArg(args, 'peminjam', 1);
                      
                      const candidate = getArg(args, 'user', 0) || getArg(args, 'peminjam', 1);
                      return (candidate && typeof candidate === 'string' && candidate.startsWith('0x')) ? candidate : '-';
                    })()}
                    mono
                  />
                )}
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
