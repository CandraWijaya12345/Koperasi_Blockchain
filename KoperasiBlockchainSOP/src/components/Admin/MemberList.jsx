import React, { useState } from 'react';
import { formatToken, formatCurrency } from '../../utils/format';

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
const MemberDetailModal = ({ member, onClose, allLogs }) => {
  if (!member) return null;

  // [FIX] BigInt safety: explicitly convert timestamp to Number during sorting
  // Also filter out any logs that have non-numeric "jumlah" (like system labels)
  const userLogs = (allLogs || [])
    .filter(l => l && l.dari && String(l.dari).toLowerCase() === String(member.address).toLowerCase())
    .filter(l => {
      if (!l.jumlah) return true;
      try {
        BigInt(l.jumlah);
        return true;
      } catch (e) {
        return false;
      }
    })
    .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.content}>
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ ...styles.avatar, width: '48px', height: '48px', fontSize: '1.25rem' }}>
              {(member.nama || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                {member.nama || 'Tanpa Nama'}
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontFamily: 'monospace' }}>
                {member.address}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}>×</button>
        </div>

        <div style={modalStyles.body}>
          <div style={modalStyles.statsGrid}>
            <div style={modalStyles.statCard}>
              <div style={modalStyles.statLabel}>Simpanan Pokok</div>
              <div style={modalStyles.statValue}>{formatCurrency(formatToken(member.sPokok))}</div>
            </div>
            <div style={modalStyles.statCard}>
              <div style={modalStyles.statLabel}>Simpanan Wajib</div>
              <div style={modalStyles.statValue}>{formatCurrency(formatToken(member.sWajib))}</div>
            </div>
            <div style={modalStyles.statCard}>
              <div style={modalStyles.statLabel}>Simpanan Sukarela</div>
              <div style={modalStyles.statValue}>{formatCurrency(formatToken(member.simpananSukarela || 0n))}</div>
            </div>
            <div style={{ ...modalStyles.statCard, border: '1px solid #dbeafe', backgroundColor: '#eff6ff' }}>
              <div style={{ ...modalStyles.statLabel, color: '#2563eb' }}>SHU Diambil</div>
              <div style={{ ...modalStyles.statValue, color: '#1e40af' }}>{formatCurrency(formatToken(member.shuSudahDiambil || 0n))}</div>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
             <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', marginBottom: '16px', textTransform: 'uppercase' }}>
               Riwayat Transaksi Terbaru
             </h3>
             <div style={modalStyles.logContainer}>
               {userLogs.length > 0 ? (
                 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                   <thead>
                     <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
                       <th style={modalStyles.logTh}>Waktu</th>
                       <th style={modalStyles.logTh}>Jenis</th>
                       <th style={{ ...modalStyles.logTh, textAlign: 'right' }}>Jumlah</th>
                     </tr>
                   </thead>
                   <tbody>
                     {userLogs.map((log, i) => (
                       <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                         <td style={modalStyles.logTd}>{new Date(Number(log.timestamp || 0) * 1000).toLocaleDateString('id-ID')}</td>
                         <td style={modalStyles.logTd}>
                           <span style={{ 
                             padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700',
                             backgroundColor: log.jenis === 'Wajib' ? '#eff6ff' : '#f0fdf4',
                             color: log.jenis === 'Wajib' ? '#2563eb' : '#16a34a'
                           }}>
                             {log.jenis}
                           </span>
                         </td>
                         <td style={{ ...modalStyles.logTd, textAlign: 'right', fontWeight: '700', color: '#1e293b' }}>
                           {formatCurrency(formatToken(log.jumlah || 0n))}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               ) : (
                 <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                   Belum ada riwayat transaksi ditemukan.
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const MemberList = ({ members, isLoading, simpananLogs, compact }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  const filteredMembers = (members || []).filter(m => 
    (m.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.address || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const checkWajibStatus = (addr) => {
    if (!simpananLogs || !Array.isArray(simpananLogs)) return false;
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    return simpananLogs.some(l => {
      const isMatch = l && l.dari && addr && 
        String(l.dari).toLowerCase() === String(addr).toLowerCase() &&
        (l.jenis === 'Wajib') &&
        new Date(Number(l.timestamp || 0) * 1000).getMonth() === curMonth &&
        new Date(Number(l.timestamp || 0) * 1000).getFullYear() === curYear;
      
      if (!isMatch) return false;
      const amount = Number(formatToken(l.jumlah || 0n));
      return amount === 25000;
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading && (!members || members.length === 0)) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Memuat data anggota...</div>;
  }

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
              <th style={styles.th}>Status Iuran</th>
              {!compact && <th style={styles.th}>Total Simpanan</th>}
              <th style={{ ...styles.th, textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length > 0 ? filteredMembers.map((m, idx) => {
              if (!m || !m.address) return null;
              
              const isPaid = checkWajibStatus(m.address);
              const POKOK_RAW = 100000n * (10n ** 18n); 
              let sWajib = m.simpananWajib || 0n;
              let sPokok = 0n;
              
              if (sWajib >= POKOK_RAW) {
                sPokok = POKOK_RAW;
                sWajib = sWajib - POKOK_RAW;
              } else {
                sPokok = sWajib;
                sWajib = 0n;
              }
              
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
                        <div style={styles.memberStatus}>Anggota Koperasi</div>
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
                      color: isPaid ? '#166534' : '#991b1b'
                    }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isPaid ? '#22c55e' : '#ef4444' }}></div>
                      {isPaid ? 'Bulan Ini Lunas' : 'Belum Bayar'}
                    </div>
                  </td>
                  {!compact && (
                    <td style={styles.td}>
                      <div style={styles.amountText}>{formatCurrency(formatToken(totalSimpanan))}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Pokok: {formatToken(sPokok)}</div>
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
        />
      )}
    </div>
  );
};

export default MemberList;
