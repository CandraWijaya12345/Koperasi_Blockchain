// components/Admin/AdminPanel.jsx
import React, { useState } from 'react';
import { cardStyles as styles } from '../../styles/cards';
import { layoutStyles } from '../../styles/layout';

import PendingLoanItem from './PendingLoanItem';
import InlineMessage from '../InlineMessage';

const AdminPanel = ({ pendingLoans, onApprove, onReject, isLoading }) => {
  const [idInput, setIdInput] = useState('');

  const [loadingAction, setLoadingAction] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const handleApprove = async () => {
    if (!idInput) return;
    setLoadingAction(true); setMsg('Menyetujui pinjaman...'); setIsError(false);
    try {
      await onApprove(idInput, setMsg);
      setMsg('Pinjaman berhasil disetujui!');
      setIdInput('');
    } catch (e) {
      setIsError(true);
      setMsg('Gagal: ' + (e.reason || e.message));
    }
    setLoadingAction(false);
  };

  const handleReject = async () => {
    if (!idInput) return;
    setLoadingAction(true); setMsg('Menolak pinjaman...'); setIsError(false);
    try {
      await onReject(idInput, setMsg);
      setMsg('Pinjaman ditolak!');
      setIdInput('');
    } catch (e) {
      setIsError(true);
      setMsg('Gagal: ' + (e.reason || e.message));
    }
    setLoadingAction(false);
  };

  return (
    <section>
      <h3 style={layoutStyles.sectionTitle}>Panel Admin</h3>
      <div
        style={{
          ...styles.card,
          background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
          color: '#fff',
          border: 'none',
        }}
      >
        <h3
          style={{
            ...styles.cardTitle,
            color: '#fff',
          }}
        >
          👑 Persetujuan Pinjaman
        </h3>
        <input
          style={{
            ...styles.input,
            backgroundColor: 'rgba(255,255,255,0.9)',
          }}
          type="number"
          value={idInput}
          onChange={(e) => setIdInput(e.target.value)}
          placeholder="ID Pinjaman"
        />
        <button
          style={{
            ...styles.button,
            backgroundColor: '#fff',
            color: '#4f46e5',
            width: 'fit-content',
            padding: '12px 24px',
          }}
          onClick={handleApprove}
          disabled={isLoading || loadingAction || !idInput}
        >
          {loadingAction && !msg.includes('Menolak') ? '⏳ ...' : 'Setujui Pinjaman'}
        </button>
        <button
          style={{
            ...styles.button,
            backgroundColor: '#ef4444',
            color: '#fff',
            width: 'fit-content',
            padding: '12px 24px',
            marginLeft: '10px'
          }}
          onClick={handleReject}
          disabled={isLoading || loadingAction || !idInput}
        >
          {loadingAction && msg.includes('Menolak') ? '⏳ ...' : 'Tolak Pinjaman'}
        </button>

        <InlineMessage message={msg} isError={isError} />

        <h4
          style={{
            marginTop: '24px',
            marginBottom: '12px',
            fontSize: '16px',
            fontWeight: 700,
          }}
        >
          📋 Daftar Permintaan Menunggu Persetujuan
        </h4>
        <div style={styles.pendingList}>
          {pendingLoans.length === 0 ? (
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              Tidak ada permintaan pinjaman yang menunggu persetujuan.
            </div>
          ) : (
            pendingLoans.map((log) => (
              <PendingLoanItem
                key={log.transactionHash + '_' + Number(log.args.id)}
                log={log}
                onUseId={setIdInput}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminPanel;
