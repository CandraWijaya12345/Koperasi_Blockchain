// components/Forms/RegisterForm.jsx
import React, { useState, useEffect } from 'react';
import { cardStyles as styles } from '../../styles/cards';
import { layoutStyles } from '../../styles/layout';
import { formatCurrency, formatToken, parseToken } from '../../utils/format';
import InlineMessage from '../InlineMessage';

const RegisterForm = ({ onRegister, isLoading, isPaymentLocked, paymentSuccess, userAddress, adminConfig }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nama: '',
    noHP: '',
    noKTP: '',
    alamat: '',
    gender: 'Laki-laki',
    job: '',
    emergency: '',
    branchId: '1'
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (!formData.nama || !formData.noHP || !formData.noKTP) {
      setIsError(true);
      setMsg("Mohon lengkapi data wajib (Nama, HP, KTP)");
      return;
    }

    setLoading(true);
    setMsg('Mempersiapkan pendaftaran blockchain...');
    setIsError(false);

    try {
      const params = {
        user: userAddress,
        nama: formData.nama,
        noHP: formData.noHP,
        noKTP: formData.noKTP,
        alamat: formData.alamat,
        gender: formData.gender,
        job: formData.job,
        emergency: formData.emergency,
        branchId: parseInt(formData.branchId)
      };

      await onRegister(params, (progressMsg) => {
        setMsg(progressMsg);
      });
      
      setMsg('Menunggu konfirmasi pembayaran...');
    } catch (e) {
      console.error("Register Error:", e);
      setIsError(true);
      setMsg('Gagal: ' + (e.reason || e.message));
    }
    setLoading(false);
  };

  const renderStepIndicator = () => (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', gap: '10px' }}>
      {[1, 2, 3].map((s) => (
        <div key={s} style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: step >= s ? '#6366f1' : '#e2e8f0',
          transition: 'all 0.3s ease'
        }} />
      ))}
    </div>
  );

  return (
    <section>
      <h3 style={layoutStyles.sectionTitle}>Pendaftaran Anggota Baru</h3>
      <div style={{ ...styles.card, maxWidth: '500px', margin: '0 auto' }}>
        {renderStepIndicator()}
        
        {step === 1 && (
          <div className="fade-in">
            <h4 style={{ marginBottom: '15px', color: '#1e293b' }}>Langkah 1: Informasi Dasar</h4>
            <label style={styles.label}>Nama Lengkap</label>
            <input
              style={styles.input}
              value={formData.nama}
              onChange={(e) => updateField('nama', e.target.value)}
              placeholder="Contoh: Budi Santoso"
            />
            <label style={styles.label}>Nomor WhatsApp</label>
            <input
              style={styles.input}
              value={formData.noHP}
              onChange={(e) => updateField('noHP', e.target.value)}
              placeholder="0812XXXXXXXX"
            />
            <label style={styles.label}>Nomor KTP</label>
            <input
              style={styles.input}
              value={formData.noKTP}
              onChange={(e) => updateField('noKTP', e.target.value)}
              placeholder="16-digit nomor KTP"
            />
            <button style={{ ...styles.button, marginTop: '10px' }} onClick={nextStep} disabled={!formData.nama || !formData.noHP}>
              Lanjut
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <h4 style={{ marginBottom: '15px', color: '#1e293b' }}>Langkah 2: Profil & Alamat</h4>
            <label style={styles.label}>Alamat Lengkap</label>
            <textarea
              style={{ ...styles.input, height: '80px', padding: '10px' }}
              value={formData.alamat}
              onChange={(e) => updateField('alamat', e.target.value)}
              placeholder="Alamat domisili saat ini"
            />
            <label style={styles.label}>Jenis Kelamin</label>
            <select 
              style={styles.input} 
              value={formData.gender} 
              onChange={(e) => updateField('gender', e.target.value)}
            >
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
            <label style={styles.label}>Pekerjaan</label>
            <input
              style={styles.input}
              value={formData.job}
              onChange={(e) => updateField('job', e.target.value)}
              placeholder="Contoh: Karyawan Swasta"
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ ...styles.button, backgroundColor: '#94a3b8' }} onClick={prevStep}>Kembali</button>
              <button style={styles.button} onClick={nextStep}>Lanjut</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <h4 style={{ marginBottom: '15px', color: '#1e293b' }}>Langkah 3: Kontak Darurat & Review</h4>
            <label style={styles.label}>Kontak Darurat (Nama & HP)</label>
            <input
              style={styles.input}
              value={formData.emergency}
              onChange={(e) => updateField('emergency', e.target.value)}
              placeholder="Contoh: Istri - 0813..."
            />
            <label style={styles.label}>Kantor Cabang</label>
            <select 
              style={styles.input} 
              value={formData.branchId} 
              onChange={(e) => updateField('branchId', e.target.value)}
            >
              <option value="1">Cabang Pusat (Jakarta)</option>
              <option value="2">Cabang Jawa Barat</option>
              <option value="3">Cabang Jawa Timur</option>
            </select>
            
            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem' }}>
              <p>📌 <strong>Total Biaya:</strong> {formatCurrency(adminConfig?.pokok ? adminConfig.pokok.toString() : '100000')} (Simpanan Pokok)</p>
              <p style={{ marginTop: '5px', color: '#64748b' }}>Pastikan data Anda sudah benar sebelum mendaftar.</p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ ...styles.button, backgroundColor: '#94a3b8' }} onClick={prevStep}>Kembali</button>
              <button 
                style={{ ...styles.button, backgroundColor: '#10b981' }} 
                onClick={handleSubmit} 
                disabled={isLoading || loading}
              >
                {loading ? '⏳ Memproses...' : 'Daftar Sekarang'}
              </button>
            </div>
          </div>
        )}

        <InlineMessage message={msg} isError={isError} />
      </div>
    </section>
  );
};

export default RegisterForm;
