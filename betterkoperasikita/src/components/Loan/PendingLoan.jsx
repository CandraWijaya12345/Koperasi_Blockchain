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

  return (
    <>
      <LoanCard
        id={Number(idVal)}
        statusLabel="Menunggu persetujuan"
        statusColor="#f59e0b"
      >
        <div style={styles.loanDetails}>
          <div style={styles.loanDetail}>
            <span style={styles.loanDetailLabel}>Jumlah Pengajuan</span>
            <span style={styles.loanDetailValue}>{jumlah} IDRT</span>
          </div>
          <div style={styles.loanDetail}>
            <span style={styles.loanDetailLabel}>Status</span>
            <span
              style={{
                ...styles.loanDetailValue,
                color: '#f59e0b',
              }}
            >
              Menunggu persetujuan admin
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

      <div style={styles.infoBox}>
        <p>
          Pengajuan pinjaman Anda sedang direview admin. Anda belum dapat
          mengajukan pinjaman baru sebelum pengajuan ini diputuskan.
        </p>
      </div>
    </>
  );
};

export default PendingLoan;
