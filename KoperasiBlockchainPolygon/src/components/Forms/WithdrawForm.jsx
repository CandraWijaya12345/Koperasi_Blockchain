import React, { useState } from 'react';
import ConfirmationModal from '../ConfirmationModal';
import InlineMessage from '../InlineMessage';

const MoneySendIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;

const WithdrawForm = ({ onWithdraw, maxBalance, isLoading }) => {
    const [amount, setAmount] = useState('');
    const [bank, setBank] = useState('');
    const [rekening, setRekening] = useState('');
    const [localLoading, setLocalLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !bank || !rekening) {
            setMsg('Mohon lengkapi semua data');
            setIsError(true);
            return;
        }

        setLocalLoading(true);
        setMsg('Memproses penarikan...');
        setIsError(false);

        try {
            await onWithdraw(amount, bank, rekening, (message) => {
                setMsg(message);
            });
            setAmount('');
            setMsg('Penarikan Berhasil!');
            setTimeout(() => setMsg(''), 5000);
        } catch (err) {
            setIsError(true);
            setMsg("Gagal: " + (err.reason || err.message));
            setTimeout(() => setMsg(''), 5000);
        } finally {
            setLocalLoading(false);
        }
    };

    return (
        <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginTop: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#be123c', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#fbbf24' }}></span>Tarik Simpanan Sukarela
            </h3>

            <div style={{ marginBottom: '16px', padding: '12px', background: '#fff1f2', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#be123c' }}>
                    Saldo Tersedia: <strong>{maxBalance}</strong>
                </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                        Jumlah Penarikan (Rupiah)
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        onWheel={(e) => e.target.blur()} // Disable scroll value change
                        disabled={isLoading || localLoading}
                        placeholder="Contoh: 50000"
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                        Nama Bank
                    </label>
                    <select
                        value={bank}
                        onChange={(e) => setBank(e.target.value)}
                        disabled={isLoading || localLoading}
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '1rem',
                            outline: 'none',
                            backgroundColor: '#fff'
                        }}
                    >
                        <option value="">Pilih Bank</option>
                        <option value="bca">BCA</option>
                        <option value="bni">BNI</option>
                        <option value="bri">BRI</option>
                        <option value="mandiri">Mandiri</option>
                        <option value="cimb">CIMB Niaga</option>
                        <option value="permata">Permata</option>
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                        Nomor Rekening
                    </label>
                    <input
                        type="text"
                        value={rekening}
                        onChange={(e) => setRekening(e.target.value)}
                        disabled={isLoading || localLoading}
                        placeholder="Contoh: 1234567890"
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading || localLoading || !amount}
                    className="btn-animate"
                    style={{
                        backgroundColor: '#be123c',
                        color: 'white',
                        padding: '12px',
                        borderRadius: '999px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        border: 'none',
                        cursor: (isLoading || localLoading || !amount) ? 'not-allowed' : 'pointer',
                        opacity: (isLoading || localLoading || !amount) ? 0.7 : 1,
                        marginTop: '8px'
                    }}
                >
                    {localLoading ? 'Memproses...' : 'Tarik Saldo ke Wallet'}
                </button>
                <InlineMessage message={msg} isError={isError} />
            </form>
        </div>
    );
};

export default WithdrawForm;
