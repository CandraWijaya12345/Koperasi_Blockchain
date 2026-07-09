import React from 'react';

// [FIX] Move styles object OUTSIDE component functional scope.
// This guarantees static compilation and prevents "Expected static flag was missing" dev warnings.
const styles = {
    container: {
        padding: '24px 0',
        maxWidth: '1000px',
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
        marginBottom: '8px'
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '32px'
    },
    infoItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '12px 0',
        borderBottom: '1px solid #f8fafc'
    },
    infoLabel: {
        fontSize: '0.75rem',
        fontWeight: '800',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    },
    infoValue: {
        fontSize: '1rem',
        fontWeight: '700',
        color: '#1e293b',
        wordBreak: 'break-all'
    }
};

const ProfileView = ({ anggotaData, account, isPengurus, joiningDate }) => {
    // Logic for role
    let roleLabel = "Anggota";
    let roleColor = "#3b82f6"; // Blue
    let roleBg = "#dbeafe";

    if (isPengurus) {
        roleLabel = "Pengurus / Admin";
        roleColor = "#059669"; // Green
        roleBg = "#d1fae5";
    }

    const getInitial = (name) => {
        if (!name) return "U";
        return name.charAt(0).toUpperCase();
    };

    const [ipfsData, setIpfsData] = React.useState(null);
    const [ipfsLoading, setIpfsLoading] = React.useState(false);

    const getPhotoUrl = (photoHash) => {
        if (!photoHash) return '';
        if (photoHash.startsWith('http')) return photoHash;
        const token = account ? localStorage.getItem(`auth_token_${account.toLowerCase()}`) : null;
        return `http://localhost:5000/api/ipfs/photo/${anggotaData.profileHash}/${account}${token ? `?token=${token}` : ''}`;
    };

    React.useEffect(() => {
        if (anggotaData?.profileHash && !ipfsData) {
            const fetchIpfsData = async () => {
                setIpfsLoading(true);
                try {
                    const userAddress = (account || '').toLowerCase();
                    const token = account ? localStorage.getItem(`auth_token_${account.toLowerCase()}`) : null;
                    const headers = {};
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }
                    const res = await fetch(`http://localhost:5000/api/ipfs/metadata/${anggotaData.profileHash}/${userAddress}`, { headers });
                    if (res.ok) {
                        const data = await res.json();
                        setIpfsData(data);
                        setIpfsLoading(false);
                        return;
                    }
                    
                    // Fallback
                    setIpfsData({
                        photoHash: `ktp_${userAddress}`
                    });
                } catch (e) {
                    console.error("Gagal ambil data IPFS Profil:", e);
                    const userAddress = (account || '').toLowerCase();
                    setIpfsData({
                        photoHash: `ktp_${userAddress}`
                    });
                }
                setIpfsLoading(false);
            };
            fetchIpfsData();
        }
    }, [anggotaData?.profileHash]);

    if (!anggotaData) return null;

    return (
        <div style={styles.container}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#1e3a8a', marginBottom: '8px' }}>
                Profil Saya
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Data identitas Anda yang terverifikasi secara permanen di Blockchain.</p>
            
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.avatar}>
                        {getInitial(ipfsData?.nama || anggotaData.nama)}
                    </div>
                    <div style={styles.nameInfo}>
                        {/* Dynamic values applied cleanly in JSX style wrapper */}
                        <div style={{ ...styles.roleBadge, color: roleColor, backgroundColor: roleBg }}>
                            {roleLabel}
                        </div>
                        <div style={styles.name}>{ipfsData?.nama || anggotaData.nama || 'Tanpa Nama'}</div>
                        <div style={{
                            width: 'fit-content',
                            padding: '6px 14px',
                            borderRadius: '99px',
                            fontSize: '0.825rem',
                            fontWeight: '800',
                            backgroundColor: anggotaData.status === 1 ? '#dcfce7' : (anggotaData.status === 3 ? '#fef3c7' : '#f1f5f9'),
                            color: anggotaData.status === 1 ? '#166534' : (anggotaData.status === 3 ? '#92400e' : '#64748b'),
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: `1px solid ${anggotaData.status === 1 ? '#bbf7d0' : (anggotaData.status === 3 ? '#fde68a' : '#e2e8f0')}`
                        }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: anggotaData.status === 1 ? '#22c55e' : (anggotaData.status === 3 ? '#f59e0b' : '#cbd5e1')
                            }}></div>
                            {anggotaData.status === 1 ? 'KEANGGOTAAN AKTIF' : 
                             anggotaData.status === 3 ? 'KEANGGOTAAN DITANGGUHKAN' : 
                             anggotaData.status === 0 ? 'CALON ANGGOTA' : 'NON-AKTIF'}
                        </div>
                    </div>
                </div>

                {ipfsLoading && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                        Memuat data terenkripsi dari IPFS...
                    </div>
                )}

                <div style={styles.infoGrid}>
                    {/* Kolom 1 */}
                    <div>
                        <div style={styles.infoItem}>
                            <div style={styles.infoLabel}>Nama Lengkap</div>
                            <div style={styles.infoValue}>{ipfsData?.nama || anggotaData.nama || '-'}</div>
                        </div>
                        <div style={styles.infoItem}>
                            <div style={styles.infoLabel}>Nomor KTP</div>
                            <div style={styles.infoValue}>{ipfsData?.noKTP || anggotaData.noKTP || '-'}</div>
                        </div>
                        <div style={styles.infoItem}>
                            <div style={styles.infoLabel}>Jenis Kelamin</div>
                            <div style={styles.infoValue}>{ipfsData?.gender || anggotaData.gender || '-'}</div>
                        </div>
                        <div style={styles.infoItem}>
                            <div style={styles.infoLabel}>Tanggal Bergabung</div>
                            <div style={styles.infoValue}>
                                {joiningDate ? new Date(joiningDate * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                            </div>
                        </div>
                    </div>

                    {/* Kolom 2 */}
                    <div>
                        <div style={styles.infoItem}>
                            <div style={styles.infoLabel}>Nomor Handphone</div>
                            <div style={styles.infoValue}>{ipfsData?.noHP || anggotaData.noHP || '-'}</div>
                        </div>
                        <div style={styles.infoItem}>
                            <div style={styles.infoLabel}>Pekerjaan</div>
                            <div style={styles.infoValue}>{ipfsData?.job || anggotaData.job || '-'}</div>
                        </div>
                        <div style={styles.infoItem}>
                            <div style={styles.infoLabel}>Kontak Darurat</div>
                            <div style={styles.infoValue}>{ipfsData?.emergency || anggotaData.emergency || '-'}</div>
                        </div>
                    </div>

                    {/* Kolom 3 (Foto KTP) */}
                    <div>
                        <div style={styles.infoLabel}>Foto KTP (IPFS)</div>
                        {ipfsData?.photoHash ? (
                            <div 
                                style={{ marginTop: '12px', cursor: 'pointer', position: 'relative' }}
                                onClick={() => window.open(getPhotoUrl(ipfsData.photoHash), '_blank')}
                            >
                                <img 
                                    src={getPhotoUrl(ipfsData.photoHash)} 
                                    alt="KTP" 
                                    style={{ width: '100%', maxWidth: '200px', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                                />
                                <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '4px', fontWeight: '600' }}>Klik untuk memperbesar</div>
                            </div>
                        ) : (
                            <div style={{ marginTop: '12px', width: '100%', maxWidth: '200px', height: '120px', backgroundColor: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>
                                Foto tidak tersedia
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ ...styles.infoItem, marginTop: '20px', borderBottom: 'none' }}>
                    <div style={styles.infoLabel}>Alamat Rumah</div>
                    <div style={{ ...styles.infoValue, fontSize: '0.95rem' }}>{ipfsData?.alamat || anggotaData.alamat || '-'}</div>
                </div>

                <div style={{ ...styles.infoItem, borderBottom: 'none' }}>
                    <div style={styles.infoLabel}>Alamat Wallet</div>
                    <div style={{ ...styles.infoValue, fontFamily: 'monospace', fontSize: '0.875rem', color: '#64748b' }}>
                        {account}
                    </div>
                </div>

                <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.875rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        <span>Jika ingin mengubah data profil, harap hubungi pengurus koperasi.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;
