import React, { useState } from 'react';
import { formatToken, formatCurrency } from '../../utils/format';
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

  // [FIX] Filter logs specifically for this member using identical logic to AdminHistory
  const userLogs = (allLogs || []).filter(log => {
      if (!log || !log.args) return false;
      const term = String(member.address).toLowerCase();
      
      // Look for the address in any relevant argument (user, peminjam, etc.)
      const addressString = String(
        log.args?.user || 
        log.args?.peminjam || 
        log.args?.anggota || 
        log.args?.[0] || 
        log.args?.[1] || 
        ''
      ).toLowerCase();
      
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
                <span>⚠️</span> Tutup Keanggotaan (Reset Anggota)
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
                      {isPaid ? 'Lunas' : 'Belum'}
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
          onCloseMembership={onCloseMembership}
        />
      )}
    </div>
  );
};

export default MemberList;
