import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AddStockForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    produitId: '',
    quantite_stock_ajout: '',
    quantite_depos_ajout: '',
    date_expiration: ''
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products', {
        params: { actif: 'true' }
      });
      setProducts(response.data.filter(p => !p.deleted));
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.produitId) {
      setError('Veuillez sélectionner un produit');
      setLoading(false);
      return;
    }

    if (!formData.quantite_stock_ajout && !formData.quantite_depos_ajout) {
      setError('Veuillez entrer au moins une quantité à ajouter (stock ou dépôt)');
      setLoading(false);
      return;
    }

    try {
      const data = {
        produitId: parseInt(formData.produitId),
        quantite_stock_ajout: parseFloat(formData.quantite_stock_ajout) || 0,
        quantite_depos_ajout: parseFloat(formData.quantite_depos_ajout) || 0,
        date_expiration: formData.date_expiration ? new Date(formData.date_expiration).toISOString() : null
      };

      await api.post('/products/add-stock', data);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Échec de l\'ajout de stock');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p.id === parseInt(formData.produitId));

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
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Ajouter au Stock / Dépôt</h2>
          <button
            onClick={onCancel}
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
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Produit *</label>
            <select
              name="produitId"
              value={formData.produitId}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            >
              <option value="">Sélectionner un produit</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.reference} - {p.nom} (Stock: {p.quantite_stock || 0}, Dépôt: {p.quantite_depos || 0})
                </option>
              ))}
            </select>
            {selectedProduct && (
              <div style={{ 
                marginTop: '0.5rem', 
                padding: '0.75rem', 
                background: '#f8f9fa', 
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}>
                <div><strong>Stock actuel:</strong> {selectedProduct.quantite_stock || 0} {selectedProduct.uniteMesure}</div>
                <div><strong>Dépôt actuel:</strong> {selectedProduct.quantite_depos || 0} {selectedProduct.uniteMesure}</div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Quantité à ajouter au Stock</label>
            <input
              type="number"
              name="quantite_stock_ajout"
              value={formData.quantite_stock_ajout}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="0.00"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
            {selectedProduct && formData.quantite_stock_ajout && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                Nouveau stock: {(selectedProduct.quantite_stock || 0) + parseFloat(formData.quantite_stock_ajout)} {selectedProduct.uniteMesure}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Quantité à ajouter au Dépôt</label>
            <input
              type="number"
              name="quantite_depos_ajout"
              value={formData.quantite_depos_ajout}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="0.00"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
            {selectedProduct && formData.quantite_depos_ajout && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                Nouveau dépôt: {(selectedProduct.quantite_depos || 0) + parseFloat(formData.quantite_depos_ajout)} {selectedProduct.uniteMesure}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Date d'expiration pour cet arrivage (optionnelle)</label>
            <input
              type="date"
              name="date_expiration"
              value={formData.date_expiration}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
              Si remplie, cette date d'expiration sera appliquée au produit
            </div>
          </div>

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
                Annuler
              </button>
            )}
            <button
              type="submit"
              disabled={loading || (!formData.quantite_stock_ajout && !formData.quantite_depos_ajout)}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '6px',
                background: '#667eea',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: (loading || (!formData.quantite_stock_ajout && !formData.quantite_depos_ajout)) ? 0.6 : 1
              }}
            >
              {loading ? 'Ajout en cours...' : 'Ajouter au Stock/Dépôt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStockForm;

