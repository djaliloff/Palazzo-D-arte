import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PrettyDatePicker from './PrettyDatePicker';

const AddStockForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    produitId: '',
    quantite_stock_ajout: '',
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
        params: { actif: 'true', limit: 1000 }
      });
      // Handle both old format (array) and new format (object with products)
      const productsList = response.data.products || response.data;
      setProducts(productsList.filter(p => !p.deleted));
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };
    
    // Update selected product when product changes
    if (name === 'produitId') {
      const product = products.find(p => p.id === parseInt(value));
      // Clear expiration date if product changes and is not perishable
      if (!product || !product.perissable) {
        newFormData.date_expiration = '';
      }
    }
    
    setFormData(newFormData);
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

    if (!formData.quantite_stock_ajout) {
      setError('Veuillez entrer une quantité à ajouter au stock');
      setLoading(false);
      return;
    }

    // Validate expiration date for perishable products
    if (selectedProduct?.perissable && formData.quantite_stock_ajout && !formData.date_expiration) {
      setError('La date d\'expiration est requise pour les produits périssables');
      setLoading(false);
      return;
    }

    try {
      const data = {
        produitId: parseInt(formData.produitId),
        quantite_stock_ajout: parseFloat(formData.quantite_stock_ajout) || 0,
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
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem'
    }}
    onClick={onCancel}
    >
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        padding: '2.5rem',
        borderRadius: '24px',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
          <button
            onClick={onCancel}
            style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            color: '#1f2937',
              fontSize: '1.5rem',
              cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ef4444';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.color = '#1f2937';
            e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
          >
            ✕
          </button>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ 
            margin: 0,
            fontSize: '2rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            Ajouter au Stock
          </h2>
        </div>

        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            color: '#dc2626',
            padding: '1.25rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            border: '2px solid #fca5a5',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: 600
          }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <span>{error}</span>
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
                  {p.reference} - {p.nom} (Stock: {p.quantite_stock || 0})
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
                {selectedProduct.perissable && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    padding: '0.5rem', 
                    background: '#fef3c7', 
                    borderRadius: '4px',
                    color: '#92400e',
                    fontSize: '0.85rem'
                  }}>
                    ⏰ Produit périssable - expiration requise pour les lots de stock
                  </div>
                )}
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

          {(selectedProduct?.perissable || formData.quantite_stock_ajout) && (
          <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Date d'expiration {selectedProduct?.perissable ? '*' : '(optionnelle)'}
              </label>
            <PrettyDatePicker
              value={formData.date_expiration}
              onChange={(v) => handleChange({ target: { name: 'date_expiration', value: v } })}
              required={selectedProduct?.perissable && formData.quantite_stock_ajout}
              min={new Date().toISOString().split('T')[0]}
            />
              {selectedProduct?.perissable && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.85rem', 
                  color: '#f59e0b',
                  padding: '0.5rem',
                  background: '#fef3c7',
                  borderRadius: '6px'
                }}>
                  ⏰ Ce produit est périssable - une date d'expiration est requise pour les lots de stock
                </div>
              )}
              {!selectedProduct?.perissable && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                  Si remplie, cette date d'expiration sera appliquée au lot
                </div>
              )}
            </div>
          )}

          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'flex-end',
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '2px solid #e5e7eb'
          }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: '1rem 2rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#6b7280',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#9ca3af';
                  e.currentTarget.style.color = '#1f2937';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                }}
              >
                Annuler
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !formData.quantite_stock_ajout}
              style={{
                padding: '1rem 2rem',
                border: 'none',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: (loading || !formData.quantite_stock_ajout) ? 0.6 : 1,
                fontSize: '1rem',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (!loading && formData.quantite_stock_ajout) {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && formData.quantite_stock_ajout) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }
              }}
            >
              {loading ? (
                <>
                  <span>⏳</span>
                  <span>Ajout en cours...</span>
                </>
              ) : (
                <>
                  <span>➕</span>
                  <span>Ajouter au Stock</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStockForm;

