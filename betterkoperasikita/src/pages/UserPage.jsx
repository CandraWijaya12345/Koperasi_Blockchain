import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import InfoCards from '../components/InfoCards';
import DashboardHero from '../components/DashboardHero';
import Tabs from '../components/Tabs';
import SimpananForm, { SimpananWajibForm } from '../components/Forms/SimpananForm';
import WithdrawForm from '../components/Forms/WithdrawForm';
import RegisterForm from '../components/Forms/RegisterForm';
import AjukanPinjamanForm from '../components/Forms/AjukanPinjamanForm';
import ActiveLoan from '../components/Loan/ActiveLoan';
import PendingLoan from '../components/Loan/PendingLoan';
import HistoryList from '../components/HistoryList';

import { useWallet } from '../hooks/useWallet';
import { useKoperasi } from '../hooks/useKoperasi';
import { layoutStyles as layout } from '../styles/layout';
import { formatCurrency, formatToken } from '../utils/format';


const WalletIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12a2 2 0 0 0 2 2h14v-4" /><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" /></svg>;
const PiggyIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5c-1.5 0-2.8.6-3.5 1.5A8.8 8.8 0 0 0 11 5c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8c0-1.8-.6-3.5-1.5-4.8.9-.7 1.5-2 1.5-3.5a1 1 0 0 0-2 0c0 1.1-.9 2-2 2" /></svg>;
const TrendingUpIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
const LoanIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
const InfoIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>;

