// components/Forms/RegisterForm.jsx
import React, { useState } from 'react';
import { cardStyles as styles } from '../../styles/cards';
import { layoutStyles } from '../../styles/layout';
import { formatCurrency, formatToken, parseToken } from '../../utils/format';
import InlineMessage from '../InlineMessage';

const RegisterForm = ({ onRegister, isLoading }) => {
  const [nama, setNama] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async () => {
    if (!nama) return;
    setLoading(true); setMsg('Memproses pendaftaran...'); setIsError(false);
    try {
      await onRegister(nama, setMsg);
      setMsg('Pendaftaran berhasil!');
      setNama('');
    } catch (e) {
      setIsError(true);
      setMsg('Gagal: ' + (e.reason || e.message));
    }
    setLoading(false);
  };

  return (
    <section>
      <h3 style={layoutStyles.sectionTitle}>Pendaftaran Anggota</h3>
      <div style={styles.card}>
        <p style={styles.cardText}>
          Biaya pendaftaran:{' '}
          <strong>
            {formatCurrency(formatToken(parseToken('100000')))} IDRT
          </strong>{' '}
          (Simpanan Pokok)
        </p>
        <input
          style={styles.input}
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Masukkan nama lengkap Anda"
        />
        <button
          className="btn-animate"
          style={styles.button}
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {loading ? '⏳ Memproses...' : 'Daftar Sekarang'}
        </button>
        <InlineMessage message={msg} isError={isError} />
      </div>
    </section>
  );
};

export default RegisterForm;
