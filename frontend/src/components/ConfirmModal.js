import React from 'react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirmer la suppression', 
  message, 
  confirmText = 'Supprimer', 
  cancelText = 'Annuler',
  confirmColor = '#dc2626',
  type = 'danger' // 'danger' or 'warning'
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '2rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          borderRadius: '24px',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          maxWidth: '500px',
          width: '100%',
          padding: '2.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            color: '#1f2937',
            fontSize: '1.2rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ef4444';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.color = '#1f2937';
            e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
          }}
        >
          ✕
        </button>

        {/* Icon */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: type === 'danger' 
              ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
              : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            border: `3px solid ${type === 'danger' ? '#fca5a5' : '#fcd34d'}`,
            boxShadow: `0 4px 20px ${type === 'danger' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
          }}>
            <span style={{
              fontSize: '2.5rem'
            }}>
              {type === 'danger' ? '🗑️' : '⚠️'}
            </span>
          </div>
        </div>

        {/* Title */}
        <h2 style={{
          margin: '0 0 1rem 0',
          fontSize: '1.75rem',
          fontWeight: 800,
          color: '#1f2937',
          textAlign: 'center',
          lineHeight: '1.3'
        }}>
          {title}
        </h2>

        {/* Message */}
        <p style={{
          margin: '0 0 2rem 0',
          fontSize: '1rem',
          color: '#6b7280',
          textAlign: 'center',
          lineHeight: '1.6'
        }}>
          {message}
        </p>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.875rem 2rem',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#6b7280',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              minWidth: '120px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#9ca3af';
              e.currentTarget.style.color = '#1f2937';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.color = '#6b7280';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '0.875rem 2rem',
              border: 'none',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${confirmColor} 0%, ${confirmColor}dd 100%)`,
              color: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              boxShadow: `0 4px 15px ${confirmColor}40`,
              minWidth: '120px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 25px ${confirmColor}60`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 15px ${confirmColor}40`;
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

