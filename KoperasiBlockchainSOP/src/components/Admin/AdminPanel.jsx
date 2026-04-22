import React from 'react';
import PendingLoanItem from './PendingLoanItem';
import InlineMessage from '../InlineMessage';

const AdminPanel = ({ pendingLoans, onApprove, onReject, onApproveSurvey, onApproveCommittee, isLoading, adminConfig }) => {
  const [msg, setMsg] = React.useState('');
  const [isError, setIsError] = React.useState(false);

  const handleNotify = (message, isErr = false) => {
    setMsg(message);
    setIsError(isErr);
    if (!isErr) setTimeout(() => setMsg(''), 5000);
  };
  const panelStyles = {
    // ... stats ...
  };

  return (
    <div style={panelStyles.container}>
      <div style={panelStyles.header}>
        <h3 style={panelStyles.title}>Persetujuan Pinjaman</h3>
        <span style={panelStyles.badge}>
          {pendingLoans.length} Permintaan
        </span>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <InlineMessage message={msg} isError={isError} />
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
              loan={log}
              onApprove={onApprove}
              onReject={onReject}
              onApproveSurvey={onApproveSurvey}
              onApproveCommittee={onApproveCommittee}
              loading={isLoading}
              onNotify={handleNotify}
              adminConfig={adminConfig}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
