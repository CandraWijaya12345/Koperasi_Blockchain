// components/Admin/PendingLoanItem.jsx
import React from 'react';
import { cardStyles as styles } from '../../styles/cards';
import { formatCurrency, formatToken } from '../../utils/format';

const shortText = (text, start = 6, end = 4) => {
  if (!text) return '-';
  return `${text.slice(0, start)}…${text.slice(-end)}`;
};

const PendingLoanItem = ({ log, loan, onUseId, onApprove, onReject, loading, onNotify }) => {
  const data = loan || log;
  if (!data) return null;

  const { args, transactionHash } = data;
  const [isActing, setIsActing] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState(null);

  const processAction = async (actionFn) => {
    if (!actionFn) return;
    setIsActing(true);
    if (onNotify) onNotify("Sedang memproses...", false);

    try {
      await actionFn(String(id), (msg) => {
        // If parent provided onNotify, pipe progress there
        if (onNotify) onNotify(msg, false);
        console.log(msg);
      });
      if (onNotify) onNotify("Aksi berhasil!", false);
    } catch (e) {
      console.error(e);
      if (onNotify) onNotify("Gagal: " + (e.message || e), true);
    }
    setIsActing(false);
    setConfirmAction(null);
  };

  const id = Number(args.id);
  const peminjam = args.peminjam || args.anggota || args[1];
  const jumlah = formatCurrency(formatToken(args.jumlah));
  const ts = data.extractedTimestamp || Number(args.waktu) || 0;
  const waktu = ts ? new Date(ts * 1000).toLocaleString('id-ID') : 'Baru saja';



  const labelStyle = {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: '4px'
  };

  const valueStyle = {
    fontSize: '0.95rem',
    color: '#334155',
    fontWeight: '600',
    fontFamily: 'Inter, sans-serif'
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
      border: '1px solid #f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default'
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px -5px rgba(0,0,0,0.05)';
      }}
    >
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>Loan ID</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>#{id}</div>
        </div>
        <span style={{
          background: '#fff7ed',
          color: '#c2410c',
          padding: '6px 12px',
          borderRadius: '99px',
          fontSize: '0.75rem',
          fontWeight: '700',
          letterSpacing: '0.03em',
          textTransform: 'uppercase'
        }}>
          Menunggu
        </span>
      </div>

      {/* BODY */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <div style={labelStyle}>Peminjam</div>
          <div style={{ ...valueStyle, fontFamily: 'monospace', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', width: 'fit-content' }}>
            {shortText(peminjam, 6, 6)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={labelStyle}>Jumlah Pengajuan</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a' }}>
            {jumlah} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>IDRT</span>
          </div>
        </div>

        <div>
          <div style={labelStyle}>Waktu Pengajuan</div>
          <div style={valueStyle}>{waktu}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={labelStyle}>Referensi Tx</div>
          <a
            href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...valueStyle, color: '#3b82f6', textDecoration: 'none', borderBottom: '1px dashed #3b82f6' }}
          >
            {shortText(transactionHash, 8, 6)}
          </a>
        </div>
      </div>

      {/* ACTION */}
      <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
        {onApprove && onReject ? (
          confirmAction ? (
            // CONFIRMATION STATE
            <div style={{
              background: confirmAction === 'approve' ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${confirmAction === 'approve' ? '#10b981' : '#ef4444'}`,
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              animation: 'fadeIn 0.2s'
            }}>
              <span style={{
                color: confirmAction === 'approve' ? '#065f46' : '#991b1b',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                {confirmAction === 'approve' ? 'Yakin Setujui?' : 'Yakin Tolak?'}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    const fn = confirmAction === 'approve' ? onApprove : onReject;
                    processAction(fn);
                  }}
                  disabled={loading || isActing}
                  style={{
                    background: confirmAction === 'approve' ? '#10b981' : '#ef4444',
                    color: 'white', border: 'none', padding: '6px 16px', borderRadius: '8px',
                    fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem'
                  }}
                >
                  {isActing ? '...' : 'Ya'}
                </button>
                <button
                  onClick={() => setConfirmAction(null)}
                  disabled={loading || isActing}
                  style={{
                    background: 'white', border: '1px solid #cbd5e1', color: '#64748b',
                    padding: '6px 12px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem'
                  }}
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            // DEFAULT STATE
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                style={{
                  flex: 1,
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: (loading || isActing) ? 'not-allowed' : 'pointer',
                  opacity: (loading || isActing) ? 0.7 : 1,
                  transition: 'filter 0.2s',
                  fontSize: '0.9rem'
                }}
                type="button"
                disabled={loading || isActing}
                onClick={() => setConfirmAction('approve')}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                onMouseLeave={e => e.currentTarget.style.filter = 'none'}
              >
                Setujui Pinjaman
              </button>
              <button
                style={{
                  flex: 1,
                  background: '#fff',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: (loading || isActing) ? 'not-allowed' : 'pointer',
                  opacity: (loading || isActing) ? 0.7 : 1,
                  transition: 'background 0.2s',
                  fontSize: '0.9rem'
                }}
                type="button"
                disabled={loading || isActing}
                onClick={() => setConfirmAction('reject')}
                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                Tolak
              </button>
            </div>
          )
        ) : (
          <button
            style={styles.pendingFillButton}
            type="button"
            onClick={() => onUseId && onUseId(String(id))}
          >
            Gunakan ID
          </button>
        )}
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default PendingLoanItem;
