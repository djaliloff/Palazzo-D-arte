import React, { useEffect, useState } from 'react';
import api from '../services/api';

const RetourList = () => {
  const [retours, setRetours] = useState([]);
  const [filteredRetours, setFilteredRetours] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRetour, setSelectedRetour] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    typeRetour: '',
    clientId: ''
  });

  useEffect(() => {
    fetchRetours();
    fetchClients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [retours, filters]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data.filter(c => c.actif));
    } catch (err) {
      console.error('Failed to load clients:', err);
    }
  };

  const fetchRetours = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.typeRetour) params.typeRetour = filters.typeRetour;
      if (filters.clientId) params.clientId = filters.clientId;

      const response = await api.get('/retours', { params });
      setRetours(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load returns');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...retours];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(retour =>
        retour.numeroRetour?.toLowerCase().includes(searchLower) ||
        retour.achat?.numeroBon?.toLowerCase().includes(searchLower) ||
        `${retour.client?.prenom || ''} ${retour.client?.nom || ''}`.toLowerCase().includes(searchLower) ||
        retour.client?.email?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredRetours(filtered);
  };

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      typeRetour: '',
      clientId: ''
    });
    setTimeout(() => {
      fetchRetours();
    }, 0);
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'TOTAL':
        return { bg: '#ffebee', color: '#c62828', text: 'Total' };
      case 'PARTIEL':
      default:
        return { bg: '#fff3e0', color: '#e65100', text: 'Partiel' };
    }
  };

  const getClientTypeBadgeColor = (type) => {
    switch (type) {
      case 'PEINTRE':
        return { bg: '#fff9c4', color: '#f57f17', text: 'Peintre' };
      case 'SIMPLE':
      default:
        return { bg: '#e3f2fd', color: '#1976d2', text: 'Client' };
    }
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
      <p style={{ color: '#6b7280', fontSize: '1.1rem', fontWeight: 500 }}>Loading returns...</p>
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

  const viewDetails = async (retourId) => {
    try {
      const response = await api.get(`/retours/${retourId}`);
      setSelectedRetour(response.data);
    } catch (err) {
      alert('Failed to load return details');
      console.error(err);
    }
  };

  const closeDetails = () => {
    setSelectedRetour(null);
  };

  return (
    <div>
      {/* Details Modal */}
      {selectedRetour && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}
        onClick={closeDetails}
        >
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Return Details</h2>
              <button
                onClick={closeDetails}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Return Number:</strong> {selectedRetour.numeroRetour}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Date:</strong> {new Date(selectedRetour.dateRetour).toLocaleString()}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Type:</strong>
              <span style={{
                marginLeft: '0.5rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                ...getTypeBadgeColor(selectedRetour.typeRetour)
              }}>
                {selectedRetour.typeRetour}
              </span>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Purchase:</strong> {selectedRetour.achat?.numeroBon}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Client:</strong> {selectedRetour.client?.prenom} {selectedRetour.client?.nom}
            </div>
            
            <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
              <strong style={{ marginBottom: '1rem', display: 'block' }}>Returned Items:</strong>
              <div style={{ overflowX: 'auto' }}>
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
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Product</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>Quantity</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Unit Price</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Amount</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRetour.ligneRetours?.map((ligne, idx) => (
                      <tr key={idx} style={{ 
                        borderBottom: '1px solid #eee'
                      }}>
                        <td style={{ padding: '0.75rem', color: '#333' }}>
                          {ligne.produit?.nom || 'N/A'}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', color: '#333' }}>
                          {ligne.quantiteRetournee} {ligne.produit?.uniteMesure || ''}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#666' }}>
                          {parseFloat(ligne.prixUnitaire).toFixed(2)} DA
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#c33', fontWeight: 500 }}>
                          {parseFloat(ligne.montantLigne).toFixed(2)} DA
                        </td>
                        <td style={{ padding: '0.75rem', color: '#666', fontSize: '0.85rem' }}>
                          {ligne.motifDetaille || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ 
              marginTop: '1.5rem', 
              paddingTop: '1rem', 
              borderTop: '2px solid #ddd',
              background: '#fff3f3',
              padding: '1rem',
              borderRadius: '6px',
              textAlign: 'right'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#c33' }}>
                <strong>Total Refund:</strong> {parseFloat(selectedRetour.montantRembourse || 0).toFixed(2)} DA
              </div>
            </div>

            {selectedRetour.motif && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
                <strong>General Reason:</strong>
                <p style={{ marginTop: '0.5rem', color: '#666' }}>{selectedRetour.motif}</p>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={closeDetails}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Container */}
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
              Returns List
            </h2>
            <p style={{ 
              margin: '0.25rem 0 0 0', 
              fontSize: '0.9rem', 
              color: '#6b7280' 
            }}>
              Showing <strong style={{ color: '#667eea' }}>{filteredRetours.length}</strong> of <strong style={{ color: '#667eea' }}>{retours.length}</strong> returns
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
                placeholder="Retour N°, Bon N°, Client, Email..."
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
                📊 Type
              </label>
              <select
                value={filters.typeRetour}
                onChange={(e) => {
                  handleFilterChange('typeRetour', e.target.value);
                  fetchRetours();
                }}
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
                <option value="PARTIEL">Partiel</option>
                <option value="TOTAL">Total</option>
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
                👤 Client
              </label>
              <select
                value={filters.clientId}
                onChange={(e) => {
                  handleFilterChange('clientId', e.target.value);
                  fetchRetours();
                }}
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
                <option value="">Tous les clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.prenom} {client.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(filters.search || filters.typeRetour || filters.clientId) && (
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
              {filters.typeRetour && (
                <span style={{
                  background: '#10b981',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 500
                }}>
                  Type: {filters.typeRetour}
                </span>
              )}
              {filters.clientId && (
                <span style={{
                  background: '#f59e0b',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 500
                }}>
                  Client: {clients.find(c => c.id === parseInt(filters.clientId))?.prenom} {clients.find(c => c.id === parseInt(filters.clientId))?.nom}
                </span>
              )}
              <button
                onClick={handleClearFilters}
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

        {filteredRetours.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem 1rem',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>↩️</div>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '1.1rem',
              fontWeight: 500,
              margin: 0
            }}>
              No returns found
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
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>RETOUR N°</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>PURCHASE</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>CLIENT</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>TYPE</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem' }}>AMOUNT</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>DATE</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredRetours.map((retour, index) => {
                  const typeBadge = getTypeBadgeColor(retour.typeRetour);
                  const clientTypeBadge = getClientTypeBadgeColor(retour.client?.type);
                  return (
                    <tr key={retour.id} style={{ 
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
                        #{retour.numeroRetour}
                      </td>
                      <td style={{ 
                        padding: '1rem',
                        fontWeight: 500,
                        color: '#1f2937'
                      }}>
                        {retour.achat?.numeroBon || <span style={{ color: '#9ca3af' }}>—</span>}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, color: '#1f2937' }}>
                          {retour.client?.prenom || ''} {retour.client?.nom || ''}
                        </div>
                        {retour.client?.type && (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: clientTypeBadge.bg === '#fff9c4' 
                              ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                              : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                            color: clientTypeBadge.color,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            display: 'inline-block',
                            marginTop: '0.25rem'
                          }}>
                            {clientTypeBadge.text}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: typeBadge.bg === '#ffebee'
                            ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
                            : 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
                          color: typeBadge.color,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          display: 'inline-block'
                        }}>
                          {typeBadge.text}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '1rem', 
                        textAlign: 'right', 
                        color: '#dc2626', 
                        fontWeight: 700,
                        fontSize: '0.95rem'
                      }}>
                        {parseFloat(retour.montantRembourse).toFixed(2)} DA
                      </td>
                      <td style={{ padding: '1rem', color: '#6b7280' }}>
                        {new Date(retour.dateRetour).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button
                          onClick={() => viewDetails(retour.id)}
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
                          👁️ View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetourList;
