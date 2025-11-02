import React, { useEffect, useState } from 'react';
import api from '../services/api';

const RetourList = () => {
  const [retours, setRetours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRetour, setSelectedRetour] = useState(null);

  useEffect(() => {
    fetchRetours();
  }, []);

  const fetchRetours = async () => {
    try {
      const response = await api.get('/retours');
      setRetours(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load returns');
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading returns...</div>;
  if (error) return <div style={{ color: 'red', padding: '1rem' }}>{error}</div>;

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
              <strong>Returned Items:</strong>
              <ul style={{ marginTop: '0.5rem' }}>
                {selectedRetour.ligneRetours?.map((ligne, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>
                    <div>{ligne.quantiteRetournee} x {ligne.produit?.nom} @ {ligne.prixUnitaire} DA = {ligne.montantLigne} DA</div>
                    {ligne.motifDetaille && (
                      <div style={{ fontSize: '0.85rem', color: '#666', marginLeft: '1rem', marginTop: '0.25rem' }}>
                        Reason: {ligne.motifDetaille}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ 
              marginTop: '1.5rem', 
              paddingTop: '1rem', 
              borderTop: '1px solid #ddd',
              textAlign: 'right'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#c33' }}>
                <strong>Total Refund:</strong> {selectedRetour.montantRembourse} DA
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
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: '#333' }}>Returns List ({retours.length})</h2>
          <button
            onClick={fetchRetours}
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

        {retours.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
            No returns found
          </p>
        ) : (
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
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>RETOUR N°</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>PURCHASE</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>CLIENT</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>TYPE</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>AMOUNT</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>DATE</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {retours.map((retour) => {
                  const typeBadge = getTypeBadgeColor(retour.typeRetour);
                  const clientTypeBadge = getClientTypeBadgeColor(retour.client?.type);
                  return (
                    <tr key={retour.id} style={{ 
                      borderBottom: '1px solid #eee',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <td style={{ padding: '0.75rem', color: '#333', fontWeight: 500 }}>
                        {retour.numeroRetour}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#333' }}>
                        {retour.achat?.numeroBon || '—'}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#333' }}>
                        <div>{retour.client?.prenom || ''} {retour.client?.nom || ''}</div>
                        {retour.client?.type && (
                          <span style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            background: clientTypeBadge.bg,
                            color: clientTypeBadge.color,
                            display: 'inline-block',
                            marginTop: '0.25rem'
                          }}>
                            {clientTypeBadge.text}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          background: typeBadge.bg,
                          color: typeBadge.color,
                          display: 'inline-block'
                        }}>
                          {typeBadge.text}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#c33', fontWeight: 500 }}>
                        {parseFloat(retour.montantRembourse).toFixed(2)} DA
                      </td>
                      <td style={{ padding: '0.75rem', color: '#666' }}>
                        {new Date(retour.dateRetour).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <button
                          onClick={() => viewDetails(retour.id)}
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
