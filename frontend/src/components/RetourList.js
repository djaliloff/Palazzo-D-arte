import React, { useEffect, useState } from 'react';
import api from '../services/api';

const RetourList = () => {
  const [retours, setRetours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    return type === 'TOTAL' 
      ? { bg: '#ffebee', color: '#c62828' }
      : { bg: '#fff3e0', color: '#e65100' };
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading returns...</div>;
  if (error) return <div style={{ color: 'red', padding: '1rem' }}>{error}</div>;

  return (
    <div>
      {retours.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>No returns found</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {retours.map((retour) => {
            const typeColors = getTypeBadgeColor(retour.typeRetour);
            return (
              <div key={retour.id} style={{
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '1.5rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#333' }}>{retour.numeroRetour}</h3>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                      {new Date(retour.dateRetour).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      background: typeColors.bg,
                      color: typeColors.color,
                      marginBottom: '0.5rem'
                    }}>
                      {retour.typeRetour}
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#c33' }}>
                      {retour.montantRembourse} DA
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
                      <strong style={{ color: '#666' }}>Purchase:</strong>
                      <span style={{ marginLeft: '0.5rem', color: '#333' }}>
                        {retour.achat?.numeroBon}
                      </span>
                    </div>
                    <div>
                      <strong style={{ color: '#666' }}>Client:</strong>
                      <span style={{ marginLeft: '0.5rem', color: '#333' }}>
                        {retour.client?.prenom} {retour.client?.nom}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <strong style={{ color: '#666' }}>Returned Items:</strong>
                  <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                    {retour.ligneRetours?.map((ligne, idx) => (
                      <li key={idx} style={{ color: '#333', marginBottom: '0.25rem' }}>
                        {ligne.quantiteRetournee} x {ligne.produit?.nom} = {ligne.montantLigne} DA
                        {ligne.motifDetaille && (
                          <span style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginLeft: '1rem' }}>
                            {ligne.motifDetaille}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {retour.motif && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                    <strong style={{ color: '#666' }}>Reason:</strong>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#333' }}>{retour.motif}</p>
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

export default RetourList;

