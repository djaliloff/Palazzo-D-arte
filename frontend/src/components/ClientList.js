import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load clients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading clients...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ 
      background: 'white', 
      padding: '1.5rem', 
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h2>Clients List ({clients.length})</h2>
      {clients.length === 0 ? (
        <p>No clients found</p>
      ) : (
        <div style={{ 
          overflowX: 'auto',
          marginTop: '1rem'
        }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '0.9rem'
          }}>
            <thead>
              <tr style={{ 
                background: '#f5f5f5',
                borderBottom: '2px solid #ddd'
              }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Phone</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} style={{ 
                  borderBottom: '1px solid #eee',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '0.75rem' }}>{client.id}</td>
                  <td style={{ padding: '0.75rem' }}>
                    {client.prenom} {client.nom}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#666' }}>
                    {client.email || '—'}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#666' }}>
                    {client.telephone || '—'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      background: client.type === 'PEINTRE' ? '#e3f2fd' : '#f3e5f5',
                      color: client.type === 'PEINTRE' ? '#1976d2' : '#7b1fa2'
                    }}>
                      {client.type}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      background: client.actif ? '#e8f5e9' : '#ffebee',
                      color: client.actif ? '#2e7d32' : '#c62828'
                    }}>
                      {client.actif ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientList;

