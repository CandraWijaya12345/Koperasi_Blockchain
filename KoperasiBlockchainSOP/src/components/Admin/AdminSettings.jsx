// components/Admin/AdminSettings.jsx
import React, { useState, useEffect } from 'react';
import InlineMessage from '../InlineMessage';
import { cardStyles } from '../../styles/cards';

// --- Professional Icons ---
const SavingsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5c-1.5 0-2.8.6-3.5 1.5A8.8 8.8 0 0 0 11 5c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8c0-1.8-.6-3.5-1.5-4.8.9-.7 1.5-2 1.5-3.5a1 1 0 0 0-2 0c0 1.1-.9 2-2 2" /></svg>
);
const LoanIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
);
const InfoIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
);
const SaveIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
);
const PiggyIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5c-1.5 0-2.8.6-3.5 1.5A8.8 8.8 0 0 0 11 5c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8c0-1.8-.6-3.5-1.5-4.8.9-.7 1.5-2 1.5-3.5a1 1 0 0 0-2 0c0 1.1-.9 2-2 2" /><path d="M7 11h.01" /><path d="M11 11h.01" /></svg>
);
const ShieldCheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>
);

const localStyles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    },
    title: {
        fontSize: '1.25rem',
        fontWeight: '800',
        color: '#0f172a',
        margin: 0
    },
    // --- Active Summary Section ---
    summarySection: {
        backgroundColor: '#f1f5f9',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
    },
    summaryHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
        color: '#475569'
    },
    summaryTitle: {
        fontSize: '0.9rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        margin: 0
    },
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px'
    },
    summaryItem: {
        backgroundColor: '#ffffff',
        padding: '16px',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    summaryLabel: {
        fontSize: '0.7rem',
        color: '#64748b',
        fontWeight: '600',
        textTransform: 'uppercase'
    },
    summaryValue: {
        fontSize: '1.1rem',
        fontWeight: '800',
        color: '#0f172a'
    },
    summaryUnit: {
        fontSize: '0.75rem',
        color: '#94a3b8',
        fontWeight: '500'
    },

    // --- Input Form Section ---
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
    },
    card: {
        ...cardStyles.card,
        padding: '24px',
        margin: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)'
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px',
        color: '#2563eb'
    },
    cardTitle: {
        fontSize: '1rem',
        fontWeight: '700',
        color: '#1e293b',
        margin: 0
    },
    label: {
        display: 'block',
        fontSize: '0.75rem',
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '6px'
    },
    activeHint: {
        fontSize: '0.7rem',
        color: '#3b82f6',
        fontWeight: '600',
        marginBottom: '4px',
        display: 'block'
    },
    input: {
        ...cardStyles.input,
        padding: '10px 12px',
        fontSize: '0.9rem',
        borderRadius: '10px',
        marginBottom: '8px'
    },
    helper: {
        fontSize: '0.75rem',
        color: '#94a3b8',
        lineHeight: '1.4',
        marginBottom: '12px'
    },
    footer: {
        marginTop: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '24px',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    },
    saveButton: {
        ...cardStyles.button,
        width: 'fit-content',
        padding: '14px 40px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '1rem',
        fontWeight: '700',
        boxShadow: '0 10px 15px -3px rgba(37,99,235,0.3)',
        transition: 'all 0.2s'
    }
};

const formatIDR = (val) => {
    return new Intl.NumberFormat('id-ID').format(val || 0);
};

