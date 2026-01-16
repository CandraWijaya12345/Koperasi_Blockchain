// components/InfoCards.jsx
import React from 'react';
import { layoutStyles as styles } from '../styles/layout';

const InfoCards = () => {
  return (
    <section style={styles.infoRow}>
      <InfoCard
        title="Transparan"
        text="Semua transaksi dicatat di blockchain, sehingga simpanan dan pinjaman tercatat jelas dan dapat diaudit kapan saja."
      />
      <InfoCard
        title="Mudah Digunakan"
        text="Cukup hubungkan wallet untuk mulai mendaftar anggota, menyimpan dana, atau mengajukan pinjaman."
      />
      <InfoCard
        title="Aman"
        text="Smart contract mengatur seluruh proses secara otomatis tanpa perantara."
      />
    </section>
  );
};

const InfoCard = ({ title, text }) => (
  <div style={styles.infoCard}>
    <h3 style={styles.infoTitle}>{title}</h3>
    <p style={styles.infoText}>{text}</p>
  </div>
);

export default InfoCards;
