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

      <PaymentOverlay isVisible={isPaymentLocked} />
      <SuccessModal 
        isVisible={paymentSuccess} 
        onClose={() => setPaymentSuccess(false)} 
      />
    </div>
  );
};

export default ProfilePage;
