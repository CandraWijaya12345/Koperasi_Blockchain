// components/Forms/SimpananForm.jsx
import React, { useState } from 'react';
import { cardStyles as styles } from '../../styles/cards';
import InlineMessage from '../InlineMessage';

const SimpananForm = ({ onSetor, isLoading }) => {
  const [jumlah, setJumlah] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async () => {
    if (!jumlah) return;
    setLoading(true); setMsg('Memproses setoran...'); setIsError(false);
    try {
      await onSetor(jumlah, setMsg);
      setMsg('Setoran berhasil!');
      setJumlah('');
    } catch (e) {
      console.error(e);
      setIsError(true);
      setMsg('Gagal: ' + (e.reason || e.message || "Error"));
    }
    setLoading(false);
  };

  return (
    <section>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>💰 Setor Simpanan Sukarela</h3>
        <p style={styles.cardText}>
          Tambahkan simpanan sukarela untuk meningkatkan saldo Anda di koperasi.
        </p>
        <input
          style={styles.input}
          type="number"
          value={jumlah}
          onChange={(e) => setJumlah(e.target.value)}
          placeholder="Masukkan jumlah IDRT"
        />
        <button
          className="btn-animate"
          style={styles.button}
          onClick={handleSubmit}
          disabled={isLoading || loading || !jumlah}
        >
          {loading ? '⏳ Memproses...' : 'Setor Sekarang'}
        </button>
        <InlineMessage message={msg} isError={isError} />
      </div>
    </section>
  );
};

export default SimpananForm;
