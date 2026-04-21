// components/Loan/ActiveLoan.jsx
import React from 'react';
import { cardStyles as styles } from '../../styles/cards';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatToken } from '../../utils/format';
import LoanCard from './LoanCard';
import BayarAngsuranForm from '../Forms/BayarAngsuranForm';

const ActiveLoan = ({ pinjamanAktif, onBayar, isLoading, isPaymentLocked, paymentSuccess, adminConfig }) => {
  const navigate = useNavigate();
  
  // Perhitungan denda sesuai logika kontrak: (totalHarusDibayar * dendaHarianPermil * overdueDays) / 1000
  const dendaRate = adminConfig?.denda || 1; // Permil harian
  const now = Math.floor(Date.now() / 1000);
  const dueDate = Number(pinjamanAktif.waktuJatuhTempo);
  
  let dendaRaw = 0n;
  if (dueDate > 0 && now > dueDate) {
    const overdueDays = BigInt(Math.floor((now - dueDate) / (24 * 3600)));
    if (overdueDays > 0n) {
      dendaRaw = (pinjamanAktif.jumlahHarusDikembalikan * BigInt(dendaRate) * overdueDays) / 1000n;
    }
  }

  const sisa = formatCurrency(
    formatToken(
        (pinjamanAktif.jumlahHarusDikembalikan - pinjamanAktif.sudahDibayar) + dendaRaw
    )
  );
  const denda = formatCurrency(formatToken(dendaRaw));
  const dibayar = formatCurrency(formatToken(pinjamanAktif.sudahDibayar));


  const isOverdue = Date.now() / 1000 > Number(pinjamanAktif.waktuJatuhTempo) && Number(pinjamanAktif.waktuJatuhTempo) !== 0;

  // Calculate Progress (0-100)
  const progress =
    (Number(pinjamanAktif.sudahDibayar) /
      Number(pinjamanAktif.jumlahHarusDikembalikan)) *
    100;

  const quality = Number(pinjamanAktif.quality || 0);
  const qualityConfig = {
    0: { label: 'Lancar', color: '#10b981', bg: '#dcfce7', desc: 'Sangat Baik (Tepat Waktu)' },
    1: { label: 'DPK', color: '#f59e0b', bg: '#fef3c7', desc: 'Dalam Pengawasan (Terlambat 1-30 hari)' },
    2: { label: 'Kurang Lancar', color: '#f97316', bg: '#ffedd5', desc: 'Terlambat 31-90 hari' },
    3: { label: 'Diragukan', color: '#ef4444', bg: '#fee2e2', desc: 'Terlambat 91-180 hari' },
    4: { label: 'Macet', color: '#991b1b', bg: '#fecaca', desc: 'Gagal Bayar (>180 hari)' }
  };

  const currentQuality = qualityConfig[quality] || qualityConfig[0];

  return (
    <>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={styles.cardTitle}>Pinjaman Aktif</h3>
            <span style={{ 
              backgroundColor: currentQuality.bg, 
              color: currentQuality.color, 
              padding: '2px 8px', 
              borderRadius: '99px', 
              fontSize: '0.7rem', 
              fontWeight: '800',
              textTransform: 'uppercase'
            }}>
              KOL-{quality + 1}: {currentQuality.label}
            </span>
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
            Monitor Angsuran
          </button>
        </div>

        <LoanCard id={Number(pinjamanAktif.id)} statusLabel="TERVERIFIKASI" hideHeader={true}>
          <div style={styles.loanDetails}>
            <div style={styles.loanDetail}>
              <span style={styles.loanDetailLabel}>Sisa Utang</span>
              <span style={{ ...styles.loanDetailValue, color: '#ef4444' }}>{sisa}</span>
            </div>
            <div style={styles.loanDetail}>
              <span style={styles.loanDetailLabel}>Sudah Dibayar</span>
              <span style={{ ...styles.loanDetailValue, color: '#10b981' }}>{dibayar}</span>
            </div>
            <div style={styles.loanDetail}>
              <span style={styles.loanDetailLabel}>Skor Kredit</span>
              <span style={{ ...styles.loanDetailValue, color: currentQuality.color }}>{currentQuality.desc}</span>
            </div>
            {dendaRaw > 0n && (
              <div style={styles.loanDetail}>
                <span style={styles.loanDetailLabel}>Denda</span>
                <span style={{ ...styles.loanDetailValue, color: '#ef4444' }}>+{denda}</span>
              </div>
            )}
          </div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${progress}%`,
                backgroundColor: currentQuality.color
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
