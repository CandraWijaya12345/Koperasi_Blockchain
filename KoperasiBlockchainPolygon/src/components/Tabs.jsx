// components/Tabs.jsx
import React from 'react';
import { cardStyles as styles } from '../styles/cards';

const Tabs = ({ activeTab, onChange }) => {
  return (
    <div style={styles.tabs}>
      <button
        className="btn-animate"
        style={{
          ...styles.tab,
          ...(activeTab === 'simpanan' ? styles.tabActive : {}),
        }}
        onClick={() => onChange('simpanan')}
      >
        Simpanan
      </button>
      <button
        className="btn-animate"
        style={{
          ...styles.tab,
          ...(activeTab === 'pinjaman' ? styles.tabActive : {}),
        }}
        onClick={() => onChange('pinjaman')}
      >
        Pinjaman
      </button>
      <button
        className="btn-animate"
        style={{
          ...styles.tab,
          ...(activeTab === 'riwayat' ? styles.tabActive : {}),
        }}
        onClick={() => onChange('riwayat')}
      >
        Riwayat
      </button>
    </div>
  );
};

export default Tabs;
