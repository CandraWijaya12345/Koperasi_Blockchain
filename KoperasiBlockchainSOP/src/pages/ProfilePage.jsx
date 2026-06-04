import React from 'react';
import Navbar from '../components/Navbar';
import ProfileView from '../components/Profile/ProfileView';
import PaymentOverlay from '../components/PaymentOverlay';
import SuccessModal from '../components/SuccessModal';

import { useWallet } from '../hooks/useWallet';
import { useKoperasi } from '../hooks/useKoperasi';
import { layoutStyles as layout } from '../styles/layout';

const ProfilePage = () => {
  const { account, isConnecting, connectWallet, disconnectWallet, error: walletError } = useWallet();

  const {
    message,
    isLoading,
    anggotaData,
    isPengurus,
    isPaymentLocked,
    paymentSuccess,
    setPaymentSuccess,
    cancelPayment,
    joiningDate
  } = useKoperasi(account);

  const globalMessage = walletError || message;

  return (
    <div style={layout.pageWrapper}>
      <Navbar
        account={account}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
        isLoading={isConnecting || isLoading}
        activeTab="profil" // Force active tab for navbar styling
      />

      {isPaymentLocked && (
        <div style={{
          background: '#eff6ff',
          borderBottom: '1px solid #bfdbfe',
          color: '#1e40af',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.9rem',
          fontWeight: '500',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <style>{`
            @keyframes pulseBanner { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.9); } }
          `}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              display: 'inline-block',
              width: '8px',
              height: '8px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'pulseBanner 1.5s infinite'
            }}></span>
            <span>Sedang memverifikasi pembayaran Anda di latar belakang... Halaman akan terupdate secara otomatis.</span>
          </div>
          <button 
            onClick={cancelPayment}
            style={{
              background: 'transparent',
              border: '1px solid #3b82f6',
              color: '#3b82f6',
              padding: '4px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.05)'; }}
            onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; }}
          >
            Batal / Reset
          </button>
        </div>
      )}

      {globalMessage && (
        <div style={layout.messageWrapper}>
          <div style={layout.messageBanner}>
            <span>{globalMessage}</span>
          </div>
        </div>
      )}

      <main style={layout.container}>
        {!account ? (
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <h2 style={{ color: '#1e3a8a', marginBottom: '16px' }}>Silakan Hubungkan Wallet</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Anda perlu menghubungkan wallet untuk melihat informasi profil Anda.</p>
            <button 
              onClick={connectWallet}
              style={{ padding: '12px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
            >
              Hubungkan Wallet
            </button>
          </div>
        ) : (
          <ProfileView 
            anggotaData={anggotaData} 
            account={account} 
            isPengurus={isPengurus}
            joiningDate={joiningDate}
          />
        )}
      </main>

      <footer style={layout.footer}>
        <p>© 2026 Koperasi Simpan Pinjam Blockchain</p>
      </footer>


      <SuccessModal 
        isVisible={paymentSuccess} 
        onClose={() => setPaymentSuccess(false)} 
      />
    </div>
  );
};

export default ProfilePage;
