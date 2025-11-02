import React, { useEffect, useState } from 'react';
import api from '../services/api';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.nom?.toLowerCase().includes(search.toLowerCase()) ||
    cat.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ 
      textAlign: 'center', 
      padding: '4rem 2rem',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
      <p style={{ color: '#6b7280', fontSize: '1.1rem', fontWeight: 500 }}>Loading categories...</p>
    </div>
  );
  
  if (error) return (
    <div style={{ 
      padding: '2rem',
      background: '#fef2f2',
      borderRadius: '12px',
      border: '1px solid #fecaca',
      color: '#dc2626',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
      <p style={{ fontWeight: 600 }}>{error}</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '2rem', 
          fontWeight: 700, 
          color: '#1f2937',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Categories
        </h1>
      </div>

      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ 
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1f2937'
            }}>
              Categories List
            </h2>
            <p style={{ 
              margin: '0.25rem 0 0 0', 
              fontSize: '0.9rem', 
              color: '#6b7280' 
            }}>
              Showing <strong style={{ color: '#667eea' }}>{filteredCategories.length}</strong> of <strong style={{ color: '#667eea' }}>{categories.length}</strong> categories
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <input
            type="text"
            placeholder="🔍 Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease',
              outline: 'none',
              background: 'white'
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

        {filteredCategories.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem 1rem',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '1.1rem',
              fontWeight: 500,
              margin: 0
            }}>
              No categories found
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
            gap: '1.25rem' 
          }}>
            {filteredCategories.map((category, index) => (
              <div 
                key={category.id} 
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
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
                {category.image ? (
                  <div style={{ 
                    marginBottom: '1rem', 
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    border: '1px solid #e9ecef'
                  }}>
                    <img 
                      src={category.image} 
                      alt={category.nom}
                      style={{
                        width: '100%',
                        maxHeight: '120px',
                        objectFit: 'contain',
                        borderRadius: '6px'
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
                    border: '2px dashed #dee2e6'
                  }}>
                    <span style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>📋</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 500 }}>No Image</span>
                  </div>
                )}
                
                <h3 style={{ 
                  margin: 0, 
                  marginBottom: '0.75rem',
                  color: '#1f2937', 
                  fontSize: '1.1rem', 
                  fontWeight: 600
                }}>
                  {category.nom}
                </h3>
                
                {category.description && (
                  <p style={{ 
                    color: '#6b7280', 
                    fontSize: '0.85rem', 
                    margin: '0 0 1rem 0', 
                    lineHeight: '1.5'
                  }}>
                    {category.description}
                  </p>
                )}

                <div style={{
                  padding: '0.5rem',
                  background: category.actif 
                    ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' 
                    : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: category.actif ? '#065f46' : '#991b1b'
                  }}>
                    {category.actif ? '✓ Active' : '✗ Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;