const UserPage = () => {
  const [activeTab, setActiveTab] = useState('simpanan');
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, message: '', isError: false, isLoading: false });

  const { account, isConnecting, connectWallet, disconnectWallet, error: walletError } = useWallet();

  const {
    message,
    isLoading,
    anggotaData,
    idrtBalance,
    totalSimpanan,
    pinjamanAktif,
    pendingLoanUser,
    history,
    daftarAnggota,
    setorSimpananSukarela,
    setorSimpananWajib,
    ajukanPinjaman,
    bayarAngsuran,
    refresh,
    simpananWajib,
    simpananSukarela,
    tarikSimpanan,
    adminConfig
  } = useKoperasi(account);

  const handleConfirmPay = async () => {
    setShowPaymentConfirm(false);
    // Open modal immediately in loading state
    setAlertConfig({ isOpen: true, message: "Memulai proses pembayaran...", isError: false, isLoading: true });

    try {
      await setorSimpananWajib((msg) => {
        // Update message while keeping loading state
        setAlertConfig(prev => ({ ...prev, message: msg, isLoading: true }));
      });
      // Final success state
      setAlertConfig({ isOpen: true, message: "Pembayaran Simpanan Wajib Berhasil!", isError: false, isLoading: false });
    } catch (err) {
      // Error state
      setAlertConfig({ isOpen: true, message: "Gagal: " + (err.reason || err.message), isError: true, isLoading: false });
    }
  };

  const globalMessage = walletError || message;

  const styles = {
    welcomeSection: {
      marginBottom: '32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 24px' // Align with container padding
    },
    welcomeTitle: {
      fontSize: '1.875rem',
      fontWeight: '800',
      color: '#1e40af',
      marginBottom: '4px',
    },
    welcomeSubtitle: {
      color: '#64748b',
      fontSize: '1rem',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
      marginBottom: '40px',
    },
    card: {
      background: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06)',
      border: '1px solid #dbeafe',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '140px',
    },
    cardLabel: {
      fontSize: '0.875rem',
      fontWeight: '700',
      color: '#3b82f6',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    cardValue: {
      fontSize: '1.875rem',
      fontWeight: '800',
      color: '#1e3a8a',
      marginBottom: '4px',
      letterSpacing: '-0.025em',
    },
    cardSubValue: {
      fontSize: '0.875rem',
      color: '#16a34a',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      background: '#dcfce7',
      width: 'fit-content',
      padding: '2px 8px',
      borderRadius: '99px'
    },
  };

  return (
    <div style={layout.pageWrapper}>
      <Navbar
        account={account}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
        isLoading={isConnecting || isLoading}
        activeTab={activeTab}
        onNavigate={setActiveTab}
      />

      {globalMessage && (
        <div style={layout.messageWrapper}>
          <div style={layout.messageBanner}>
            <span style={{ color: '#1e40af' }}><InfoIcon /></span>
            <span>{globalMessage}</span>
          </div>
        </div>
      )}

      <main style={layout.container}>

        {!account && (
          <>
            <Hero onConnect={connectWallet} isLoading={isConnecting} />
            <InfoCards />
          </>
        )}

        {account && (
          <>
            <DashboardHero
              userAccount={account}
              nama={anggotaData?.terdaftar ? anggotaData.nama : "Calon Anggota"}
              isMember={!!anggotaData?.terdaftar}
            />

            {anggotaData?.terdaftar && (
              <div style={styles.grid}>
                <div style={styles.card}>
                  <div>
                    <div style={styles.cardLabel}><WalletIcon /> Saldo Wallet</div>
                    <div style={styles.cardValue}>
                      {formatCurrency(idrtBalance)} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: '500' }}>IDRT</span>
                    </div>
                  </div>
                  <div style={styles.cardSubValue}>
                    Siap Transaksi
                  </div>
                </div>

                <div style={styles.card}>
                  <div>
                    <div style={styles.cardLabel}><PiggyIcon /> Total Simpanan</div>
                    <div style={styles.cardValue}>
                      {formatCurrency(totalSimpanan)} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: '500' }}>IDRT</span>
                    </div>
                  </div>
                  <div style={styles.cardSubValue}>
                    <TrendingUpIcon /> Berkembang
                  </div>
                </div>

                <div style={{ ...styles.card, borderLeft: pinjamanAktif ? '4px solid #f59e0b' : '4px solid #10b981' }}>
                  <div>
                    <div style={{ ...styles.cardLabel, color: pinjamanAktif ? '#d97706' : '#059669' }}>
                      <LoanIcon /> Status Pinjaman
                    </div>
                    {pinjamanAktif ? (
                      <>
                        <div style={styles.cardValue}>
                          {formatCurrency(formatToken(pinjamanAktif.jumlahHarusDikembalikan - pinjamanAktif.sudahDibayar))} <span style={{ fontSize: '1rem', color: '#64748b' }}>IDRT</span>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#b45309', fontWeight: '600', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px', width: 'fit-content' }}>
                          Sedang Berjalan
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ ...styles.cardValue, color: '#059669' }}>Bebas Utang</div>
                        <div style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '600' }}>
                          Siap Mengajukan
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!anggotaData?.terdaftar && (
              <RegisterForm onRegister={daftarAnggota} isLoading={isLoading} />
            )}

            {anggotaData?.terdaftar && (
              <>
                <Tabs activeTab={activeTab} onChange={setActiveTab} />

                {activeTab === "simpanan" && (
                  <>
                    <SimpananWajibForm
                      history={history}
                      isLoading={isLoading}
                      onPay={setorSimpananWajib}
                    />

                    <SimpananForm
                      onSetor={setorSimpananSukarela}
                      isLoading={isLoading}
                    />

                    {/* WITHDRAW SECTION */}
                    <WithdrawForm
                      onWithdraw={tarikSimpanan}
                      maxBalance={formatCurrency(formatToken(anggotaData?.simpananSukarela || 0))}
                      isLoading={isLoading}
                    />
                  </>
                )}

                {activeTab === "pinjaman" && (
                  <>
                    {pinjamanAktif ? (
                      <ActiveLoan
                        pinjamanAktif={pinjamanAktif}
                        onBayar={bayarAngsuran}
                        isLoading={isLoading}
                      />
                    ) : pendingLoanUser ? (
                      <PendingLoan pendingLoanUser={pendingLoanUser} />
                    ) : (
                      <AjukanPinjamanForm
                        onAjukan={ajukanPinjaman}
                        isLoading={isLoading}
                        maxLimit={0}
                        adminConfig={adminConfig || {}}
                      />
                    )}
                  </>
                )}

                {activeTab === "riwayat" && (
                  <HistoryList
                    history={history}
                    onRefresh={refresh}
                    isLoading={isLoading}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      <footer style={layout.footer}>
        <p>© 2024 Koperasi Simpan Pinjam Blockchain</p>
      </footer>

    </div>
  );
};

export default UserPage;
