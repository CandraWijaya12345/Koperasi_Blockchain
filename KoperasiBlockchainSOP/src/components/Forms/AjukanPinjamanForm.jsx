import React, { useState } from 'react';
import InlineMessage from '../InlineMessage';

const AjukanPinjamanForm = ({ onAjukan, isLoading, maxLimit, adminConfig }) => {
  const [amount, setAmount] = useState('');
  const [tenor, setTenor] = useState('12');
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Defensive parsing
  const bungaRate = adminConfig?.bungaPinjaman || 12;
  const dendaRate = adminConfig?.denda || 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !bank || !accountNumber) {
      setShowWarning(true);
      return;
    }
    if (Number(amount) <= 0) {
      setMsg('Jumlah pinjaman tidak valid');
      setIsError(true);
      return;
    }
    setShowWarning(false);

    setMsg('Memproses...');
    setIsError(false);
    try {
      await onAjukan(amount, tenor, bank, accountNumber, (m) => setMsg(m));
      setMsg('Berhasil!');
      setAmount('');
      setBank('');
      setAccountNumber('');
    } catch (err) {
      setMsg('Gagal: ' + (err.reason || err.message));
      setIsError(true);
    }
  };

  // Calculation Logic: (Amount * Rate/100 * Tenor) / 12
  const amountVal = parseFloat(amount) || 0;
  const tenorVal = parseInt(tenor) || 12;

  const totalBunga = (amountVal * (bungaRate / 100) * tenorVal) / 12;
  const totalBayar = amountVal + totalBunga;
  const cicilanPerBulan = totalBayar / tenorVal;

  // Formatting for display
  const formatRp = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // Inline simplified styles to avoid crash references
  const containerStyle = { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: 24 };
  const labelStyle = { display: 'block', marginBottom: '8px', color: '#64748b' };
  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '16px' };
  const btnStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 'bold', cursor: 'pointer', opacity: isLoading ? 0.7 : 1 };

  return (
    <div style={containerStyle}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e40af', marginBottom: '16px' }}>
        Ajukan Pinjaman
      </h3>

      <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
        <p style={{ margin: 0, fontWeight: 600, color: '#334155' }}>Info Parameter Pinjaman:</p>
        <ul style={{ margin: '8px 0 0 20px', color: '#475569', fontSize: '0.9rem' }}>
          <li>Suku Bunga: <b>{bungaRate}% per tahun</b></li>
          <li>Denda Harian: <b>{dendaRate}‰ (permil)</b></li>
          <li>Limit Maksimal: 3x Total Simpanan</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit}>
        <div>
          <label style={labelStyle}>Jumlah Pinjaman (Rupiah)</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onWheel={(e) => e.target.blur()} // Disable scroll value change
            placeholder="Contoh: 5000000"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Tenor (Bulan)</label>
          <select
            value={tenor}
            onChange={e => setTenor(e.target.value)}
            style={inputStyle}
          >
            <option value="3">3 Bulan</option>
            <option value="6">6 Bulan</option>
            <option value="12">12 Bulan</option>
            <option value="24">24 Bulan</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Nama Bank (Untuk Pencairan)</label>
          <select
            value={bank}
            onChange={e => setBank(e.target.value)}
            style={inputStyle}
          >
            <option value="">Pilih Bank</option>
            <option value="BCA">BCA</option>
            <option value="BRI">BRI</option>
            <option value="BNI">BNI</option>
            <option value="MANDIRI">Mandiri</option>
            <option value="PERMATA">Permata</option>
            <option value="CIMB">CIMB Niaga</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Nomor Rekening</label>
          <input
            type="text"
            value={accountNumber}
            onChange={e => setAccountNumber(e.target.value)}
            placeholder="Contoh: 1234567890"
            style={inputStyle}
          />
        </div>

        {amountVal > 0 && (
          <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #bfdbfe' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#1e3a8a' }}>Simulasi Pembayaran</h4>
            <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Pokok Pinjaman:</span>
                <b>{formatRp(amountVal)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Total Bunga ({tenorVal} bln):</span>
                <b style={{ color: '#ea580c' }}>+ {formatRp(totalBunga)}</b>
              </div>
              <div style={{ height: '1px', background: '#cbd5e1', margin: '4px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                <span style={{ fontWeight: 600, color: '#1e40af' }}>Total Harus Dibayar:</span>
                <b style={{ color: '#1e40af' }}>{formatRp(totalBayar)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#dbeafe', padding: '8px', borderRadius: '6px', marginTop: '4px' }}>
                <span style={{ fontWeight: 600, color: '#1e3a8a' }}>Cicilan / Bulan:</span>
                <b style={{ color: '#1e3a8a' }}>{formatRp(cicilanPerBulan)}</b>
              </div>
            </div>
          </div>
        )}

        {/* Warning only shown after submit attempt */}
        {showWarning && (!amount || !bank || !accountNumber) && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            background: '#fffbeb', border: '1px solid #fde68a',
            padding: '14px 16px', borderRadius: '10px', marginBottom: '16px',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div style={{ fontSize: '0.85rem', color: '#92400e' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Lengkapi data berikut sebelum mengajukan:</div>
              <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
                {!amount && <li>Jumlah pinjaman</li>}
                {!bank && <li>Nama bank untuk pencairan</li>}
                {!accountNumber && <li>Nomor rekening</li>}
              </ul>
            </div>
          </div>
        )}

        <button type="submit" style={btnStyle} disabled={isLoading}>
          {isLoading ? 'Memproses...' : 'Ajukan Sekarang'}
        </button>

        <div style={{ marginTop: '16px' }}>
          <InlineMessage message={msg} isError={isError} />
        </div>
      </form>
    </div>
  );
};

export default AjukanPinjamanForm;
