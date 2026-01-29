// components/Navbar.jsx
import React, { useState } from 'react';
import { navbarStyles as styles } from '../styles/navbar';
import ConfirmationModal from './ConfirmationModal';

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
            <ConfirmationModal
                isOpen={showConfirm}
                title="Konfirmasi Logout"
                message="Apakah Anda yakin ingin keluar dari akun ini?"
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                confirmText="Ya, Keluar"
                cancelText="Batal"
                isDanger={true}
            />
        </>
    );
};

export default Navbar;
