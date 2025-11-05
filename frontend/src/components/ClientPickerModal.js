import React, { useEffect, useState } from 'react';
import api from '../services/api';
import ClientForm from './ClientForm';

const ClientPickerModal = ({ onClose, onSelect }) => {
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await api.get('/clients', { params: { actif: 'true' } });
        setClients(response.data || []);
      } catch (err) {
        console.error('Failed to load clients:', err);
      }
    };
    fetchClients();
  }, []);

  const filteredClients = clients.filter(client =>
    !clientSearch ||
    (client.nom?.toLowerCase().includes(clientSearch.toLowerCase())) ||
    (client.prenom?.toLowerCase().includes(clientSearch.toLowerCase())) ||
    (client.email?.toLowerCase().includes(clientSearch.toLowerCase())) ||
    (client.telephone?.includes(clientSearch))
  );
  const limitedClients = filteredClients.slice(0, 20);

  return (
    <div style={{
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
    onClick={onClose}
    >
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        padding: '2rem',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '85vh',
        overflow: 'auto',
        position: 'relative'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>

        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Select or Create Client</h3>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Search Client</label>
          <input
            type="text"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
          />
        </div>

        <div style={{
          maxHeight: '240px',
          overflowY: 'auto',
          marginBottom: '0.75rem',
          border: '1px solid #ddd',
          borderRadius: '6px',
          padding: '0.25rem'
        }}>
          {limitedClients.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '1.5rem' }}>No clients found</p>
          ) : (
            limitedClients.map(client => (
              <div
                key={client.id}
                onClick={() => onSelect(client)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '0.35rem',
                  cursor: 'pointer',
                  background: 'white',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(102, 126, 234, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.25 }}>
                    {client.prenom} {client.nom}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {client.email || client.telephone || '—'}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#667eea', fontWeight: 600 }}>
                  Select →
                </div>
              </div>
            ))
          )}
        </div>
        {filteredClients.length > 20 && (
          <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem' }}>
            Showing 20 of {filteredClients.length}. Refine your search to see others.
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowNewClientForm(!showNewClientForm)}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          {showNewClientForm ? 'Cancel' : '+ Create New Client'}
        </button>

        {showNewClientForm && (
          <ClientForm
            onCancel={() => setShowNewClientForm(false)}
            onSuccess={(created) => {
              setShowNewClientForm(false);
              if (created) {
                onSelect(created);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ClientPickerModal;


