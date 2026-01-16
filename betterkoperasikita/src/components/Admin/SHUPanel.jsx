import React, { useState } from 'react';
import { formatCurrency, formatToken } from '../../utils/format';
import InlineMessage from '../InlineMessage';

const SHUPanel = ({ stats, history, members, onDistribute, isLoading }) => {
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState(null);

    // Calculate simulation
    // stats.rawProfit and stats.rawTotalSimpanan are BigInts or large numbers from contract
    // But if formatToken converts to string decimals, we need raw values.
    // Assuming useKoperasi returns raw values in stats.

    const profit = stats.rawProfit ? BigInt(stats.rawProfit) : 0n;
    const totalSimpanan = stats.rawTotalSimpanan ? BigInt(stats.rawTotalSimpanan) : 1n; // avoid div by zero

    const simulation = React.useMemo(() => {
        if (!members || members.length === 0) return [];
        return members.map(m => {
            const simpanan = m.simpananPokok + m.simpananWajib + m.simpananSukarela; // Already BigInt from ethers?
            // Note: memberList data from useKoperasi might be Ethers Result or object.
            // useKoperasi fetchAllMembers maps them well.

            let share = 0n;
            if (profit > 0n && totalSimpanan > 0n) {
                share = (simpanan * profit) / totalSimpanan;
            }

            return {
                name: m.nama,
                address: m.address,
                simpanan: simpanan,
                share: share
            };
        }).sort((a, b) => {
            // Sort by share desc
            if (b.share > a.share) return 1;
            if (b.share < a.share) return -1;
            return 0;
        });
    }, [members, profit, totalSimpanan]);

    const handleDistribute = async () => {
        setShowConfirm(false);
        try {
            await onDistribute((m) => { setMsg(m); setIsError(false); });
            setMsg('SHU Berhasil dibagikan ke seluruh anggota!');
        } catch (e) {
            setMsg('Gagal: ' + e.message);
            setIsError(true);
        }
    };

    const cardStyle = {
        background: '#fff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
    };

    return (
        <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Pembagian Sisa Hasil Usaha (SHU)</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

                <div style={cardStyle}>
                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>💰</div>
                    <h3 style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>Profit Belum Dibagi</h3>
                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#0f172a', margin: '10px 0' }}>
                        {stats.profitBelumDibagi ? formatCurrency(stats.profitBelumDibagi) : 'Rp0'}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#666' }}>
                        Profit yang terkumpul dari bunga pinjaman dan belum didistribusikan.
                    </p>
                </div>

                <div style={cardStyle}>
                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📈</div>
                    <h3 style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>Total SHU Dibagikan</h3>
                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#16a34a', margin: '10px 0' }}>
                        {stats.totalSHUDibagikan ? formatCurrency(stats.totalSHUDibagikan) : 'Rp0'}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#666' }}>
                        Akumulasi total SHU yang pernah dibagikan ke anggota.
                    </p>
                </div>

            </div>

            <div style={{ marginTop: '24px', background: '#fff', padding: '24px', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px' }}>Aksi Distribusi</h3>
                <p style={{ marginBottom: '20px', color: '#4b5563' }}>
                    Klik tombol di bawah untuk membagikan seluruh profit yang tersedia secara proporsional kepada semua anggota berdasarkan jumlah simpanan mereka.
                </p>

                <button
                    onClick={() => setShowConfirm(true)}
                    disabled={isLoading || profit <= 0n}
                    style={{
                        background: profit > 0n ? '#2563eb' : '#94a3b8',
                        color: 'white', fontWeight: 'bold', padding: '12px 24px', borderRadius: '8px', border: 'none',
                        cursor: profit > 0n ? 'pointer' : 'not-allowed', fontSize: '1rem'
                    }}
                >
                    {isLoading ? 'Memproses...' : 'Simulasi & Bagikan SHU'}
                </button>

                <div style={{ marginTop: '10px' }}>
                    <InlineMessage message={msg} isError={isError} />
                </div>
            </div>

            {/* HISTORY SHU */}
            <div style={{ marginTop: '24px', background: '#fff', padding: '24px', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px' }}>Riwayat Pembagian SHU</h3>
                {history && history.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                                <th style={{ padding: '10px', color: '#64748b' }}>Tanggal</th>
                                <th style={{ padding: '10px', color: '#64748b' }}>Total Dibagikan</th>
                                <th style={{ padding: '10px', color: '#64748b' }}>Transaction Hash</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((h, i) => (
                                <tr
                                    key={i}
                                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    onClick={() => setSelectedHistory(h)}
                                >
                                    <td style={{ padding: '10px' }}>
                                        {new Date(h.timestamp * 1000).toLocaleString('id-ID', {
                                            dateStyle: 'medium', timeStyle: 'short'
                                        })}
                                    </td>
                                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#16a34a' }}>
                                        {formatCurrency(formatToken(h.total))}
                                    </td>
                                    <td style={{ padding: '10px', fontSize: '0.85rem', color: '#64748b', fontFamily: 'monospace' }}>
                                        {h.txHash ? h.txHash.substring(0, 16) + '...' : '-'}
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'right', color: '#cbd5e1' }}>ᐳ</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>Belum ada riwayat pembagian SHU.</p>
                )}
            </div>

            {/* CONFIRMATION POPUP */}
            {showConfirm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px' }}>Konfirmasi Pembagian</h3>
                        <p style={{ marginBottom: '16px', color: '#4b5563' }}>
                            Berikut adalah <strong>estimasi</strong> pembagian SHU berdasarkan saldo profit saat ini ({formatCurrency(formatToken(profit))}) dan total simpanan ({formatCurrency(formatToken(totalSimpanan))}).
                        </p>

                        <div style={{ overflowX: 'auto', marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                        <th style={{ padding: '8px' }}>Anggota</th>
                                        <th style={{ padding: '8px' }}>Total Simpanan</th>
                                        <th style={{ padding: '8px' }}>Estimasi SHU</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {simulation.map((s, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '8px' }}>
                                                <div style={{ fontWeight: '500' }}>{s.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.address.substring(0, 6)}...</div>
                                            </td>
                                            <td style={{ padding: '8px' }}>{formatCurrency(formatToken(s.simpanan))}</td>
                                            <td style={{ padding: '8px', fontWeight: 'bold', color: '#16a34a' }}>{formatCurrency(formatToken(s.share))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowConfirm(false)}
                                style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDistribute}
                                style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Ya, Bagikan Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HISTORY DETAIL POPUP */}
            {selectedHistory && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200
                }} onClick={() => setSelectedHistory(null)}>
                    <div
                        style={{ background: '#fff', width: '90%', maxWidth: '500px', borderRadius: '16px', padding: '24px', position: 'relative' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>Detail Pembagian SHU</h3>
                            <button
                                onClick={() => setSelectedHistory(null)}
                                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '8px' }}>📈</div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#16a34a' }}>SHU Didistribusikan</h4>
                            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '8px 0', color: '#0f172a' }}>
                                {formatCurrency(formatToken(selectedHistory.total))}
                            </p>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                {new Date(selectedHistory.timestamp * 1000).toLocaleString('id-ID', {
                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </p>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Transaction Hash</p>
                                <p style={{ fontSize: '0.85rem', fontFamily: 'monospace', wordBreak: 'break-all', color: '#334155' }}>
                                    {selectedHistory.txHash}
                                </p>
                            </div>

                            <a
                                href={`https://sepolia.etherscan.io/tx/${selectedHistory.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    width: '100%', padding: '12px', background: '#3b82f6', color: 'white',
                                    textDecoration: 'none', borderRadius: '8px', fontWeight: '600', marginTop: '16px'
                                }}
                            >
                                <span>Lihat di Etherscan</span>
                                <span style={{ fontSize: '1.1rem' }}>↗</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SHUPanel;
