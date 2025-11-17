import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PrettyDatePicker from './PrettyDatePicker';

const MODE_VENTE_OPTIONS = [
  { value: 'TOTAL', label: 'Vente totale uniquement' },
  { value: 'PARTIAL', label: 'Vente partielle uniquement' },
  { value: 'BOTH', label: 'Vente totale et partielle' }
];

const UNITE_OPTIONS = [
  { value: 'PIECE', label: 'Pièce' },
  { value: 'KG', label: 'Kilogramme (kg)' },
  { value: 'LITRE', label: 'Litre (L)' },
  { value: 'METRE', label: 'Mètre (m)' }
];

const ProductForm = ({ product, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    reference: '',
    nom: '',
    description: '',
    image: '',
    prixTotal: '',
    prixPartiel: '',
    modeVente: 'TOTAL',
    poids: '',
    uniteMesure: '',
    marqueId: '',
    categorieId: '',
    seuilAlerte: '5',
    quantite_stock: '0',
    perissable: false,
    date_expiration: ''
  });
  const [marques, setMarques] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchMarques();
    fetchCategories();
    if (product) {
      setFormData({
        reference: product.reference || '',
        nom: product.nom || '',
        description: product.description || '',
        image: product.image || '',
        prixTotal: product.prixTotal != null ? product.prixTotal.toString() : '',
        prixPartiel: product.prixPartiel != null ? product.prixPartiel.toString() : '',
        modeVente: product.modeVente || 'TOTAL',
        poids: product.poids != null ? product.poids.toString() : '',
        uniteMesure: product.uniteMesure || '',
        marqueId: product.marqueId || '',
        categorieId: product.categorieId || '',
        seuilAlerte: product.seuilAlerte != null ? product.seuilAlerte.toString() : '5',
        quantite_stock: product.quantite_stock != null ? product.quantite_stock.toString() : '0',
        perissable: product.perissable !== undefined ? product.perissable : false,
        date_expiration: ''
      });
      setImagePreview(product.image || '');
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
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file' && files && files[0]) {
      const file = files[0];
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData({
          ...formData,
          image: base64String
        });
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    } else {
      // Ensure date_expiration is always a string to avoid controlled/uncontrolled issues
      const newValue = type === 'checkbox' ? checked : (value ?? '');
      
      // Clear date_expiration if perissable is unchecked or stock is 0
      let updatedFormData = {
        ...formData,
        [name]: newValue
      };
      
      if (name === 'perissable' && !checked) {
        updatedFormData.date_expiration = '';
      } else if (name === 'quantite_stock' && parseFloat(value || 0) === 0) {
        updatedFormData.date_expiration = '';
      }

      if (name === 'modeVente') {
        if (newValue === 'TOTAL') {
          updatedFormData.prixPartiel = '';
          updatedFormData.uniteMesure = '';
        } else if (newValue === 'PARTIAL') {
          updatedFormData.prixTotal = '';
        }
      }
      
      setFormData(updatedFormData);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.nom || !formData.marqueId || !formData.categorieId) {
        setError('Nom, marque et catégorie sont obligatoires');
        setLoading(false);
        return;
      }

      if (formData.modeVente !== 'PARTIAL' && !formData.prixTotal) {
        setError('Un prix total est requis pour ce mode de vente');
        setLoading(false);
        return;
      }

      if (formData.modeVente !== 'TOTAL' && (!formData.prixPartiel || !formData.uniteMesure)) {
        setError('Prix partiel et unité de mesure sont requis pour la vente partielle');
        setLoading(false);
        return;
      }

      const data = {
        reference: formData.reference || undefined,
        nom: formData.nom,
        description: formData.description || '',
        image: formData.image,
        modeVente: formData.modeVente,
        prixTotal: formData.prixTotal ? parseFloat(formData.prixTotal) : null,
        prixPartiel: formData.prixPartiel ? parseFloat(formData.prixPartiel) : null,
        uniteMesure: formData.uniteMesure || null,
        poids: formData.poids ? parseFloat(formData.poids) : null,
        marqueId: parseInt(formData.marqueId),
        categorieId: parseInt(formData.categorieId),
        seuilAlerte: parseFloat(formData.seuilAlerte),
        quantite_stock: parseFloat(formData.quantite_stock) || 0,
        perissable: Boolean(formData.perissable)
      };

      if (formData.modeVente === 'TOTAL') {
        data.prixPartiel = null;
        data.uniteMesure = null;
      } else if (formData.modeVente === 'PARTIAL') {
        data.prixTotal = null;
      }

      if (!product && data.reference === '') {
        delete data.reference;
      }

      if (product) {
        // When updating, don't send date_expiration and quantite_stock changes
        // (those should be managed through add-stock endpoint)
        delete data.date_expiration;
        delete data.quantite_stock; // Stock should only be managed through lots
        await api.put(`/products/${product.id}`, data);
      } else {
        // Only include date_expiration when creating new product with initial stock
        if (formData.date_expiration) {
          data.date_expiration = formData.date_expiration;
        }
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
        maxWidth: '900px',
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
            {product ? 'Edit Product' : 'Add New Product'}
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
          <span style={{ fontSize: '1.25rem' }}>✕</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          {product && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Reference</label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>
          )}

          <div style={product ? {} : { gridColumn: '1 / -1' }}>
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

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Mode de vente *</label>
            <select
              name="modeVente"
              value={formData.modeVente}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            >
              {MODE_VENTE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Product Image</label>
            
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />

            {/* Image Preview */}
            {imagePreview && (
              <div style={{ marginTop: '0.75rem' }}>
              <img 
                src={imagePreview}
                alt="Preview"
                style={{
                  width: '100%',
                  maxHeight: '200px',
                  objectFit: 'contain',
                  borderRadius: '6px',
                    border: '1px solid #eee',
                    background: '#f8f9fa'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              </div>
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

          {formData.modeVente !== 'PARTIAL' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Prix total (DA) {formData.modeVente !== 'PARTIAL' ? '*' : ''}
              </label>
              <input
                type="number"
                name="prixTotal"
                value={formData.prixTotal}
                onChange={handleChange}
                required={formData.modeVente !== 'PARTIAL'}
                step="0.01"
                min="0"
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>
          )}

          {formData.modeVente !== 'TOTAL' && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Prix partiel (DA / unité) *
                </label>
                <input
                  type="number"
                  name="prixPartiel"
                  value={formData.prixPartiel}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Unité de mesure *</label>
                <select
                  name="uniteMesure"
                  value={formData.uniteMesure}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
                >
                  <option value="">Sélectionner une unité</option>
                  {UNITE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Contenance/Poids total (optionnel)
            </label>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                name="perissable"
                checked={formData.perissable}
                onChange={handleChange}
                id="perissable"
              />
              <label htmlFor="perissable" style={{ cursor: 'pointer' }}>
                ⏰ Perishable product (requires expiration date for lots)
              </label>
            </div>
          </div>

          {/* Expiration date field when perissable is true and creating initial stock */}
          {formData.perissable && formData.quantite_stock && parseFloat(formData.quantite_stock) > 0 && (
            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Date d'expiration pour le stock initial *
              </label>
              <PrettyDatePicker
                value={formData.date_expiration || ''}
                onChange={(v) => handleChange({ target: { name: 'date_expiration', value: v } })}
                required={formData.perissable && parseFloat(formData.quantite_stock) > 0}
                min={new Date().toISOString().split('T')[0]}
              />
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#f59e0b' }}>
                â° Une date d'expiration est requise pour crÃ©er le lot de stock initial
              </div>
            </div>
          )}
        </div>

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
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '1rem 2rem',
              border: 'none',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontSize: '1rem',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }
            }}
          >
            {loading ? (
              <>
                <span>â³</span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>{product ? 'Update Product' : 'Create Product'}</span>
              </>
            )}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default ProductForm;


