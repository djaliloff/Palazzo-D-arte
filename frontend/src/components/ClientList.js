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

  if (loading) return (
    <div style={{ 
      textAlign: 'center', 
      padding: '4rem 2rem',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
      <p style={{ color: '#6b7280', fontSize: '1.1rem', fontWeight: 500 }}>Loading clients...</p>
    </div>
  );
  
  if (error) return (
    <div style={{ 
      padding: '2rem',
      background: '#fef2f2',
      borderRadius: '12px',
      border: '1px solid #fecaca',
      color: '#dc2626',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
      <p style={{ fontWeight: 600 }}>{error}</p>
    </div>
  );

  return (
    <div style={{ 
      background: 'white', 
      padding: '1.5rem', 
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ 
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <div>
          <h2 style={{ 
            margin: 0, 
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#1f2937'
          }}>
            Clients List
          </h2>
          <p style={{ 
            margin: '0.25rem 0 0 0', 
            fontSize: '0.9rem', 
            color: '#6b7280' 
          }}>
            Showing <strong style={{ color: '#667eea' }}>{Math.min(filteredClients.length, 50)}</strong> of <strong style={{ color: '#667eea' }}>{clients.length}</strong> clients
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        marginBottom: '1.5rem',
        padding: '1.25rem',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: '1rem', 
          marginBottom: '1rem' 
        }}>
          <div style={{ flex: '1 1 300px', minWidth: '200px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 600, 
              fontSize: '0.9rem',
              color: '#374151'
            }}>
              🔍 Rechercher
            </label>
            <input
              type="text"
              placeholder="Nom, email, téléphone..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.95rem',
                transition: 'all 0.2s ease',
                outline: 'none',
                background: 'white'
              }}
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
          <div style={{ flex: '0 1 180px', minWidth: '150px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 600, 
              fontSize: '0.9rem',
              color: '#374151'
            }}>
              🏷️ Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.95rem',
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">Tous</option>
              <option value="SIMPLE">Simple</option>
              <option value="PEINTRE">Peintre</option>
            </select>
          </div>
          <div style={{ flex: '0 1 180px', minWidth: '150px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 600, 
              fontSize: '0.9rem',
              color: '#374151'
            }}>
              ✅ Statut
            </label>
            <select
              value={filters.actif}
              onChange={(e) => handleFilterChange('actif', e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.95rem',
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">Tous</option>
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </div>
        </div>
        {(filters.search || filters.type || filters.actif) && (
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            paddingTop: '0.75rem',
            borderTop: '1px solid #e5e7eb',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>
              Active filters:
            </span>
            {filters.search && (
              <span style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 500
              }}>
                Search: {filters.search}
              </span>
            )}
            {filters.type && (
              <span style={{
                background: '#10b981',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 500
              }}>
                Type: {filters.type}
              </span>
            )}
            {filters.actif !== '' && (
              <span style={{
                background: filters.actif === 'true' ? '#10b981' : '#ef4444',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 500
              }}>
                Status: {filters.actif === 'true' ? 'Active' : 'Inactive'}
              </span>
            )}
            <button
              onClick={clearFilters}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#b91c1c';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#dc2626';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              style={{
                padding: '0.5rem 1rem',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
              }}
            >
              ✕ Clear All
            </button>
          </div>
        )}
      </div>

      {filteredClients.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem 1rem',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '1.1rem',
            fontWeight: 500,
            margin: 0
          }}>
            No clients found
          </p>
          <p style={{ 
            color: '#9ca3af', 
            fontSize: '0.9rem',
            marginTop: '0.5rem'
          }}>
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <div style={{ 
          overflowX: 'auto',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '0.9rem',
            background: 'white'
          }}>
            <thead>
              <tr style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>ID</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>Name</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>Phone</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>Type</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem' }}>Total Spent</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.slice(0, 50).map((client, index) => (
                <tr 
                  key={client.id} 
                  style={{ 
                    borderBottom: '1px solid #e5e7eb',
                    transition: 'background 0.2s',
                    background: index % 2 === 0 ? 'white' : '#f9fafb'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.transform = 'scale(1.001)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#f9fafb';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <td style={{ 
                    padding: '1rem', 
                    fontWeight: 600,
                    color: '#6b7280'
                  }}>
                    #{client.id}
                  </td>
                  <td style={{ 
                    padding: '1rem',
                    fontWeight: 600,
                    color: '#1f2937'
                  }}>
                    {client.prenom} {client.nom}
                  </td>
                  <td style={{ padding: '1rem', color: '#6b7280' }}>
                    {client.email ? (
                      <a 
                        href={`mailto:${client.email}`}
                        style={{ 
                          color: '#667eea',
                          textDecoration: 'none',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#5568d3'}
                        onMouseLeave={(e) => e.target.style.color = '#667eea'}
                      >
                        {client.email}
                      </a>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', color: '#6b7280' }}>
                    {client.telephone ? (
                      <a 
                        href={`tel:${client.telephone}`}
                        style={{ 
                          color: '#667eea',
                          textDecoration: 'none',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#5568d3'}
                        onMouseLeave={(e) => e.target.style.color = '#667eea'}
                      >
                        {client.telephone}
                      </a>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.375rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: client.type === 'PEINTRE' 
                        ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' 
                        : 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                      color: client.type === 'PEINTRE' ? '#1e40af' : '#6b21a8',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      display: 'inline-block'
                    }}>
                      {client.type}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '1rem', 
                    textAlign: 'right', 
                    fontWeight: 700, 
                    fontSize: '0.95rem',
                    color: '#667eea'
                  }}>
                    {client.totalSpent ? `${parseFloat(client.totalSpent).toFixed(2)} DA` : '0.00 DA'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.375rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: client.actif 
                        ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' 
                        : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                      color: client.actif ? '#065f46' : '#991b1b',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      display: 'inline-block'
                    }}>
                      {client.actif ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      {onEdit && (
                        <button
                          onClick={() => onEdit(client)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #5568d3 0%, #667eea 100%)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          style={{
                            padding: '0.5rem 0.875rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
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
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        style={{
                          padding: '0.5rem 0.875rem',
                          background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
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

