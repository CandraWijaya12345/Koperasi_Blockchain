import React, { useState } from 'react';
import { formatCurrency } from '../../utils/format';
import InlineMessage from '../InlineMessage';
import { IDRTOKEN_CONTRACT_ADDRESS } from '../../utils/constants';

const FundManagement = ({ stats, onWithdraw, onAddLiquidity, onMint, isLoading }) => {
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

    return (
        <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Manajemen Dana & Penarikan</h2>

            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '12px' }}>Status Dana Kontrak</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '2.5rem' }}>🏦</div>
                    <div>
                        <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Saldo Tersedia di Smart Contract</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>
                            {stats.contractBalance ? formatCurrency(stats.contractBalance) : 'Rp0'}
                        </p>
                    </div>
                </div>

            </div>

            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px', color: '#2563eb' }}>Kirim IDRT ke User (Minting)</h3>
                <p style={{ marginBottom: '20px', color: '#4b5563', fontSize: '0.9rem' }}>
                    Berikan saldo awal (IDRT) ke alamat user agar mereka dapat mendaftar (membayar Simpanan Pokok).
                </p>

                <form onSubmit={handleMint}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Alamat Wallet User</label>
                        <input
                            type="text"
                            value={mintToAddr}
                            onChange={e => setMintToAddr(e.target.value)}
                            placeholder="0x..."
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Jumlah (IDRT)</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <input
                            type="number"
                            value={mintAmount}
                            onChange={e => setMintAmount(e.target.value)}
                            placeholder="Contoh: 100000 (Simpanan Pokok)"
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                background: '#2563eb', color: 'white', fontWeight: '600', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer'
                            }}
                        >
                            Kirim Token
                        </button>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                        <InlineMessage message={mintMsg} isError={isMintError} />
                    </div>
                </form>
            </div>

            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px', color: '#16a34a' }}>Tambah Likuiditas (Setor Dana)</h3>
                <p style={{ marginBottom: '20px', color: '#4b5563', fontSize: '0.9rem' }}>
                    Setor IDRT dari wallet admin ke kontrak koperasi untuk modal pinjaman.
                </p>

                <form onSubmit={handleAddLiquidity}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Jumlah Setoran (IDRT)</label>
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
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px', color: '#dc2626' }}>Emergency Withdraw</h3>
                <p style={{ marginBottom: '20px', color: '#4b5563', fontSize: '0.9rem' }}>
                    Tarik dana IDR Token dari kontrak ke wallet admin. Gunakan fitur ini jika ada kelebihan likuiditas atau kondisi darurat.
                </p>

                <form onSubmit={handleWithdraw}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Jumlah Penarikan (IDRT)</label>
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
        </div >
    );
};

export default FundManagement;
