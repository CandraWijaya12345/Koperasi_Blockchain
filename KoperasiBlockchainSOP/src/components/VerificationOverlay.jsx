import React from 'react';

const VerificationOverlay = ({ isVisible, message = 'Memverifikasi Transaksi di Blockchain...', onCancel }) => {
  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10001, // Higher than regular overlays
      color: 'white',
      padding: '24px',
      textAlign: 'center',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pulseText { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(0.98); } }
        @keyframes wave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
      
      {/* Premium Loader */}
      <div style={{ position: 'relative', marginBottom: '40px' }}>
        <div style={{
          width: '100px',
          height: '100px',
          border: '4px solid rgba(59, 130, 246, 0.1)',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1.5s cubic-bezier(0.5, 0, 0.5, 1) infinite',
        }}></div>
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          width: '80px',
          height: '80px',
          border: '4px solid rgba(255, 255, 255, 0.05)',
          borderBottom: '4px solid #60a5fa',
          borderRadius: '50%',
          animation: 'spin 2s linear infinite reverse',
        }}></div>
      </div>

      <h2 style={{ 
        fontSize: '1.75rem', 
        fontWeight: '800', 
        marginBottom: '16px',
        animation: 'pulseText 2s ease-in-out infinite',
        letterSpacing: '-0.025em'
      }}>
        {message}
      </h2>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
         <div style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '50%', animation: 'wave 1.2s infinite 0.1s' }}></div>
         <div style={{ width: '8px', height: '8px', backgroundColor: '#60a5fa', borderRadius: '50%', animation: 'wave 1.2s infinite 0.2s' }}></div>
         <div style={{ width: '8px', height: '8px', backgroundColor: '#93c5fd', borderRadius: '50%', animation: 'wave 1.2s infinite 0.3s' }}></div>
      </div>

      <div style={{ 
        maxWidth: '450px', 
        padding: '20px', 
        backgroundColor: 'rgba(255,255,255,0.05)', 
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
          Sistem sedang mendeteksi perubahan saldo di wallet Anda. 
          Halaman akan me-refresh secara otomatis setelah data berhasil disinkronkan.
        </p>
      </div>

      <p style={{ marginTop: '24px', fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Polygon Amoy Network Syncing...
      </p>

      {onCancel && (
        <button 
          onClick={onCancel}
          style={{
            marginTop: '32px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(4px)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '12px 24px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => { e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'; e.target.style.borderColor = 'rgba(255,255,255,0.4)'; }}
          onMouseOut={(e) => { e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
        >
          Batal & Reset Manual
        </button>
      )}
    </div>
  );
};

export default VerificationOverlay;
