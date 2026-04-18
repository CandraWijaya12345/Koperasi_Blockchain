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
    </section>
  );
};

export default Hero;
