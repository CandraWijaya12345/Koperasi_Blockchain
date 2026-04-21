// components/Admin/GovernancePanel.jsx
import React, { useState } from 'react';
import { cardStyles } from '../../styles/cards';
import InlineMessage from '../InlineMessage';
import { formatCurrency, formatToken, parseToken } from '../../utils/format';

// --- Professional Icons ---
const SyncIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>
);
const BillIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>
);
const ProfitIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
);

const localStyles = {
    header: {
        marginBottom: '24px',
        paddingBottom: '12px',
        borderBottom: '2px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: '800',
        color: '#0f172a',
        margin: 0,
        letterSpacing: '-0.025em'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
    },
    card: {
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease'
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px'
    },
    iconWrapper: {
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        color: '#475569'
    },
    cardTitle: {
        fontSize: '1.125rem',
        fontWeight: '700',
        color: '#1e293b',
        margin: 0
    },
    description: {
        color: '#64748b',
        fontSize: '0.875rem',
        lineHeight: '1.5',
        marginBottom: '20px'
    },
    statsBox: {
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
        border: '1px solid #f1f5f9'
    },
    statRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
    },
    statLabel: {
        fontSize: '0.75rem',
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase'
    },
    statValue: {
        fontSize: '0.925rem',
        fontWeight: '700',
        color: '#1e3a8a'
    },
    inputLabel: {
        fontSize: '0.75rem',
        fontWeight: '700',
        color: '#475569',
        marginBottom: '8px',
        display: 'block'
    },
    input: {
        ...cardStyles.input,
        marginBottom: '20px',
        fontSize: '0.925rem'
    },
    button: {
        ...cardStyles.button,
        marginTop: 'auto',
        fontSize: '0.875rem',
        fontWeight: '700'
    }
};

const GovernancePanel = ({ stats, onSync, onGenerateBills, onReleaseSharing, isLoading }) => {
  const [billAmount, setBillAmount] = useState('25000');
  const [sharingPercent, setSharingPercent] = useState('10');
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  const handleAction = async (fn, params) => {
    setLocalLoading(true);
    setMsg('Memproses transaksi tata kelola...');
    setIsError(false);
    try {
      await fn(params, (m) => setMsg(m));
      setMsg('Operasi berhasil diselesaikan.');
      setTimeout(() => setMsg(''), 5000);
    } catch (e) {
      console.error(e);
      setIsError(true);
      setMsg('Kesalahan: ' + (e.message || e));
    }
    setLocalLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={localStyles.header}>
        <h2 style={localStyles.title}>Manajemen Keuangan</h2>
        <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>
            Governance Console v2.0
        </div>
      </div>
      
      <div style={localStyles.grid}>
        
        {/* SYNC LIQUIDITY */}
        <div style={localStyles.card}>
          <div style={localStyles.cardHeader}>
            <div style={localStyles.iconWrapper}><SyncIcon /></div>
            <h3 style={localStyles.cardTitle}>Sinkronisasi Likuiditas</h3>
          </div>
          <p style={localStyles.description}>
            Penyelarasan saldo kas Xendit dengan cadangan IDRT di blockchain untuk menjaga stabilitas nilai 1:1.
          </p>
          <div style={localStyles.statsBox}>
            <div style={localStyles.statRow}>
              <span style={localStyles.statLabel}>Saldo Xendit</span>
              <span style={localStyles.statValue}>{formatCurrency(stats.xenditBalance || '0')}</span>
            </div>
            <div style={{ ...localStyles.statRow, marginBottom: 0 }}>
              <span style={localStyles.statLabel}>Saldo Kontrak</span>
              <span style={localStyles.statValue}>{formatCurrency(formatToken(parseToken(stats.contractBalance || '0')))}</span>
            </div>
          </div>
          <button 
            style={{ ...localStyles.button, backgroundColor: '#1e40af' }}
            onClick={() => handleAction(onSync)}
            disabled={localLoading || isLoading}
          >
            {localLoading ? 'Memproses...' : 'Jalankan Sinkronisasi'}
          </button>
        </div>

        {/* MONTHLY BILLS */}
        <div style={localStyles.card}>
          <div style={localStyles.cardHeader}>
            <div style={{ ...localStyles.iconWrapper, backgroundColor: '#f5f3ff', color: '#6d28d9' }}><BillIcon /></div>
            <h3 style={localStyles.cardTitle}>Penerbitan Tagihan</h3>
          </div>
          <p style={localStyles.description}>
            Otomasi penerbitan tagihan Simpanan Wajib bulanan untuk seluruh anggota koperasi yang terdaftar.
          </p>
          <label style={localStyles.inputLabel}>Nominal Per Anggota (IDR)</label>
          <input 
            type="number"
            style={localStyles.input}
            value={billAmount}
            onChange={(e) => setBillAmount(e.target.value)}
          />
          <button 
            style={{ ...localStyles.button, backgroundColor: '#6d28d9' }}
            onClick={() => handleAction(onGenerateBills, billAmount)}
            disabled={localLoading || isLoading}
          >
            Penerbitan Massal
          </button>
        </div>

        {/* PROFIT SHARING */}
        <div style={localStyles.card}>
          <div style={localStyles.cardHeader}>
            <div style={{ ...localStyles.iconWrapper, backgroundColor: '#ecfdf5', color: '#059669' }}><ProfitIcon /></div>
            <h3 style={localStyles.cardTitle}>Distribusi SHU</h3>
          </div>
          <p style={localStyles.description}>
            Pembagian Sisa Hasil Usaha (SHU) kepada anggota berdasarkan proporsi simpanan aktif mereka.
          </p>
          <div style={{ ...localStyles.statsBox, backgroundColor: '#ecfdf5', borderColor: '#d1fae5' }}>
             <div style={{ ...localStyles.statRow, marginBottom: 0 }}>
              <span style={{ ...localStyles.statLabel, color: '#065f46' }}>Profit Akumulasi</span>
              <span style={{ ...localStyles.statValue, color: '#047857' }}>{formatCurrency(stats.profitBelumDibagi || '0')}</span>
            </div>
          </div>
          <label style={localStyles.inputLabel}>Persentase Alokasi (%)</label>
          <input 
            type="number"
            style={localStyles.input}
            value={sharingPercent}
            onChange={(e) => setSharingPercent(e.target.value)}
          />
          <button 
            style={{ ...localStyles.button, backgroundColor: '#059669' }}
            onClick={() => handleAction(onReleaseSharing, sharingPercent)}
            disabled={localLoading || isLoading}
          >
            Rilis Bagi Hasil
          </button>
        </div>

      </div>

      <InlineMessage message={msg} isError={isError} />
    </div>
  );
};

export default GovernancePanel;

