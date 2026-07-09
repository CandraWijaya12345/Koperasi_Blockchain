import React, { useState } from 'react';
import { formatCurrency, formatrupiah } from '../../utils/format';
import InlineMessage from '../InlineMessage';
import { RUPIAH_ADDRESS } from '../../utils/constants';

const FundManagement = ({ stats, onWithdraw, onMint, onSync, isLoading }) => {
    const [amount, setAmount] = useState('');
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);

    // New state for Minting
    const [mintToAddr, setMintToAddr] = useState('');
    const [mintAmount, setMintAmount] = useState('');
    const [mintMsg, setMintMsg] = useState('');
    const [isMintError, setIsMintError] = useState(false);
    const [syncMsg, setSyncMsg] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);

    const handleMint = async (e) => {
        e.preventDefault();
        if (!mintToAddr || !mintAmount) {
            setMintMsg('Mohon isi alamat wallet dan jumlah.');
            setIsMintError(true);
            return;
        }
        setMintMsg('Memproses pengiriman rupiah...');
        setIsMintError(false);
        try {
            await onMint(mintToAddr, mintAmount, (m) => setMintMsg(m));
            setMintMsg('Berhasil mengirim rupiah!');
            setMintAmount('');
            setMintToAddr('');
        } catch (err) {
            setMintMsg('Gagal: ' + (err.reason || err.message));
            setIsMintError(true);
        }
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        if (!amount) return;

        try {
            setMsg('Memproses penarikan...');
            setIsError(false);
            await onWithdraw(RUPIAH_ADDRESS, amount, (m) => setMsg(m));
            setMsg('Penarikan dana berhasil!');
            setAmount('');
        } catch (err) {
            setMsg('Gagal: ' + err.message);
            setIsError(true);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncMsg('Menyelaraskan saldo...');
        try {
            await onSync((m) => setSyncMsg(m));
            setSyncMsg('Saldo berhasil disinkronisasi!');
            setTimeout(() => setSyncMsg(''), 5000);
        } catch (err) {
            setSyncMsg('Gagal: ' + err.message);
        }
        setIsSyncing(false);
    };

    return (
        <div>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '12px' }}>Status Dana & Likuiditas</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#eff6ff', borderRadius: '12px' }}>
                            <div style={{ marginRight: 'auto' }}>
                                <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Saldo Xendit (IDR)</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>
                                    {stats.xenditBalance ? formatCurrency(stats.xenditBalance) : 'Rp0'}
                                </p>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Real funds in Xendit Account</p>
                            </div>
                            <button
                                onClick={handleSync}
                                disabled={isLoading || isSyncing}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#3b82f6',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    opacity: isLoading || isSyncing ? 0.7 : 1
                                }}
                            >
                                {isSyncing ? 'Syncing...' : 'Sync'}
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                            <div style={{ marginRight: 'auto' }}>
                                <p style={{ fontSize: '0.9rem', color: '#166534' }}>Saldo Smart Contract (IDR)</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#15803d' }}>
                                    {stats.contractBalance ? formatCurrency(stats.contractBalance) : 'Rp0'}
                                </p>
                                <p style={{ fontSize: '0.75rem', color: '#166534' }}>Jumlah Rupiah digital di dalam pool Blockchain</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginRight: 'auto' }}>
                                <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Saldo Gas Admin (POL)</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: Number(stats.adminPolBalance) < 0.05 ? '#dc2626' : '#0f172a' }}>
                                    {stats.adminPolBalance || '0'} POL
                                </p>
                                <p style={{ fontSize: '0.75rem', color: Number(stats.adminPolBalance) < 0.05 ? '#dc2626' : '#94a3b8', fontWeight: Number(stats.adminPolBalance) < 0.05 ? '600' : 'normal' }}>
                                    {Number(stats.adminPolBalance) < 0.05 ? '⚠️ SALDO KRITIS (Segera Top-up)' : 'Native rupiah for gas fees'}
                                </p>
                            </div>
                        </div>
                    </div>
                    {syncMsg && <InlineMessage message={syncMsg} isError={syncMsg.includes('Gagal')} />}
                </div>

            {/* EMERGENCY WITHDRAWAL - DISABLED AS NOT SUPPORTED BY CONTRACT */}
            {/* 
            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px', color: '#dc2626' }}>Penarikan Darurat (Emergency)</h3>
                <p style={{ marginBottom: '20px', color: '#4b5563', fontSize: '0.9rem' }}>
                    Tarik dana dari kontrak ke wallet admin. Gunakan fitur ini jika ada kelebihan likuiditas atau kondisi darurat.
                </p>

                <form onSubmit={handleWithdraw}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Jumlah Penarikan (Rupiah)</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="Contoh: 1000000"
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                background: '#dc2626', color: 'white', fontWeight: '600', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer'
                            }}
                        >
                            Tarik Dana
                        </button>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                        <InlineMessage message={msg} isError={isError} />
                    </div>
                </form>
            </div>
            */}

            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                    ℹ️ Seluruh penarikan dana anggota diproses secara otomatis melalui integrasi Payout Xendit & Smart Contract.
                </p>
            </div>
        </div>
    );
};

export default FundManagement;
