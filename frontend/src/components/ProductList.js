import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ProductList = () => {
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
      <form onSubmit={handleSearchSubmit} style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Search products..."
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            borderRadius: '6px',
            border: '2px solid #ddd',
            fontSize: '1rem'
          }}
        />
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

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
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
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666' }}>
                <span>{product.marque?.nom}</span>
                <span>{product.categorie?.nom}</span>
              </div>

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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;

