import React from 'react';
import { formatCurrency, formatToken } from '../../utils/format';

const LoanHistory = ({ history }) => {
    // Filter events related to loans
    // PinjamanDiajukan, PinjamanDisetujui, PinjamanLunas, PinjamanDitolak
    const loanEvents = history.filter(log => 
        ['PinjamanDiajukan', 'PinjamanDisetujui', 'PinjamanLunas', 'PinjamanDitolak'].includes(log.fragment?.name)
    );

    // Grouping events by Loan ID for easier status reporting
    const loansById = {};
    loanEvents.forEach(log => {
        const id = Number(log.args.id);
        if (!loansById[id]) {
            loansById[id] = {
                id,
                jumlah: 0n,
                tenor: 0,
                status: 'DIPROSES',
                waktu: log.extractedTimestamp,
                alasanDitolak: ''
            };
        }

        const name = log.fragment.name;
        if (name === 'PinjamanDiajukan') {
            loansById[id].jumlah = log.args.jumlah;
            loansById[id].tenor = Number(log.args.tenor);
            loansById[id].waktu = log.extractedTimestamp;
        } else if (name === 'PinjamanDisetujui') {
            loansById[id].status = 'AKTIF';
        } else if (name === 'PinjamanLunas') {
            loansById[id].status = 'LUNAS';
        } else if (name === 'PinjamanDitolak') {
            loansById[id].status = 'DITOLAK';
            loansById[id].alasanDitolak = log.args.alasan || '';
        }
    });

    const loansList = Object.values(loansById).sort((a, b) => b.id - a.id);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'LUNAS': return { color: '#059669', bg: '#d1fae5' };
            case 'AKTIF': return { color: '#d97706', bg: '#fef3c7' };
            case 'DITOLAK': return { color: '#dc2626', bg: '#fee2e2' };
            default: return { color: '#4b5563', bg: '#f3f4f6' };
        }
    };

    if (loansList.length === 0) return null;

    return (
        <div style={{ marginTop: '40px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e3a8a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Riwayat Pengajuan Pinjaman
            </h3>
            
            <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>ID</th>
                            <th style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Jumlah Pinjaman</th>
                            <th style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Tenor</th>
                            <th style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Status</th>
                            <th style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Tanggal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loansList.map((loan) => {
                            const style = getStatusStyle(loan.status);
                            return (
                                <tr key={loan.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#1e293b', fontWeight: '500' }}>#{loan.id}</td>
                                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#1e293b', fontWeight: '700' }}>{formatCurrency(formatToken(loan.jumlah))}</td>
                                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#1e293b' }}>{loan.tenor} Bulan</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{ 
                                            display: 'inline-block', 
                                            padding: '2px 8px', 
                                            borderRadius: '99px', 
                                            fontSize: '0.75rem', 
                                            fontWeight: '700',
                                            color: style.color,
                                            backgroundColor: style.bg
                                        }}>
                                            {loan.status}
                                        </span>
                                        {loan.status === 'DITOLAK' && loan.alasanDitolak && (
                                            <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '2px' }}>Ket: {loan.alasanDitolak}</div>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#64748b' }}>
                                        {new Date(loan.waktu * 1000).toLocaleDateString('id-ID')}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LoanHistory;
