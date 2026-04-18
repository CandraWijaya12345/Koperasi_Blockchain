import React, { useState, useEffect, useRef } from 'react';
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
import LoanHistory from '../components/Loan/LoanHistory';
import HistoryList from '../components/HistoryList';
import PaymentOverlay from '../components/PaymentOverlay';
import SuccessModal from '../components/SuccessModal';

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
  const [showBreakdown, setShowBreakdown] = useState(false);

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
    adminConfig,
    isPaymentLocked,
    paymentSuccess,
    setPaymentSuccess,
    isPengurus,
    paymentType,
    cancelPayment
  } = useKoperasi(account);

  // [BARU] States for Iframe Payment Modal
  const [activeInvoiceUrl, setActiveInvoiceUrl] = useState(null);
  const [showIframe, setShowIframe] = useState(false);

  // Auto-close Iframe when payment succeeds
  useEffect(() => {
    if (paymentSuccess) {
      setShowIframe(false);
      setActiveInvoiceUrl(null);
    }
  }, [paymentSuccess]);

  // Wrappers to handle invoiceUrl from hook
  const handlePaymentTrigger = async (paymentFunc, ...args) => {
    try {
      const result = await paymentFunc(...args);
      if (result && result.invoiceUrl) {
        setActiveInvoiceUrl(result.invoiceUrl);
        setShowIframe(true);
      }
    } catch (err) {
      console.error("Payment trigger error:", err);
    }
  };

  // [BARU] Ref untuk scrolling ke form withdraw
  const withdrawFormRef = React.useRef(null);

  const handleWithdrawClick = () => {
    setActiveTab('simpanan');
    // Tunggu render tab selesai baru scroll
    setTimeout(() => {
      if (withdrawFormRef.current) {
        withdrawFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
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
      padding: '32px',
      boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06)',
      border: '1px solid #dbeafe',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      minHeight: '160px',
    },
    cardLabel: {
      fontSize: '1rem',
      fontWeight: '700',
      color: '#3b82f6',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    cardValue: {
      fontSize: '2.5rem',
      fontWeight: '800',
      color: '#1e3a8a',
      marginBottom: '0',
      letterSpacing: '-0.025em',
      lineHeight: 1,
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
    breakdownPanel: {
      position: 'absolute',
      bottom: 'calc(100% + 12px)',
      left: 0,
      right: 0,
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      border: '1px solid rgba(37, 99, 235, 0.1)',
      zIndex: 50,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: 0,
      transform: 'translateY(10px)',
      pointerEvents: 'none',
    },
    breakdownPanelVisible: {
      opacity: 1,
      transform: 'translateY(0)',
      pointerEvents: 'auto',
    },
    breakdownItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
    },
    breakdownLabel: {
      fontSize: '0.875rem',
      color: '#64748b',
      fontWeight: '600',
    },
    breakdownValue: {
      fontSize: '0.875rem',
      color: '#1e3a8a',
      fontWeight: '700',
    }
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
              onWithdraw={handleWithdrawClick}
            />

            {anggotaData?.terdaftar && (
              <div style={styles.grid}>
                <div style={styles.card}>
                  <div>
                    <div style={styles.cardLabel}><WalletIcon /> Saldo Wallet</div>
                    <div style={styles.cardValue}>
                      {formatCurrency(idrtBalance)}
                    </div>
                  </div>
                </div>

                <div 
                  style={{ ...styles.card, position: 'relative' }}
                  onMouseEnter={() => setShowBreakdown(true)}
                  onMouseLeave={() => setShowBreakdown(false)}
                >
                  {/* BREAKDOWN TOOLTIP */}
                  <div style={{
                    ...styles.breakdownPanel,
                    ...(showBreakdown ? styles.breakdownPanelVisible : {})
                  }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '800', color: '#1e40af', marginBottom: '12px', borderBottom: '2px solid #dbeafe', paddingBottom: '8px' }}>
                      Rincian Simpanan
                    </h4>
                    <div style={styles.breakdownItem}>
                      <span style={styles.breakdownLabel}>Simpanan Pokok</span>
                      <span style={styles.breakdownValue}>{formatCurrency(formatToken(anggotaData?.simpananPokok || 0))}</span>
                    </div>
                    <div style={styles.breakdownItem}>
                      <span style={styles.breakdownLabel}>Simpanan Wajib</span>
                      <span style={styles.breakdownValue}>{formatCurrency(formatToken(anggotaData?.simpananWajib || 0))}</span>
                    </div>
                    <div style={{ ...styles.breakdownItem, borderBottom: 'none' }}>
                      <span style={styles.breakdownLabel}>Simpanan Sukarela</span>
                      <span style={styles.breakdownValue}>{formatCurrency(formatToken(anggotaData?.simpananSukarela || 0))}</span>
                    </div>
                  </div>

                  <div>
                    <div style={styles.cardLabel}><PiggyIcon /> Total Simpanan</div>
                    <div style={styles.cardValue}>
                      {formatCurrency(totalSimpanan)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <InfoIcon /> Hover untuk rincian
                    </div>
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
                          {formatCurrency(formatToken(pinjamanAktif.jumlahHarusDikembalikan - pinjamanAktif.sudahDibayar))}
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
              <RegisterForm 
                onRegister={(...args) => handlePaymentTrigger(daftarAnggota, ...args)} 
                isLoading={isLoading} 
                isPaymentLocked={isPaymentLocked}
                paymentSuccess={paymentSuccess}
              />
            )}

            {anggotaData?.terdaftar && (
              <>
                <Tabs activeTab={activeTab} onChange={setActiveTab} />

                {activeTab === "simpanan" && (
                  <>
                    <SimpananWajibForm
                      history={history}
                      isLoading={isLoading}
                      isPaymentLocked={isPaymentLocked}
                      paymentSuccess={paymentSuccess}
                      onPay={(...args) => handlePaymentTrigger(setorSimpananWajib, ...args)}
                    />

                    <SimpananForm
                      onSetor={(...args) => handlePaymentTrigger(setorSimpananSukarela, ...args)}
                      isLoading={isLoading}
                      isPaymentLocked={isPaymentLocked}
                      paymentSuccess={paymentSuccess}
                    />

                    {/* WITHDRAW SECTION */}
                    <div ref={withdrawFormRef}>
                      <WithdrawForm
                        onWithdraw={tarikSimpanan}
                        maxBalance={formatCurrency(formatToken(anggotaData?.simpananSukarela || 0))}
                        isLoading={isLoading}
                      />
                    </div>
                  </>
                )}

                {activeTab === "pinjaman" && (
                  <>
                    {pinjamanAktif ? (
                      <ActiveLoan
                        pinjamanAktif={pinjamanAktif}
                        onBayar={(...args) => handlePaymentTrigger(bayarAngsuran, ...args)}
                        isLoading={isLoading}
                        isPaymentLocked={isPaymentLocked}
                        paymentSuccess={paymentSuccess}
                        adminConfig={adminConfig}
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

                    {/* Selalu tampilkan riwayat pengajuan di bawah fitur utama pinjaman */}
                    <LoanHistory history={history} />
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
        <p>© 2026 Koperasi Simpan Pinjam Blockchain</p>
      </footer>

      <PaymentOverlay isVisible={isPaymentLocked && !showIframe} />
      
      {/* SEAMLESS IFRAME MODAL */}
      {showIframe && activeInvoiceUrl && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
           <div style={{
             width: '100%', maxWidth: '1000px', height: '90vh',
             backgroundColor: 'white', borderRadius: '24px',
             overflow: 'hidden', position: 'relative',
             boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
           }}>
             {/* Header Modal */}
             <div style={{
               padding: '16px 24px', backgroundColor: '#f8fafc',
               borderBottom: '1px solid #e2e8f0',
               display: 'flex', justifyContent: 'space-between', alignItems: 'center'
             }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <div style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
                 <span style={{ fontWeight: '700', color: '#1e293b' }}>Pembayaran Aman Xendit</span>
               </div>
               <button 
                 onClick={() => {
                   cancelPayment();
                   setShowIframe(false);
                 }}
                 style={{ 
                   background: '#ef4444', color: 'white', border: 'none', 
                   padding: '6px 16px', borderRadius: '12px', fontWeight: '600',
                   cursor: 'pointer', transition: 'all 0.2s'
                 }}
                 onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                 onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
               >
                 Tutup Pembayaran
               </button>
             </div>

             <iframe 
               src={activeInvoiceUrl}
               style={{ width: '100%', height: 'calc(100% - 60px)', border: 'none' }}
               title="Xendit Payment"
             />
           </div>
           <p style={{ color: 'white', marginTop: '16px', fontSize: '0.875rem', opacity: 0.8 }}>
             Halaman ini akan otomatis tertutup setelah pembayaran Anda terverifikasi.
           </p>
        </div>
      )}

      <SuccessModal 
        isVisible={paymentSuccess} 
        onClose={() => setPaymentSuccess(false)} 
        type={paymentType}
      />
    </div>
  );
};

export default UserPage;
