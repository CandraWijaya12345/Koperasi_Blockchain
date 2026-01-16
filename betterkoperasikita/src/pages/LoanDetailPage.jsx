import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useKoperasi } from '../hooks/useKoperasi';
import { formatToken } from '../utils/format';
import { layoutStyles as layout } from '../styles/layout';
import Navbar from '../components/Navbar';

// Simple Icons as SVG components
const CalculatorIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 21H17C19.2091 21 21 19.2091 21 17V7C21 4.79086 19.2091 3 17 3H7C4.79086 3 3 4.79086 3 7V17C3 19.2091 4.79086 21 7 21Z" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 7H9V13H15V7Z" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 17H15" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const WalletIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.5 20.5H5.5C4.39543 20.5 3.5 19.6046 3.5 18.5V5.5C3.5 4.39543 4.39543 3.5 5.5 3.5H18.5C19.6046 3.5 20.5 4.39543 20.5 5.5V18.5C20.5 19.6046 19.6046 20.5 18.5 20.5Z" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 12H20.5" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.5 7.5H11.5" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const CalendarIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 2V6" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 2V6" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 10H21" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ClockIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 6V12L16 14" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const BackIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 12H5" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 19L5 12L12 5" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const LoanDetailPage = () => {
    const navigate = useNavigate();
    const { account, connectWallet, disconnectWallet, isConnecting } = useWallet();
    const { pinjamanAktif, isLoading } = useKoperasi(account);

    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        return new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    const styles = {
        card: {
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            maxWidth: '700px',
            margin: '2rem auto',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
        },
        header: {
            padding: '1.5rem 2rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        headerTitle: {
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#0f172a'
        },
        headerSubtitle: {
            fontSize: '0.875rem',
            color: '#64748b',
            marginTop: '0.25rem'
        },
        badge: (isPaid) => ({
            background: isPaid ? '#dcfce7' : '#fff7ed',
            color: isPaid ? '#166534' : '#c2410c',
            border: `1px solid ${isPaid ? '#bbf7d0' : '#ffedd5'}`,
            padding: '0.25rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.025em',
            textTransform: 'uppercase'
        }),
        body: {
            padding: '2rem'
        },
        progressSection: {
            marginBottom: '2.5rem'
        },
        progressHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '0.75rem'
        },
        progressTitle: {
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#334155'
        },
        progressValue: {
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#2563eb'
        },
        track: {
            height: '8px',
            background: '#f1f5f9',
            borderRadius: '4px',
            overflow: 'hidden'
        },
        indicator: (percent) => ({
            height: '100%',
            width: `${Math.min(percent, 100)}%`,
            background: '#2563eb',
            borderRadius: '4px'
        }),
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '2rem',
            marginTop: '1rem'
        },
        statItem: {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
        },
        statLabelContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#64748b',
            fontSize: '0.875rem',
            fontWeight: 500
        },
        statValue: {
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#0f172a',
            fontFeatureSettings: '"tnum" on, "lnum" on'
        },
        statValueSub: {
            fontSize: '0.875rem',
            fontWeight: 400,
            color: '#94a3b8',
            marginLeft: '4px'
        },
        footer: {
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            padding: '1.5rem 2rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px'
        },
        footerItem: {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
        },
        footerLabel: {
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        },
        footerValue: {
            fontSize: '1rem',
            fontWeight: 600,
            color: '#334155'
        },
        backButton: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#64748b',
            background: 'none',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '0.5rem 0',
            marginBottom: '1rem',
            transition: 'color 0.2s'
        }
    };

    const content = () => {
        if (!account) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Silakan hubungkan dompet Anda.</div>;
        if (isLoading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Memuat data pinjaman...</div>;

        if (!pinjamanAktif) return (
            <div style={styles.card}>
                <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <div style={{ background: '#f1f5f9', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <WalletIcon />
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a', fontSize: '1.25rem' }}>Tidak Ada Pinjaman Aktif</h3>
                    <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.875rem', lineHeight: '1.5' }}>
                        Anda sedang bebas dari tanggungan pinjaman saat ini.
                    </p>
                    <button onClick={() => navigate('/user')} style={{
                        background: '#0f172a', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem'
                    }}>
                        Kembali ke Dashboard
                    </button>
                </div>
            </div>
        );

        const total = BigInt(pinjamanAktif.jumlahHarusDikembalikan || 0);
        const paid = BigInt(pinjamanAktif.sudahDibayar || 0);
        const debt = total - paid;

        let percent = 0;
        if (total > 0n) {
            percent = Number(paid * 100n / total);
        }

        return (
            <>
                <button onClick={() => navigate('/user')} style={styles.backButton}>
                    <BackIcon /> Kembali
                </button>

                <div style={styles.card}>
                    {/* Header */}
                    <div style={styles.header}>
                        <div>
                            <h2 style={styles.headerTitle}>Detail Pinjaman</h2>
                            <div style={styles.headerSubtitle}>Ref: #{pinjamanAktif.id?.toString()}</div>
                        </div>
                        <div style={styles.badge(pinjamanAktif.lunas)}>
                            {pinjamanAktif.lunas ? 'Lunas' : 'Aktif'}
                        </div>
                    </div>

                    {/* Body */}
                    <div style={styles.body}>
                        {/* Progress */}
                        <div style={styles.progressSection}>
                            <div style={styles.progressHeader}>
                                <span style={styles.progressTitle}>Progress Pembayaran</span>
                                <span style={styles.progressValue}>{percent.toFixed(1)}%</span>
                            </div>
                            <div style={styles.track}>
                                <div style={styles.indicator(percent)}></div>
                            </div>
                        </div>

                        {/* Principal Stats */}
                        <div style={styles.grid}>
                            <div style={styles.statItem}>
                                <div style={styles.statLabelContainer}>
                                    <WalletIcon />
                                    <span>Total Tagihan</span>
                                </div>
                                <div style={styles.statValue}>
                                    {formatToken(pinjamanAktif.jumlahHarusDikembalikan)}
                                    <span style={styles.statValueSub}>IDRT</span>
                                </div>
                            </div>

                            <div style={{ ...styles.statItem, borderLeft: '1px solid #f1f5f9', paddingLeft: '2rem' }}>
                                <div style={styles.statLabelContainer}>
                                    <CalculatorIcon />
                                    <span>Sisa Kewajiban</span>
                                </div>
                                <div style={{ ...styles.statValue, color: pinjamanAktif.lunas ? '#16a34a' : '#ef4444' }}>
                                    {formatToken(debt)}
                                    <span style={styles.statValueSub}>IDRT</span>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Stats Row */}
                        <div style={{ ...styles.grid, marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #f1f5f9' }}>
                            <div style={styles.statItem}>
                                <div style={styles.statLabelContainer}>
                                    <span>Pokok Pinjaman</span>
                                </div>
                                <div style={{ ...styles.statValue, fontSize: '1.1rem' }}>
                                    {formatToken(pinjamanAktif.jumlahPinjaman)}
                                </div>
                            </div>
                            <div style={{ ...styles.statItem, paddingLeft: '2rem' }}>
                                <div style={styles.statLabelContainer}>
                                    <span>Sudah Dibayar</span>
                                </div>
                                <div style={{ ...styles.statValue, fontSize: '1.1rem', color: '#16a34a' }}>
                                    {formatToken(pinjamanAktif.sudahDibayar)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={styles.footer}>
                        <div style={styles.footerItem}>
                            <div style={styles.footerLabel}><ClockIcon /> Tenor</div>
                            <div style={styles.footerValue}>
                                {pinjamanAktif.tenorBulan ? pinjamanAktif.tenorBulan.toString() : '12'} Bulan
                            </div>
                        </div>
                        <div style={{ ...styles.footerItem, alignItems: 'flex-end' }}>
                            <div style={styles.footerLabel}><CalendarIcon /> Jatuh Tempo</div>
                            <div style={styles.footerValue}>
                                {formatDate(pinjamanAktif.waktuJatuhTempo)}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    return (
        <div style={layout.pageWrapper}>
            <Navbar
                account={account}
                onConnect={connectWallet}
                onDisconnect={disconnectWallet}
                isLoading={isConnecting || isLoading}
            />
            <main style={layout.container}>
                {content()}
            </main>
            <footer style={layout.footer}>
                <p style={{ color: '#94a3b8' }}>© 2024 Koperasi Simpan Pinjam</p>
            </footer>
        </div>
    );
};

export default LoanDetailPage;
