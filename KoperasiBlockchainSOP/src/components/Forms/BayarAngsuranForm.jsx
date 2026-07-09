// components/Forms/BayarAngsuranForm.jsx
import React, { useState, useEffect } from 'react';
import { cardStyles as styles } from '../../styles/cards';
import InlineMessage from '../InlineMessage';

const BayarAngsuranForm = ({ onBayar, isLoading, isPaymentLocked, paymentSuccess, paymentType }) => {
  const [jumlah, setJumlah] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const wasLocked = React.useRef(false);

  // Clear message or show cancellation when payment modal is closed
  useEffect(() => {
    if (isPaymentLocked && paymentType === 'angsuran') {
      wasLocked.current = true;
    } else if (!isPaymentLocked && wasLocked.current) {
      wasLocked.current = false;
      if (paymentSuccess) {
        setMsg('');
      } else {
        setMsg('Pembayaran dibatalkan oleh pengguna.');
        setIsError(true);
        setTimeout(() => setMsg(''), 5000);
      }
    }
  }, [isPaymentLocked, paymentSuccess, paymentType]);

  const handleSubmit = async () => {
    if (!jumlah) return;
    setLoading(true); setMsg('Memproses pembayaran...'); setIsError(false);
    try {
      await onBayar(jumlah, setMsg);
      // [FIX] Pesan sukses asli ada di SuccessModal
      setMsg('Menunggu verifikasi pembayaran...');
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
        onWheel={(e) => e.target.blur()} // Disable scroll value change
        placeholder="Jumlah angsuran"
      />
      <button
        className="btn-animate"
        style={styles.button}
        onClick={handleSubmit}
        disabled={isLoading || loading || !jumlah}
      >
        {loading ? 'Memproses...' : 'Bayar Angsuran'}
      </button>
      <InlineMessage message={msg} isError={isError} />
    </>
  );
};

export default BayarAngsuranForm;
