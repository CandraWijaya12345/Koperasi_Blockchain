// components/DashboardHero.jsx
import React from 'react';
import { layoutStyles as styles } from '../styles/layout';

const DashboardHero = ({ userAccount, nama }) => {
  const labelNama = nama || 'Anggota';

  return (
    <section style={styles.dashboardHero}>
      <div style={styles.dashboardHeroLeft}>
        <p style={styles.dashboardLabel}>Halo, {labelNama}</p>
        <h2 style={styles.dashboardTitle}>
          Kelola Simpanan dan Pinjaman dengan Lebih Transparan
        </h2>
        <p style={styles.dashboardSubtitle}>
          Gunakan panel di bawah untuk melakukan setoran, pengajuan pinjaman,
          dan memantau seluruh riwayat transaksi Anda.
        </p>
      </div>
      <div style={styles.dashboardHeroRight}>
        <div style={styles.dashboardBadge}>
          <span>Wallet</span>
          <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
            {userAccount.substring(0, 8)}...
            {userAccount.substring(userAccount.length - 6)}
          </span>
        </div>
        <div style={styles.dashboardHeroBubble}>Withdraw Saldo</div>
      </div>
    </section>
  );
};

export default DashboardHero;
