import React from 'react';

const TransactionModal = ({ isVisible, stage, message, type = 'simpanan', error, onClose }) => {
  if (!isVisible) return null;

  // Stages definition
  const stages = {
    xendit: [
      { id: 1, label: 'Menyiapkan Invoice', icon: '📝' },
      { id: 2, label: 'Menunggu Pembayaran', icon: '💳' },
      { id: 3, label: 'Verifikasi Blockchain', icon: '⛓️' },
      { id: 4, label: 'Selesai', icon: '✅' }
    ],
    internal: [
      { id: 1, label: 'Menyiapkan Transaksi', icon: '📝' },
      { id: 2, label: 'Mengirim ke Blockchain', icon: '⛓️' },
      { id: 3, label: 'Memperbarui Saldo', icon: '🔄' },
      { id: 4, label: 'Selesai', icon: '✅' }
    ]
  };

  const currentStages = type === 'internal' ? stages.internal : stages.xendit;
  const isSuccess = stage >= 4;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9000,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        padding: '32px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
            {isSuccess ? 'Transaksi Berhasil!' : 'Memproses Transaksi'}
          </h3>
          <p style={{ fontSize: '0.9rem', color: error ? '#ef4444' : '#64748b', margin: 0, fontWeight: error ? '700' : '400' }}>
            {error || message || 'Mohon tunggu sebentar...'}
          </p>
        </div>

        {/* Progress Stages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {currentStages.map((s, idx) => {
            const isDone = stage > s.id || (stage >= 4 && s.id === 4);
            const isCurrent = stage === s.id && !isDone;
            const isPending = stage < s.id;

            return (
              <div key={s.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: isCurrent ? '#eff6ff' : (isDone ? '#f0fdf4' : '#f8fafc'),
                border: '1px solid',
                borderColor: isCurrent ? '#bfdbfe' : (isDone ? '#bbf7d0' : '#e2e8f0'),
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  backgroundColor: isDone ? '#22c55e' : (isCurrent ? '#3b82f6' : '#e2e8f0'),
                  color: 'white',
                  position: 'relative'
                }}>
                  {isDone ? '✓' : (isCurrent ? <div style={{ width: '16px', height: '16px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : s.id)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: isCurrent || isDone ? '700' : '500',
                    color: isDone ? '#166534' : (isCurrent ? '#1e40af' : '#64748b')
                  }}>
                    {s.label}
                  </div>
                </div>
                <div style={{ fontSize: '1.2rem', opacity: isPending ? 0.3 : 1 }}>
                  {s.icon}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          {isSuccess || error ? (
            <button
              onClick={onClose}
              style={{
                width: '100%',
                backgroundColor: error ? '#ef4444' : '#16a34a',
                color: 'white',
                border: 'none',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: `0 4px 6px -1px ${error ? 'rgba(239, 68, 68, 0.2)' : 'rgba(22, 163, 74, 0.2)'}`
              }}
            >
              {error ? 'Tutup & Coba Lagi' : 'Selesai & Tutup'}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, animation: 'pulse 2s infinite' }}>
                Jangan tutup halaman ini sampai proses selesai.
              </p>
              {stage === 3 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginTop: '12px' }}>
                  <button 
                    onClick={onClose}
                    style={{ 
                      backgroundColor: '#3b82f6', color: 'white', border: 'none', 
                      padding: '10px 20px', borderRadius: '12px', fontSize: '0.85rem', 
                      fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
                      width: '100%'
                    }}
                  >
                    Tutup & Lewati Verifikasi
                  </button>
                  <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                    Pembayaran Anda telah sukses. Transaksi blockchain sedang diproses di latar belakang dan saldo Anda akan ter-update otomatis.
                  </p>
                </div>
              ) : stage <= 2 ? (
                <button 
                  onClick={onClose}
                  style={{ 
                    background: 'none', border: 'none', color: '#94a3b8', 
                    fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' 
                  }}
                >
                  Batal / Tutup Panel
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;
