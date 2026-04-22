import React, { useState } from 'react';
import PendingLoanItem from './PendingLoanItem';
import InlineMessage from '../InlineMessage'; // Import InlineMessage
import { formatCurrency, formatToken } from '../../utils/format';

const LoanManagement = ({ allLoans, onApprove, onReject, onApproveSurvey, onApproveCommittee, isLoading, systemStatus, adminConfig }) => {
    const [activeTab, setActiveTab] = useState('pending'); // pending, active, paid, rejected
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);

    const [selectedLoan, setSelectedLoan] = useState(null);

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
                    Belum ada data pinjaman {type === 'active' ? 'Aktif' : type === 'paid' ? 'Lunas' : 'Ditolak'}.
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
                            <th style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b' }}>Nominal</th>
                            <th style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b' }}>Tanggal</th>
                            {type === 'active' && <th style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b' }}>Jatuh Tempo</th>}
                            <th style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b', textAlign: 'right' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loans.map((loan) => {
                            const id = Number(loan.args.id || loan.args.loanId);
                            const peminjam = loan.args.peminjam || '0x...';
                            const rawAmount = loan.amountOverride || loan.args.jumlah || loan.args.jumlahPinjaman || 0n;
                            const jumlah = formatCurrency(formatToken(rawAmount));

                            // Date handling
                            const dateObj = new Date(loan.extractedTimestamp * 1000);
                            const dateStr = dateObj.toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'short', year: 'numeric'
                            });

                            let statusBadges = {
                                active: <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 'bold' }}>Aktif</span>,
                                paid: <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 'bold' }}>Lunas</span>,
                                rejected: <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 'bold' }}>Ditolak</span>
                            };

                            return (
                                <tr key={`${type}-${id}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px', fontWeight: 'bold' }}>#{id}</td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                            {peminjam.substring(0, 8)}...{peminjam.substring(34)}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px', fontWeight: '700', color: '#0f172a' }}>{jumlah}</td>
                                    <td style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b' }}>{dateStr}</td>
                                    {type === 'active' && (
                                        <td style={{ padding: '12px', fontSize: '0.85rem', color: '#e11d48', fontWeight: '600' }}>
                                            {loan.jatuhTempoProp ? new Date(Number(loan.jatuhTempoProp) * 1000).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                    )}
                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                        <button 
                                            onClick={() => setSelectedLoan({ ...loan, type })}
                                            style={{
                                                background: '#f1f5f9',
                                                border: 'none',
                                                color: '#64748b',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => { e.target.style.background = '#e2e8f0'; e.target.style.color = '#0f172a'; }}
                                            onMouseLeave={(e) => { e.target.style.background = '#f1f5f9'; e.target.style.color = '#64748b'; }}
                                        >
                                            Rincian
                                        </button>
                                    </td>
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
                                        onApproveSurvey={onApproveSurvey}
                                        onApproveCommittee={onApproveCommittee}
                                        loading={isLoading}
                                        onNotify={handleNotify}
                                        systemStatus={systemStatus}
                                        adminConfig={adminConfig}
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

            {/* LOAN DETAIL MODAL */}
            {selectedLoan && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
                }} onClick={() => setSelectedLoan(null)}>
                    <div 
                        style={{ 
                            background: '#fff', width: '90%', maxWidth: '500px', borderRadius: '20px', 
                            padding: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            position: 'relative', overflow: 'hidden'
                        }} 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header Gradient Decor */}
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', background: 'linear-gradient(90deg, #2563eb, #3b82f6)' }}></div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 4px 0', color: '#0f172a' }}>Rincian Pinjaman #{Number(selectedLoan.args.id || selectedLoan.args.loanId)}</h3>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ 
                                        background: selectedLoan.type === 'active' ? '#dbeafe' : selectedLoan.type === 'paid' ? '#dcfce7' : '#fee2e2',
                                        color: selectedLoan.type === 'active' ? '#1e40af' : selectedLoan.type === 'paid' ? '#166534' : '#991b1b',
                                        padding: '2px 10px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase'
                                    }}>
                                        {selectedLoan.type}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>• Transaksi Blockchain</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedLoan(null)}
                                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Peminjam Info */}
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>Address Peminjam</p>
                                <p style={{ fontSize: '0.9rem', fontFamily: 'monospace', wordBreak: 'break-all', color: '#0f172a', margin: 0 }}>
                                    {selectedLoan.args.peminjam || '0x...'}
                                </p>
                            </div>

                            {/* Nominal & Progress */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Nominal Pinjaman</p>
                                    <p style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                                        {formatCurrency(formatToken(selectedLoan.amountOverride || selectedLoan.args.jumlah || selectedLoan.args.jumlahPinjaman || 0n))}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Tgl. Pengajuan</p>
                                    <p style={{ fontSize: '1rem', fontWeight: '600', color: '#334155', margin: 0 }}>
                                        {new Date(selectedLoan.extractedTimestamp * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            {/* Transaction Proof */}
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                                <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '10px' }}>Blockchain Transaction Proof</p>
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ overflow: 'hidden' }}>
                                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '2px' }}>Tx Hash</p>
                                        <p style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#3b82f6', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {selectedLoan.transactionHash}
                                        </p>
                                    </div>
                                    <a 
                                        href={`https://amoy.polygonscan.com/tx/${selectedLoan.transactionHash}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{ 
                                            background: '#3b82f6', color: '#fff', textDecoration: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold'
                                        }}
                                    >
                                        Buka ↗
                                    </a>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedLoan(null)}
                            style={{ 
                                width: '100%', marginTop: '30px', padding: '14px', borderRadius: '12px', 
                                background: '#0f172a', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer' 
                            }}
                        >
                            Tutup Rincian
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoanManagement;
