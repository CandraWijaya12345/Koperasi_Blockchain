// components/Loan/ActiveLoan.jsx
import React from 'react';
import { cardStyles as styles } from '../../styles/cards';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatToken } from '../../utils/format';
import LoanCard from './LoanCard';
import BayarAngsuranForm from '../Forms/BayarAngsuranForm';

const ActiveLoan = ({ pinjamanAktif, onBayar, isLoading, isPaymentLocked, paymentSuccess, adminConfig }) => {
  const navigate = useNavigate();
  
  // Hitung ekspektasi total (Pokok + Bunga) tanpa denda
  // Rumus di contract: uint256 bungaTotal = (_amount * bungaPinjamanTahunanPersen * _tenorBulan) / 1200;
  const bungaRate = adminConfig?.bungaPinjaman || 12; // fallback ke 12% if missing
  const pokok = pinjamanAktif.jumlahPinjaman;
  const tenor = pinjamanAktif.tenorBulan;
  
  const bungaTotal = (pokok * BigInt(bungaRate) * BigInt(tenor)) / 1200n;
  const expectedTotal = pokok + bungaTotal;
  const dendaRaw = pinjamanAktif.jumlahHarusDikembalikan > expectedTotal ? 
                   pinjamanAktif.jumlahHarusDikembalikan - expectedTotal : 0n;

  const total = formatCurrency(formatToken(pinjamanAktif.jumlahHarusDikembalikan));
  const denda = formatCurrency(formatToken(dendaRaw));
  const dibayar = formatCurrency(formatToken(pinjamanAktif.sudahDibayar));
  const sisa = formatCurrency(
    formatToken(
      pinjamanAktif.jumlahHarusDikembalikan - pinjamanAktif.sudahDibayar
    )
  );

  const isOverdue = Date.now() / 1000 > Number(pinjamanAktif.waktuJatuhTempo) && Number(pinjamanAktif.waktuJatuhTempo) !== 0;

  // Calculate Progress (0-100)
  const progress =
    (Number(pinjamanAktif.sudahDibayar) /
      Number(pinjamanAktif.jumlahHarusDikembalikan)) *
    100;

  return (
    <>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={styles.cardTitle}>Pinjaman Aktif</h3>
            {isOverdue && (
              <span style={{ 
                backgroundColor: '#fee2e2', 
                color: '#dc2626', 
                padding: '2px 8px', 
                borderRadius: '4px', 
                fontSize: '0.75rem', 
                fontWeight: '700' 
              }}>
                TERLAMBAT
              </span>
            )}
          </div>
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
              <span style={styles.loanDetailValue}>{total}</span>
            </div>
            {dendaRaw > 0n && (
              <div style={styles.loanDetail}>
                <span style={styles.loanDetailLabel}>Akumulasi Denda</span>
                <span style={{ ...styles.loanDetailValue, color: '#ef4444' }}>+{denda}</span>
              </div>
            )}
            <div style={styles.loanDetail}>
              <span style={styles.loanDetailLabel}>Sudah Dibayar</span>
              <span
                style={{
                  ...styles.loanDetailValue,
                  color: '#10b981',
                }}
              >
                {dibayar}
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
                {sisa}
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

      <BayarAngsuranForm 
        onBayar={onBayar} 
        isLoading={isLoading} 
        isPaymentLocked={isPaymentLocked}
        paymentSuccess={paymentSuccess}
      />
    </>
  );
};

export default ActiveLoan;
