import React, { useState } from 'react';
import { formatToken } from '../../utils/format';
import InlineMessage from '../InlineMessage';

const MemberList = ({ members, onMint, isLoading, simpananLogs, compact }) => {
    const [mintAmounts, setMintAmounts] = useState({});
    const [loadingStates, setLoadingStates] = useState({});
    const [statusMsgs, setStatusMsgs] = useState({});

    const handleAmountChange = (addr, val) => {
        setMintAmounts(prev => ({ ...prev, [addr]: val }));
    };

    const handleMint = async (addr) => {
        const amount = mintAmounts[addr];
        if (!amount || amount <= 0) {
            setStatusMsgs(prev => ({ ...prev, [addr]: { text: 'Jumlah tidak valid', error: true } }));
            return;
        }

        setLoadingStates(prev => ({ ...prev, [addr]: true }));
        setStatusMsgs(prev => ({ ...prev, [addr]: { text: 'Minting...', error: false } }));

        try {
            // Callback wrapper for specific address
            const updateStatus = (msg) => {
                setStatusMsgs(prev => ({ ...prev, [addr]: { text: msg, error: false } }));
            };

            await onMint(addr, amount, updateStatus);
            setStatusMsgs(prev => ({ ...prev, [addr]: { text: 'Berhasil!', error: false } }));
            setMintAmounts(prev => ({ ...prev, [addr]: '' }));
        } catch (e) {
            console.error(e);
            setStatusMsgs(prev => ({ ...prev, [addr]: { text: 'Gagal: ' + (e.reason || e.message), error: true } }));
        }
        setLoadingStates(prev => ({ ...prev, [addr]: false }));
    };

    const checkWajibStatus = (addr) => {
        if (!simpananLogs) return false;
        const now = new Date();
        const curMonth = now.getMonth();
        const curYear = now.getFullYear();

        return simpananLogs.some(l =>
            l.dari.toLowerCase() === addr.toLowerCase() &&
            (l.jenis === 'Wajib') && // Ensure exact match with event arg
            new Date(l.timestamp * 1000).getMonth() === curMonth &&
            new Date(l.timestamp * 1000).getFullYear() === curYear
        );
    };

    if (!members || members.length === 0) {
        return <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>Belum ada anggota terdaftar.</div>;
    }

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                        <th style={styles.th}>Nama</th>
                        {!compact && <th style={styles.th}>Address</th>}
                        <th style={styles.th}>Simpanan Wajib (Bln Ini)</th>
                        {!compact && <th style={styles.th}>Simpanan Total</th>}
                        <th style={styles.th}>Aksi (Mint IDRT)</th>
                    </tr>
                </thead>
                <tbody>
                    {members.map((m, idx) => {
                        const isPaid = checkWajibStatus(m.address);
                        return (
                            <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={styles.td}>
                                    <div style={{ fontWeight: 600 }}>{m.nama}</div>
                                    {compact && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{m.address.substring(0, 6)}...{m.address.substring(38)}</div>}
                                </td>
                                {!compact && (
                                    <td style={styles.td}>
                                        <div style={{ fontSize: '0.85rem', color: '#666', fontFamily: 'monospace' }}>
                                            {m.address}
                                        </div>
                                    </td>
                                )}
                                <td style={styles.td}>
                                    <div
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '4px 10px',
                                            borderRadius: 20,
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            backgroundColor: isPaid ? '#dcfce7' : '#fee2e2',
                                            color: isPaid ? '#166534' : '#991b1b'
                                        }}
                                    >
                                        {isPaid ? '✅ Lunas' : '❌ Belum'}
                                    </div>
                                </td>
                                {!compact && (
                                    <td style={styles.td}>
                                        {formatToken(m.simpananPokok + m.simpananWajib + m.simpananSukarela)}
                                    </td>
                                )}
                                <td style={styles.td}>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <input
                                            type="number"
                                            placeholder="Juml"
                                            value={mintAmounts[m.address] || ''}
                                            onChange={(e) => handleAmountChange(m.address, e.target.value)}
                                            style={styles.input}
                                        />
                                        <button
                                            onClick={() => handleMint(m.address)}
                                            disabled={isLoading || loadingStates[m.address]}
                                            style={{
                                                ...styles.btn,
                                                opacity: (isLoading || loadingStates[m.address]) ? 0.7 : 1,
                                                cursor: (isLoading || loadingStates[m.address]) ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {loadingStates[m.address] ? '...' : 'Mint'}
                                        </button>
                                    </div>
                                    <InlineMessage
                                        message={statusMsgs[m.address]?.text}
                                        isError={statusMsgs[m.address]?.error}
                                        compact
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const styles = {
    th: {
        padding: '12px 16px',
        color: '#6b7280',
        fontSize: '0.85rem',
        fontWeight: 600,
        textTransform: 'uppercase'
    },
    td: {
        padding: '16px',
        verticalAlign: 'middle'
    },
    input: {
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid #d1d5db',
        width: '100px',
        fontSize: '0.9rem'
    },
    btn: {
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: 8,
        fontWeight: 600,
        fontSize: '0.85rem'
    }
};

export default MemberList;
