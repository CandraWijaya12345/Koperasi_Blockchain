import React, { useState } from 'react';
import ConfirmationModal from '../ConfirmationModal';

const MoneySendIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;

const WithdrawForm = ({ onWithdraw, maxBalance, isLoading }) => {
    const [amount, setAmount] = useState('');
    const [localLoading, setLocalLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, message: '', isError: false });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount) return;

        setLocalLoading(true);
        try {
            await onWithdraw(amount, (msg) => {
                console.log(msg);
            });
            setAmount('');
            setAlertConfig({ isOpen: true, message: "Penarikan Berhasil!", isError: false });
        } catch (err) {
            setAlertConfig({ isOpen: true, message: "Gagal: " + (err.reason || err.message), isError: true });
        } finally {
            setLocalLoading(false);
        }
    };

    return (
        <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginTop: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#be123c', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Tarik Simpanan Sukarela
            </h3>

            <div style={{ marginBottom: '16px', padding: '12px', background: '#fff1f2', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#be123c' }}>
                    Saldo Tersedia: <strong>{maxBalance} IDRT</strong>
                </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                        Jumlah Penarikan (IDRT)
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
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
            </form>

            <ConfirmationModal
                isOpen={alertConfig.isOpen}
                title={alertConfig.isError ? "Gagal" : "Berhasil"}
                message={alertConfig.message}
                isAlert={true}
                confirmText="OK"
                onConfirm={() => setAlertConfig({ ...alertConfig, isOpen: false })}
                isDanger={alertConfig.isError}
            />
        </div>
    );
};

export default WithdrawForm;
