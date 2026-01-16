// components/Loan/ActiveLoan.jsx
import React from 'react';
import { cardStyles as styles } from '../../styles/cards';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatToken } from '../../utils/format';
import LoanCard from './LoanCard';
import BayarAngsuranForm from '../Forms/BayarAngsuranForm';

const ActiveLoan = ({ pinjamanAktif, onBayar, isLoading }) => {
  const navigate = useNavigate();
  const total = formatCurrency(
    formatToken(pinjamanAktif.jumlahHarusDikembalikan)
  );
  const dibayar = formatCurrency(formatToken(pinjamanAktif.sudahDibayar));
  const sisa = formatCurrency(
    formatToken(
      pinjamanAktif.jumlahHarusDikembalikan - pinjamanAktif.sudahDibayar
    )
  );
  // Calculate Progress (0-100)
  const progress =
    (Number(pinjamanAktif.sudahDibayar) /
      Number(pinjamanAktif.jumlahHarusDikembalikan)) *
    100;

  return (
    <>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={styles.cardTitle}>Pinjaman Aktif</h3>
          <button
            className="btn-animate"
            onClick={() => navigate('/pinjaman/detail')}
            style={{
              background: '#eff6ff',
              color: '#2563eb',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Lihat Detail
          </button>
        </div>

        <LoanCard id={Number(pinjamanAktif.id)} statusLabel="Aktif" hideHeader={true}>
          <div style={styles.loanDetails}>
            <div style={styles.loanDetail}>
              <span style={styles.loanDetailLabel}>Total Utang</span>
              <span style={styles.loanDetailValue}>{total} IDRT</span>
            </div>
            <div style={styles.loanDetail}>
              <span style={styles.loanDetailLabel}>Sudah Dibayar</span>
              <span
                style={{
                  ...styles.loanDetailValue,
                  color: '#10b981',
                }}
              >
                {dibayar} IDRT
              </span>
            </div>
            <div style={styles.loanDetail}>
              <span style={styles.loanDetailLabel}>Sisa Utang</span>
              <span
                style={{
                  ...styles.loanDetailValue,
                  color: '#ef4444',
                }}
              >
                {sisa} IDRT
              </span>
            </div>
          </div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${progress}%`,
              }}
            />
          </div>
        </LoanCard>
      </div>

      <BayarAngsuranForm onBayar={onBayar} isLoading={isLoading} />
    </>
  );
};

export default ActiveLoan;
