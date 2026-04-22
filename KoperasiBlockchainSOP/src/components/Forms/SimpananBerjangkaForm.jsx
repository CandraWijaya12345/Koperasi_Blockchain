import React, { useState, useEffect } from 'react';
import { cardStyles as styles } from '../../styles/cards';
import InlineMessage from '../InlineMessage';
import { formatCurrency, formatToken, formatTokenInt } from '../../utils/format';

const LockIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const UnlockIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>;
const TrendingUpIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;

const SimpananBerjangkaForm = ({ 
  userTimeDeposits, 
  idrtBalance, 
  anggotaData, 
  onOpen, 
  onCair, 
  isLoading,
  annualInterestRate = 5 // Default to 5 if not provided
}) => {
  const [amount, setAmount] = useState('');
  const [tenor, setTenor] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  // Removed hardcoded: const annualInterestRate = 5; 
  const estimateInterest = (Number(amount || 0) * annualInterestRate * tenor) / 1200;

  const handleOpen = async () => {
    if (!amount || Number(amount) <= 0) {
      setMsg("Masukkan nominal yang valid");
      setIsError(true);
      return;
    }
    
    setLoading(true);
    setMsg("Menyiapkan pembukaan simpanan berjangka...");
    setIsError(false);
    
    try {
      await onOpen(amount, tenor, (m) => setMsg(m));
      setAmount('');
      setMsg("Simpanan Berjangka berhasil dibuka!");
      setTimeout(() => setMsg(''), 5000);
    } catch (err) {
      console.error(err);
      setIsError(true);
      setMsg("Gagal: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCairkan = async (index) => {
    setLoading(true);
    setMsg("Memproses pencairan...");
    setIsError(false);
    try {
      await onCair(index, (m) => setMsg(m));
      setMsg("Simpanan berhasil dicairkan!");
      setTimeout(() => setMsg(''), 5000);
    } catch (err) {
      console.error(err);
      setIsError(true);
      setMsg("Gagal: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  const activeDeposits = userTimeDeposits.filter(d => d.active);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
      {/* FORM CARD */}
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '16px' }}>
          <div>
            <h3 style={styles.cardTitle}>Simpanan Berjangka (Deposito)</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Investasikan saldo Sukarela Anda untuk imbal jasa yang lebih tinggi.
            </p>
          </div>
          <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '12px' }}>
            <TrendingUpIcon />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Nominal Investasi (Rupiah)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                style={{ ...styles.input, marginBottom: 0, paddingRight: '60px' }}
              />
              <button 
                onClick={() => setAmount(formatTokenInt(anggotaData?.simpananSukarela || 0n))}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer' }}
              >
                MAX
              </button>
            </div>
            <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
              <span>Saldo Sukarela Tersedia:</span>
              <span style={{ fontWeight: '600', color: '#1e40af' }}>{formatCurrency(formatToken(anggotaData?.simpananSukarela || 0n))}</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Pilih Jangka Waktu (Tenor)</label>
            <div style={{ display: 'flex', gap: '6px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
              {[1, 3, 6, 12].map(t => (
                <button
                  key={t}
                  onClick={() => setTenor(t)}
                  style={{
                    flex: 1,
                    background: tenor === t ? '#fff' : 'transparent',
                    color: tenor === t ? '#2563eb' : '#64748b',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 2px',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: tenor === t ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {t} Bln
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', gap: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Imbal Jasa Estimasi ({annualInterestRate}% p.a)</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#16a34a' }}>+ {formatCurrency(estimateInterest.toFixed(0))}</div>
          </div>
          <div style={{ width: '1.5px', backgroundColor: '#e2e8f0' }}></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Total Penerimaan Saat Jatuh Tempo</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>{formatCurrency((Number(amount || 0) + estimateInterest).toFixed(0))}</div>
          </div>
        </div>

        {msg && <InlineMessage message={msg} type={isError ? 'error' : 'info'} />}

        <button
          onClick={handleOpen}
          disabled={loading || isLoading || !amount}
          style={styles.button}
        >
          {loading ? 'Memproses Blockchain...' : 'Buka Simpanan Berjangka'}
        </button>
      </div>

      {/* LIST SECTION */}
      <div style={styles.card}>
        <h4 style={{ ...styles.cardTitle, fontSize: '16px', marginBottom: '16px' }}>
          Simpanan Berjangka Aktif ({activeDeposits.length})
        </h4>

        {activeDeposits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Anda belum memiliki simpanan berjangka yang aktif.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            {activeDeposits.map((dep) => {
              const now = Date.now() / 1000;
              const isMatured = now >= dep.lockUntil;
              const daysLeft = Math.ceil((dep.lockUntil - now) / 86400);

              return (
                <div key={dep.index} style={{ ...styles.loanCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: isMatured ? '#dcfce7' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isMatured ? '#16a34a' : '#d97706' }}>
                      {isMatured ? <UnlockIcon /> : <LockIcon />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>
                        {formatCurrency(formatToken(dep.amount))}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {isMatured ? 'Siap Dicairkan' : `Jatuh tempo dlm ${daysLeft} hari`}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#16a34a', marginBottom: '4px' }}>
                      Jasa: +{formatCurrency(formatToken(dep.interestRate))}
                    </div>
                    <button
                      onClick={() => handleCairkan(dep.index)}
                      disabled={!isMatured || loading}
                      style={{
                        backgroundColor: isMatured ? '#10b981' : '#f3f4f6',
                        color: isMatured ? '#fff' : '#9ca3af',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: isMatured ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {isMatured ? 'Cairkan' : 'Terkunci'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpananBerjangkaForm;
