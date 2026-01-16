// components/Forms/BayarAngsuranForm.jsx
import React, { useState } from 'react';
import { cardStyles as styles } from '../../styles/cards';
import InlineMessage from '../InlineMessage';

const BayarAngsuranForm = ({ onBayar, isLoading }) => {
  const [jumlah, setJumlah] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async () => {
    if (!jumlah) return;
    setLoading(true); setMsg('Memproses pembayaran...'); setIsError(false);
    try {
      await onBayar(jumlah, setMsg);
      setMsg('Pembayaran berhasil!');
      setJumlah('');
    } catch (e) {
      console.error(e);
      setIsError(true);
      setMsg('Gagal: ' + (e.reason || e.message || "Error"));
    }
    setLoading(false);
  };

  return (
    <>
      <input
        style={styles.input}
        type="number"
        value={jumlah}
        onChange={(e) => setJumlah(e.target.value)}
        placeholder="Jumlah angsuran"
      />
      <button
        className="btn-animate"
        style={styles.button}
        onClick={handleSubmit}
        disabled={isLoading || !jumlah}
      >
        {loading ? '⏳ Memproses...' : 'Bayar Angsuran'}
      </button>
      <InlineMessage message={msg} isError={isError} />
    </>
  );
};

export default BayarAngsuranForm;
