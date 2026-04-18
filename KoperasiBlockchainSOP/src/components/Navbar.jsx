// components/Navbar.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { navbarStyles as styles } from '../styles/navbar';
import ConfirmationModal from './ConfirmationModal';

const Navbar = ({ account, onConnect, onDisconnect, isLoading, onNavigate, activeTab }) => {
    const navigate = useNavigate();
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
                onClick={() => {
                    if (id === 'profil') {
                        navigate('/profil');
                    } else {
                        // If we are not on home, go home first
                        if (window.location.pathname !== '/' && window.location.pathname !== '/user') {
                            navigate('/');
                            // Small delay or use useEffect in target page to set tab
                            setTimeout(() => {
                                if (onNavigate) onNavigate(id);
                            }, 50);
                        } else {
                            if (onNavigate) onNavigate(id);
                        }
                    }
                }}
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
                            onClick={() => navigate('/')}
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
                                <div 
                                    onClick={() => navigate('/profil')}
                                    style={{ 
                                        cursor: 'pointer', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '50%',
                                        backgroundColor: activeTab === 'profil' ? '#dbeafe' : '#f1f5f9',
                                        color: activeTab === 'profil' ? '#2563eb' : '#64748b',
                                        transition: 'all 0.2s',
                                        border: '1px solid #e5e7eb'
                                    }}
                                    title="Akun Saya"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                </div>
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
