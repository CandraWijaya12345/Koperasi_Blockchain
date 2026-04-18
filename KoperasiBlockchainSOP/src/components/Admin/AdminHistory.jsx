import React, { useState } from 'react';
import HistoryList from '../HistoryList';

const AdminHistory = ({ logs, onRefresh, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter logs based on search term (address or event name)
  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    const address = String(log.args?.user || log.args?.peminjam || log.args?.anggota || log.args[0] || '').toLowerCase();
    const eventName = (log.eventName || log.fragment?.name || '').toLowerCase();
    
    return address.includes(term) || eventName.includes(term);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ 
        background: 'white', 
        padding: '16px 24px', 
        borderRadius: '16px', 
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          placeholder="Cari alamat wallet atau tipe transaksi..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            width: '100%',
            fontSize: '0.95rem',
            color: '#1e293b'
          }}
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            ×
          </button>
        )}
      </div>

      <HistoryList 
        history={filteredLogs} 
        onRefresh={onRefresh} 
        isLoading={isLoading} 
        isAdminView={true}
      />
    </div>
  );
};

export default AdminHistory;
