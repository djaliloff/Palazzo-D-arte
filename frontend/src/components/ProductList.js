import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ProductList = ({ onEdit }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [marques, setMarques] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedMarque, setSelectedMarque] = useState('');
  const [selectedCategorie, setSelectedCategorie] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchMarques();
    fetchCategories();
  }, []);

  const fetchMarques = async () => {
    try {
      const response = await api.get('/marques');
      setMarques(response.data.filter(m => m.actif));
    } catch (err) {
      console.error('Failed to load brands:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.filter(c => c.actif));
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedMarque) params.marqueId = selectedMarque;
      if (selectedCategorie) params.categorieId = selectedCategorie;

      const response = await api.get('/products', { params });
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
    fetchProducts();
  };

  const handleFilterChange = () => {
    fetchProducts();
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedMarque('');
    setSelectedCategorie('');
    setTimeout(() => {
      fetchProducts();
    }, 0);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading products...</div>;
  if (error) return <div style={{ color: 'red', padding: '1rem' }}>{error}</div>;

  return (
    <div>
      {/* Search and Filter Form */}
      <div style={{ 
        marginBottom: '1.5rem', 
        background: 'white',
        padding: '1rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb'
      }}>
        <form onSubmit={handleSearchSubmit} style={{ 
          display: 'flex', 
          gap: '0.75rem',
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="🔍 Search products by name, reference, brand, or category..."
            style={{ 
              flex: '1 1 300px',
              padding: '0.875rem 1rem', 
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
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
          <select
            value={selectedMarque}
            onChange={(e) => {
              setSelectedMarque(e.target.value);
              handleFilterChange();
            }}
            style={{
              flex: '0 1 180px',
              padding: '0.875rem 1rem',
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
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
            <option value="">🏷️ All Brands</option>
            {marques.map((marque) => (
              <option key={marque.id} value={marque.id}>
                {marque.nom}
              </option>
            ))}
          </select>
          <select
            value={selectedCategorie}
            onChange={(e) => {
              setSelectedCategorie(e.target.value);
              handleFilterChange();
            }}
            style={{
              flex: '0 1 180px',
              padding: '0.875rem 1rem',
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
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
            <option value="">📋 All Categories</option>
            {categories.map((categorie) => (
              <option key={categorie.id} value={categorie.id}>
                {categorie.nom}
              </option>
            ))}
          </select>
          <button
            type="submit"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #5568d3 0%, #667eea 100%)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            style={{
              padding: '0.875rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)',
              whiteSpace: 'nowrap'
            }}
          >
            🔍 Search
          </button>
          <button
            type="button"
            onClick={handleClearFilters}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#5a6268';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#6c757d';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            style={{
              padding: '0.875rem 1.5rem',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(108, 117, 125, 0.3)',
              whiteSpace: 'nowrap'
            }}
          >
            🔄 Clear Filters
          </button>
        </form>
        
        {/* Active Filters Display */}
        {(search || selectedMarque || selectedCategorie) && (
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            paddingTop: '0.75rem',
            borderTop: '1px solid #e5e7eb',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>
              Active filters:
            </span>
            {search && (
              <span style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 500
              }}>
                Search: {search}
              </span>
            )}
            {selectedMarque && (
              <span style={{
                background: '#10b981',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 500
              }}>
                Brand: {marques.find(m => m.id === parseInt(selectedMarque))?.nom}
              </span>
            )}
            {selectedCategorie && (
              <span style={{
                background: '#f59e0b',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 500
              }}>
                Category: {categories.find(c => c.id === parseInt(selectedCategorie))?.nom}
              </span>
            )}
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem 1rem',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '1.1rem',
            fontWeight: 500,
            margin: 0
          }}>
            No products found
          </p>
          <p style={{ 
            color: '#9ca3af', 
            fontSize: '0.9rem',
            marginTop: '0.5rem'
          }}>
            Try adjusting your search criteria
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
          gap: '1.25rem' 
        }}>
          {products.map((product) => (
            <div 
              key={product.id} 
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15), 0 4px 6px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)';
              }}
            >
              {/* Product Image */}
              {product.image ? (
                <div style={{ 
                  marginBottom: '1rem', 
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  border: '1px solid #e9ecef'
                }}>
                  <img 
                    src={product.image} 
                    alt={product.nom}
                    style={{
                      width: '100%',
                      maxHeight: '120px',
                      objectFit: 'contain',
                      borderRadius: '6px'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  marginBottom: '1rem',
                  height: '120px',
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#adb5bd',
                  fontSize: '2rem',
                  border: '2px dashed #dee2e6',
                  position: 'relative'
                }}>
                  <span style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>📦</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 500 }}>No Image</span>
                </div>
              )}

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '0.75rem',
                gap: '0.5rem'
              }}>
                <h3 style={{ 
                  margin: 0, 
                  color: '#1f2937', 
                  fontSize: '1rem', 
                  lineHeight: '1.4',
                  fontWeight: 600,
                  flex: 1
                }}>
                  {product.nom}
                </h3>
                <span style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)',
                  letterSpacing: '0.5px'
                }}>
                  {product.reference}
                </span>
              </div>
              
              {product.description && (
                <p style={{ 
                  color: '#6b7280', 
                  fontSize: '0.8rem', 
                  margin: '0 0 1rem 0', 
                  lineHeight: '1.5', 
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {product.description}
                </p>
              )}

              <div style={{ 
                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '0.75rem',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    fontSize: '0.85rem'
                  }}>
                    <span style={{ color: '#6b7280', fontWeight: 500 }}>💰 Price</span>
                    <span style={{ 
                      color: '#1f2937', 
                      fontWeight: 700,
                      fontSize: '0.9rem'
                    }}>
                      {product.prixUnitaire} DA
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    fontSize: '0.85rem'
                  }}>
                    <span style={{ color: '#6b7280', fontWeight: 500 }}>📦 Stock</span>
                    <span style={{ 
                      color: product.quantite_stock <= product.seuilAlerte ? '#ef4444' : '#10b981',
                      fontWeight: 600
                    }}>
                      {product.quantite_stock} {product.uniteMesure}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    fontSize: '0.85rem'
                  }}>
                    <span style={{ color: '#6b7280', fontWeight: 500 }}>🏭 Dépôt</span>
                    <span style={{ 
                      color: '#667eea',
                      fontWeight: 600
                    }}>
                      {product.quantite_depos || 0} {product.uniteMesure}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontSize: '0.75rem', 
                color: '#6b7280', 
                marginBottom: '0.75rem',
                padding: '0.5rem',
                background: '#f9fafb',
                borderRadius: '6px'
              }}>
                <span style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontWeight: 500
                }}>
                  🏷️ {product.marque?.nom}
                </span>
                <span style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontWeight: 500
                }}>
                  📋 {product.categorie?.nom}
                </span>
              </div>

              {product.date_expiration && (
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: new Date(product.date_expiration) < new Date() ? '#ef4444' : '#6b7280',
                  marginBottom: '0.75rem',
                  fontWeight: new Date(product.date_expiration) < new Date() ? 600 : 500,
                  padding: '0.5rem',
                  background: new Date(product.date_expiration) < new Date() ? '#fef2f2' : '#f9fafb',
                  borderRadius: '6px',
                  border: `1px solid ${new Date(product.date_expiration) < new Date() ? '#fecaca' : '#e5e7eb'}`
                }}>
                  {new Date(product.date_expiration) < new Date() ? '⚠️ ' : '📅 '}
                  Exp: {new Date(product.date_expiration).toLocaleDateString()}
                </div>
              )}

              {product.quantite_stock <= product.seuilAlerte && (
                <div style={{
                  background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                  color: '#dc2626',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  marginBottom: '0.75rem',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid #fecaca',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)'
                }}>
                  ⚠️ Low Stock Alert
                </div>
              )}

              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginTop: 'auto',
                paddingTop: '0.75rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                {onEdit && (
                  <button
                    onClick={() => onEdit(product)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #5568d3 0%, #667eea 100%)';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
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

