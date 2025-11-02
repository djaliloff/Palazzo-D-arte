import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ProductForm = ({ product, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    reference: '',
    nom: '',
    description: '',
    image: '',
    prixUnitaire: '',
    prixTotal: '',
    poids: '',
    uniteMesure: 'PIECE',
    marqueId: '',
    categorieId: '',
    seuilAlerte: '5',
    quantite_stock: '0',
    quantite_depos: '0',
    date_expiration: '',
    venduParUnite: true
  });
  const [marques, setMarques] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMarques();
    fetchCategories();
    if (product) {
      setFormData({
        reference: product.reference || '',
        nom: product.nom || '',
        description: product.description || '',
        image: product.image || '',
        prixUnitaire: product.prixUnitaire || '',
        prixTotal: product.prixTotal || '',
        poids: product.poids || '',
        uniteMesure: product.uniteMesure || 'PIECE',
        marqueId: product.marqueId || '',
        categorieId: product.categorieId || '',
        seuilAlerte: product.seuilAlerte || '5',
        quantite_stock: product.quantite_stock || '0',
        quantite_depos: product.quantite_depos || '0',
        date_expiration: product.date_expiration ? new Date(product.date_expiration).toISOString().split('T')[0] : '',
        venduParUnite: product.venduParUnite !== undefined ? product.venduParUnite : true
      });
    }
  }, [product]);

  const fetchMarques = async () => {
    try {
      const response = await api.get('/marques');
      setMarques(response.data || []);
    } catch (err) {
      console.error('Failed to load brands:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        ...formData,
        prixUnitaire: parseFloat(formData.prixUnitaire),
        prixTotal: parseFloat(formData.prixTotal) || parseFloat(formData.prixUnitaire),
        poids: formData.poids ? parseFloat(formData.poids) : null,
        marqueId: parseInt(formData.marqueId),
        categorieId: parseInt(formData.categorieId),
        seuilAlerte: parseFloat(formData.seuilAlerte),
        quantite_stock: parseFloat(formData.quantite_stock) || 0,
        quantite_depos: parseFloat(formData.quantite_depos) || 0,
        date_expiration: formData.date_expiration ? new Date(formData.date_expiration).toISOString() : null
      };

      if (product) {
        await api.put(`/products/${product.id}`, data);
      } else {
        await api.post('/products', data);
      }
      
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
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
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Reference *</label>
            <input
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name *</label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Image URL</label>
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
            {formData.image && (
              <img 
                src={formData.image} 
                alt="Preview"
                style={{
                  width: '100%',
                  maxHeight: '200px',
                  objectFit: 'contain',
                  marginTop: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #eee'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Unit Price (DA) *</label>
            <input
              type="number"
              name="prixUnitaire"
              value={formData.prixUnitaire}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Total Price (DA)</label>
            <input
              type="number"
              name="prixTotal"
              value={formData.prixTotal}
              onChange={handleChange}
              step="0.01"
              min="0"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Weight (KG)</label>
            <input
              type="number"
              name="poids"
              value={formData.poids}
              onChange={handleChange}
              step="0.01"
              min="0"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Unit *</label>
            <select
              name="uniteMesure"
              value={formData.uniteMesure}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            >
              <option value="KG">KG</option>
              <option value="PIECE">PIECE</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Brand *</label>
            <select
              name="marqueId"
              value={formData.marqueId}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            >
              <option value="">Select Brand</option>
              {marques.map(m => (
                <option key={m.id} value={m.id}>{m.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Category *</label>
            <select
              name="categorieId"
              value={formData.categorieId}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            >
              <option value="">Select Category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Alert Threshold</label>
            <input
              type="number"
              name="seuilAlerte"
              value={formData.seuilAlerte}
              onChange={handleChange}
              step="0.01"
              min="0"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Quantité Stock</label>
            <input
              type="number"
              name="quantite_stock"
              value={formData.quantite_stock}
              onChange={handleChange}
              step="0.01"
              min="0"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Quantité Dépôt</label>
            <input
              type="number"
              name="quantite_depos"
              value={formData.quantite_depos}
              onChange={handleChange}
              step="0.01"
              min="0"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Date d'expiration (optionnelle)</label>
            <input
              type="date"
              name="date_expiration"
              value={formData.date_expiration}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', gridColumn: '1 / -1' }}>
            <input
              type="checkbox"
              name="venduParUnite"
              checked={formData.venduParUnite}
              onChange={handleChange}
              id="venduParUnite"
            />
            <label htmlFor="venduParUnite" style={{ cursor: 'pointer' }}>
              Can sell partial units (e.g., 5.5kg)
            </label>
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
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '6px',
              background: '#667eea',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default ProductForm;


