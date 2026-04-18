import React from 'react';

const ProfileView = ({ anggotaData, account, isPengurus }) => {
    if (!anggotaData) return null;

    // Logic for role
    let roleLabel = "Anggota";
    let roleColor = "#3b82f6"; // Blue
    let roleBg = "#dbeafe";

    if (isPengurus) {
        roleLabel = "Pengurus / Admin";
        roleColor = "#059669"; // Green
        roleBg = "#d1fae5";
    }

    const styles = {
        container: {
            padding: '24px 0',
            maxWidth: '800px',
            margin: '0 auto'
        },
        card: {
            background: 'white',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f1f5f9',
            marginTop: '20px'
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '40px',
            paddingBottom: '24px',
            borderBottom: '1px solid #f1f5f9'
        },
        avatar: {
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '2.5rem',
            fontWeight: '700',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
        },
        nameInfo: {
            flex: 1
        },
        name: {
            fontSize: '1.75rem',
            fontWeight: '800',
            color: '#1e293b',
            marginBottom: '4px'
        },
        roleBadge: {
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '99px',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: roleColor,
            backgroundColor: roleBg,
            marginBottom: '8px'
        },
        infoGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px'
        },
        infoItem: {
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
        },
        infoLabel: {
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.025em'
        },
        infoValue: {
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#1e293b',
            wordBreak: 'break-all'
        },
        statusBadge: {
            width: 'fit-content',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: '700',
            backgroundColor: '#dcfce7',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        },
        dot: {
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#22c55e'
        }
    };

    const getInitial = (name) => {
        if (!name) return "U";
        return name.charAt(0).toUpperCase();
    };

    return (
        <div style={styles.container}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#1e3a8a', marginBottom: '8px' }}>
                Profil Saya
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Manajemen informasi akun Anda yang terdaftar pada sistem Koperasi Blockchain.</p>
            
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.avatar}>
                        {getInitial(anggotaData.nama)}
                    </div>
                    <div style={styles.nameInfo}>
                        <div style={styles.roleBadge}>{roleLabel}</div>
                        <div style={styles.name}>{anggotaData.nama || 'Tanpa Nama'}</div>
                        <div style={styles.statusBadge}>
                            <div style={styles.dot}></div>
                            KEANGGOTAAN AKTIF
                        </div>
                    </div>
                </div>

                <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                        <div style={styles.infoLabel}>Nama Lengkap</div>
                        <div style={styles.infoValue}>{anggotaData.nama}</div>
                    </div>
                    
                    <div style={styles.infoItem}>
                        <div style={styles.infoLabel}>Alamat Wallet</div>
                        <div style={{ ...styles.infoValue, fontFamily: 'monospace', fontSize: '1rem' }}>
                            {account}
                        </div>
                    </div>

                    <div style={styles.infoItem}>
                        <div style={styles.infoLabel}>Akses Sistem</div>
                        <div style={{ ...styles.infoValue, color: isPengurus ? '#059669' : '#1e293b' }}>
                            {isPengurus ? 'Hak Akses Pengurus' : 'Hak Akses Anggota'}
                        </div>
                    </div>

                    <div style={styles.infoItem}>
                        <div style={styles.infoLabel}>Posisi</div>
                        <div style={{ ...styles.infoValue }}>
                            {isPengurus ? 'Staf Koperasi' : 'Anggota Aktif'}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.875rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        <span>Data ini ditarik secara langsung dari Smart Contract di jaringan blockchain Polygon.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;
