import React, { useState } from 'react';
import { formatCurrency } from '../../utils/format';
import InlineMessage from '../InlineMessage';
import { IDRTOKEN_CONTRACT_ADDRESS } from '../../utils/constants';

const FundManagement = ({ stats, onWithdraw, onAddLiquidity, onMint, onSync, isLoading }) => {
    const [amount, setAmount] = useState('');
    const [depositAmount, setDepositAmount] = useState(''); // New state for deposit
    const [msg, setMsg] = useState('');
    const [depositMsg, setDepositMsg] = useState(''); // New msg for deposit
    const [isError, setIsError] = useState(false);
    const [isDepositError, setIsDepositError] = useState(false);

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
        setMintMsg('Memproses pengiriman token...');
        setIsMintError(false);
        try {
            await onMint(mintToAddr, mintAmount, (m) => setMintMsg(m));
            setMintMsg('Berhasil mengirim Token!');
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
            await onWithdraw(IDRTOKEN_CONTRACT_ADDRESS, amount, (m) => setMsg(m));
            setMsg('Penarikan dana berhasil!');
            setAmount('');
        } catch (err) {
            setMsg('Gagal: ' + err.message);
            setIsError(true);
        }
    };

    const handleAddLiquidity = async (e) => {
        e.preventDefault();
        if (!depositAmount) return;
        setDepositMsg('Memproses setoran...');
        setIsDepositError(false);
        try {
            await onAddLiquidity(depositAmount, (m) => setDepositMsg(m));
            setDepositMsg('Likuiditas berhasil ditambah!');
            setDepositAmount('');
        } catch (err) {
            setDepositMsg('Gagal: ' + err.message);
            setIsDepositError(true);
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Manajemen Dana & Penarikan</h2>

            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '12px' }}>Status Dana & Likuiditas</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginRight: 'auto' }}>
                                <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Saldo Gas Admin (POL)</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: Number(stats.adminPolBalance) < 0.05 ? '#dc2626' : '#0f172a' }}>
                                    {stats.adminPolBalance || '0'} POL
                                </p>
                                <p style={{ fontSize: '0.75rem', color: Number(stats.adminPolBalance) < 0.05 ? '#dc2626' : '#94a3b8', fontWeight: Number(stats.adminPolBalance) < 0.05 ? '600' : 'normal' }}>
                                    {Number(stats.adminPolBalance) < 0.05 ? '⚠️ SALDO KRITIS (Segera Top-up)' : 'Native token for gas fees'}
                                </p>
                            </div>
                        </div>
                    </div>
                    {syncMsg && <InlineMessage message={syncMsg} isError={syncMsg.includes('Gagal')} />}
                </div>




            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px', color: '#16a34a' }}>Tambah Likuiditas (Setor Dana)</h3>
                <p style={{ marginBottom: '20px', color: '#4b5563', fontSize: '0.9rem' }}>
                    Setor Dana dari wallet admin ke kontrak koperasi untuk modal pinjaman.
                </p>

                <form onSubmit={handleAddLiquidity}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Jumlah Setoran (Rupiah)</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <input
                            type="number"
                            value={depositAmount}
                            onChange={e => setDepositAmount(e.target.value)}
                            placeholder="Contoh: 500000"
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                background: '#16a34a', color: 'white', fontWeight: '600', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer'
                            }}
                        >
                            Setor Dana
                        </button>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                        <InlineMessage message={depositMsg} isError={isDepositError} />
                    </div>
                </form>
            </div>

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
        </div>
    );
};

export default FundManagement;
