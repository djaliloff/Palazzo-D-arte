import React, { useState, useEffect } from 'react';
import api from '../services/api';

const RetourForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    achatId: '',
    motif: '',
    typeRetour: 'PARTIEL'
  });
  const [achats, setAchats] = useState([]);
  const [filteredAchats, setFilteredAchats] = useState([]);
  const [achatSearch, setAchatSearch] = useState('');
  const [selectedAchat, setSelectedAchat] = useState(null);
  const [ligneRetours, setLigneRetours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAchats();
  }, []);

  useEffect(() => {
    // Filter achats based on search
    if (achatSearch) {
      const searchLower = achatSearch.toLowerCase();
      const filtered = achats.filter(achat =>
        achat.numeroBon?.toLowerCase().includes(searchLower) ||
        `${achat.client?.prenom || ''} ${achat.client?.nom || ''}`.toLowerCase().includes(searchLower) ||
        achat.client?.email?.toLowerCase().includes(searchLower) ||
        achat.client?.telephone?.includes(searchLower) ||
        achat.id.toString().includes(searchLower)
      );
      setFilteredAchats(filtered);
    } else {
      setFilteredAchats(achats);
    }
  }, [achatSearch, achats]);

  useEffect(() => {
    if (formData.achatId) {
      fetchAchatDetails(formData.achatId);
    }
  }, [formData.achatId]);

  const fetchAchats = async () => {
    try {
      const response = await api.get('/achats');
      setAchats(response.data);
    } catch (err) {
      console.error('Failed to load purchases:', err);
    }
  };

  const fetchAchatDetails = async (achatId) => {
    try {
      const response = await api.get(`/achats/${achatId}`);
      setSelectedAchat(response.data);
      
      // Initialize ligneRetours from ligneAchats
      const initialLignes = response.data.ligneAchats
        .filter(la => la.quantite > la.quantiteRetournee)
        .map(la => ({
          ligneAchatId: la.id,
          produitId: la.produitId,
          quantiteRetournee: '',
          prixUnitaire: la.prixUnitaire,
          maxQuantite: la.quantite - la.quantiteRetournee,
          motifDetaille: ''
        }));
      setLigneRetours(initialLignes);
    } catch (err) {
      console.error('Failed to load purchase details:', err);
    }
  };

  const updateLigneRetour = (index, field, value) => {
    const updated = [...ligneRetours];
    updated[index][field] = value;
    
    // Validate quantity doesn't exceed max
    if (field === 'quantiteRetournee') {
      const maxQty = updated[index].maxQuantite;
      if (parseFloat(value) > maxQty) {
        updated[index].quantiteRetournee = maxQty;
        setError(`Maximum returnable quantity is ${maxQty}`);
        setTimeout(() => setError(''), 3000);
      }
    }
    
    setLigneRetours(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.achatId) {
      setError('Please select a purchase');
      setLoading(false);
      return;
    }

    if (ligneRetours.length === 0) {
      setError('No items available to return');
      setLoading(false);
      return;
    }

    // Validate all lines
    const validLignes = ligneRetours.filter(l => 
      l.quantiteRetournee && parseFloat(l.quantiteRetournee) > 0
    );

    if (validLignes.length === 0) {
      setError('Please specify quantities to return');
      setLoading(false);
      return;
    }

    // Determine return type
    const totalReturned = validLignes.reduce((sum, l) => sum + parseFloat(l.quantiteRetournee), 0);
    const totalPurchased = selectedAchat.ligneAchats.reduce((sum, la) => sum + la.quantite, 0);
    const typeRetour = totalReturned >= totalPurchased ? 'TOTAL' : 'PARTIEL';

    try {
      const data = {
        achatId: parseInt(formData.achatId),
        ligneRetours: validLignes.map(l => ({
          ligneAchatId: l.ligneAchatId,
          produitId: l.produitId,
          quantiteRetournee: parseFloat(l.quantiteRetournee),
          prixUnitaire: l.prixUnitaire,
          motifDetaille: l.motifDetaille || ''
        })),
        motif: formData.motif,
        typeRetour: typeRetour
      };

      await api.post('/retours', data);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create return');
    } finally {
      setLoading(false);
    }
  };

  return (
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
    onClick={onCancel}
    >
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>Create New Return</h2>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666',
              padding: '0.5rem',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

      {error && (
        <div style={{
          background: '#fee',
          color: '#c33',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>🔍 Search Purchase *</label>
            <input
              type="text"
              placeholder="Search by purchase number, client name, email, or phone..."
              value={achatSearch}
              onChange={(e) => setAchatSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.95rem',
                transition: 'all 0.2s ease',
                outline: 'none',
                background: 'white',
                marginBottom: '0.75rem'
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

          <div>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Select Purchase *</label>
            <select
              value={formData.achatId}
              onChange={(e) => {
                setFormData({ ...formData, achatId: e.target.value });
                setAchatSearch(''); // Clear search after selection
              }}
              required
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
              <option value="">Select Purchase</option>
              {filteredAchats.map(a => (
                <option key={a.id} value={a.id}>
                  {a.numeroBon} - {a.client?.nom} {a.client?.prenom} ({new Date(a.dateAchat).toLocaleDateString()}) - {a.prix_total_remise} DA
                </option>
              ))}
            </select>
            {filteredAchats.length === 0 && achatSearch && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
                No purchases found matching "{achatSearch}"
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Return Type</label>
            <select
              value={formData.typeRetour}
              onChange={(e) => setFormData({ ...formData, typeRetour: e.target.value })}
              disabled
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.95rem',
                background: '#f5f5f5',
                cursor: 'not-allowed'
              }}
            >
              <option value="PARTIEL">Partial</option>
              <option value="TOTAL">Total</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Reason</label>
            <textarea
              value={formData.motif}
              onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
              rows="3"
              placeholder="Enter the reason for this return..."
              style={{
                width: '100%',
                padding: '0.875rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                resize: 'vertical',
                fontSize: '0.95rem',
                transition: 'all 0.2s ease',
                outline: 'none',
                fontFamily: 'inherit'
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
        </div>

        {/* Selected Purchase Info */}
        {selectedAchat && (
          <div style={{
            padding: '1.25rem',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>Purchase Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>Purchase Number:</span>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>{selectedAchat.numeroBon}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>Client:</span>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>{selectedAchat.client?.nom} {selectedAchat.client?.prenom}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>Date:</span>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>{new Date(selectedAchat.dateAchat).toLocaleDateString()}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>Total:</span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#667eea' }}>{selectedAchat.prix_total_remise} DA</div>
              </div>
            </div>
          </div>
        )}

        {/* Return Items */}
        {ligneRetours.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700, color: '#1f2937' }}>Items to Return</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {ligneRetours.map((ligne, index) => {
                const produit = selectedAchat?.ligneAchats?.find(la => la.id === ligne.ligneAchatId)?.produit;
                return (
                  <div key={index} style={{
                    padding: '1.25rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    background: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                  }}
                  >
                      <div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <strong style={{ fontSize: '1rem', color: '#1f2937' }}>{produit?.nom}</strong>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          Max returnable: <strong style={{ color: '#667eea' }}>{ligne.maxQuantite} {produit?.uniteMesure}</strong>
                        </div>
                      </div>

                      {/* Bouton pour retourner la totalité */}
                      {ligne.maxQuantite > 0 && (
                        <button
                          type="button"
                          onClick={() => updateLigneRetour(index, 'quantiteRetournee', ligne.maxQuantite.toString())}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            marginBottom: '0.75rem',
                            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
                          }}
                        >
                          🔄 Retourner la totalité ({ligne.maxQuantite} {produit?.uniteMesure})
                        </button>
                      )}

                      {/* Section pour retourner par quantité spécifiée */}
                      <div style={{ 
                        padding: '0.75rem',
                        background: ligne.maxQuantite > 0 ? '#f8f9fa' : 'transparent',
                        borderRadius: '8px',
                        border: ligne.maxQuantite > 0 ? '1px solid #e9ecef' : 'none'
                      }}>
                        {ligne.maxQuantite > 0 && (
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#666', 
                            marginBottom: '0.5rem',
                            fontWeight: 500,
                            textAlign: 'center'
                          }}>
                            Ou retourner par quantité:
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={ligne.quantiteRetournee}
                        onChange={(e) => updateLigneRetour(index, 'quantiteRetournee', e.target.value)}
                        required
                        step="0.01"
                        min="0"
                        max={ligne.maxQuantite}
                        style={{
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
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
                      />

                      <div style={{
                        textAlign: 'right',
                        padding: '0.75rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '1rem'
                      }}>
                        {ligne.quantiteRetournee ? 
                          (parseFloat(ligne.quantiteRetournee) * ligne.prixUnitaire).toFixed(2) : '0.00'} DA
                          </div>
                        </div>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="📝 Detailed reason (optional)"
                      value={ligne.motifDetaille}
                      onChange={(e) => updateLigneRetour(index, 'motifDetaille', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
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
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid #e5e7eb' }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
              style={{
                padding: '0.875rem 2rem',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#374151',
                transition: 'all 0.2s ease'
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !formData.achatId || ligneRetours.length === 0}
            onMouseEnter={(e) => {
              if (!loading && formData.achatId && ligneRetours.length > 0) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #5568d3 0%, #667eea 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && formData.achatId && ligneRetours.length > 0) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
            style={{
              padding: '0.875rem 2rem',
              border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              cursor: loading || !formData.achatId || ligneRetours.length === 0 ? 'not-allowed' : 'pointer',
              opacity: (loading || !formData.achatId || ligneRetours.length === 0) ? 0.6 : 1,
              fontSize: '0.95rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              boxShadow: (loading || !formData.achatId || ligneRetours.length === 0) ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
          >
            {loading ? 'Creating...' : '✓ Create Return'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default RetourForm;



