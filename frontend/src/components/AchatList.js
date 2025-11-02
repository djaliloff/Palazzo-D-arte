import React, { useEffect, useState } from 'react';
import api from '../services/api';

const AchatList = () => {
  const [achats, setAchats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      case 'VALIDE': return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'RETOURNE_PARTIEL': return { bg: '#fff3e0', color: '#e65100' };
      case 'RETOURNE_TOTAL': return { bg: '#ffebee', color: '#c62828' };
      default: return { bg: '#f5f5f5', color: '#666' };
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading purchases...</div>;
  if (error) return <div style={{ color: 'red', padding: '1rem' }}>{error}</div>;

  return (
    <div>
      {achats.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>No purchases found</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {achats.map((achat) => {
            const statusColors = getStatusBadgeColor(achat.statut);
            return (
              <div key={achat.id} style={{
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '1.5rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#333' }}>{achat.numeroBon}</h3>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                      {new Date(achat.dateAchat).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      background: statusColors.bg,
                      color: statusColors.color
                    }}>
                      {achat.statut}
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '1.25rem', fontWeight: 'bold', color: '#667eea' }}>
                      {achat.prix_total_remise} DA
                    </div>
                  </div>
                </div>

                <div style={{ 
                  background: '#f9f9f9', 
                  padding: '1rem', 
                  borderRadius: '6px',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem' }}>
                    <div>
                      <strong style={{ color: '#666' }}>Client:</strong>
                      <span style={{ marginLeft: '0.5rem', color: '#333' }}>
                        {achat.client?.prenom} {achat.client?.nom}
                      </span>
                    </div>
                    <div>
                      <strong style={{ color: '#666' }}>Staff:</strong>
                      <span style={{ marginLeft: '0.5rem', color: '#333' }}>
                        {achat.utilisateur?.nom}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <strong style={{ color: '#666' }}>Items:</strong>
                  <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                    {achat.ligneAchats?.map((ligne, idx) => (
                      <li key={idx} style={{ color: '#333', marginBottom: '0.25rem' }}>
                        {ligne.quantite} x {ligne.produit?.nom} = {ligne.sousTotal} DA
                      </li>
                    ))}
                  </ul>
                </div>

                {achat.notes && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                    <strong style={{ color: '#666' }}>Notes:</strong>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#333' }}>{achat.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AchatList;

