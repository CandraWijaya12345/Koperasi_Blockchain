import React, { useState, useEffect } from 'react';
import InlineMessage from '../InlineMessage';
import { formatToken } from '../../utils/format';

const AdminSettings = ({ config, onSetBunga, onSetDenda, onAddLiquidity, isLoading }) => {
    // Local states for forms
    const [bungaVal, setBungaVal] = useState('');
    const [dendaVal, setDendaVal] = useState('');
    const [liquidVal, setLiquidVal] = useState('');

    // Status messages per form
    const [status, setStatus] = useState({
        bunga: { msg: '', error: false },
        denda: { msg: '', error: false },
        liquid: { msg: '', error: false }
    });

    useEffect(() => {
        if (config) {
            setBungaVal(config.bunga || '');
            setDendaVal(config.denda || '');
        }
    }, [config]);

    const handleUpdateBunga = async (e) => {
        e.preventDefault();
        setStatus(p => ({ ...p, bunga: { msg: 'Memproses...', error: false } }));
        try {
            await onSetBunga(bungaVal, (m) => setStatus(p => ({ ...p, bunga: { msg: m, error: false } })));
            setStatus(p => ({ ...p, bunga: { msg: 'Berhasil diupdate!', error: false } }));
        } catch (err) {
            setStatus(p => ({ ...p, bunga: { msg: 'Gagal: ' + err.message, error: true } }));
        }
    };

    const handleUpdateDenda = async (e) => {
        e.preventDefault();
        setStatus(p => ({ ...p, denda: { msg: 'Memproses...', error: false } }));
        try {
            await onSetDenda(dendaVal, (m) => setStatus(p => ({ ...p, denda: { msg: m, error: false } })));
            setStatus(p => ({ ...p, denda: { msg: 'Berhasil diupdate!', error: false } }));
        } catch (err) {
            setStatus(p => ({ ...p, denda: { msg: 'Gagal: ' + err.message, error: true } }));
        }
    };

    const handleAddLiquidity = async (e) => {
        e.preventDefault();
        if (!liquidVal) return;
        setStatus(p => ({ ...p, liquid: { msg: 'Memproses...', error: false } }));
        try {
            await onAddLiquidity(liquidVal, (m) => setStatus(p => ({ ...p, liquid: { msg: m, error: false } })));
            setStatus(p => ({ ...p, liquid: { msg: 'Likuiditas berhasil ditambah!', error: false } }));
            setLiquidVal('');
        } catch (err) {
            setStatus(p => ({ ...p, liquid: { msg: 'Gagal: ' + err.message, error: true } }));
        }
    };

    const cardStyle = {
        background: '#fff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        marginBottom: '20px'
    };

    const labelStyle = { display: 'block', marginBottom: '8px', color: '#4b5563', fontWeight: '500' };
    const inputStyle = {
        width: '100%', padding: '10px', borderRadius: '8px',
        border: '1px solid #d1d5db', marginBottom: '12px'
    };
    const btnStyle = {
        padding: '10px 20px', borderRadius: '8px', border: 'none',
        background: '#2563eb', color: '#fff', fontWeight: '600', cursor: 'pointer'
    };

    return (
        <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Pengaturan & Konfigurasi</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

                {/* SUKU BUNGA */}
                <div style={cardStyle}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px' }}>Suku Bunga</h3>
                    <form onSubmit={handleUpdateBunga}>
                        <label style={labelStyle}>Bunga Bulanan (%)</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="number"
                                style={inputStyle}
                                value={bungaVal}
                                onChange={e => setBungaVal(e.target.value)}
                            />
                            <button style={btnStyle} disabled={isLoading}>Update</button>
                        </div>
                        <InlineMessage message={status.bunga.msg} isError={status.bunga.error} compact />
                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>
                            Persentase bunga flat yang dikenakan per bulan untuk pinjaman baru.
                        </p>
                    </form>
                </div>

                {/* DENDA */}
                <div style={cardStyle}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px' }}>Denda Keterlambatan</h3>
                    <form onSubmit={handleUpdateDenda}>
                        <label style={labelStyle}>Denda Harian (Permil ‰)</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="number"
                                style={inputStyle}
                                value={dendaVal}
                                onChange={e => setDendaVal(e.target.value)}
                            />
                            <button style={{ ...btnStyle, background: '#ea580c' }} disabled={isLoading}>Update</button>
                        </div>
                        <InlineMessage message={status.denda.msg} isError={status.denda.error} compact />
                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>
                            1 Permil = 0.1%. Denda dihitung harian dari sisa pokok pinjaman.
                        </p>
                    </form>
                </div>



            </div>
        </div>
    );
};

export default AdminSettings;
