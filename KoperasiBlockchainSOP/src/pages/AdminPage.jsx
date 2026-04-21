import React from 'react';
import { layoutStyles as layout } from '../styles/layout';
import { useWallet } from '../hooks/useWallet';
import { useKoperasi } from '../hooks/useKoperasi';

import AdminPanel from '../components/Admin/AdminPanel';
import MemberList from '../components/Admin/MemberList';
import LoanManagement from '../components/Admin/LoanManagement';
import AdminSettings from '../components/Admin/AdminSettings';
import SHUPanel from '../components/Admin/SHUPanel';
import FundManagement from '../components/Admin/FundManagement';
import AdminHistory from '../components/Admin/AdminHistory';
import GovernancePanel from '../components/Admin/GovernancePanel';
import { useState, useEffect } from 'react';

// --- ICONS (Simple, Clean SVGs) ---
const DashboardIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
);
const UserIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const WalletIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path></svg>
);
const LoanIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);
const MoneyIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);
const ChartIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
);
const SettingsIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
);
const HistoryIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"></path><circle cx="12" cy="12" r="9"></circle></svg>
);

const AdminPage = () => {
  const { account, isConnecting, connectWallet, disconnectWallet, error: walletError } = useWallet();

  const {
    message,
    isLoading,
    isPengurus,
    pendingLoans,
    approvedTodayCount,
    allLoans,
    adminConfig,
    setujuiPinjaman,
    memberList,
    mintToken,
    tolakPinjaman,
    updateGlobalSettings,
    tambahLikuiditas,
    adminStats,
    shuHistory,
    allSimpananLogs,
    allGlobalLogs,
    fetchAllGlobalLogs,
    emergencyWithdraw,
    syncLiquidity,
    approveSurvey,
    approveCommittee,
    generateMonthlyBills,
    releaseProfitSharing,
    closeMembership
  } = useKoperasi(account);

  const [activeTab, setActiveTab] = useState('dashboard');
  const globalMessage = walletError || message;

  // Auto-fetch logs when entering Riwayat tab
  useEffect(() => {
    if (activeTab === 'riwayat' && account) {
      fetchAllGlobalLogs();
    }
  }, [activeTab, account, fetchAllGlobalLogs]);

  // ===============================
  // PROTEKSI AKSES ADMIN
  // ===============================
  if (!account) {
    return (
      <div style={{ ...layout.pageWrapper, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#3b82f6' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <h2 style={{ marginBottom: 12, color: '#0f172a' }}>Admin Access Required</h2>
          <p style={{ marginBottom: 24, color: '#64748b' }}>
            Hubungkan wallet dengan akun pengurus untuk mengakses panel ini.
          </p>
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
              fontSize: '0.9rem'
            }}
          >
            {isConnecting ? 'Verifying...' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    );
  }

  if (account && !isPengurus) {
    return (
      <div style={{ ...layout.pageWrapper, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ef4444' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          </div>
          <h2 style={{ marginBottom: 12, color: '#0f172a' }}>Akses Ditolak</h2>
          <p style={{ marginBottom: 8, color: '#64748b' }}>
            Akun <span style={{ fontFamily: 'monospace' }}>{account}</span> tidak memiliki akses admin.
          </p>
          <p style={{ marginBottom: 24, color: '#64748b' }}>
            Silakan hubungkan akun pengurus atau disconnect dan gunakan akun lain.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => { disconnectWallet(); }}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fff',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              Disconnect
            </button>
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              {isConnecting ? 'Verifying...' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={layout.pageWrapper}>
      <div style={styles.shell}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', background: '#3b82f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>JD</div>
              <span style={styles.brandLogo}>JDCOOP <span style={{ color: '#94a3b8' }}>Admin</span></span>
            </div>
          </div>

          <nav style={styles.menu}>
            <SidebarItem icon={<DashboardIcon active={activeTab === 'dashboard'} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <div style={styles.menuLabel}>Management</div>
            <SidebarItem icon={<UserIcon active={activeTab === 'anggota'} />} label="Anggota" active={activeTab === 'anggota'} onClick={() => setActiveTab('anggota')} />
            <SidebarItem icon={<LoanIcon active={activeTab === 'pinjaman'} />} label="Pinjaman" active={activeTab === 'pinjaman'} onClick={() => setActiveTab('pinjaman')} />
            <div style={styles.menuLabel}>Finance & Gov</div>
            <SidebarItem icon={<MoneyIcon active={activeTab === 'governance'} />} label="Governance" active={activeTab === 'governance'} onClick={() => setActiveTab('governance')} />
            <SidebarItem icon={<WalletIcon active={activeTab === 'likuiditas'} />} label="Likuiditas" active={activeTab === 'likuiditas'} onClick={() => setActiveTab('likuiditas')} />
            <SidebarItem icon={<HistoryIcon active={activeTab === 'riwayat'} />} label="Riwayat" active={activeTab === 'riwayat'} onClick={() => setActiveTab('riwayat')} />
            <div style={{ flex: 1 }}></div>
            <SidebarItem icon={<SettingsIcon active={activeTab === 'pengaturan'} />} label="Settings" active={activeTab === 'pengaturan'} onClick={() => setActiveTab('pengaturan')} />
          </nav>
        </aside>

        <div style={styles.main}>
          <header style={styles.topbar}></header>

          {globalMessage && (
            <div style={styles.messageBanner}>
              <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
              <span style={{ fontSize: '0.9rem' }}>{globalMessage}</span>
            </div>
          )}

          {adminStats.adminPolBalance && Number(adminStats.adminPolBalance) < 0.1 && (
            <div style={{ ...styles.messageBanner, background: '#fff7ed', color: '#c2410c', borderColor: '#fdba74', marginBottom: '10px' }}>
              <span>⚠️ Saldo POL Rendah: {adminStats.adminPolBalance} POL</span>
            </div>
          )}

          <main style={styles.content}>
            {activeTab === 'dashboard' && (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <h1 style={styles.welcomeTitle}>Dashboard Overview</h1>
                </div>
                <section style={styles.statsRow}>
                  <StatCard label="Pending Loans" value={allLoans.pending ? allLoans.pending.length : 0} trend="Requires Action" urgent />
                  <StatCard label="Active Loans" value={allLoans.active ? allLoans.active.length : 0} trend="Performing" />
                  <StatCard label="Total Members" value={memberList.length} trend="Active users" />
                  <StatCard label="Interest (Simpanan)" value={`${adminConfig.bunga}%`} trend="Annual" />
                </section>
                <div style={styles.mainGrid}>
                  <div style={styles.bigCard}>
                    <h2 style={{ ...styles.cardTitle, marginBottom: '20px' }}>Recent Members</h2>
                    <MemberList members={memberList.slice(0, 5)} onMint={mintToken} isLoading={isLoading} simpananLogs={allSimpananLogs} compact={true} onCloseMembership={closeMembership} />
                  </div>
                  <div style={styles.sideCard}>
                    <AdminPanel 
                      pendingLoans={allLoans.pending ? allLoans.pending.slice(0, 3) : []} 
                      onApprove={setujuiPinjaman} 
                      onReject={tolakPinjaman} 
                      onApproveSurvey={approveSurvey}
                      onApproveCommittee={approveCommittee}
                      isLoading={isLoading} 
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'anggota' && (
              <div style={styles.pageCard}>
                <h2 style={styles.pageTitle}>Member Management</h2>
                <MemberList members={memberList} isLoading={isLoading} simpananLogs={allSimpananLogs} onMint={mintToken} onCloseMembership={closeMembership} />
              </div>
            )}

            {activeTab === 'pinjaman' && (
              <div style={styles.pageCard}>
                <LoanManagement 
                  allLoans={allLoans} 
                  onApprove={setujuiPinjaman} 
                  onReject={tolakPinjaman} 
                  onApproveSurvey={approveSurvey} 
                  onApproveCommittee={approveCommittee} 
                  isLoading={isLoading} 
                />
              </div>
            )}

            {activeTab === 'governance' && (
              <div style={styles.pageCard}>
                <GovernancePanel 
                  stats={adminStats} 
                  onSync={syncLiquidity} 
                  onGenerateBills={generateMonthlyBills} 
                  onReleaseSharing={releaseProfitSharing} 
                  isLoading={isLoading} 
                />
              </div>
            )}

            {activeTab === 'likuiditas' && (
              <div style={styles.pageCard}>
                <h2 style={styles.pageTitle}>Financial & Liquidity</h2>
                <FundManagement stats={adminStats} onWithdraw={emergencyWithdraw} onAddLiquidity={tambahLikuiditas} onSync={syncLiquidity} isLoading={isLoading} />
              </div>
            )}

            {activeTab === 'riwayat' && (
              <div style={styles.pageCard}>
                <h2 style={styles.pageTitle}>Global Transaction History</h2>
                <AdminHistory logs={allGlobalLogs} onRefresh={fetchAllGlobalLogs} isLoading={isLoading} />
              </div>
            )}

            {activeTab === 'pengaturan' && (
              <div style={styles.pageCard}>
                <AdminSettings config={adminConfig} onUpdate={updateGlobalSettings} isLoading={isLoading} />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

/* ====== COMPONENTS ====== */

const SidebarItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} style={{ ...styles.menuItem, ...(active ? styles.menuItemActive : {}) }}>
    <span style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
    <span style={{ fontSize: '0.9rem', fontWeight: active ? '600' : '500' }}>{label}</span>
  </div>
);

const StatCard = ({ label, value, trend, urgent }) => (
  <div style={styles.statCard}>
    <div style={styles.statLabel}>{label}</div>
    <div style={{ ...styles.statValue, color: urgent && value > 0 ? '#ef4444' : '#0f172a' }}>{value}</div>
    <div style={styles.statTrend}>
      {urgent && value > 0 ? <span style={{ color: '#ef4444' }}>● High Priority</span> : <span style={{ color: '#94a3b8' }}>{trend}</span>}
    </div>
  </div>
);

/* ====== STYLES ====== */
const styles = {
  shell: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#f1f5f9', // Slate-100
    fontFamily: "'Inter', sans-serif"
  },
  sidebar: {
    width: 260,
    backgroundColor: '#fff',
    borderRight: '1px solid #e2e8f0',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh'
  },
  sidebarHeader: {
    marginBottom: 32,
    paddingLeft: 12
  },
  brandLogo: {
    fontSize: 20,
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.025em'
  },
  menu: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1
  },
  menuLabel: {
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    color: '#94a3b8',
    fontWeight: 700,
    letterSpacing: '0.05em',
    marginTop: 16,
    marginBottom: 8,
    paddingLeft: 12
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 8,
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  menuItemActive: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
  },
  main: { flex: 1, padding: '24px 40px', overflowY: 'auto' },
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    width: '300px',
    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    width: '100%',
    fontSize: '0.9rem',
    color: '#0f172a'
  },
  profileBox: { display: 'flex', alignItems: 'center', cursor: 'pointer' },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem'
  },
  messageBanner: {
    padding: '12px 16px',
    backgroundColor: '#eff6ff',
    border: '1px solid #dbeafe',
    borderRadius: 8,
    marginBottom: 24,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: '#1e40af'
  },
  content: { flex: 1 },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: '-0.025em'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
    gap: 20,
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
  },
  statLabel: { fontSize: '0.85rem', color: '#64748b', fontWeight: 500, marginBottom: 8 },
  statValue: { fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: 4, lineHeight: 1 },
  statTrend: { fontSize: '0.75rem', fontWeight: 500 },

  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: 24,
  },
  bigCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
  },
  sideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
    height: 'fit-content'
  },
  cardTitle: { fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: 0 },
  pageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: '32px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
  },
  pageTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 24
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontWeight: 500
  }
};

export default AdminPage;
