import React, { useState, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { cardStyles as styles } from '../../styles/cards';
import { formatCurrency } from '../../utils/format';
import InlineMessage from '../InlineMessage';

const RegisterForm = ({ onRegister, isLoading, isPaymentLocked, paymentSuccess, paymentType, userAddress, adminConfig }) => {
  const [step, setStep] = useState(() => {
    try {
      const addr = userAddress ? userAddress.toLowerCase() : null;
      const saved = addr ? sessionStorage.getItem(`register_form_step_${addr}`) : null;
      if (saved) {
        const val = parseInt(saved);
        if (val >= 1 && val <= 3) return val;
      }
    } catch (e) {}
    return 1;
  });
  const [formData, setFormData] = useState(() => {
    try {
      const addr = userAddress ? userAddress.toLowerCase() : null;
      const saved = addr ? sessionStorage.getItem(`register_form_data_${addr}`) : null;
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
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
    };
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [ktpPhoto, setKtpPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(() => {
    const addr = userAddress ? userAddress.toLowerCase() : null;
    return addr ? sessionStorage.getItem(`register_ktp_photo_base64_${addr}`) : null;
  });

  const activeAddressRef = React.useRef(userAddress);

  // [MITIGASI] Reload form data and step when userAddress switches
  useEffect(() => {
    const addr = userAddress ? userAddress.toLowerCase() : null;
    if (addr) {
      const savedStep = sessionStorage.getItem(`register_form_step_${addr}`);
      if (savedStep) {
        const val = parseInt(savedStep);
        if (val >= 1 && val <= 3) setStep(val);
      } else {
        setStep(1);
      }

      const savedData = sessionStorage.getItem(`register_form_data_${addr}`);
      if (savedData) {
        setFormData(JSON.parse(savedData));
      } else {
        setFormData({
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
      }

      const savedPhoto = sessionStorage.getItem(`register_ktp_photo_base64_${addr}`);
      setPhotoPreview(savedPhoto || null);
    } else {
      setStep(1);
      setFormData({
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
      setPhotoPreview(null);
    }
    setKtpPhoto(null);
    setErrors({});
    setMsg('');
    setIsError(false);
    
    // Update ref to allow writes to new account
    activeAddressRef.current = userAddress;
  }, [userAddress]);

  useEffect(() => {
    if (userAddress && activeAddressRef.current && userAddress.toLowerCase() === activeAddressRef.current.toLowerCase()) {
      sessionStorage.setItem(`register_form_step_${userAddress.toLowerCase()}`, step.toString());
    }
  }, [step, userAddress]);

  useEffect(() => {
    if (userAddress && activeAddressRef.current && userAddress.toLowerCase() === activeAddressRef.current.toLowerCase()) {
      sessionStorage.setItem(`register_form_data_${userAddress.toLowerCase()}`, JSON.stringify(formData));
    }
  }, [formData, userAddress]);

  useEffect(() => {
    if (paymentSuccess && paymentType === 'POKOK' && userAddress) {
      const addr = userAddress.toLowerCase();
      sessionStorage.removeItem(`register_form_step_${addr}`);
      sessionStorage.removeItem(`register_form_data_${addr}`);
      sessionStorage.removeItem(`register_ktp_photo_base64_${addr}`);
    }
  }, [paymentSuccess, paymentType, userAddress]);

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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setMsg("Mengompres foto...");

    const options = {
      maxSizeMB: 0.2, // Target 200KB
      maxWidthOrHeight: 1280,
      useWebWorker: true,
      fileType: 'image/webp'
    };

    try {
      const compressedFile = await imageCompression(file, options);
      setKtpPhoto(compressedFile);
      
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Gagal membaca berkas KTP"));
        reader.readAsDataURL(compressedFile);
      });
      if (userAddress) {
        sessionStorage.setItem(`register_ktp_photo_base64_${userAddress.toLowerCase()}`, base64);
      }
      setPhotoPreview(base64);
      setMsg("Foto berhasil dikompres!");
      setIsError(false);
      setErrors(prev => ({ ...prev, ktpPhoto: "" }));
    } catch (error) {
      console.error("Compression error:", error);
      setIsError(true);
      setMsg("Gagal mengompres foto. Silakan coba lagi.");
    }
    setLoading(false);
  };

  const wasLocked = React.useRef(false);

  useEffect(() => {
    if (isPaymentLocked && paymentType === 'POKOK') {
      wasLocked.current = true;
    } else if (!isPaymentLocked && wasLocked.current) {
      wasLocked.current = false;
      if (paymentSuccess) {
        setMsg('');
      } else {
        setMsg('Pembayaran dibatalkan atau belum terverifikasi.');
        setIsError(true);
        setTimeout(() => setMsg(''), 5000);
      }
    }
  }, [isPaymentLocked, paymentSuccess, paymentType]);

  const validateStep = (s) => {
    const stepErrors = {};
    if (s === 1) {
        if (!formData.nama || errors.nama) stepErrors.nama = errors.nama || "Nama wajib diisi";
        if (!formData.noHP || errors.noHP) stepErrors.noHP = errors.noHP || "No HP wajib diisi";
        if (!formData.noKTP || errors.noKTP) stepErrors.noKTP = errors.noKTP || "NIK wajib diisi";
        const hasPhoto = ktpPhoto || photoPreview || (userAddress && sessionStorage.getItem(`register_ktp_photo_base64_${userAddress.toLowerCase()}`));
        if (!hasPhoto) stepErrors.ktpPhoto = "Foto KTP wajib diunggah";
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
        const firstErrorKey = Object.keys(stepErrors)[0];
        setMsg(stepErrors[firstErrorKey]);
        return false;
    }
    return true;
  };

  const validateAll = () => {
    const allErrors = {};
    
    // Step 1
    if (!formData.nama || errors.nama) allErrors.nama = errors.nama || "Nama wajib diisi";
    if (!formData.noHP || errors.noHP) allErrors.noHP = errors.noHP || "No HP wajib diisi";
    if (!formData.noKTP || errors.noKTP) allErrors.noKTP = errors.noKTP || "NIK wajib diisi";
    const hasPhoto = ktpPhoto || photoPreview || sessionStorage.getItem('register_ktp_photo_base64');
    if (!hasPhoto) allErrors.ktpPhoto = "Foto KTP wajib diunggah";

    // Step 2
    if (!formData.alamat || errors.alamat) allErrors.alamat = errors.alamat || "Alamat wajib diisi";
    if (!formData.jobType) allErrors.jobType = "Pekerjaan wajib dipilih";
    if (formData.jobType === 'Lainnya' && !formData.jobOther) allErrors.jobOther = "Detail wajib diisi";

    // Step 3
    if (!formData.emergencyName || errors.emergencyName) allErrors.emergencyName = errors.emergencyName || "Nama wajib diisi";
    if (!formData.emergencyPhone || errors.emergencyPhone) allErrors.emergencyPhone = errors.emergencyPhone || "No HP wajib diisi";

    if (Object.keys(allErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...allErrors }));
        setIsError(true);
        
        // Direct user back to the first failing step
        if (allErrors.nama || allErrors.noHP || allErrors.noKTP || allErrors.ktpPhoto) {
            setStep(1);
        } else if (allErrors.alamat || allErrors.jobType || allErrors.jobOther) {
            setStep(2);
        } else {
            setStep(3);
        }
        
        const firstErrorKey = Object.keys(allErrors)[0];
        setMsg(allErrors[firstErrorKey]);
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
    if (!validateAll()) return;
    setLoading(true);
    setMsg('Memproses pendaftaran...');
    setIsError(false);
    try {
      const jobValue = formData.jobType === 'Lainnya' ? formData.jobOther : formData.jobType;
      const emergencyValue = `${formData.emergencyName} (${formData.emergencyPhone})`;
      
      // Convert photo to base64 if exists, or use the one from sessionStorage
      let photoBase64 = photoPreview || (userAddress && sessionStorage.getItem(`register_ktp_photo_base64_${userAddress.toLowerCase()}`));
      if (!photoBase64 && ktpPhoto) {
        setMsg("Menyiapkan berkas foto...");
        photoBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = (e) => reject(new Error("Gagal membaca foto KTP"));
          reader.readAsDataURL(ktpPhoto);
        });
      }

      setMsg("Data siap! Memproses pendaftaran...");

      const params = {
        user: userAddress,
        nama: formData.nama,
        noHP: formData.noHP,
        noKTP: formData.noKTP,
        alamat: formData.alamat,
        gender: formData.gender,
        job: jobValue,
        emergency: emergencyValue,
        branchId: parseInt(formData.branchId),
        photoBase64: photoBase64 // Dikirim sebagai base64 ke server untuk di-upload setelah pembayaran berhasil
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
          <span className="stepper-label" style={{ fontWeight: '700', color: step >= s ? '#1e3a8a' : '#9ca3af', textTransform: 'uppercase' }}>
            {s === 1 ? 'Data Diri' : s === 2 ? 'Profil' : 'Konfirmasi'}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <section style={{ width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .form-step { animation: fadeIn 0.4s ease-out forwards; }
        
        .register-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #111827;
          margin-bottom: 8px;
        }
        .register-subtitle {
          color: #6b7280;
          font-size: 0.95rem;
        }
        .register-card {
          max-width: 500px;
          margin: 0 auto;
          padding: 32px;
          background-color: #fff;
          border-radius: 18px;
          box-shadow: 0 10px 30px rgba(15,23,42,0.06);
          border: 1px solid #e5e7eb;
          box-sizing: border-box;
          width: 100%;
          transition: all 0.3s ease;
        }
        .responsive-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
          width: 100%;
        }
        .stepper-label {
          font-size: 11px;
          transition: all 0.3s;
        }
        .responsive-btn-group {
          display: flex;
          gap: 12px;
          width: 100%;
        }
        
        @media (max-width: 520px) {
          .register-card {
            padding: 20px 16px !important;
            border-radius: 16px !important;
            box-shadow: 0 4px 20px rgba(15,23,42,0.04) !important;
          }
          .responsive-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .stepper-label {
            font-size: 9px !important;
            letter-spacing: -0.5px;
          }
          .register-title {
            font-size: 1.4rem !important;
          }
          .register-subtitle {
            font-size: 0.85rem !important;
          }
          .responsive-btn-group {
            gap: 8px !important;
          }
          .responsive-btn-group button {
            padding: 11px 16px !important;
            font-size: 14px !important;
          }
        }
      `}</style>

      <div className="register-card">
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

            <div style={{ marginBottom: '20px' }}>
              <label style={{ ...styles.statLabel, display: 'block', marginBottom: '6px', fontWeight: 600 }}>Foto KTP</label>
              <div style={{ 
                border: `2px dashed ${errors.ktpPhoto ? '#ef4444' : '#d1d5db'}`, 
                borderRadius: '12px', 
                padding: '16px', 
                textAlign: 'center',
                backgroundColor: '#f9fafb',
                cursor: 'pointer'
              }} onClick={() => document.getElementById('ktpInput').click()}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview KTP" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px' }} />
                ) : (
                  <div style={{ color: '#9ca3af' }}>
                    <p style={{ fontSize: '14px', marginBottom: '4px' }}>Klik untuk upload foto KTP</p>
                    <p style={{ fontSize: '11px' }}>Foto akan dikompres otomatis (Max 200KB)</p>
                  </div>
                )}
                <input 
                  id="ktpInput" 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange} 
                />
              </div>
              {errors.ktpPhoto && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.ktpPhoto}</p>}
            </div>

            <button style={styles.button} onClick={nextStep} disabled={loading}>
              {loading ? 'MEMPROSES...' : 'LANJUTKAN'}
            </button>
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
            <div className="responsive-grid">
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
            <div className="responsive-btn-group">
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
              <div className="responsive-grid" style={{ gap: '12px' }}>
                <div>
                  <label style={{ ...styles.statLabel, fontSize: '11px' }}>Nama</label>
                  <input style={{ ...styles.input, height: '40px', padding: '8px 12px', marginBottom: 0 }} value={formData.emergencyName} onChange={(e) => updateField('emergencyName', e.target.value)} placeholder="Nama" />
                </div>
                <div>
                  <label style={{ ...styles.statLabel, fontSize: '11px' }}>Nomor Handphone</label>
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
            <div className="responsive-btn-group">
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
