// components/Loan/LoanCard.jsx
import React from 'react';
import { cardStyles as styles } from '../../styles/cards';

const LoanCard = ({ children, statusLabel, statusColor = '#10b981', id }) => {
  return (
    <div style={styles.loanCard}>
      <div style={styles.loanHeader}>
        <span style={styles.loanId}>ID #{id}</span>
        <span
          style={{
            ...styles.loanStatus,
            backgroundColor: statusColor,
          }}
        >
          {statusLabel}
        </span>
      </div>
      {children}
    </div>
  );
};

export default LoanCard;
