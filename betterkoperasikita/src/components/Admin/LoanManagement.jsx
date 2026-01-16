import React, { useState } from 'react';
import PendingLoanItem from './PendingLoanItem';
import InlineMessage from '../InlineMessage'; // Import InlineMessage
import { formatCurrency, formatToken } from '../../utils/format';

const LoanManagement = ({ allLoans, onApprove, onReject, isLoading }) => {
    const [activeTab, setActiveTab] = useState('pending'); // pending, active, paid, rejected
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);

    const handleNotify = (message, isErr = false) => {
        setMsg(message);
        setIsError(isErr);
        // Auto-clear success messages after 5 seconds
        if (!isErr) {
            setTimeout(() => setMsg(''), 5000);
        }
    };

    // Helper to render basic table for non-pending loans
    const renderTable = (loans, type) => {
        if (!loans || loans.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    Belum ada data pinjaman {type}.
                </div>
            );
        }

        return (
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                            <th style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b' }}>ID</th>
                            <th style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b' }}>Peminjam</th>
                            <th style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b' }}>Jumlah</th>
                            <th style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b' }}>Tanggal</th>
                            {type === 'active' && <th style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b' }}>Jatuh Tempo</th>}
                            <th style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loans.map((loan) => {
                            const id = Number(loan.args.id);
                            const peminjam = loan.args.peminjam;
                            const jumlah = formatCurrency(formatToken(loan.args.jumlah || loan.args.jumlahPinjaman || 0));

                            // Date handling
                            const dateObj = new Date(loan.extractedTimestamp * 1000);
                            const dateStr = dateObj.toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'short', year: 'numeric'
                            });

                            let statusBadges = {
                                active: <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '99px', fontSize: '0.75rem' }}>Aktif</span>,
                                paid: <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '99px', fontSize: '0.75rem' }}>Lunas</span>,
                                rejected: <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '99px', fontSize: '0.75rem' }}>Ditolak</span>
                            };

                            return (
                                <tr key={id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px', fontWeight: 'bold' }}>#{id}</td>
                                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>
                                        {peminjam.substring(0, 6)}...{peminjam.substring(38)}
                                    </td>
                                    <td style={{ padding: '12px' }}>{jumlah}</td>
                                    <td style={{ padding: '12px', fontSize: '0.85rem', color: '#666' }}>{dateStr}</td>
                                    {type === 'active' && (
                                        <td style={{ padding: '12px', fontSize: '0.85rem', color: '#666' }}>
                                            {/* Note: Active loans filtered from Disetujui event might not have Jatuh Tempo in args unless we look at PinjamanDisetujui args which has jatuhTempo as args[2] */}
                                            {loan.args.jatuhTempo ? new Date(Number(loan.args.jatuhTempo) * 1000).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                    )}
                                    <td style={{ padding: '12px' }}>{statusBadges[type]}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Manajemen Pinjaman</h2>

            {/* Notification Area */}
            <div style={{ marginBottom: '20px' }}>
                <InlineMessage message={msg} isError={isError} />
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '1px' }}>
                {['pending', 'active', 'paid', 'rejected'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            background: 'transparent',
                            borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
                            color: activeTab === tab ? '#2563eb' : '#64748b',
                            fontWeight: activeTab === tab ? '600' : '500',
                            cursor: 'pointer',
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab === 'pending' ? `Permintaan Baru (${allLoans.pending.length})` :
                            tab === 'active' ? `Aktif (${allLoans.active.length})` :
                                tab === 'paid' ? `Lunas (${allLoans.paid.length})` :
                                    `Ditolak (${allLoans.rejected.length})`}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
                {activeTab === 'pending' && (
                    <div>
                        {allLoans.pending.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Tidak ada permintaan pinjaman baru.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {allLoans.pending.map(loan => (
                                    <PendingLoanItem
                                        key={loan.args.id.toString()}
                                        loan={loan}
                                        onApprove={onApprove}
                                        onReject={onReject}
                                        extractTimestamp={loan.extractedTimestamp}
                                        loading={isLoading}
                                        onNotify={handleNotify} // Pass notify handler
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'active' && renderTable(allLoans.active, 'active')}
                {activeTab === 'paid' && renderTable(allLoans.paid, 'paid')}
                {activeTab === 'rejected' && renderTable(allLoans.rejected, 'rejected')}
            </div>
        </div>
    );
};

export default LoanManagement;
