import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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
import SimpananBerjangkaForm from '../components/Forms/SimpananBerjangkaForm';
import VerificationOverlay from '../components/VerificationOverlay';
import TransactionModal from '../components/TransactionModal';

import { useWallet } from '../hooks/useWallet';
import { useKoperasi } from '../hooks/useKoperasi';
import { layoutStyles as layout } from '../styles/layout';
import { formatCurrency, formatrupiah } from '../utils/format';


const WalletIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12a2 2 0 0 0 2 2h14v-4" /><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" /></svg>;
const PiggyIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5c-1.5 0-2.8.6-3.5 1.5A8.8 8.8 0 0 0 11 5c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8c0-1.8-.6-3.5-1.5-4.8.9-.7 1.5-2 1.5-3.5a1 1 0 0 0-2 0c0 1.1-.9 2-2 2" /></svg>;
const TrendingUpIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
const LoanIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
const InfoIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>;

const UserPage = () => {
  const [activeTab, setActiveTab] = useState('simpanan');
  const [showBreakdown, setShowBreakdown] = useState(false);

  const { account, isConnecting, connectWallet, disconnectWallet, error: walletError } = useWallet();
  const location = useLocation();

  // [UX FIX] Handle navigation state from other pages (e.g. from Profile)
  useEffect(() => {
    if (location.state?.targetTab) {
      setActiveTab(location.state.targetTab);
      // Clear state so it doesn't persist on manual refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const {
    message,
    isLoading,
    anggotaData,
    idrBalance,
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
    tarikSimpanan,
    isPaymentLocked,
    paymentSuccess,
    cancelPayment,
    bayarSimpananWajibInternal,
    adminConfig,
    userTimeDeposits,
    openSimpananBerjangka,
    cairkanSimpananBerjangka,
    triggerTripleSync,
    setPaymentSuccess,
    isPengurus,
    paymentType,
    joiningDate,
    systemStatus
  } = useKoperasi(account);

  // [BARU] States for Iframe Payment Modal
  const [activeInvoiceUrl, setActiveInvoiceUrl] = useState(null);
  const [showIframe, setShowIframe] = useState(false);
  const [activeExternalId, setActiveExternalId] = useState(() => sessionStorage.getItem('activeExternalId') || null);

  // [BARU] States for Transaction Stage Tracking
  const [txModal, setTxModal] = useState({
    visible: false,
    stage: 1,
    message: '',
    type: 'xendit',
    error: null
  });

  // [NEW] Listen for PAYMENT_SUCCESS_IFRAME message from Xendit redirect iframe
  useEffect(() => {
    const handleIframeMessage = (event) => {
      if (event.data?.type === 'PAYMENT_SUCCESS_IFRAME') {
        console.log("[Payment] Received PAYMENT_SUCCESS_IFRAME message from child frame.");
        setShowIframe(false);
        setActiveInvoiceUrl(null);
        
        // Immediately advance to stage 3 (Blockchain verification) in parent window
        setTxModal(prev => ({
          ...prev,
          stage: 3,
          message: 'Pembayaran terdeteksi! Sedang memverifikasi di blockchain...'
        }));
      }
    };
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  // Auto-close Iframe when payment succeeds
  useEffect(() => {
    if (paymentSuccess) {
      setShowIframe(false);
      setActiveInvoiceUrl(null);
      
      // Update Modal to Success Stage
      setTxModal(prev => ({
        ...prev,
        stage: 4,
        message: 'Pembayaran terverifikasi! Saldo Anda telah diperbarui.'
      }));
    }
  }, [paymentSuccess]);

  // Track stages for Xendit payments
  useEffect(() => {
    if (isPaymentLocked && !paymentSuccess && txModal.visible && txModal.type === 'xendit') {
      if (showIframe) {
        setTxModal(prev => ({ ...prev, stage: 2, message: 'Menunggu Anda menyelesaikan pembayaran di panel Xendit...' }));
      } else if (!showIframe && txModal.stage < 3) {
        // If iframe is closed but still locked, it means we are in verification stage
        setTxModal(prev => ({ ...prev, stage: 3, message: 'Pembayaran sedang diverifikasi di blockchain. Mohon tunggu...' }));
      }
    }
  }, [isPaymentLocked, paymentSuccess, showIframe, txModal.visible, txModal.type, txModal.stage]);

  // [MITIGASI] Recover state on refresh if locked
  useEffect(() => {
    if (isPaymentLocked && !paymentSuccess && !txModal.visible) {
      setTxModal({
        visible: true,
        stage: 3,
        message: 'Mendeteksi transaksi aktif... Menunggu verifikasi blockchain otomatis.',
        type: 'xendit'
      });
    }
  }, [isPaymentLocked, paymentSuccess, txModal.visible]);

  // Wrappers to handle invoiceUrl from hook
  const handlePaymentTrigger = async (paymentFunc, ...args) => {
    try {
      setTxModal({ visible: true, stage: 1, message: 'Menyiapkan invoice pembayaran...', type: 'xendit', error: null });
      const result = await paymentFunc(...args, (msg) => setTxModal(prev => ({ ...prev, message: msg })));
      if (result && result.invoiceUrl) {
        setActiveInvoiceUrl(result.invoiceUrl);
        setActiveExternalId(result.externalId || null);
        sessionStorage.setItem('activeExternalId', result.externalId || '');
        setShowIframe(true);
      }
      return result;
    } catch (err) {
      console.error("Payment trigger error:", err);
      // Mitigation: Show error in modal instead of just closing it
      setTxModal(prev => ({ ...prev, error: err.message || 'Terjadi kesalahan sistem.' }));
      throw err;
    }
  };

  const handleClosePayment = async () => {
    const extId = activeExternalId || sessionStorage.getItem('activeExternalId');
    if (extId) {
      // Show verification stage on the status modal
      setTxModal({ visible: true, stage: 1, message: 'Memverifikasi status pembayaran terakhir di Xendit...', type: 'xendit', error: null });
      try {
        const res = await fetch(`http://localhost:5000/api/payment/verify/${extId}`);
        const data = await res.json();
        if (data.success && (data.status === 'PAID' || data.status === 'SETTLED')) {
          // Payment was actually completed! Advance to blockchain stage
          console.log("[Close Payment] Verified as PAID. Keeping locked for blockchain confirmation.");
          setShowIframe(false);
          setActiveExternalId(null);
          sessionStorage.removeItem('activeExternalId');
          setTxModal(prev => ({
            ...prev,
            stage: 3,
            message: 'Pembayaran terdeteksi sukses! Memperbarui data Anda di blockchain...'
          }));
          return;
        }
      } catch (err) {
        console.warn("[Close Payment] Verification fetch failed:", err);
      }
    }
    
    // If not paid (or verification failed/unpaid), we proceed to cancel
    cancelPayment();
    setShowIframe(false);
    setActiveExternalId(null);
    sessionStorage.removeItem('activeExternalId');
    setTxModal({ visible: false, stage: 1, message: '', type: 'xendit' });
  };

  const handleInternalPayment = async (onProgress) => {
    try {
      setTxModal({ visible: true, stage: 1, message: 'Menyiapkan data blockchain...', type: 'internal', error: null });
      const tx = await bayarSimpananWajibInternal((msg) => {
        // Update stage based on message keywords
        if (msg.includes('Blockchain')) setTxModal(prev => ({ ...prev, stage: 2, message: msg }));
        else if (msg.includes('konfirmasi')) setTxModal(prev => ({ ...prev, stage: 2, message: msg }));
        else setTxModal(prev => ({ ...prev, message: msg }));
      });
      
      setTxModal(prev => ({ ...prev, stage: 3, message: 'Transaksi dikonfirmasi! Memperbarui saldo Anda...' }));
      await triggerTripleSync();
      
      setTxModal(prev => ({ ...prev, stage: 4, message: 'Berhasil! Saldo Simpanan Wajib Anda telah bertambah.' }));
      return tx;
    } catch (err) {
      console.error("Internal payment error:", err);
      setTxModal(prev => ({ ...prev, error: err.message || 'Gagal memproses transaksi blockchain.' }));
      throw err;
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

  // [BARU] Logic to detect if user is in "Waiting for Blockchain Activation" state
  const isActivating = !anggotaData?.terdaftar && isPaymentLocked && (paymentType === 'simpanan' || paymentType === 'POKOK');

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
    },
    statusBadge: (status) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 16px',
      borderRadius: '99px',
      fontSize: '0.825rem',
      fontWeight: '800',
      background: status === 1 ? '#dcfce7' : (status === 3 ? '#fef3c7' : '#f1f5f9'),
      color: status === 1 ? '#166534' : (status === 3 ? '#92400e' : '#64748b'),
      border: `1px solid ${status === 1 ? '#bbf7d0' : (status === 3 ? '#fde68a' : '#e2e8f0')}`,
    }),
    watchdogBanner: {
      backgroundColor: '#fef2f2',
      borderBottom: '1px solid #fee2e2',
      padding: '12px 24px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '12px',
      color: '#991b1b',
      fontSize: '0.875rem',
      fontWeight: '600'
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

      {/* WATCHDOG SYSTEM HEALTH BANNER */}
      {systemStatus.webhookMismatch && (
        <div style={styles.watchdogBanner}>
            <span style={{ animation: 'pulse 1s infinite' }}>⚠️</span>
            <span>Deteksi Masalah Sinkronisasi: Callback Xendit mungkin terganggu. Kami sedang mencoba menyelaraskan otomatis...</span>
            <button onClick={refresh} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>Periksa Sekarang</button>
        </div>
      )}

      {/* GLOBAL SYNCING BANNER (Silent Background Refresh Enabled) */}
      {isPaymentLocked && !showIframe && (
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
              nama={(anggotaData?.terdaftar && anggotaData?.status === 1) ? anggotaData.nama : (anggotaData?.status === 4 ? "Mantan Anggota" : "Calon Anggota")}
              isMember={anggotaData?.terdaftar && anggotaData?.status === 1}
              onWithdraw={handleWithdrawClick}
            />

            {anggotaData?.terdaftar && anggotaData?.status === 1 && (
              <div style={styles.grid}>
                <div style={styles.card}>
                  <div>
                    <div style={styles.cardLabel}><WalletIcon /> Saldo Wallet</div>
                    <div style={styles.cardValue}>
                      {formatCurrency(idrBalance)}
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
                      <span style={styles.breakdownValue}>{formatCurrency(formatrupiah(anggotaData?.simpananPokok || 0))}</span>
                    </div>
                    <div style={styles.breakdownItem}>
                      <span style={styles.breakdownLabel}>Simpanan Wajib</span>
                      <span style={styles.breakdownValue}>{formatCurrency(formatrupiah(anggotaData?.simpananWajib || 0))}</span>
                    </div>
                    <div style={styles.breakdownItem}>
                      <span style={styles.breakdownLabel}>Simpanan Sukarela</span>
                      <span style={styles.breakdownValue}>{formatCurrency(formatrupiah(anggotaData?.simpananSukarela || 0))}</span>
                    </div>
                    <div style={{ ...styles.breakdownItem, borderBottom: 'none' }}>
                      <span style={styles.breakdownLabel}>Simpanan Berjangka</span>
                      <span style={{ ...styles.breakdownValue, color: '#16a34a' }}>
                        {formatCurrency(formatrupiah(userTimeDeposits.reduce((sum, d) => d.active ? sum + BigInt(d.amount) : sum, 0n)))}
                      </span>
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
                          {formatCurrency(formatrupiah(pinjamanAktif.jumlahHarusDikembalikan - pinjamanAktif.sudahDibayar))}
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

            {/* [BARU] OVERLAY AKTIVASI: Tampil jika sudah bayar tapi blockchain belum konfirmasi */}
            {isActivating && (
                <div style={{
                    ...styles.card,
                    textAlign: 'center',
                    padding: '60px 40px',
                    border: '2px dashed #3b82f6',
                    backgroundColor: '#eff6ff',
                    animation: 'pulse 2s infinite'
                }}>
                    <div style={{ marginBottom: '20px' }}>
                        <svg className="animate-spin" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e40af', marginBottom: '12px' }}>
                        Sedang Mengaktifkan Akun...
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '500px', margin: '0 auto', marginBottom: '24px' }}>
                        Pembayaran Anda telah diterima. Kami sedang mendaftarkan identitas Anda ke jaringan blockchain Polygon. 
                        <b> Mohon jangan tutup halaman ini</b>, dashboard akan tampil otomatis sebentar lagi.
                    </p>
                    <button 
                        onClick={cancelPayment}
                        style={{
                            background: '#ffffff',
                            color: '#64748b',
                            border: '1px solid #d1d5db',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                        }}
                    >
                        Batal & Verifikasi Manual
                    </button>
                </div>
            )}



            {(!anggotaData?.terdaftar || anggotaData?.status === 4) && !isLoading && !isActivating && (
              <RegisterForm 
                onRegister={(...args) => handlePaymentTrigger(daftarAnggota, ...args)} 
                isLoading={isLoading} 
                isPaymentLocked={isPaymentLocked}
                paymentSuccess={paymentSuccess}
                paymentType={paymentType}
                userAddress={account}
                adminConfig={adminConfig}
              />
            )}

            {anggotaData?.terdaftar && anggotaData?.status === 1 && (
              <>
                <Tabs activeTab={activeTab} onChange={setActiveTab} />

                {activeTab === "simpanan" && (
                  <>
                    <SimpananWajibForm
                      anggotaData={anggotaData}
                      adminConfig={adminConfig}
                      isLoading={isLoading}
                      isPaymentLocked={isPaymentLocked}
                      paymentSuccess={paymentSuccess}
                      paymentType={paymentType}
                      onPay={(...args) => handlePaymentTrigger(setorSimpananWajib, ...args)}
                      onPayInternal={handleInternalPayment}
                    />

                    <SimpananForm
                      onSetor={(...args) => handlePaymentTrigger(setorSimpananSukarela, ...args)}
                      isLoading={isLoading}
                      isPaymentLocked={isPaymentLocked}
                      paymentSuccess={paymentSuccess}
                      paymentType={paymentType}
                    />

                    {/* WITHDRAW SECTION */}
                    <div ref={withdrawFormRef}>
                      <WithdrawForm
                        onWithdraw={tarikSimpanan}
                        maxBalance={formatCurrency(formatrupiah(anggotaData?.simpananSukarela || 0))}
                        isLoading={isLoading}
                      />
                    </div>
                  </>
                )}

                {activeTab === "berjangka" && (
                  <SimpananBerjangkaForm
                    userTimeDeposits={userTimeDeposits}
                    anggotaData={anggotaData}
                    idrBalance={idrBalance}
                    onOpen={openSimpananBerjangka}
                    onCair={cairkanSimpananBerjangka}
                    isLoading={isLoading}
                    annualInterestRate={adminConfig?.bunga || 5}
                  />
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
                        paymentType={paymentType}
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

      <TransactionModal 
        isVisible={txModal.visible}
        stage={txModal.stage}
        message={txModal.message}
        type={txModal.type}
        error={txModal.error}
        onClose={() => {
          // If closed during blockchain verification (stage 3), do NOT call cancelPayment so polling and banner can continue in the background.
          // If closed before stage 3, we release the lock as the user cancelled.
          if (txModal.stage < 3 && isPaymentLocked) {
            cancelPayment();
          }
          setTxModal(prev => ({ ...prev, visible: false }));
          setPaymentSuccess(false); // Reset internal flag
        }}
      />
      
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
                 <span style={{ fontWeight: '700', color: '#1e293b' }}>Xendit Payment Gateway</span>
               </div>
               <button 
                 onClick={handleClosePayment}
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
        onClose={() => {
          setPaymentSuccess(false);
          // [FIX] Auto-Refresh browser for total data consistency
          window.location.reload();
        }} 
        type={paymentType}
      />
    </div>
  );
};

export default UserPage;
