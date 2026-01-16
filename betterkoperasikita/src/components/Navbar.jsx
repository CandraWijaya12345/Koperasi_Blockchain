// components/Navbar.jsx
import React, { useState } from 'react';
import { navbarStyles as styles } from '../styles/navbar';

const Navbar = ({ account, onConnect, onDisconnect, isLoading, onNavigate, activeTab }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const short =
    account && account.length > 10
      ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
      : account || '';

  const handleLogoutClick = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    onDisconnect();
    setShowConfirm(false);
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  // Helper for Nav Items
  const NavItem = ({ id, label }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => onNavigate && onNavigate(id)}
        style={{
          ...styles.navLink,
          textDecoration: "none",
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontWeight: isActive ? '700' : '500',
          color: isActive ? '#2563eb' : '#64748b',
          borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
          borderRadius: '0',
          padding: '20px 4px', // Taller hit area
          height: '100%'
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      <header style={styles.header}>
        <div style={styles.headerContent}>

          {/* kiri */}
          <nav style={styles.navLeft}>
            {/* If logged in, use tab navigation. If not, show static or nothing */}
            {account ? (
              <>
                <NavItem id="simpanan" label="Simpanan" />
                <NavItem id="pinjaman" label="Pinjaman" />
                <NavItem id="riwayat" label="Riwayat" />
              </>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Welcome to Koperasi Kita</div>
            )}
          </nav>

          {/* tengah */}
          <div style={styles.navCenter}>
            {/* Brand can reset to default */}
            <div
              style={{ ...styles.brandText, cursor: 'pointer' }}
            >
              KSP Kita
            </div>
          </div>

          {/* kanan */}
          <div style={styles.navRight}>
            {!account ? (
              <button
                className="btn-animate"
                style={styles.navPrimaryButton}
                onClick={onConnect}
                disabled={isLoading}
              >
                {isLoading ? 'Menghubungkan...' : 'Masuk'}
              </button>
            ) : (
              <div style={styles.walletInfo}>
                <div style={styles.walletAddress}>{short}</div>
                <button
                  onClick={handleLogoutClick}
                  className="btn-animate"
                  style={{
                    ...styles.navLink,
                    color: '#ef4444',
                    marginLeft: '8px',
                    cursor: 'pointer',
                    border: 'none',
                    background: 'none',
                    fontWeight: 600,
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            className='popup-content'
            style={{
              backgroundColor: '#fff',
              padding: '24px',
              borderRadius: '16px',
              width: '320px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#1f2937' }}>
              Konfirmasi Logout
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
              Apakah Anda yakin ingin keluar dari akun ini?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                  color: '#374151',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
