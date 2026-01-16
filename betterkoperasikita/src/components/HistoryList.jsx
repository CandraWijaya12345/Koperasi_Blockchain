// components/HistoryList.jsx
import React from 'react';
import { cardStyles as styles } from '../styles/cards';
import { formatCurrency, formatToken } from '../utils/format';

const HistoryList = ({ history, onRefresh, isLoading }) => {
  const [selectedLog, setSelectedLog] = React.useState(null);

  const renderItem = (log) => {
    const { args, eventName, transactionHash } = log;
    const shortHash =
      transactionHash.substring(0, 6) +
      '...' +
      transactionHash.substring(transactionHash.length - 4);
    transactionHash.substring(transactionHash.length - 4);
    const ts = log.extractedTimestamp || Number(args.waktu) || 0;
    const waktu = ts ? new Date(ts * 1000).toLocaleString('id-ID') : '-';

    let color = '#64748b';
    let label = '';
    let amount = '';

    switch (eventName) {
      case 'SimpananMasuk':
        color = '#10b981';
        label = args.jenisSimpanan;
        amount = `+${formatCurrency(formatToken(args.jumlah))} IDRT`;
        break;
      case 'PenarikanSukses':
        color = '#ef4444';
        label = 'Penarikan';
        amount = `-${formatCurrency(formatToken(args.jumlah))} IDRT`;
        break;
      case 'PinjamanDiajukan':
        color = '#f59e0b';
        label = 'Pengajuan Pinjaman';
        amount = `${formatCurrency(formatToken(args.jumlah))} IDRT`;
        break;
      case 'PinjamanDisetujui':
        color = '#10b981';
        label = 'Pinjaman Disetujui';
        amount = `ID: ${Number(args.id)}`;
        break;
      case 'AngsuranDibayar':
        color = '#3b82f6';
        label = 'Pembayaran Angsuran';
        amount = `${formatCurrency(formatToken(args.jumlah))} IDRT`;
        break;
      case 'PinjamanLunas':
        color = '#10b981';
        label = 'Pinjaman Lunas';
        amount = `ID: ${Number(args.id)}`;
        break;
      default:
        label = eventName;
    }

    return (
      <div
        key={transactionHash + log.logIndex}
        style={{
          padding: '16px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          marginBottom: '12px',
          border: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
        }}
        onClick={() => setSelectedLog({ ...log, label, amount, time: waktu, color })}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            backgroundColor: color,
            borderRadius: '50%',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 600,
              color: '#1f2937',
              marginBottom: '4px',
            }}
          >
            {label}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            {waktu} • {shortHash}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              fontWeight: 600,
              color: color,
              fontSize: '15px',
            }}
          >
            {amount}
          </div>
          {/* Arrow icon > */}
          <div style={{ color: '#cbd5e1' }}>ᐳ</div>
        </div>
      </div>
    );
  };

  return (
    <section>
      <div style={styles.card}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h3 style={styles.cardTitle}>Riwayat Transaksi</h3>
          <button
            className="btn-animate"
            style={styles.refreshButton}
            onClick={onRefresh}
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
        <div style={styles.historyContainer}>
          {history && history.length > 0 ? (
            history.map(renderItem)
          ) : (
            <div style={styles.emptyState}>

              <p>Belum ada riwayat transaksi</p>
            </div>
          )}
        </div>
      </div>

      {/* DETAIL POPUP */}
      {selectedLog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }} onClick={() => setSelectedLog(null)}>
          <div
            className="popup-content"
            style={{ background: '#fff', width: '90%', maxWidth: '500px', borderRadius: '16px', padding: '24px', position: 'relative' }}
            onClick={e => e.stopPropagation()} // prevent close on click inside
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>Detail Transaksi</h3>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
              >
                ×
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>
                {selectedLog.color === '#10b981' ? '✅' : selectedLog.color === '#ef4444' ? '💸' : '📜'}
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: selectedLog.color }}>{selectedLog.label}</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '8px 0' }}>{selectedLog.amount}</p>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{selectedLog.time}</p>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Transaction Hash</p>
                <p style={{ fontSize: '0.85rem', fontFamily: 'monospace', wordBreak: 'break-all', color: '#334155' }}>
                  {selectedLog.transactionHash}
                </p>
              </div>

              {selectedLog.args && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>From / Actor</p>
                  <p style={{ fontSize: '0.85rem', fontFamily: 'monospace', wordBreak: 'break-all', color: '#334155' }}>
                    {(function () {
                      const { eventName, args } = selectedLog;
                      // If args has named property 'anggota' or 'peminjam'
                      if (args.anggota) return args.anggota;
                      if (args.peminjam) return args.peminjam;
                      // Fallback by index for known events
                      if (['SimpananMasuk', 'PenarikanSukses'].includes(eventName)) return args[0];
                      if (['PinjamanDiajukan', 'PinjamanDisetujui', 'AngsuranDibayar', 'PinjamanLunas'].includes(eventName)) return args[1];
                      // Generic fallback
                      return args[0] && typeof args[0] === 'string' && args[0].startsWith('0x') ? args[0] : '-';
                    })()}
                  </p>
                </div>
              )}

              <a
                href={`https://sepolia.etherscan.io/tx/${selectedLog.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', padding: '12px', background: '#3b82f6', color: 'white',
                  textDecoration: 'none', borderRadius: '8px', fontWeight: '600', marginTop: '16px'
                }}
              >
                <span>Lihat di Etherscan</span>
                <span style={{ fontSize: '1.1rem' }}>↗</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HistoryList;
