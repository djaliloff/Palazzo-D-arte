import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ClientForm = ({ client, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    type: 'SIMPLE',
    actif: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (client) {
      setFormData({
        nom: client.nom || '',
        prenom: client.prenom || '',
        email: client.email || '',
        telephone: client.telephone || '',
        adresse: client.adresse || '',
        type: client.type || 'SIMPLE',
        actif: client.actif !== undefined ? client.actif : true
      });
    }
  }, [client]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let response;
      if (client) {
        response = await api.put(`/clients/${client.id}`, formData);
        setMessage('Client updated successfully!');
      } else {
        response = await api.post('/clients', formData);
        setMessage('Client created successfully!');
      }
      
      // Reset form if creating new
      if (!client) {
        setFormData({
          nom: '',
          prenom: '',
          email: '',
          telephone: '',
          adresse: '',
          type: 'SIMPLE',
          actif: true
        });
      }
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(response?.data);
        }, 300);
      } else {
        window.location.reload();
      }
    } catch (error) {
      setMessage(error.response?.data?.message || `Error ${client ? 'updating' : 'creating'} client`);
    } finally {
      setLoading(false);
    }
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
        zIndex: 1000,
        padding: '2rem'
      }}
      onClick={onCancel}
    >
      <div 
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          padding: '2.5rem',
          borderRadius: '24px',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
          <button
            onClick={onCancel}
            style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            color: '#1f2937',
              fontSize: '1.5rem',
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
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.color = '#1f2937';
            e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
          >
            ✕
          </button>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ 
            margin: 0,
            fontSize: '2rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            {client ? 'Edit Client' : 'Add New Client'}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>First Name *</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '0.875rem', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem', transition: 'all 0.2s ease', outline: 'none' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Last Name</label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.875rem', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem', transition: 'all 0.2s ease', outline: 'none' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.875rem', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem', transition: 'all 0.2s ease', outline: 'none' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Phone</label>
                <input
                  type="text"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.875rem', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem', transition: 'all 0.2s ease', outline: 'none' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Address</label>
              <input
                type="text"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.875rem', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem', transition: 'all 0.2s ease', outline: 'none' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Client Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.875rem', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem', background: 'white', cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="SIMPLE">Simple</option>
                <option value="PEINTRE">Peintre</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem', background: '#f9fafb', borderRadius: '8px', border: '2px solid #e5e7eb' }}>
              <input
                type="checkbox"
                name="actif"
                checked={formData.actif}
                onChange={handleChange}
                id="actif"
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="actif" style={{ cursor: 'pointer', fontWeight: 500, fontSize: '0.95rem', color: '#374151' }}>
                Active Client
              </label>
            </div>
          </div>

          {message && (
            <div style={{
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
              padding: '1.25rem',
              background: message.includes('Error') 
                ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' 
                : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
              color: message.includes('Error') ? '#dc2626' : '#059669',
              borderRadius: '12px',
              border: `2px solid ${message.includes('Error') ? '#fca5a5' : '#6ee7b7'}`,
              boxShadow: message.includes('Error') 
                ? '0 4px 12px rgba(239, 68, 68, 0.2)' 
                : '0 4px 12px rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontWeight: 600
            }}>
              <span style={{ fontSize: '1.25rem' }}>{message.includes('Error') ? '⚠️' : '✅'}</span>
              <span>{message}</span>
            </div>
          )}

          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'flex-end',
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '2px solid #e5e7eb'
          }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: '1rem 2rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#6b7280',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
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
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '1rem 2rem',
                border: 'none',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontSize: '1rem',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }
              }}
            >
              {loading ? (
                <>
                  <span>⏳</span>
                  <span>{client ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <span>{client ? '✏️' : '➕'}</span>
                  <span>{client ? 'Update Client' : 'Create Client'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;
