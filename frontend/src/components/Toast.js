import React from 'react';

const variants = {
  success: {
    background: '#dcfce7',
    border: '#86efac',
    color: '#166534',
    icon: '✅'
  },
  error: {
    background: '#fee2e2',
    border: '#fca5a5',
    color: '#b91c1c',
    icon: '⚠️'
  },
  info: {
    background: '#e0e7ff',
    border: '#c7d2fe',
    color: '#312e81',
    icon: 'ℹ️'
  }
};

const Toast = ({ open, type = 'info', message, onClose }) => {
  if (!open || !message) return null;

  const variant = variants[type] || variants.info;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 2000,
        cursor: 'pointer',
        maxWidth: '360px',
        transition: 'transform 0.2s ease, opacity 0.2s ease'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          background: variant.background,
          border: `1px solid ${variant.border}`,
          color: variant.color,
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          boxShadow: '0 12px 40px rgba(15, 23, 42, 0.2)',
          fontWeight: 600,
          lineHeight: 1.4
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>{variant.icon}</span>
        <span style={{ flex: 1 }}>{message}</span>
      </div>
    </div>
  );
};

export default Toast;
