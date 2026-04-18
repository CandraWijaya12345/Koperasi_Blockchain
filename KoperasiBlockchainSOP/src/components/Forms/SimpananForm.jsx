// components/Forms/SimpananForm.jsx
import React, { useState, useEffect } from 'react';
import { cardStyles as styles } from '../../styles/cards';
import InlineMessage from '../InlineMessage';
import { formatCurrency, formatToken, parseToken } from '../../utils/format';

const BoltIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
const CheckCircleIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const CalendarIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;

export const SimpananWajibForm = ({ history, isLoading, isPaymentLocked, paymentSuccess, onPay }) => {
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

  const handlePay = async () => {
    setLoading(true);
    setMsg("Memproses Pembayaran via Midtrans...");
    setIsError(false);

    try {
      await onPay((message) => {
        setMsg(message);
      });
      // [FIX] Jangan langsung set sukses di sini karena pembayaran baru saja dimulai di modal.
      // Pesan sukses yang sebenarnya akan muncul di SuccessModal (UserPage).
      setMsg("Menunggu pembayaran...");
      setTimeout(() => setMsg(''), 5000);
    } catch (err) {
      if (err.message && err.message.includes("dibatalkan")) {
        setMsg("Pembayaran dibatalkan.");
      } else {
        console.error(err);
        setIsError(true);
        setMsg("Gagal: " + (err.reason || err.message));
      }
      setTimeout(() => setMsg(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // [FIX] Filter Logic: Simpanan Pokok (First Wajib Deposit) should NOT count as Monthly Simpanan Wajib
  const wajibDeposits = history.filter(h => {
    const isSimpanan = h.fragment?.name === 'DepositTercatat' || h.eventName === 'DepositTercatat' || h.fragment?.name === 'SimpananMasuk';
    if (!isSimpanan) return false;

    let jenis = '';
    if (h.args && h.args[2]) jenis = h.args[2];
    if (h.args && h.args.jenis) jenis = h.args.jenis;

    return jenis === 'Wajib';
  });

  // Sort by time ascending (Oldest first)
  wajibDeposits.sort((a, b) => a.extractedTimestamp - b.extractedTimestamp);

  // If there is strictly more than 1 Wajib deposit overall, OR if the only deposit is NOT this month
  // But simpler: Just ignore the very first Wajib deposit ever (Simpanan Pokok)
  // And check if *any other* Wajib deposit exists in current month

  const hasPaidThisMonth = wajibDeposits.some(h => {
    // h.args[1] is amount in WEI
    const amount = Number(formatToken(h.args[1] || h.args.jumlah || 0n));
    if (amount !== 25000) return false;

    const ts = h.extractedTimestamp * 1000;
    const d = new Date(ts);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const deadline = new Date(currentYear, currentMonth, 10);
  const isOverdue = now > deadline && !hasPaidThisMonth;
  const options = { day: 'numeric', month: 'long', year: 'numeric' };

  return (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e40af', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#fbbf24' }}></span>Simpanan Wajib
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>Kewajiban bulanan anggota</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a' }}>Rp25.000</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>/ Bulan</div>
        </div>
      </div>

      <div style={{ background: hasPaidThisMonth ? '#f0fdf4' : '#fff7ed', padding: '16px', borderRadius: '8px', border: hasPaidThisMonth ? '1px solid #bbf7d0' : '1px solid #fed7aa' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ color: hasPaidThisMonth ? '#16a34a' : '#ea580c' }}>
              {hasPaidThisMonth ? <CheckCircleIcon /> : <CalendarIcon />}
            </span>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', color: hasPaidThisMonth ? '#166534' : '#9a3412' }}>
                {hasPaidThisMonth ? 'Sudah Lunas' : 'Belum Dibayar'}
              </div>
              {!hasPaidThisMonth && (
                <div style={{ fontSize: '0.8rem', color: isOverdue ? '#dc2626' : '#9a3412' }}>
                  Jatuh Tempo: <b>{deadline.toLocaleDateString('id-ID', options)}</b>
                </div>
              )}
              {hasPaidThisMonth && (
                <div style={{ fontSize: '0.8rem', color: '#166534' }}>
                  Terima kasih sudah membayar tepat waktu.
                </div>
              )}
            </div>
          </div>
          {!hasPaidThisMonth && (
            <button
              onClick={handlePay}
              disabled={isLoading || loading}
              style={{
                background: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                opacity: isLoading || loading ? 0.7 : 1
              }}
            >
              {loading ? 'Memproses...' : 'Bayar Sekarang'}
            </button>
          )}
        </div>
      </div>

      <InlineMessage message={msg} isError={isError} />
    </div>
  );
};

const SimpananForm = ({ onSetor, isLoading, isPaymentLocked, paymentSuccess }) => {
  const [jumlah, setJumlah] = useState('');
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

  const handlePay = async () => {
    if (!jumlah) return;
    setLoading(true); setMsg('Memproses Pembayaran via Xendit...'); setIsError(false);

    try {
      await onSetor(jumlah, setMsg);
      // [FIX] Jangan langsung set sukses. Pesan sukses asli ada di SuccessModal.
      setMsg('Menunggu verifikasi pembayaran...');
      setJumlah('');
      setTimeout(() => setMsg(''), 5000);
    } catch (e) {
      if (e.message && e.message.includes("dibatalkan")) {
        setMsg("Pembayaran dibatalkan.");
      } else {
        console.error(e);
        setIsError(true);
        setMsg('Gagal: ' + (e.reason || e.message || "Error"));
      }
      setTimeout(() => setMsg(''), 5000);
    }
    setLoading(false);
  };

  return (
    <section>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Setor Simpanan Sukarela</h3>
        <p style={styles.cardText}>
          Tambahkan simpanan sukarela untuk meningkatkan saldo Anda di koperasi.
        </p>
        <input
          style={styles.input}
          type="number"
          value={jumlah}
          onChange={(e) => setJumlah(e.target.value)}
          onWheel={(e) => e.target.blur()} // Disable scroll value change
          placeholder="Masukkan jumlah (Rupiah)"
        />
        <button
          className="btn-animate"
          style={styles.button}
          onClick={handlePay}
          disabled={isLoading || loading || !jumlah}
        >
          {loading ? 'Memproses...' : 'Setor Sekarang'}
        </button>
        <InlineMessage message={msg} isError={isError} />
      </div>
    </section>
  );
};

export default SimpananForm;
