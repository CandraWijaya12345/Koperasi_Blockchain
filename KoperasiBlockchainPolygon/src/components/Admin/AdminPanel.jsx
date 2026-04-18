// components/Admin/AdminPanel.jsx
import React from 'react';
import PendingLoanItem from './PendingLoanItem';

const AdminPanel = ({ pendingLoans, onApprove, onReject, isLoading }) => {
  const panelStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px',
      paddingBottom: '12px',
      borderBottom: '1px solid #f1f5f9'
    },
    title: {
      fontSize: '0.925rem',
      fontWeight: '700',
      color: '#1e293b',
      textTransform: 'uppercase',
      letterSpacing: '0.025em'
    },
    badge: {
      backgroundColor: pendingLoans.length > 0 ? '#eff6ff' : '#f8fafc',
      color: pendingLoans.length > 0 ? '#2563eb' : '#94a3b8',
      fontSize: '0.75rem',
      fontWeight: '700',
      padding: '4px 10px',
      borderRadius: '99px',
      border: '1px solid',
      borderColor: pendingLoans.length > 0 ? '#dbeafe' : '#e2e8f0'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      border: '1px dashed #e2e8f0',
      color: '#94a3b8',
      fontSize: '0.875rem'
    }
  };

  return (
    <div style={panelStyles.container}>
      <div style={panelStyles.header}>
        <h3 style={panelStyles.title}>Persetujuan Pinjaman</h3>
        <span style={panelStyles.badge}>
          {pendingLoans.length} Permintaan
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {pendingLoans.length === 0 ? (
          <div style={panelStyles.emptyState}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>✓</div>
            Semua permintaan telah diproses.
          </div>
        ) : (
          pendingLoans.map((log) => (
            <PendingLoanItem
              key={log.transactionHash + '_' + Number(log.args.id)}
              log={log}
              onApprove={onApprove}
              onReject={onReject}
              loading={isLoading}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
