import React, { useEffect, useState } from 'react';
import api from '../services/api';

const AchatList = () => {
  const [achats, setAchats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAchat, setSelectedAchat] = useState(null);

  useEffect(() => {
    fetchAchats();
  }, []);

  const fetchAchats = async () => {
    try {
      const response = await api.get('/achats');
      setAchats(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load purchases');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (statut) => {
    switch (statut) {
      case 'VALIDE': 
        return { bg: '#e8f5e9', color: '#2e7d32', text: 'Valide' };
      case 'RETOURNE_PARTIEL': 
        return { bg: '#fff3e0', color: '#e65100', text: 'Retourné Partiel' };
      case 'RETOURNE_TOTAL': 
        return { bg: '#ffebee', color: '#c62828', text: 'Retourné Total' };
      default: 
        return { bg: '#f5f5f5', color: '#666', text: statut };
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

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading purchases...</div>;
  if (error) return <div style={{ color: 'red', padding: '1rem' }}>{error}</div>;

  const viewDetails = async (achatId) => {
    try {
      const response = await api.get(`/achats/${achatId}`);
      setSelectedAchat(response.data);
    } catch (err) {
      alert('Failed to load purchase details');
      console.error(err);
    }
  };

  const closeDetails = () => {
    setSelectedAchat(null);
  };

  return (
    <div>
      {/* Details Modal */}
      {selectedAchat && (
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
              <h2 style={{ margin: 0 }}>Purchase Details</h2>
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
              <strong>Purchase Number:</strong> {selectedAchat.numeroBon}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Date:</strong> {new Date(selectedAchat.dateAchat).toLocaleString()}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Client:</strong> {selectedAchat.client?.prenom} {selectedAchat.client?.nom}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Staff:</strong> {selectedAchat.utilisateur?.nom} {selectedAchat.utilisateur?.prenom}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Status:</strong> 
              <span style={{
                marginLeft: '0.5rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                ...getStatusBadgeColor(selectedAchat.statut)
              }}>
                {selectedAchat.statut}
              </span>
            </div>
            
            <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
              <strong>Items:</strong>
              <ul style={{ marginTop: '0.5rem' }}>
                {selectedAchat.ligneAchats?.map((ligne, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>
                    {ligne.quantite} x {ligne.produit?.nom} @ {ligne.prixUnitaire} DA = {ligne.sousTotal} DA
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ 
              marginTop: '1.5rem', 
              paddingTop: '1rem', 
              borderTop: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <div>
                <strong>Subtotal:</strong> {selectedAchat.prix_total} DA
              </div>
              <div>
                <strong>Global Discount:</strong> {selectedAchat.remiseGlobale} DA
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#667eea' }}>
                <strong>Total:</strong> {selectedAchat.prix_total_remise} DA
              </div>
            </div>

            {selectedAchat.notes && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
                <strong>Notes:</strong>
                <p style={{ marginTop: '0.5rem', color: '#666' }}>{selectedAchat.notes}</p>
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
          <h2 style={{ margin: 0, color: '#333' }}>Purchases List ({achats.length})</h2>
          <button
            onClick={fetchAchats}
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

        {achats.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
            No purchases found
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
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>BON N°</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>CLIENT</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>TELEPHONE</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>TYPE</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>AMOUNT</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>DATE</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>STATUS</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {achats.map((achat) => {
                  const statusBadge = getStatusBadgeColor(achat.statut);
                  const typeBadge = getClientTypeBadgeColor(achat.client?.type);
                  return (
                    <tr key={achat.id} style={{ 
                      borderBottom: '1px solid #eee',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <td style={{ padding: '0.75rem', color: '#333', fontWeight: 500 }}>
                        {achat.numeroBon}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#333' }}>
                        {achat.client?.prenom || ''} {achat.client?.nom || ''}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#666' }}>
                        {achat.client?.telephone || '—'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
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
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#333', fontWeight: 500 }}>
                        {parseFloat(achat.prix_total_remise).toFixed(2)} DA
                      </td>
                      <td style={{ padding: '0.75rem', color: '#666' }}>
                        {new Date(achat.dateAchat).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          background: statusBadge.bg,
                          color: statusBadge.color,
                          display: 'inline-block'
                        }}>
                          {statusBadge.text}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <button
                          onClick={() => viewDetails(achat.id)}
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

export default AchatList;
