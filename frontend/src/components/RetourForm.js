import React, { useState, useEffect } from 'react';
import api from '../services/api';

const RetourForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    achatId: '',
    motif: '',
    typeRetour: 'PARTIEL'
  });
  const [achats, setAchats] = useState([]);
  const [selectedAchat, setSelectedAchat] = useState(null);
  const [ligneRetours, setLigneRetours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAchats();
  }, []);

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
      background: 'white',
      padding: '2rem',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '2rem'
    }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Create New Return</h2>

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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Purchase *</label>
            <select
              value={formData.achatId}
              onChange={(e) => setFormData({ ...formData, achatId: e.target.value })}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            >
              <option value="">Select Purchase</option>
              {achats.map(a => (
                <option key={a.id} value={a.id}>
                  {a.numeroBon} - {a.client?.nom} ({new Date(a.dateAchat).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Return Type</label>
            <select
              value={formData.typeRetour}
              onChange={(e) => setFormData({ ...formData, typeRetour: e.target.value })}
              disabled
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', background: '#f5f5f5' }}
            >
              <option value="PARTIEL">Partial</option>
              <option value="TOTAL">Total</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Reason</label>
            <textarea
              value={formData.motif}
              onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
              rows="3"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Selected Purchase Info */}
        {selectedAchat && (
          <div style={{
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Purchase Details</h4>
            <p style={{ margin: 0, color: '#666' }}>
              Client: {selectedAchat.client?.nom} {selectedAchat.client?.prenom} | 
              Date: {new Date(selectedAchat.dateAchat).toLocaleDateString()} | 
              Total: {selectedAchat.prix_total_remise} DA
            </p>
          </div>
        )}

        {/* Return Items */}
        {ligneRetours.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Items to Return</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {ligneRetours.map((ligne, index) => {
                const produit = selectedAchat?.ligneAchats?.find(la => la.id === ligne.ligneAchatId)?.produit;
                return (
                  <div key={index} style={{
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    background: 'white'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div>
                        <strong>{produit?.nom}</strong>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                          Max: {ligne.maxQuantite} {produit?.uniteMesure}
                        </div>
                      </div>

                      <input
                        type="number"
                        placeholder="Return Quantity"
                        value={ligne.quantiteRetournee}
                        onChange={(e) => updateLigneRetour(index, 'quantiteRetournee', e.target.value)}
                        required
                        step="0.01"
                        min="0"
                        max={ligne.maxQuantite}
                        style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
                      />

                      <div style={{ textAlign: 'right', color: '#667eea', fontWeight: 'bold' }}>
                        {ligne.quantiteRetournee ? 
                          (parseFloat(ligne.quantiteRetournee) * ligne.prixUnitaire).toFixed(2) : '0.00'} DA
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Detailed reason (optional)"
                      value={ligne.motifDetaille}
                      onChange={(e) => updateLigneRetour(index, 'motifDetaille', e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem' }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !formData.achatId || ligneRetours.length === 0}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '6px',
              background: '#667eea',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: (loading || !formData.achatId || ligneRetours.length === 0) ? 0.6 : 1
            }}
          >
            {loading ? 'Creating...' : 'Create Return'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RetourForm;



