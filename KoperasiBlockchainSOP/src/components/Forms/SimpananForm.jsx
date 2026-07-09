// components/Forms/SimpananForm.jsx
import React, { useState, useEffect } from 'react';
import { cardStyles as styles } from '../../styles/cards';
import InlineMessage from '../InlineMessage';
import { formatCurrency, formatrupiah, parserupiah } from '../../utils/format';

const BoltIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
const CheckCircleIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const CalendarIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const AlertIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
);

export const SimpananWajibForm = ({ anggotaData, adminConfig, isLoading, isPaymentLocked, paymentSuccess, paymentType, onPay, onPayInternal }) => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const billAmount = anggotaData?.currentBilling || 0n;
  const hasActiveBill = billAmount > 0n;
  // [FIX] If no bill, show 0 to avoid "disuruh bayar 50rb" confusion when status is actually Lunas
  const displayAmount = hasActiveBill 
    ? Number(formatrupiah(billAmount)) 
    : 0;

  const totalBill = Number(formatrupiah(billAmount));
  const monthlyBillNominal = adminConfig?.wajib || 25000;
  const tunggakan = totalBill > monthlyBillNominal ? totalBill - monthlyBillNominal : 0;
  const tagihanBulanIni = totalBill > monthlyBillNominal ? monthlyBillNominal : totalBill;

  const wasLocked = React.useRef(false);

  // Clear message or show cancellation when payment modal is closed
  useEffect(() => {
    if (isPaymentLocked && paymentType === 'wajib') {
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

  const handlePay = async () => {
    setLoading(true);
    setMsg("Memproses Pembayaran tagihan...");
    setIsError(false);
    try {
      await onPay((message) => setMsg(message));
    } catch (err) {
      console.error(err);
      setIsError(true);
      setMsg("Gagal: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '24px', border: '2px solid', borderColor: hasActiveBill ? '#3b82f6' : '#e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e40af', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
             Simpanan Wajib & Tagihan
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {hasActiveBill ? <><AlertIcon size={14} /> Tagihan tertunda ditemukan.</> : 'Kewajiban bulanan teratur Anda.'}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: '900', color: hasActiveBill ? '#2563eb' : '#0f172a' }}>
            {formatCurrency(hasActiveBill ? totalBill : monthlyBillNominal)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{hasActiveBill ? 'Total Tagihan Aktif' : '/ Per Periode'}</div>
        </div>
      </div>

      <div style={{ background: hasActiveBill ? '#eff6ff' : '#f0fdf4', padding: '16px', borderRadius: '12px', border: hasActiveBill ? '1px solid #bfdbfe' : '1px solid #bbf7d0', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ color: hasActiveBill ? '#2563eb' : '#16a34a' }}>
              {hasActiveBill ? <BoltIcon /> : <CheckCircleIcon />}
            </span>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: hasActiveBill ? '#1e40af' : '#166534' }}>
                {hasActiveBill ? 'Tagihan Tersedia' : 'Status: Lunas / Tidak Ada Tagihan'}
              </div>
              <div style={{ fontSize: '0.8rem', color: hasActiveBill ? '#1e40af' : '#166534' }}>
                {hasActiveBill ? 'Segera lakukan pembayaran untuk menjaga skor kredit Anda.' : 'Semua kewajiban telah terpenuhi.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasActiveBill && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Tagihan Bulan Ini</div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>{formatCurrency(tagihanBulanIni)}</div>
          </div>
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: tunggakan > 0 ? '#fff1f2' : '#f8fafc', border: '1px solid', borderColor: tunggakan > 0 ? '#fecaca' : '#e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', color: tunggakan > 0 ? '#b91c1c' : '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Tunggakan (Arrears)</div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: tunggakan > 0 ? '#e11d48' : '#0f172a' }}>{formatCurrency(tunggakan)}</div>
          </div>
        </div>
      )}

      {hasActiveBill && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handlePay}
                disabled={isLoading || loading}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  boxShadow: '0 4px 10px -2px rgba(37, 99, 235, 0.4)'
                }}
              >
                {loading ? '...' : 'Bayar via Xendit'}
              </button>
              
              <button
                onClick={async () => {
                  setLoading(true); setMsg("Memproses potong saldo..."); setIsError(false);
                  try {
                    await onPayInternal((m) => setMsg(m));
                    setMsg(""); // Clear background message on success
                  } catch (e) {
                    setIsError(true); setMsg(e.message);
                    setTimeout(() => setMsg(''), 5000);
                  } finally { setLoading(false); }
                }}
                disabled={isLoading || loading || BigInt(anggotaData?.simpananSukarela || 0) < billAmount}
                style={{
                  background: '#fff',
                  color: BigInt(anggotaData?.simpananSukarela || 0) < billAmount ? '#94a3b8' : '#2563eb',
                  border: '1px solid',
                  borderColor: BigInt(anggotaData?.simpananSukarela || 0) < billAmount ? '#e2e8f0' : '#2563eb',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: BigInt(anggotaData?.simpananSukarela || 0) < billAmount ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                {BigInt(anggotaData?.simpananSukarela || 0) < billAmount ? 'Saldo Sukarela Tidak Cukup' : 'Potong Saldo Sukarela'}
              </button>
            </div>
          )}
      <InlineMessage message={msg} isError={isError} />
    </div>
  );
};

const SimpananForm = ({ onSetor, isLoading, isPaymentLocked, paymentSuccess, paymentType }) => {
  const [jumlah, setJumlah] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const wasLocked = React.useRef(false);

  // Clear message or show cancellation when payment modal is closed
  useEffect(() => {
    if (isPaymentLocked && paymentType === 'simpanan') {
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

  const handlePay = async () => {
    if (!jumlah) return;
    setLoading(true); setMsg('Memproses Pembayaran via Xendit...'); setIsError(false);

    try {
      await onSetor(jumlah, setMsg);
      setJumlah('');
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
