// components/Loan/PendingLoan.jsx
import React from 'react';
import { cardStyles as styles } from '../../styles/cards';
import { formatCurrency, formatToken } from '../../utils/format';
import LoanCard from './LoanCard';

const PendingLoan = ({ pendingLoanUser }) => {
  const args = pendingLoanUser.args || [];
  const idVal = args.id !== undefined ? args.id : args[0];
  const jumlahVal = args.jumlah !== undefined ? args.jumlah : args[2];

  const jumlah = formatCurrency(formatToken(jumlahVal));

  const ts = pendingLoanUser.extractedTimestamp || Number(args.waktu) || 0;
  const waktu = ts ? new Date(ts * 1000).toLocaleString('id-ID') : '-';

  const status = Number(pendingLoanUser.status || 0);
  const statusConfig = {
    0: { label: 'Menunggu Survey', color: '#f59e0b', msg: 'Permintaan Anda sedang dalam antrean penjadwalan survey oleh tim kami.' },
    1: { label: 'Proses Komite', color: '#6366f1', msg: 'Hasil survey Anda sedang ditinjau oleh Komite Pinjaman untuk keputusan akhir.' },
    2: { label: 'Disetujui - Antre Pencairan', color: '#10b981', msg: 'Pinjaman Anda telah disetujui! Sedang menunggu proses pencairan dana ke rekening Anda.' }
  };

  const currentStatus = statusConfig[status] || statusConfig[0];

  return (
    <>
      <LoanCard
        id={Number(idVal)}
        statusLabel={currentStatus.label}
        statusColor={currentStatus.color}
      >
        <div style={styles.loanDetails}>
          <div style={styles.loanDetail}>
            <span style={styles.loanDetailLabel}>Jumlah Pengajuan</span>
            <span style={styles.loanDetailValue}>{jumlah}</span>
          </div>
          <div style={styles.loanDetail}>
            <span style={styles.loanDetailLabel}>Status Saat Ini</span>
            <span
              style={{
                ...styles.loanDetailValue,
                color: currentStatus.color,
              }}
            >
              {currentStatus.label}
            </span>
          </div>
          <div style={styles.loanDetail}>
            <span style={styles.loanDetailLabel}>Waktu Pengajuan</span>
            <span
              style={{
                ...styles.loanDetailValue,
                fontSize: '14px',
              }}
            >
              {waktu}
            </span>
          </div>
        </div>
      </LoanCard>

      <div style={{ ...styles.infoBox, backgroundColor: '#f8fafc', borderLeft: `4px solid ${currentStatus.color}` }}>
        <p style={{ fontWeight: '600', marginBottom: '4px' }}>Update Progress:</p>
        <p>
          {currentStatus.msg}
        </p>
      </div>
    </>
  );
};

export default PendingLoan;
