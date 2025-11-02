import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ProductList = ({ onEdit }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products', {
        params: search ? { search } : {}
      });
      setProducts(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchProducts();
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading products...</div>;
  if (error) return <div style={{ color: 'red', padding: '1rem' }}>{error}</div>;

  return (
    <div>
      {/* Search Form */}
      <form onSubmit={handleSearchSubmit} style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Search products..."
          style={{ 
            flex: 1,
            padding: '0.75rem', 
            borderRadius: '6px',
            border: '2px solid #ddd',
            fontSize: '1rem'
          }}
        />
        <button
          type="submit"
          style={{
            padding: '0.75rem 1.5rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 500
          }}
        >
          🔍 Search
        </button>
        <button
          type="button"
          onClick={() => {
            setSearch('');
            setLoading(true);
            fetchProducts();
          }}
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
      </form>

      {products.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>No products found</p>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {products.map((product) => (
            <div key={product.id} style={{
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '1.5rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {/* Product Image */}
              {product.image ? (
                <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                  <img 
                    src={product.image} 
                    alt={product.nom}
                    style={{
                      width: '100%',
                      maxHeight: '200px',
                      objectFit: 'contain',
                      borderRadius: '6px',
                      border: '1px solid #eee'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  marginBottom: '1rem',
                  height: '150px',
                  background: '#f0f0f0',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: '0.9rem'
                }}>
                  No Image
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#333' }}>{product.nom}</h3>
                <span style={{
                  background: '#667eea',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.85rem'
                }}>
                  {product.reference}
                </span>
              </div>
              
              {product.description && (
                <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
                  {product.description}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <strong style={{ color: '#333' }}>Price:</strong>
                  <span style={{ color: '#667eea', marginLeft: '0.5rem' }}>
                    {product.prixUnitaire} DA
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#333' }}>Stock:</strong>
                  <span style={{ 
                    marginLeft: '0.5rem',
                    color: product.quantite_stock <= product.seuilAlerte ? '#c33' : '#3c3'
                  }}>
                    {product.quantite_stock} {product.uniteMesure}
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#333' }}>Dépôt:</strong>
                  <span style={{ 
                    marginLeft: '0.5rem',
                    color: '#667eea'
                  }}>
                    {product.quantite_depos || 0} {product.uniteMesure}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                <span>{product.marque?.nom}</span>
                <span>{product.categorie?.nom}</span>
              </div>

              {product.date_expiration && (
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: new Date(product.date_expiration) < new Date() ? '#c33' : '#666',
                  marginBottom: '0.5rem',
                  fontWeight: new Date(product.date_expiration) < new Date() ? 'bold' : 'normal'
                }}>
                  {new Date(product.date_expiration) < new Date() ? '⚠️ ' : ''}
                  Expiration: {new Date(product.date_expiration).toLocaleDateString()}
                </div>
              )}

              {product.quantite_stock <= product.seuilAlerte && (
                <div style={{
                  background: '#ffe3e3',
                  color: '#c33',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  marginTop: '1rem',
                  textAlign: 'center',
                  fontSize: '0.9rem'
                }}>
                  ⚠️ Low Stock Alert
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                {onEdit && (
                  <button
                    onClick={() => onEdit(product)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    ✏️ Edit
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (window.confirm(`Delete ${product.nom}?`)) {
                      try {
                        await api.delete(`/products/${product.id}`);
                        fetchProducts();
                      } catch (err) {
                        alert('Failed to delete product');
                      }
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;

