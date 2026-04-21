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

const SHUConfirmationModal = ({ stats, members, sharingPercent, onConfirm, onCancel, isLoading }) => {
    const rawProfit = stats.rawProfit || 0n;
    const rawTotalSimpanan = stats.rawTotalSimpanan || 0n;
    const amountToDistribute = (rawProfit * BigInt(sharingPercent)) / 100n;

    const simulation = (members || []).map(m => {
        const sPokok = BigInt(m.sPokok || 0);
        const sWajib = BigInt(m.sWajib || 0);
        const sSukarela = BigInt(m.simpananSukarela || 0);
        const totalMemberSavings = sPokok + sWajib + sSukarela;

        let share = 0n;
        if (rawTotalSimpanan > 0n) {
            share = (totalMemberSavings * amountToDistribute) / rawTotalSimpanan;
        }

        return {
            nama: m.nama || 'Tanpa Nama',
            address: m.address,
            totalSavings: totalMemberSavings,
            share: share
        };
    }).filter(s => s.share > 0n); // Only show members getting something

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#fff', borderRadius: '24px', width: '100%', maxWidth: '720px',
                maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Konfirmasi Distribusi SHU</h2>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>Review simulasi pembagian sebelum rilis ke Blockchain</p>
                    </div>
                    <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>×</button>
                </div>

                <div style={{ padding: '24px', overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Total Profit (100%)</div>
                            <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>{formatCurrency(formatToken(rawProfit))}</div>
                        </div>
                        <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: '#eff6ff', border: '1px solid #dbeafe' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', marginBottom: '4px' }}>Alokasi ({sharingPercent}%)</div>
                            <div style={{ fontSize: '1rem', fontWeight: '800', color: '#1e40af' }}>{formatCurrency(formatToken(amountToDistribute))}</div>
                        </div>
                        <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: '#f0fdf4', border: '1px solid #dcfce7' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', marginBottom: '4px' }}>Penerima</div>
                            <div style={{ fontSize: '1rem', fontWeight: '800', color: '#166534' }}>{simulation.length} Anggota</div>
                        </div>
                    </div>

                    <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569', marginBottom: '12px', textTransform: 'uppercase' }}>Simulasi Pembagian</h3>
                    <div style={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>Anggota</th>
                                    <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>Total Simpanan</th>
                                    <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>Estimasi SHU</th>
                                </tr>
                            </thead>
                            <tbody>
                                {simulation.slice(0, 10).map((s, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{s.nama}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>{s.address.substring(0, 10)}...</div>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b' }}>
                                            {formatCurrency(formatToken(s.totalSavings))}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: '#059669' }}>
                                            {formatCurrency(formatToken(s.share))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {simulation.length > 10 && (
                            <div style={{ padding: '12px', textAlign: 'center', backgroundColor: '#f8fafc', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                ... dan {simulation.length - 10} anggota lainnya
                            </div>
                        )}
                        {simulation.length === 0 && (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                Tidak ada data simulasi. Pastikan profit ada dan anggota memiliki simpanan.
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button 
                        onClick={onCancel}
                        style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#fff', fontWeight: '700', cursor: 'pointer' }}
                    >
                        Batalkan
                    </button>
                    <button 
                        disabled={isLoading || simulation.length === 0}
                        onClick={onConfirm}
                        style={{ 
                            padding: '10px 24px', borderRadius: '10px', border: 'none', 
                            backgroundColor: '#059669', color: '#fff', fontWeight: '700', 
                            cursor: 'pointer', opacity: (isLoading || simulation.length === 0) ? 0.6 : 1
                        }}
                    >
                        {isLoading ? 'Memproses...' : 'Konfirmasi & Distribusikan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const GovernancePanel = ({ stats, members, onSync, onGenerateBills, onReleaseSharing, isLoading }) => {
  const [billAmount, setBillAmount] = useState('25000');
  const [sharingPercent, setSharingPercent] = useState('100');
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [showConfirmSHU, setShowConfirmSHU] = useState(false);

  const handleAction = async (fn, params) => {
    setLocalLoading(true);
    setMsg('Memproses transaksi tata kelola...');
    setIsError(false);
    try {
      await fn(params, (m) => setMsg(m));
      setMsg('Operasi berhasil diselesaikan.');
      setShowConfirmSHU(false);
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

        {/* PROFIT SHARING (Hidden for Presentation/UAT) */}
        {/*
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
            onClick={() => setShowConfirmSHU(true)}
            disabled={localLoading || isLoading || (stats.rawProfit || 0n) === 0n}
          >
            Mulai Distribusi
          </button>
        </div>
        */}

      </div>

      <InlineMessage message={msg} isError={isError} />

      {showConfirmSHU && (
          <SHUConfirmationModal 
            stats={stats}
            members={members}
            sharingPercent={sharingPercent}
            onCancel={() => setShowConfirmSHU(false)}
            onConfirm={() => handleAction(onReleaseSharing, sharingPercent)}
            isLoading={localLoading}
          />
      )}
    </div>
  );
};

export default GovernancePanel;

