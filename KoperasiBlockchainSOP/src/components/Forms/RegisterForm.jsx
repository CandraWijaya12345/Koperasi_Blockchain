// components/Forms/RegisterForm.jsx
import React, { useState, useEffect } from 'react';
import { cardStyles as styles } from '../../styles/cards';
import { layoutStyles } from '../../styles/layout';
import { formatCurrency, formatToken, parseToken } from '../../utils/format';
import InlineMessage from '../InlineMessage';

const RegisterForm = ({ onRegister, isLoading, isPaymentLocked, paymentSuccess }) => {
  const [nama, setNama] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  // Clear message or show cancellation when payment modal is closed
  useEffect(() => {
    if (!isPaymentLocked && msg.includes("Menunggu")) {
      if (paymentSuccess) {
        setMsg('');
      } else {
        setMsg('Pembayaran dibatalkan oleh pengguna.');
        setIsError(true);
        setTimeout(() => setMsg(''), 5000);
      }
    }
  }, [isPaymentLocked, msg, paymentSuccess]);

  // Xendit Flow: Redirects to new tab, user must confirm manually in this prototype
  const handleSubmit = async () => {
    if (!nama) return;
    setLoading(true);
    setMsg('Mempersiapkan pembayaran Xendit...');
    setIsError(false);

    try {
      // Pass callback to handle progress messages
      await onRegister(nama, undefined, (progressMsg) => {
        setMsg(progressMsg);
      });
      // [FIX] Jangan langsung set sukses. Pesan ini harusnya menunggu verifikasi blok.
      setMsg('Menunggu konfirmasi pembayaran...');
      setNama('');
    } catch (e) {
      console.error("Register Error:", e);
      // If user cancelled in confirm dialog
      if (e.message.includes("dibatalkan")) {
        setMsg("Pendaftaran dibatalkan.");
        setLoading(false);
        return;
      }
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
            {formatCurrency(formatToken(parseToken('100000')))}
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
