import React, { useState, useEffect } from 'react';

const PaymentModal = ({ isOpen, title, amount, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timer

    useEffect(() => {
        if (isOpen) {
            setTimeLeft(300);
            const timer = setInterval(() => {
                setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isOpen]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : '0'}${s}`;
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card-animate" style={{
                backgroundColor: 'white', padding: '24px', borderRadius: '16px',
                maxWidth: '400px', width: '90%', textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>{title}</h3>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '0.9rem' }}>Total Pembayaran</p>
                    <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem' }}>{amount}</h2>
                </div>

                <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* CSS Placeholder for QR Code */}
                    <div style={{
                        width: '200px',
                        height: '200px',
                        backgroundColor: '#fff',
                        backgroundImage: `
              linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000),
              linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)
            `,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 10px 10px',
                        border: '8px solid white',
                        boxShadow: '0 0 0 2px #000',
                        marginBottom: '8px'
                    }}></div>

                    <p style={{ marginTop: '8px', fontSize: '0.85rem', color: '#dc2626', fontWeight: 'bold' }}>
                        Selesaikan dalam: {formatTime(timeLeft)}
                    </p>
                </div>

                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '24px' }}>
                    Scan QRIS di atas menggunakan aplikasi e-wallet atau mobile banking Anda.
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                            background: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer'
                        }}
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                            background: '#2563eb', color: 'white', fontWeight: '600', cursor: 'pointer'
                        }}
                    >
                        Sudah Bayar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
