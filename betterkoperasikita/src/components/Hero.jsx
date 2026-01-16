// components/Hero.jsx
import React from 'react';
import { layoutStyles as styles } from '../styles/layout';

const Hero = ({ onConnect, isLoading }) => {
  return (
    <section style={styles.heroSection}>
      <div style={styles.heroText}>
        <h1 style={styles.heroTitle}>
          Wujudkan Finansial Sejahtera <br />Bersama Koperasi Kita
        </h1>
        <p style={styles.heroSubtitle}>
          Platform koperasi digital yang aman, transparan, dan terpercaya.
          Kelola simpanan dan pinjaman Anda dengan mudah dalam satu genggaman.
        </p>
        <button
          className="btn-animate"
          style={styles.heroButton}
          onClick={onConnect}
          disabled={isLoading}
        >
          {isLoading ? 'Menghubungkan...' : 'Mulai Sekarang'}
        </button>
      </div>

      <div style={styles.heroImageWrapper}>
        <img
          style={styles.heroImage}
          src="https://images.unsplash.com/photo-1605902711834-8b11c3e3ef41?auto=format&fit=crop&w=1100&q=80"
          alt="Kegiatan Koperasi"
        />
      </div>
    </section>
  );
};

export default Hero;
