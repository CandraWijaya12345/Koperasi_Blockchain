import React from 'react';

const InlineMessage = ({ message, isError, compact }) => {
    if (!message) return null;

    const style = {
        padding: compact ? '4px 8px' : '10px 14px',
        backgroundColor: isError ? '#fee2e2' : '#dcfce7', // Red-100 vs Green-100
        color: isError ? '#991b1b' : '#166534', // Red-800 vs Green-800
        borderRadius: compact ? '6px' : '10px',
        display: 'flex',
        alignItems: 'center',
        gap: compact ? '6px' : '10px',
        fontSize: compact ? '0.75rem' : '0.9rem',
        fontWeight: '500',
        marginTop: compact ? '4px' : '12px',
        animation: 'fadeIn 0.3s ease-in-out',
        border: `1px solid ${isError ? '#fecaca' : '#bbf7d0'}`,
        width: compact ? 'fit-content' : 'auto'
    };

    const icon = isError ? '⚠️' : '✅';

    return (
        <div style={style}>
            <span>{icon}</span>
            <span>{message}</span>
            <style>
                {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
            </style>
        </div>
    );
};

export default InlineMessage;
