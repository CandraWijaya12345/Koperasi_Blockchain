import React from 'react';

const SuccessModal = ({ isVisible, onClose, type = 'simpanan' }) => {
  if (!isVisible) return null;

  const isAngsuran = type === 'angsuran';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes checkmark { 0% { stroke-dashoffset: 48; } 100% { stroke-dashoffset: 0; } }
      `}</style>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#f0fdf4',
          borderRadius: '50%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 auto 24px'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 48, strokeDashoffset: 48, animation: 'checkmark 0.6s ease-out 0.2s forwards' }} />
          </svg>
        </div>

        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827', marginBottom: '12px' }}>
          {isAngsuran ? 'Angsuran Berhasil!' : 'Simpanan Berhasil!'}
        </h3>
        
        <p style={{ color: '#4b5563', lineHeight: '1.6', marginBottom: '32px' }}>
          {isAngsuran 
            ? 'Terima kasih! Pembayaran angsuran Anda telah berhasil diproses dan dicatat di blockchain.' 
            : 'Terima kasih! Penyetoran Anda telah berhasil diproses dan dicatat di blockchain.'}
          <br/> Saldo Anda akan segera diperbarui secara otomatis.
        </p>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            backgroundColor: '#16a34a',
            color: 'white',
            border: 'none',
            padding: '14px',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)'
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
        >
          Tutup
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
