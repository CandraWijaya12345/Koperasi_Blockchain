// components/Forms/RegisterForm.jsx
import React, { useState, useEffect } from 'react';
import { cardStyles as styles } from '../../styles/cards';
import { formatCurrency } from '../../utils/format';
import InlineMessage from '../InlineMessage';

const RegisterForm = ({ onRegister, isLoading, isPaymentLocked, paymentSuccess, userAddress, adminConfig }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nama: '',
    noHP: '',
    noKTP: '',
    alamat: '',
    gender: 'Laki-laki',
    jobType: '', 
    jobOther: '', 
    emergencyName: '',
    emergencyPhone: '',
    branchId: '1'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const validateField = (name, value) => {
    let error = "";
    if (name === 'nama' || name === 'emergencyName') {
      if (value.length < 3) error = "Nama minimal 3 karakter";
      else if (!/^[a-zA-Z\s.]*$/.test(value)) error = "Nama hanya boleh berisi huruf, spasi, atau titik";
    }
    if (name === 'noHP' || name === 'emergencyPhone') {
      if (!/^08[0-9]{8,11}$/.test(value)) error = "Format HP tidak valid (Wajib 08...)";
    }
    if (name === 'noKTP') {
      if (value.length !== 16) error = "NIK harus tepat 16 digit";
    }
    if (name === 'alamat' && value.length < 10) {
      error = "Alamat terlalu singkat (Min 10 karakter)";
    }
    return error;
  };

  const updateField = (field, value) => {
    let sanitizedValue = value;
    if (field === 'noHP' || field === 'noKTP' || field === 'emergencyPhone') {
        sanitizedValue = value.replace(/[^0-9]/g, '');
    }
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    const error = validateField(field, sanitizedValue);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  useEffect(() => {
    if (!isPaymentLocked && msg.includes("Menunggu")) {
      if (paymentSuccess) {
        setMsg('');
      } else {
        setMsg('Pembayaran dibatalkan atau belum terverifikasi.');
        setIsError(true);
        setTimeout(() => setMsg(''), 5000);
      }
    }
  }, [isPaymentLocked, msg, paymentSuccess]);

  const validateStep = (s) => {
    const stepErrors = {};
    if (s === 1) {
        if (!formData.nama || errors.nama) stepErrors.nama = errors.nama || "Nama wajib diisi";
        if (!formData.noHP || errors.noHP) stepErrors.noHP = errors.noHP || "No HP wajib diisi";
        if (!formData.noKTP || errors.noKTP) stepErrors.noKTP = errors.noKTP || "NIK wajib diisi";
    }
    if (s === 2) {
        if (!formData.alamat || errors.alamat) stepErrors.alamat = errors.alamat || "Alamat wajib diisi";
        if (!formData.jobType) stepErrors.jobType = "Pekerjaan wajib dipilih";
        if (formData.jobType === 'Lainnya' && !formData.jobOther) stepErrors.jobOther = "Detail wajib diisi";
    }
    if (s === 3) {
        if (!formData.emergencyName || errors.emergencyName) stepErrors.emergencyName = errors.emergencyName || "Nama wajib diisi";
        if (!formData.emergencyPhone || errors.emergencyPhone) stepErrors.emergencyPhone = errors.emergencyPhone || "No HP wajib diisi";
    }
    if (Object.keys(stepErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...stepErrors }));
        setIsError(true);
        setMsg("Mohon lengkapi seluruh data.");
        return false;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
        setStep(prev => prev + 1);
        setMsg("");
        setIsError(false);
    }
  };
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    setLoading(true);
    setMsg('Memproses pendaftaran...');
    setIsError(false);
    try {
      const jobValue = formData.jobType === 'Lainnya' ? formData.jobOther : formData.jobType;
      const emergencyValue = `${formData.emergencyName} (${formData.emergencyPhone})`;
      const params = {
        user: userAddress,
        nama: formData.nama,
        noHP: formData.noHP,
        noKTP: formData.noKTP,
        alamat: formData.alamat,
        gender: formData.gender,
        job: jobValue,
        emergency: emergencyValue,
        branchId: parseInt(formData.branchId)
      };
      await onRegister(params, (progressMsg) => setMsg(progressMsg));
    } catch (e) {
      console.error(e);
      setIsError(true);
      setMsg('Gagal: ' + (e.reason || e.message));
    }
    setLoading(false);
  };

  const renderStepper = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '15px', left: '0', right: '0', height: '2px', backgroundColor: '#e5e7eb', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: '15px', left: '0', height: '2px', backgroundColor: '#2563eb', width: `${((step - 1) / 2) * 100}%`, transition: 'all 0.5s ease', zIndex: 0 }} />
      {[1, 2, 3].map((s) => (
        <div key={s} style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            backgroundColor: step >= s ? '#2563eb' : 'white',
            border: `2px solid ${step >= s ? '#2563eb' : '#e5e7eb'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: step >= s ? 'white' : '#9ca3af',
            fontWeight: '700', fontSize: '14px', transition: 'all 0.3s'
          }}>
            {s}
          </div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: step >= s ? '#1e3a8a' : '#9ca3af', textTransform: 'uppercase' }}>
            {s === 1 ? 'Data Diri' : s === 2 ? 'Profil' : 'Konfirmasi'}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <section>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .form-step { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>Koperasi Kita</h3>
        <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Mulai perjalanan finansial masa depan Anda hari ini.</p>
      </div>

      <div style={{ ...styles.card, maxWidth: '500px', margin: '0 auto', padding: '32px' }}>
        {renderStepper()}
        
        {step === 1 && (
          <div className="form-step">
            <h4 style={{ ...styles.cardTitle, marginBottom: '20px' }}>Informasi Identitas</h4>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ ...styles.statLabel, display: 'block', marginBottom: '6px', fontWeight: 600 }}>Nama Lengkap</label>
              <input
                style={{ ...styles.input, borderColor: errors.nama ? '#ef4444' : '#d1d5db', marginBottom: 0 }}
                value={formData.nama}
                onChange={(e) => updateField('nama', e.target.value)}
                placeholder="Nama sesuai KTP"
              />
              {errors.nama && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.nama}</p>}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ ...styles.statLabel, display: 'block', marginBottom: '6px', fontWeight: 600 }}>Nomor WhatsApp</label>
              <input
                style={{ ...styles.input, borderColor: errors.noHP ? '#ef4444' : '#d1d5db', marginBottom: 0 }}
                value={formData.noHP}
                onChange={(e) => updateField('noHP', e.target.value)}
                placeholder="0812XXXXXXXX"
              />
              {errors.noHP && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.noHP}</p>}
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ ...styles.statLabel, display: 'block', marginBottom: '6px', fontWeight: 600 }}>Nomor KTP (NIK)</label>
              <input
                style={{ ...styles.input, borderColor: errors.noKTP ? '#ef4444' : '#d1d5db', marginBottom: 0 }}
                value={formData.noKTP}
                onChange={(e) => updateField('noKTP', e.target.value)}
                placeholder="16 digit angka"
              />
              {errors.noKTP && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.noKTP}</p>}
            </div>
            <button style={styles.button} onClick={nextStep}>LANJUTKAN</button>
          </div>
        )}

        {step === 2 && (
          <div className="form-step">
            <h4 style={{ ...styles.cardTitle, marginBottom: '20px' }}>Profil & Alamat</h4>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ ...styles.statLabel, display: 'block', marginBottom: '6px', fontWeight: 600 }}>Alamat Lengkap</label>
              <textarea
                style={{ ...styles.input, height: '80px', padding: '12px', borderColor: errors.alamat ? '#ef4444' : '#d1d5db', marginBottom: 0, resize: 'none' }}
                value={formData.alamat}
                onChange={(e) => updateField('alamat', e.target.value)}
                placeholder="Alamat saat ini"
              />
              {errors.alamat && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.alamat}</p>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ ...styles.statLabel, display: 'block', marginBottom: '6px', fontWeight: 600 }}>Kelamin</label>
                <select style={styles.input} value={formData.gender} onChange={(e) => updateField('gender', e.target.value)}>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label style={{ ...styles.statLabel, display: 'block', marginBottom: '6px', fontWeight: 600 }}>Pekerjaan</label>
                <select style={{ ...styles.input, borderColor: errors.jobType ? '#ef4444' : '#d1d5db' }} value={formData.jobType} onChange={(e) => updateField('jobType', e.target.value)}>
                  <option value="">Pilih...</option>
                  <option value="Karyawan">Karyawan</option>
                  <option value="PNS">PNS/ASN</option>
                  <option value="Wiraswasta">Wiraswasta</option>
                  <option value="Lainnya">Lainnya...</option>
                </select>
              </div>
            </div>
            {formData.jobType === 'Lainnya' && (
              <div style={{ marginBottom: '16px' }}>
                <input style={{ ...styles.input, borderColor: errors.jobOther ? '#ef4444' : '#d1d5db' }} value={formData.jobOther} onChange={(e) => updateField('jobOther', e.target.value)} placeholder="Detail pekerjaan" />
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ ...styles.button, backgroundColor: '#f3f4f6', color: '#4b5563', boxShadow: 'none' }} onClick={prevStep}>KEMBALI</button>
              <button style={styles.button} onClick={nextStep}>LANJUT</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="form-step">
            <h4 style={{ ...styles.cardTitle, marginBottom: '20px' }}>Review & Kontak Darurat</h4>
            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase' }}>Kontak Darurat</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ ...styles.statLabel, fontSize: '11px' }}>Nama</label>
                  <input style={{ ...styles.input, height: '40px', padding: '8px 12px', marginBottom: 0 }} value={formData.emergencyName} onChange={(e) => updateField('emergencyName', e.target.value)} placeholder="Nama" />
                </div>
                <div>
                  <label style={{ ...styles.statLabel, fontSize: '11px' }}>No. HP</label>
                  <input style={{ ...styles.input, height: '40px', padding: '8px 12px', marginBottom: 0 }} value={formData.emergencyPhone} onChange={(e) => updateField('emergencyPhone', e.target.value)} placeholder="08..." />
                </div>
              </div>
            </div>
            <div style={{ ...styles.infoBox, backgroundColor: '#eff6ff', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Biaya Pendaftaran</span>
                <span style={{ fontWeight: 700, color: '#1e40af', fontSize: '1.1rem' }}>{formatCurrency(adminConfig?.pokok?.toString() || '100000')}</span>
              </div>
              <p style={{ fontSize: '12px', marginTop: '6px', opacity: 0.8 }}>Biaya ini akan disimpan sebagai Simpanan Pokok Anda.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ ...styles.button, backgroundColor: '#f3f4f6', color: '#4b5563', boxShadow: 'none' }} onClick={prevStep}>KEMBALI</button>
              <button style={{ ...styles.button, backgroundColor: '#10b981', boxShadow: '0 10px 25px rgba(16,185,129,0.3)' }} onClick={handleSubmit} disabled={isLoading || loading}>
                {loading ? 'MEMPROSES...' : 'DAFTAR SEKARANG'}
              </button>
            </div>
          </div>
        )}
        {msg && <div style={{ marginTop: '20px' }}><InlineMessage message={msg} isError={isError} /></div>}
      </div>
    </section>
  );
};

export default RegisterForm;
