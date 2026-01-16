// components/Stats.jsx
import React from 'react';
import { cardStyles as styles } from '../styles/cards';
import { layoutStyles } from '../styles/layout';
import { formatCurrency, formatToken } from '../utils/format';

const Stats = ({
  anggotaData,
  idrtBalance,
  totalSimpanan,
  pinjamanAktif,
  pendingLoanUser,
}) => {
  const renderLoanSummary = () => {
    if (!anggotaData || !anggotaData.terdaftar) return null;

    let label = 'Status Pinjaman';
    let value = 'Tidak ada pinjaman';
    let extra = '';

    if (pinjamanAktif) {
      const sisa =
        pinjamanAktif.jumlahHarusDikembalikan - pinjamanAktif.sudahDibayar;
      value = `Aktif • Sisa ${formatCurrency(formatToken(sisa))} IDRT`;
      extra = `ID #${Number(pinjamanAktif.id)}`;
    } else if (pendingLoanUser) {
      value = `Menunggu persetujuan • ${formatCurrency(
        formatToken(pendingLoanUser.args.jumlah)
      )} IDRT`;
      extra = `ID #${Number(pendingLoanUser.args.id)}`;
    }

    return (
      <div style={styles.statCard}>
        <div style={styles.statIcon}>💳</div>
        <div>
          <div style={styles.statLabel}>{label}</div>
          <div style={styles.statValue}>{value}</div>
          {extra && (
            <div
              style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '4px',
              }}
            >
              {extra}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section>
      <h3 style={layoutStyles.sectionTitle}>Ringkasan Akun</h3>
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div>
            <div style={styles.statLabel}>Saldo IDRT</div>
            <div style={styles.statValue}>
              {formatCurrency(idrtBalance)}
            </div>
          </div>
        </div>

        {anggotaData?.terdaftar && (
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🏛️</div>
            <div>
              <div style={styles.statLabel}>Total Simpanan</div>
              <div style={styles.statValue}>
                {formatCurrency(totalSimpanan)}
              </div>
            </div>
          </div>
        )}

        {anggotaData?.terdaftar && (
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🙋‍♂️</div>
            <div>
              <div style={styles.statLabel}>Nama Anggota</div>
              <div style={styles.statValue}>{anggotaData.nama}</div>
            </div>
          </div>
        )}

        {renderLoanSummary()}
      </div>
    </section>
  );
};

export default Stats;
