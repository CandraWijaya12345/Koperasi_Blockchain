// components/Admin/PendingLoanItem.jsx
import React from 'react';
import { cardStyles as styles } from '../../styles/cards';
import { formatCurrency, formatToken } from '../../utils/format';

const shortText = (text, start = 6, end = 4) => {
  if (!text) return '-';
  return `${text.slice(0, start)}…${text.slice(-end)}`;
};

const LoadingSpinner = ({ size = 16, color = "currentColor" }) => (
  <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const PendingLoanItem = ({ log, loan, onApprove, onReject, onApproveSurvey, onApproveCommittee, loading, onNotify, systemStatus, adminConfig }) => {
  const data = loan || log;
  if (!data) return null;

  const { args, transactionHash } = data;
  const [isActing, setIsActing] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState(null);
  const [rejectionReason, setRejectionReason] = React.useState('Syarat tidak lengkap');
  const [surveyNote, setSurveyNote] = React.useState('');
  const [bankDetails, setBankDetails] = React.useState(null);

  const status = Number(data?.status ?? 0);
  const id = Number(loan?.id ?? args?.id ?? 0);
  const peminjam = loan?.peminjam ?? args?.peminjam ?? args?.anggota ?? args?.[1];
  const jumlah = formatCurrency(formatToken(loan?.jumlahPinjaman ?? args?.jumlah ?? 0));
  const ts = loan?.extractedTimestamp ?? data?.extractedTimestamp ?? Number(args?.waktu) ?? 0;
  const waktu = ts ? new Date(ts * 1000).toLocaleString('id-ID') : 'Baru saja';

  React.useEffect(() => {
    if (peminjam) {
      fetch(`http://localhost:5000/api/loan/details/${peminjam}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.details) {
            setBankDetails(data.details);
          }
        })
        .catch(err => console.error("Failed to fetch bank details", err));
    }
  }, [peminjam]);

  const processAction = async (actionFn) => {
    if (!actionFn) return;
    setIsActing(true);
    if (onNotify) onNotify("Sedang memproses...", false);

    try {
      await actionFn(String(id), (msg) => {
        if (onNotify) onNotify(msg, false);
      });
      if (onNotify) onNotify("Aksi berhasil!", false);
    } catch (e) {
      console.error(e);
      if (onNotify) onNotify("Gagal: " + (e.message || e), true);
    }
    setIsActing(false);
    setConfirmAction(null);
  };

  const statusMap = {
    0: { text: 'Menunggu Survey', color: '#c2410c', bg: '#fff7ed' },
    1: { text: 'Menunggu Komite', color: '#1d4ed8', bg: '#eff6ff' },
    2: { text: 'Siap Dicairkan', color: '#15803d', bg: '#f0fdf4' }
  };
  const statusInfo = statusMap[status] || { text: 'Pending', color: '#64748b', bg: '#f1f5f9' };

  const getButtonText = () => {
    if (status === 0) return 'Setujui Survey';
    if (status === 1) return 'Setujui Komite';
    return 'Cairkan Dana (Disburse)';
  };

  const labelStyle = { fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600', marginBottom: '4px' };
  const valueStyle = { fontSize: '0.95rem', color: '#334155', fontWeight: '600' };

  return (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
        <div>
          <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '700' }}>Pinjaman #{id}</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{waktu}</div>
        </div>
        <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: '6px 12px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>
          {statusInfo.text}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <div style={labelStyle}>Peminjam</div>
          <div style={{ ...valueStyle, fontFamily: 'monospace', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', width: 'fit-content' }}>
            {shortText(peminjam, 6, 6)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={labelStyle}>Jumlah</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>{jumlah}</div>
        </div>
        <div>
          <div style={labelStyle}>Rekening Tujuan</div>
          <div style={valueStyle}>{bankDetails ? `${bankDetails.bank} - ${bankDetails.accountNumber}` : 'Manual / Belum Set'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={labelStyle}>Referensi Tx</div>
          <a href={`https://amoy.polygonscan.com/tx/${transactionHash}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', borderBottom: '1px dashed #3b82f6' }}>
            {shortText(transactionHash, 8, 6)}
          </a>
        </div>
      </div>

      {/* [NEW] Fee Breakdown Section */}
      <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>Rencana Pencairan & Biaya</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
            <div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '600' }}>BIAYA ADMIN</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>{formatCurrency(adminConfig?.feeAdmin || 0)}</div>
            </div>
            <div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '600' }}>PROVISI ({adminConfig?.feeProvisi || 0}%)</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>
                    {formatCurrency(((loan?.jumlahPinjaman ?? args?.jumlah ?? 0n) * BigInt(adminConfig?.feeProvisi || 0)) / 100n / 10n**18n)}
                </div>
            </div>
            <div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '600' }}>DANA DITERIMA</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#166534' }}>
                    {adminConfig?.deductUpfront ? 
                        formatCurrency(formatToken(loan?.jumlahPinjaman ?? args?.jumlah ?? 0n) - (adminConfig?.feeAdmin || 0) - (formatToken(loan?.jumlahPinjaman ?? args?.jumlah ?? 0n) * (adminConfig?.feeProvisi || 0) / 100))
                        : formatCurrency(formatToken(loan?.jumlahPinjaman ?? args?.jumlah ?? 0n))}
                </div>
            </div>
            <div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '600' }}>STRATEGI BIAYA</div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: adminConfig?.deductUpfront ? '#ea580c' : '#2563eb' }}>
                    {adminConfig?.deductUpfront ? 'POTONG DI AWAL' : 'TAMBAH KE TENOR'}
                </div>
            </div>
        </div>
      </div>

      <div style={{ marginTop: '10px' }}>
        {confirmAction ? (
          <div style={{ background: confirmAction === 'approve' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${confirmAction === 'approve' ? '#22c55e' : '#ef4444'}`, borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontWeight: '700', marginBottom: '12px', color: confirmAction === 'approve' ? '#166534' : '#991b1b' }}>
              {confirmAction === 'approve' ? `Konfirmasi: ${getButtonText()}` : 'Konfirmasi: Tolak Pinjaman'}
            </p>
            
            {confirmAction === 'approve' && status === 0 && (
              <input 
                type="text" 
                placeholder="Tambahkan catatan survey (opsional)..."
                value={surveyNote}
                onChange={e => setSurveyNote(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '12px' }}
              />
            )}

            {confirmAction === 'reject' && (
              <input 
                type="text" 
                placeholder="Alasan penolakan..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #fca5a5', marginBottom: '12px' }}
              />
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setConfirmAction(null)}
                disabled={isActing}
                style={{ 
                  background: '#fff', border: '1px solid #d1d5db', padding: '8px 16px', 
                  borderRadius: '8px', fontWeight: '600',
                  cursor: isActing ? 'not-allowed' : 'pointer',
                  opacity: isActing ? 0.6 : 1
                }}
              >Batal</button>
              <button 
                disabled={isActing}
                onClick={() => {
                  if (confirmAction === 'reject') processAction((idx, cb) => onReject(idx, rejectionReason, cb));
                  else if (status === 0) processAction((idx, cb) => onApproveSurvey(idx, surveyNote, cb));
                  else if (status === 1) processAction(onApproveCommittee);
                  else processAction(onApprove);
                }}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: confirmAction === 'approve' ? '#22c55e' : '#ef4444', 
                  color: '#fff', border: 'none', padding: '8px 24px', borderRadius: '8px', 
                  fontWeight: '700', cursor: isActing ? 'not-allowed' : 'pointer',
                  opacity: isActing ? 0.7 : 1
                }}
              >
                {isActing ? (
                  <>
                    <LoadingSpinner size={18} />
                    <span>Memproses...</span>
                  </>
                ) : 'Konfirmasi'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setConfirmAction('approve')}
              disabled={isActing || systemStatus?.xendit !== 'ONLINE' || systemStatus?.tunnel !== 'ONLINE'}
              title={
                systemStatus?.xendit !== 'ONLINE' ? "Xendit API Offline" : 
                systemStatus?.tunnel !== 'ONLINE' ? "NGrok Tunnel Offline - Harap nyalakan NGrok" : 
                ""
              }
              style={{ 
                flex: 2, 
                background: (systemStatus?.xendit === 'ONLINE' && systemStatus?.tunnel === 'ONLINE') 
                  ? (status === 2 ? '#10b981' : '#2563eb') 
                  : '#94a3b8', 
                color: '#fff', 
                border: 'none', 
                padding: '12px', 
                borderRadius: '10px', 
                fontWeight: '700', 
                cursor: (isActing || systemStatus?.xendit !== 'ONLINE' || systemStatus?.tunnel !== 'ONLINE') ? 'not-allowed' : 'pointer',
                opacity: (isActing || systemStatus?.xendit !== 'ONLINE' || systemStatus?.tunnel !== 'ONLINE') ? 0.6 : 1
              }}
            >
              {systemStatus?.tunnel !== 'ONLINE' ? 'Tunnel Offline' : 
               systemStatus?.xendit !== 'ONLINE' ? 'Xendit Offline' : 
               getButtonText()}
            </button>
            <button 
              onClick={() => setConfirmAction('reject')}
              disabled={isActing}
              style={{ 
                flex: 1, 
                background: '#fff', 
                color: '#ef4444', 
                border: '1px solid #ef4444', 
                padding: '12px', 
                borderRadius: '10px', 
                fontWeight: '700', 
                cursor: isActing ? 'not-allowed' : 'pointer',
                opacity: isActing ? 0.6 : 1
              }}
            >
              Tolak
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingLoanItem;
