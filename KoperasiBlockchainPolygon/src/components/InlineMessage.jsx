import React from 'react';

const InlineMessage = ({ message, isError, compact }) => {
    const [displayMessage, setDisplayMessage] = React.useState('');
    const [visible, setVisible] = React.useState(false);

    React.useEffect(() => {
        let timeout;
        if (message) {
            setDisplayMessage(message);
            setVisible(true);
        } else {
            setVisible(false);
            // Wait for transition to finish before clearing text
            timeout = setTimeout(() => {
                setDisplayMessage('');
            }, 300);
        }
        return () => clearTimeout(timeout);
    }, [message]);

    if (!displayMessage) return null;

    const style = {
        padding: compact ? '4px 8px' : '10px 14px',
        backgroundColor: isError ? '#fee2e2' : '#dcfce7',
        color: isError ? '#991b1b' : '#166534',
        borderRadius: compact ? '6px' : '10px',
        display: 'flex',
        alignItems: 'center',
        gap: compact ? '6px' : '10px',
        fontSize: compact ? '0.75rem' : '0.9rem',
        fontWeight: '500',
        marginTop: compact ? '4px' : '12px',
        border: `1px solid ${isError ? '#fecaca' : '#bbf7d0'}`,
        width: compact ? 'fit-content' : 'auto',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-5px)',
        transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
    };

    return (
        <div style={style}>
            <span>{displayMessage}</span>
        </div>
    );
};

export default InlineMessage;