const AdminSettings = ({ config, onUpdate, isLoading }) => {
    const [formData, setFormData] = useState({
        bungaSimpanan: '9', // Max limit is 9%
        bungaPinjaman: '12',
        dendaHarian: '1',
        pokok: '100000',
        adm: '0'
    });

    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);
    const [localLoading, setLocalLoading] = useState(false);

    // [FIX] Update formData only when config is loaded, but NOT while user is actively editing/saving
    useEffect(() => {
        if (config && !localLoading) {
            setFormData({
                bungaSimpanan: config.bunga?.toString() || '9',
                bungaPinjaman: config.bungaPinjaman?.toString() || '12',
                dendaHarian: config.denda?.toString() || '1',
                pokok: config.pokok?.toString() || '100000',
                adm: config.adm?.toString() || '0'
            });
        }
    }, [config, localLoading]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLocalLoading(true);
        setMsg('Memproses beberapa transaksi blockchain secara berurutan... Mohon tunggu.');
        setIsError(false);

        try {
            const params = {
                bungaSimpanan: parseInt(formData.bungaSimpanan),
                bungaPinjaman: parseInt(formData.bungaPinjaman),
                dendaHarian: parseInt(formData.dendaHarian),
                pokok: formData.pokok,
                adm: formData.adm
            };
            await onUpdate(params, (m) => setMsg(m));
            setMsg('Parameter berhasil diperbarui! Menunggu sinkronisasi akhir...');
            
            // Notification cleanup
            setTimeout(() => setMsg(''), 8000);
        } catch (err) {
            console.error(err);
            setIsError(true);
            setMsg('Gagal: ' + (err.message || err));
        }
        setLocalLoading(false);
    };

    return (
        <div style={localStyles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={localStyles.title}>Konfigurasi Sistem</h2>
            </div>

            {/* --- DASHBOARD: KONFIGURASI AKTIF --- */}
            <div style={localStyles.summarySection}>
                <div style={localStyles.summaryHeader}>
                    <ShieldCheckIcon />
                    <h3 style={localStyles.summaryTitle}>Konfigurasi Aktif di Blockchain</h3>
                </div>
                <div style={localStyles.summaryGrid}>
                    <div style={localStyles.summaryItem}>
                        <span style={localStyles.summaryLabel}>Simpanan Pokok</span>
                        <span style={localStyles.summaryValue}>Rp {formatIDR(config?.pokok)}</span>
                        <span style={localStyles.summaryUnit}>IDRT</span>
                    </div>
                    <div style={localStyles.summaryItem}>
                        <span style={localStyles.summaryLabel}>Bunga Simpanan</span>
                        <span style={localStyles.summaryValue}>{config?.bunga}%</span>
                        <span style={localStyles.summaryUnit}>Per Tahun</span>
                    </div>
                    <div style={localStyles.summaryItem}>
                        <span style={localStyles.summaryLabel}>Bunga Pinjaman</span>
                        <span style={localStyles.summaryValue}>{config?.bungaPinjaman}%</span>
                        <span style={localStyles.summaryUnit}>Per Tahun</span>
                    </div>
                    <div style={localStyles.summaryItem}>
                        <span style={localStyles.summaryLabel}>Denda Harian</span>
                        <span style={localStyles.summaryValue}>{config?.denda}‰</span>
                        <span style={localStyles.summaryUnit}>Per Hari</span>
                    </div>
                </div>
            </div>

            <div style={localStyles.grid}>
                {/* MEMBERSHIP CONFIG */}
                <div style={localStyles.card}>
                    <div>
                        <div style={localStyles.cardHeader}>
                            <PiggyIcon />
                            <h3 style={localStyles.cardTitle}>Setelan Keanggotaan</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                            <div>
                                <label style={localStyles.label}>Ubah Simpanan Pokok</label>
                                <span style={localStyles.activeHint}>Aktif: Rp {formatIDR(config?.pokok)}</span>
                                <input
                                    type="number"
                                    style={localStyles.input}
                                    value={formData.pokok}
                                    placeholder="e.g. 100000"
                                    onChange={e => setFormData({ ...formData, pokok: e.target.value })}
                                />
                            </div>
                        </div>
                        <p style={localStyles.helper}>
                            Simpanan Pokok (Tabungan) yang ditarik saat Anggota baru mendaftar.
                        </p>
                    </div>
                </div>

                {/* SAVINGS CONFIG */}
                <div style={localStyles.card}>
                    <div>
                        <div style={localStyles.cardHeader}>
                            <SavingsIcon />
                            <h3 style={localStyles.cardTitle}>Simpanan & Imbal Hasil</h3>
                        </div>
                        <input
                            type="number"
                            max="9"
                            style={localStyles.input}
                            value={formData.bungaSimpanan}
                            onChange={e => setFormData({ ...formData, bungaSimpanan: e.target.value })}
                        />
                        <p style={localStyles.helper}>
                            Persentase imbal hasil tahunan (Maksimal 9% sesuai regulasi).
                        </p>
                    </div>
                </div>

                {/* LOAN CONFIG */}
                <div style={localStyles.card}>
                    <div>
                        <div style={localStyles.cardHeader}>
                            <LoanIcon />
                            <h3 style={localStyles.cardTitle}>Perkreditan & Penalti</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={localStyles.label}>Bunga Pinjaman (%)</label>
                                <span style={localStyles.activeHint}>Aktif: {config?.bungaPinjaman}%</span>
                                <input
                                    type="number"
                                    style={localStyles.input}
                                    value={formData.bungaPinjaman}
                                    onChange={e => setFormData({ ...formData, bungaPinjaman: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={localStyles.label}>Denda (‰ / hari)</label>
                                <span style={localStyles.activeHint}>Aktif: {config?.denda}‰</span>
                                <input
                                    type="number"
                                    style={localStyles.input}
                                    value={formData.dendaHarian}
                                    onChange={e => setFormData({ ...formData, dendaHarian: e.target.value })}
                                />
                            </div>
                        </div>
                        <p style={localStyles.helper}>
                            Ketentuan bunga pinjaman dan denda keterlambatan per mil.
                        </p>
                    </div>
                </div>
            </div>

            <div style={localStyles.footer}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ color: '#64748b', marginTop: '2px' }}><InfoIcon /></div>
                    <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: 1.6 }}>
                        <b>Penting:</b> Perubahan akan melalui proses <b>Zero-Gas</b> via Relayer. 
                        Waktu sinkronisasi blockchain Amoy biasanya membutuhkan waktu 5-10 detik untuk konfirmasi penuh. 
                        Nilai yang tampil di kotak "Konfigurasi Aktif" adalah data valid dari Smart Contract saat ini.
                    </p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <button 
                        style={{ 
                            ...localStyles.saveButton, 
                            backgroundColor: localLoading ? '#94a3b8' : '#2563eb',
                            cursor: localLoading ? 'not-allowed' : 'pointer'
                        }}
                        onClick={handleSubmit}
                        disabled={isLoading || localLoading}
                    >
                        {localLoading ? 'Memproses...' : (
                            <>
                                <SaveIcon />
                                <span>Simpan Parameter Baru</span>
                            </>
                        )}
                    </button>
                    {msg && <div style={{ minWidth: '300px' }}><InlineMessage message={msg} isError={isError} /></div>}
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
