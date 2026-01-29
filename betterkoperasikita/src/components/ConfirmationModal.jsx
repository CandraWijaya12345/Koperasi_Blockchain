import React from 'react';

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Ya, Lanjutkan", cancelText = "Batal", isDanger = false, isAlert = false, isLoading = false }) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                backdropFilter: 'blur(4px)',
            }}
        >
            <div
                className='popup-content'
                style={{
                    backgroundColor: '#fff',
                    padding: '24px',
                    borderRadius: '16px',
                    width: '320px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center',
                }}
            >
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#1f2937' }}>
                    {title}
                </h3>
                <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
                    {message}
                </p>
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            border: '3px solid #e2e8f0',
                            borderTopColor: '#3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        {!isAlert && (
                            <button
                                onClick={onCancel}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '999px',
                                    border: '1px solid #e5e7eb',
                                    backgroundColor: '#fff',
                                    color: '#374151',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                }}
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={onConfirm}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '999px',
                                border: 'none',
                                backgroundColor: isDanger ? '#ef4444' : '#2563eb',
                                color: '#fff',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '14px',
                            }}
                        >
                            {confirmText}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConfirmationModal;
