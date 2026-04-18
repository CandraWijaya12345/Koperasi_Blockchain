import React from 'react';

const PaymentOverlay = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      color: 'white',
      padding: '24px',
      textAlign: 'center',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(0.95); } }
      `}</style>
      
      <div style={{
        width: '80px',
        height: '80px',
        border: '6px solid rgba(255, 255, 255, 0.1)',
        borderTop: '6px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '32px'
      }}></div>

      <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '12px' }}>
        Pembayaran Sedang Berlangsung
      </h2>
      
      <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: '500px', lineHeight: '1.6' }}>
        Silakan selesaikan proses pembayaran di tab baru yang telah terbuka. 
        Halaman ini akan otomatis diperbarui setelah pembayaran dikonfirmasi.
      </p>

      <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', fontSize: '0.85rem', color: '#64748b' }}>
          Jangan tutup atau refresh tab ini
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.target.style.background = 'transparent'}
        >
          Masalah? Refresh Halaman
        </button>
      </div>
    </div>
  );
};

export default PaymentOverlay;
