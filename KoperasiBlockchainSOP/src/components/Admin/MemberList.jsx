import React, { useState } from 'react';
import { formatrupiah, formatCurrency } from '../../utils/format';
import { KOPERASI_CONTRACT_ADDRESS } from '../../utils/constants';
import HistoryList from '../HistoryList';

// --- STYLES (Moved to top to avoid Temporal Dead Zone errors) ---
const styles = {
  container: { backgroundColor: '#fff' },
  filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' },
  searchWrapper: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 16px', flex: 1, maxWidth: '400px', transition: 'all 0.2s' },
  searchInput: { border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '0.875rem', width: '100%', color: '#1e293b' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0 },
  headerRow: { backgroundColor: '#f8fafc', textAlign: 'left' },
  th: { padding: '14px 20px', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' },
  row: { transition: 'background-color 0.2s', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '16px 20px', verticalAlign: 'middle' },
  idBadge: { fontSize: '0.75rem', fontWeight: '700', color: '#64748b', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' },
  avatar: { width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.875rem', border: '1px solid #dbeafe' },
  memberName: { fontSize: '0.925rem', fontWeight: '700', color: '#1e293b' },
  memberStatus: { fontSize: '0.75rem', color: '#94a3b8' },
  addressWrapper: { display: 'flex', alignItems: 'center', gap: '8px' },
  addressText: { fontSize: '0.85rem', color: '#64748b', fontFamily: 'monospace', backgroundColor: '#f8fafc', padding: '2px 6px', borderRadius: '4px' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '700' },
  amountText: { fontSize: '0.925rem', fontWeight: '700', color: '#1e3a8a' },
  iconButton: { background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#94a3b8', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
  actionButton: { backgroundColor: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px 16px', borderRadius: '8px', fontSize: '0.825rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }
};

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  content: { backgroundColor: '#fff', borderRadius: '20px', width: '90%', maxWidth: '640px', maxHeight: '85vh', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px', transition: 'all 0.2s' },
  body: { padding: '24px', overflowY: 'auto' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
  statCard: { padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc' },
  statLabel: { fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '4px' },
  statValue: { fontSize: '1rem', fontWeight: '800', color: '#1e293b' },
  logContainer: { border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' },
  logTh: { padding: '10px 16px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' },
  logTd: { padding: '12px 16px', fontSize: '0.85rem', color: '#64748b' }
};

// --- ICONS ---
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
);

// --- MODAL COMPONENT ---
const MemberDetailModal = ({ member, onClose, allLogs, onCloseMembership }) => {
  if (!member) return null;

  const [localMsg, setLocalMsg] = React.useState('');
  const [localLoading, setLocalLoading] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const [ipfsData, setIpfsData] = React.useState(null);
  const [ipfsLoading, setIpfsLoading] = React.useState(false);

  const getAuthToken = () => {
    const activeAddr = window.ethereum?.selectedAddress;
    if (activeAddr) {
      return localStorage.getItem(`auth_token_${activeAddr.toLowerCase()}`);
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('auth_token_')) {
        return localStorage.getItem(key);
      }
    }
    return null;
  };

  const getPhotoUrl = (photoHash) => {
    if (!photoHash) return '';
    if (photoHash.startsWith('http')) return photoHash;
    const token = getAuthToken();
    return `${window.API_BASE}/api/ipfs/photo/${member.profileHash}/${member.address}${token ? `?token=${token}` : ''}`;
  };

  React.useEffect(() => {
    if (member.profileHash && !ipfsData) {
      const fetchIpfsData = async () => {
        setIpfsLoading(true);
        try {
          const userAddress = String(member.address).toLowerCase();
          const token = getAuthToken();
          const headers = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          const res = await fetch(`${window.API_BASE}/api/ipfs/metadata/${member.profileHash}/${userAddress}`, { headers });
          if (res.status === 401) {
            const activeAddr = window.ethereum?.selectedAddress;
            if (activeAddr) {
              localStorage.removeItem(`auth_token_${activeAddr.toLowerCase()}`);
              window.dispatchEvent(new CustomEvent('auth-unauthorized', { detail: { address: activeAddr } }));
            }
          }
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
          console.error("Gagal ambil data IPFS:", e);
          const userAddress = String(member.address).toLowerCase();
          setIpfsData({
            photoHash: `ktp_${userAddress}`
          });
        }
        setIpfsLoading(false);
      };
      fetchIpfsData();
    }
  }, [member.profileHash]);

  // [FIX] Filter logs khusus member ini
  const userLogs = (allLogs || []).filter(log => {
      if (!log || !log.args) return false;
      const term = String(member.address).toLowerCase();
      const addressString = String(log.args?.user || log.args?.peminjam || log.args?.[0] || '').toLowerCase();
      return addressString === term;
  });

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.content}>
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ ...styles.avatar, width: '48px', height: '48px', fontSize: '1.25rem', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none' }}>
              {(member.nama || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                {member.nama || 'Tanpa Nama'}
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{member.address.substring(0, 16)}...</span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span>ID Anggota #{member.id}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}>×</button>
        </div>

        <div style={modalStyles.body}>
          <div style={modalStyles.statsGrid}>
            <div style={modalStyles.statCard}>
              <div style={modalStyles.statLabel}>Simpanan Pokok</div>
              <div style={modalStyles.statValue}>{formatCurrency(formatrupiah(member.sPokok))}</div>
            </div>
            <div style={modalStyles.statCard}>
              <div style={modalStyles.statLabel}>Simpanan Wajib</div>
              <div style={modalStyles.statValue}>{formatCurrency(formatrupiah(member.sWajib))}</div>
            </div>
            <div style={modalStyles.statCard}>
              <div style={modalStyles.statLabel}>Simpanan Sukarela</div>
              <div style={modalStyles.statValue}>{formatCurrency(formatrupiah(member.simpananSukarela || 0n))}</div>
            </div>
            <div style={{ ...modalStyles.statCard, border: (member.tagihanWajib || 0n) > 0n ? '1px solid #fee2e2' : '1px solid #f1f5f9', backgroundColor: (member.tagihanWajib || 0n) > 0n ? '#fef2f2' : '#f8fafc' }}>
              <div style={{ ...modalStyles.statLabel, color: (member.tagihanWajib || 0n) > 0n ? '#991b1b' : '#64748b' }}>Tagihan Wajib (Unpaid)</div>
              <div style={{ ...modalStyles.statValue, color: (member.tagihanWajib || 0n) > 0n ? '#dc2626' : '#1e293b' }}>{formatCurrency(formatrupiah(member.tagihanWajib || 0n))}</div>
            </div>
          </div>

          {/* [BARU] Informasi Identitas dari IPFS atau On-Chain */}
          <div style={{ marginTop: '24px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e40af', margin: 0, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Identitas Terverifikasi
              </h4>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '99px',
                fontSize: '0.725rem',
                fontWeight: '700',
                backgroundColor: member.isIPFSStorage ? '#eff6ff' : '#ecfdf5',
                color: member.isIPFSStorage ? '#2563eb' : '#059669',
                border: member.isIPFSStorage ? '1px solid #dbeafe' : '1px solid #a7f3d0',
                textTransform: 'none'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: member.isIPFSStorage ? '#2563eb' : '#059669',
                  display: 'inline-block'
                }} />
                {member.isIPFSStorage ? 'Penyimpanan: IPFS' : 'Penyimpanan: On-Chain (Blockchain)'}
              </span>
            </div>
            
            {ipfsLoading ? (
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Memuat data dari IPFS...</p>
            ) : (ipfsData || member.noHP || member.noKTP || member.alamat) ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={modalStyles.statLabel}>Nomor KTP (NIK)</div>
                    <div style={{ ...modalStyles.statValue, fontSize: '0.9rem' }}>{ipfsData?.noKTP || member.noKTP || '-'}</div>
                  </div>
                  <div>
                    <div style={modalStyles.statLabel}>WhatsApp / HP</div>
                    <div style={{ ...modalStyles.statValue, fontSize: '0.9rem' }}>{ipfsData?.noHP || member.noHP || '-'}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={modalStyles.statLabel}>Alamat Lengkap</div>
                    <div style={{ ...modalStyles.statValue, fontSize: '0.85rem', fontWeight: '500', lineHeight: '1.4' }}>{ipfsData?.alamat || member.alamat || '-'}</div>
                  </div>
                  <div>
                    <div style={modalStyles.statLabel}>Jenis Kelamin</div>
                    <div style={{ ...modalStyles.statValue, fontSize: '0.9rem' }}>{ipfsData?.gender || member.gender || '-'}</div>
                  </div>
                  <div>
                    <div style={modalStyles.statLabel}>Pekerjaan</div>
                    <div style={{ ...modalStyles.statValue, fontSize: '0.9rem' }}>{ipfsData?.job || member.job || '-'}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={modalStyles.statLabel}>Kontak Darurat (Emergency)</div>
                    <div style={{ ...modalStyles.statValue, fontSize: '0.9rem' }}>{ipfsData?.emergency || member.emergency || '-'}</div>
                  </div>
                </div>
                <div>
                  <div style={modalStyles.statLabel}>Foto KTP</div>
                  {ipfsData?.photoHash ? (
                    <div 
                      style={{ cursor: 'pointer', position: 'relative' }}
                      onClick={() => window.open(getPhotoUrl(ipfsData.photoHash), '_blank')}
                    >
                      <img 
                        src={getPhotoUrl(ipfsData.photoHash)} 
                        alt="KTP" 
                        style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
                      />
                      <div style={{ position: 'absolute', bottom: '4px', right: '4px', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>Klik Perbesar</div>
                    </div>
                  ) : (
                    <div style={{ height: '100px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>Tidak ada foto</div>
                  )}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Data identitas tidak ditemukan.</p>
            )}
          </div>

          <div style={{ marginTop: '28px' }}>
             {/* Use the standard HistoryList component for consistency */}
             <HistoryList 
               history={userLogs} 
               isLoading={false} 
               isAdminView={false} 
             />
          </div>

          {/* ADMIN ACTION: CLOSE MEMBERSHIP */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
            {!showConfirm ? (
              <button 
                onClick={() => setShowConfirm(true)}
                disabled={localLoading}
                style={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #fee2e2', 
                  color: '#dc2626', 
                  padding: '10px 20px', 
                  borderRadius: '10px', 
                  fontSize: '0.85rem', 
                  fontWeight: '700',
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                  <span>System Action:</span> Tutup Keanggotaan (Reset Anggota)
              </button>
            ) : (
                <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fee2e2' }}>
                  <p style={{ fontSize: '0.85rem', color: '#991b1b', margin: '0 0 12px 0', fontWeight: '600' }}>
                    Apakah Anda yakin? Anggota akan dikeluarkan dari sistem dan saldo mereka akan di-reset (Refund blockchain). Ini hanya dilakukan untuk koreksi data atau anggota keluar.
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={async () => {
                        setLocalLoading(true);
                        try {
                          await onCloseMembership(member.address, setLocalMsg);
                          onClose();
                        } catch (e) {
                          setLocalMsg("Gagal: " + e.message);
                        }
                        setLocalLoading(false);
                      }}
                      style={{ flex: 1, backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      {localLoading ? 'Memproses...' : 'Ya, Tutup Sekarang'}
                    </button>
                    <button 
                      onClick={() => setShowConfirm(false)}
                      style={{ flex: 1, backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Batal
                    </button>
                  </div>
                </div>
            )}
            {localMsg && (
              <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
                {localMsg}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const MemberList = ({ members, isLoading, simpananLogs, compact, onCloseMembership }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  const filteredMembers = (members || []).filter(m => {
    // Filter out KOPERASI RESERVE
    if (m.address.toLowerCase() === KOPERASI_CONTRACT_ADDRESS.toLowerCase()) return false;
    
    return (m.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (m.address || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const checkWajibStatus = (addr) => {
    if (!simpananLogs || !Array.isArray(simpananLogs)) return false;
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    // Now more robust: Checks if any 'Wajib' log exists for this user in the current month
    // Regardless of the specific amount (handles dynamic billing)
    return simpananLogs.some(l => {
      if (!l || !l.dari || !addr) return false;
      
      const isMemberMatch = String(l.dari).toLowerCase() === String(addr).toLowerCase();
      const isWajibType = String(l.jenis).includes('Wajib');
      const logDate = new Date(Number(l.timestamp || 0) * 1000);
      const isCurrentMonth = logDate.getMonth() === curMonth && logDate.getFullYear() === curYear;

      return isMemberMatch && isWajibType && isCurrentMonth;
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={styles.container}>
      {!compact && (
        <div style={styles.filterBar}>
          <div style={styles.searchWrapper}>
            <span style={{ color: '#94a3b8' }}><SearchIcon /></span>
            <input 
              type="text" 
              placeholder="Cari anggota berdasarkan nama atau alamat..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
            {filteredMembers.length} Anggota ditemukan
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={{ ...styles.th, width: '60px' }}>ID</th>
              <th style={styles.th}>Anggota</th>
              {!compact && <th style={styles.th}>Wallet</th>}
              <th style={styles.th}>Iuran</th>
              <th style={styles.th}>Status</th>
              {!compact && <th style={styles.th}>Total Simpanan</th>}
              <th style={{ ...styles.th, textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length > 0 ? filteredMembers.map((m, idx) => {
              if (!m || !m.address) return null;
              
              const isPaid = (m.tagihanWajib || 0n) === 0n;
              const sPokok = m.simpananPokok || 0n;
              const sWajib = m.simpananWajib || 0n;
              const totalSimpanan = sPokok + sWajib + (m.simpananSukarela || 0n);

              return (
                <tr key={idx} style={styles.row}>
                  <td style={styles.td}>
                    <span style={styles.idBadge}>{idx + 1}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={styles.avatar}>
                        {(m.nama || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={styles.memberName}>{m.nama || 'Tanpa Nama'}</div>
                        <div style={{
                          ...styles.memberStatus,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>Anggota Koperasi</span>
                          <span style={{ color: '#cbd5e1' }}>•</span>
                          <span style={{
                            fontWeight: '600',
                            color: m.isIPFSStorage ? '#3b82f6' : '#10b981'
                          }}>
                            {m.isIPFSStorage ? 'IPFS' : 'On-Chain'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  {!compact && (
                    <td style={styles.td}>
                      <div style={styles.addressWrapper}>
                        <span style={styles.addressText}>{m.address.substring(0, 6)}...{m.address.substring(38)}</span>
                        <button onClick={() => copyToClipboard(m.address)} style={styles.iconButton}><CopyIcon /></button>
                      </div>
                    </td>
                  )}
                  <td style={styles.td}>
                    <div style={{
                      ...styles.statusBadge,
                      backgroundColor: isPaid ? '#dcfce7' : '#fee2e2',
                      color: isPaid ? '#166534' : '#991b1b',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '2px',
                      padding: '8px 14px'
                    }}>
                      <span style={{ fontSize: '0.75rem' }}>{isPaid ? 'Lunas' : 'Belum Bayar'}</span>
                      {!isPaid && (
                        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                          {formatCurrency(formatrupiah(m.tagihanWajib))}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={styles.td}>
                    {(m.address.toLowerCase() === KOPERASI_CONTRACT_ADDRESS.toLowerCase() || m.nama === 'KOPERASI RESERVE') ? (
                      <div style={{
                        ...styles.statusBadge,
                        backgroundColor: '#f8fafc',
                        color: '#475569',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#94a3b8' }}></div>
                        SISTEM / RESERVE
                      </div>
                    ) : (
                      <div style={{
                        ...styles.statusBadge,
                        backgroundColor: m.status === 1 ? '#dcfce7' : (m.status === 4 ? '#fee2e2' : (m.status === 2 ? '#f1f5f9' : (m.status === 3 ? '#fef3c7' : '#f8fafc'))),
                        color: m.status === 1 ? '#166534' : (m.status === 4 ? '#b91c1c' : (m.status === 2 ? '#64748b' : (m.status === 3 ? '#92400e' : '#94a3b8'))),
                        border: m.status === 1 ? '1px solid #bbf7d0' : (m.status === 4 ? '1px solid #fecaca' : (m.status === 2 ? '1px solid #e2e8f0' : (m.status === 3 ? '1px solid #fde68a' : '1px solid #f1f5f9')))
                      }}>
                        <div style={{ 
                          width: '6px', height: '6px', borderRadius: '50%', 
                          backgroundColor: m.status === 1 ? '#22c55e' : (m.status === 4 ? '#ef4444' : (m.status === 2 ? '#94a3b8' : (m.status === 3 ? '#f59e0b' : '#cbd5e1'))) 
                        }}></div>
                        {m.status === 1 ? 'Aktif' : (m.status === 4 ? 'Keluar' : (m.status === 2 ? 'Non-Aktif' : (m.status === 3 ? 'Suspended' : 'Belum Registrasi')))}
                      </div>
                    )}
                  </td>
                  {!compact && (
                    <td style={styles.td}>
                      <div style={styles.amountText}>{formatCurrency(formatrupiah(totalSimpanan))}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Pokok: {formatrupiah(sPokok)}</div>
                    </td>
                  )}
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    <button 
                      style={styles.actionButton}
                      onClick={() => setSelectedMember({ ...m, sPokok, sWajib, totalSimpanan, id: idx + 1 })}
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="6" style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                  Tidak ada anggota yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedMember && (
        <MemberDetailModal 
          member={selectedMember} 
          onClose={() => setSelectedMember(null)} 
          allLogs={simpananLogs}
          onCloseMembership={onCloseMembership}
        />
      )}
    </div>
  );
};

export default MemberList;
