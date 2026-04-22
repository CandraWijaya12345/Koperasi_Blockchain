// components/DashboardHero.jsx
import React from 'react';
import { layoutStyles as styles } from '../styles/layout';

const DashboardHero = ({ userAccount, nama, isMember, onWithdraw }) => {
  const labelNama = nama || 'Anggota';

  return (
    <section style={styles.dashboardHero}>
      <div style={styles.dashboardHeroLeft}>
        <p style={styles.dashboardLabel}>Halo, {labelNama}</p>
        <h2 style={styles.dashboardTitle}>
          {isMember 
            ? "Kelola Simpanan dan Pinjaman dengan Lebih Transparan" 
            : "Segera Bergabung dengan Koperasi Blockchain Kami"}
        </h2>
        <p style={styles.dashboardSubtitle}>
          {isMember
            ? "Gunakan panel di bawah untuk melakukan setoran, pengajuan pinjaman, dan memantau seluruh riwayat transaksi Anda."
            : "Silakan lengkapi formulir pendaftaran di bawah untuk mulai menikmati layanan simpan pinjam berbasis blockchain."}
        </p>
      </div>
      <div style={styles.dashboardHeroRight}>
        {isMember && (
          <>
            <div style={styles.dashboardBadge}>
              <span>Wallet</span>
              <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
                {userAccount.substring(0, 8)}...
                {userAccount.substring(userAccount.length - 6)}
              </span>
            </div>
            <div
              style={{ ...styles.dashboardHeroBubble, cursor: 'pointer' }}
              onClick={onWithdraw}
              role="button"
            >
              Withdraw Saldo
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default DashboardHero;
