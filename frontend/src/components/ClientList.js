import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ClientList = ({ onEdit, refreshKey }) => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    actif: ''
  });

  useEffect(() => {
    fetchClients();
  }, [refreshKey]);

  useEffect(() => {
    applyFilters();
  }, [clients, filters]);

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

  const applyFilters = () => {
    let filtered = [...clients];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(client =>
        (client.nom?.toLowerCase().includes(searchLower)) ||
        (client.prenom?.toLowerCase().includes(searchLower)) ||
        (client.email?.toLowerCase().includes(searchLower)) ||
        (client.telephone?.includes(searchLower))
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(client => client.type === filters.type);
    }

    // Active status filter
    if (filters.actif !== '') {
      const isActive = filters.actif === 'true';
      filtered = filtered.filter(client => client.actif === isActive);
    }

    setFilteredClients(filtered);
  };

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      actif: ''
    });
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Clients List ({filteredClients.length} / {clients.length})</h2>
        <button
          onClick={fetchClients}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 500
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{
        marginBottom: '1.5rem',
        padding: '1rem',
        background: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
              Rechercher
            </label>
            <input
              type="text"
              placeholder="Nom, email, téléphone..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.9rem',
                background: 'white'
              }}
            >
              <option value="">Tous</option>
              <option value="SIMPLE">Simple</option>
              <option value="PEINTRE">Peintre</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
              Statut
            </label>
            <select
              value={filters.actif}
              onChange={(e) => handleFilterChange('actif', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.9rem',
                background: 'white'
              }}
            >
              <option value="">Tous</option>
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </div>
        </div>
        {(filters.search || filters.type || filters.actif) && (
          <button
            onClick={clearFilters}
            style={{
              padding: '0.5rem 1rem',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            ✕ Effacer les filtres
          </button>
        )}
      </div>

      {filteredClients.length === 0 ? (
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
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total Spent</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
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
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 500, color: '#667eea' }}>
                    {client.totalSpent ? `${parseFloat(client.totalSpent).toFixed(2)} DA` : '0.00 DA'}
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
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {onEdit && (
                        <button
                          onClick={() => onEdit(client)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            background: '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          ✏️ Edit
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          if (window.confirm(`Delete ${client.nom}?`)) {
                            try {
                              await api.delete(`/clients/${client.id}`);
                              fetchClients();
                            } catch (err) {
                              alert('Failed to delete client');
                            }
                          }
                        }}
                        style={{
                          padding: '0.4rem 0.8rem',
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
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

