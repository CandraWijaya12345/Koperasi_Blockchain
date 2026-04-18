import React, { useState, useRef, useEffect } from 'react';

const InfoPopup = ({ title, content }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popupRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div style={{ position: 'relative', display: 'inline-block', marginLeft: '8px' }} ref={popupRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: '#dbeafe',
                    color: '#2563eb',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'monospace',
                    transition: 'all 0.2s'
                }}
                title="Informasi Pinjaman"
            >
                i
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '30px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '280px',
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    padding: '16px',
                    zIndex: 100,
                    border: '1px solid #e5e7eb',
                    fontSize: '13px',
                    color: '#374151',
                    textAlign: 'left'
                }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                        {title}
                    </h4>
                    <div style={{ lineHeight: '1.5' }}>
                        {content}
                    </div>
                    {/* Arrow */}
                    <div style={{
                        position: 'absolute',
                        top: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%) rotate(45deg)',
                        width: '12px',
                        height: '12px',
                        backgroundColor: '#fff',
                        borderLeft: '1px solid #e5e7eb',
                        borderTop: '1px solid #e5e7eb',
                    }} />
                </div>
            )}
        </div>
    );
};

export default InfoPopup;
