import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import ProductDetailModal from './ProductDetailModal';
import ConfirmModal from './ConfirmModal';

const SALE_MODE_BADGES = {
  TOTAL: { label: 'Vente totale', emoji: '🛒' },
  PARTIAL: { label: 'Vente partielle', emoji: '⚖️' },
  BOTH: { label: 'Total + partiel', emoji: '🔀' }
};

const UNIT_LABELS = {
  PIECE: ['pièce', 'pièces'],
  KG: 'kg',
  LITRE: 'L',
  METRE: 'm'
};

const formatNumber = (value, options = {}) => {
  const number = Number(value);
  const safeNumber = Number.isFinite(number) ? number : 0;
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  }).format(safeNumber);
};

const getUnitLabel = (unit, quantity = 0) => {
  const isPlural = quantity > 1 || quantity === 0;

  if (!unit) {
    return isPlural ? 'unités' : 'unité';
  }

  const label = UNIT_LABELS[unit];

  if (Array.isArray(label)) {
    return isPlural ? label[1] : label[0];
  }

  return label || unit.toLowerCase();
};

export const formatStockDisplay = (product) => {
  const quantity = Number(product?.quantite_stock ?? 0);

  // For products that can be sold in BOTH modes, display stock as
  // "X unités" plus remainder in the unit of measure when poids is defined.
  if (product?.modeVente === 'BOTH') {
    const poidsValue = Number(product?.poids);

    if (product?.uniteMesure && Number.isFinite(poidsValue) && poidsValue > 0) {
      const piecesCompletes = Math.floor(quantity);
      const resteEnUnite = (quantity - piecesCompletes) * poidsValue;
      // Partie 1 : unités (pièces complètes)
      const piecesLabel = piecesCompletes > 1 ? 'unités' : 'unité';
      // Partie 2 : unité de mesure réelle (kg, m, L, ...)
      const resteLabel = getUnitLabel(product.uniteMesure, resteEnUnite);

      if (resteEnUnite > 0 && piecesCompletes > 0) {
        return `${piecesCompletes} ${piecesLabel} et ${formatNumber(resteEnUnite, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${resteLabel}`;
      } else if (piecesCompletes > 0) {
        return `${piecesCompletes} ${piecesLabel}`;
      } else if (resteEnUnite > 0) {
        return `${formatNumber(resteEnUnite, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${resteLabel}`;
      }
    }

    const formattedQuantity = formatNumber(quantity, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    return `${formattedQuantity} unités`;
  }

  // Si le produit a un poids défini, est vendu par unité et l'unité de mesure est KG,
  // on affiche "X pièces et Y kg" à partir d'un stock potentiellement fractionnaire.
  if (product?.poids && product?.uniteMesure === 'KG' && product?.venduParUnite) {
    const poidsValue = Number(product.poids) || 0;
    const piecesCompletes = Math.floor(quantity);
    const resteEnUnite = (quantity - piecesCompletes) * poidsValue;

    if (resteEnUnite > 0 && piecesCompletes > 0) {
      const piecesLabel = getUnitLabel('PIECE', piecesCompletes);
      const resteLabel = getUnitLabel(product.uniteMesure, resteEnUnite);
      return `${piecesCompletes} ${piecesLabel} et ${formatNumber(resteEnUnite, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${resteLabel}`;
    } else if (piecesCompletes > 0) {
      const piecesLabel = getUnitLabel('PIECE', piecesCompletes);
      return `${piecesCompletes} ${piecesLabel}`;
    } else if (resteEnUnite > 0) {
      const resteLabel = getUnitLabel(product.uniteMesure, resteEnUnite);
      return `${formatNumber(resteEnUnite, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${resteLabel}`;
    }
  }

  const isCountable = !product?.uniteMesure || product.uniteMesure === 'PIECE';
  const formattedQuantity = formatNumber(quantity, {
    minimumFractionDigits: 0,
    maximumFractionDigits: isCountable ? 0 : 2
  });
  const unitLabel = getUnitLabel(product?.uniteMesure, quantity);

  return `${formattedQuantity} ${unitLabel}`.trim();
};

const getPriceLines = (product) => {
  const lines = [];

  if (product?.modeVente !== 'PARTIAL' && product?.prixTotal != null) {
    lines.push({
      label: 'Prix total',
      value: `${formatNumber(product.prixTotal, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} DA`
    });
  }

  if (product?.modeVente !== 'TOTAL' && product?.prixPartiel != null) {
    const unitLabel = getUnitLabel(product?.uniteMesure);
    lines.push({
      label: 'Prix partiel',
      value: `${formatNumber(product.prixPartiel, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} DA / ${unitLabel}`
    });
  }

  return lines;
};

const getSaleModeBadge = (mode) => SALE_MODE_BADGES[mode] ?? { label: mode || 'Mode inconnu', emoji: 'ℹ️' };

const ProductList = ({ onEdit }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [marques, setMarques] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedMarque, setSelectedMarque] = useState('');
  const [selectedCategorie, setSelectedCategorie] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const observerTarget = useRef(null);
  const isInitialMount = useRef(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { product: {...}, isOpen: true }

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

  const fetchProducts = useCallback(async (pageNum = 1, append = false, marqueId = null, categorieId = null, searchTerm = null) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const params = {
        page: pageNum,
        limit: 20
      };
      
      if (marqueId !== null && marqueId !== '') params.marqueId = marqueId;
      if (categorieId !== null && categorieId !== '') params.categorieId = categorieId;
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/products', { params });
      
      // Handle both old format (array) and new format (object with products and pagination)
      const responseData = response.data.products || response.data;
      const pagination = response.data.pagination;

      if (append) {
        setProducts(prev => [...prev, ...responseData]);
      } else {
        setProducts(responseData);
      }

      if (pagination) {
        setHasMore(pagination.hasMore);
        setTotal(pagination.total);
      } else {
        // Fallback for old API format
        setHasMore(responseData.length >= 20);
      }

      setError('');
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchMarques();
    fetchCategories();
    fetchProducts(1, false);
  }, [fetchProducts]);

  // When brand, category, or search changes, reset and fetch
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    setPage(1);
    setHasMore(true);
    const searchTerm = search.trim() || null;
    fetchProducts(1, false, selectedMarque || null, selectedCategorie || null, searchTerm);
  }, [selectedMarque, selectedCategorie, search, fetchProducts]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          const searchTerm = search.trim() || null;
          fetchProducts(nextPage, true, selectedMarque || null, selectedCategorie || null, searchTerm);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadingMore, page, search, selectedMarque, selectedCategorie, fetchProducts]);

  const handleClearFilters = () => {
    setSearch('');
    setSelectedMarque('');
    setSelectedCategorie('');
    setPage(1);
    setHasMore(true);
  };

  const handleDeleteClick = (product) => {
    setDeleteConfirm({ product, isOpen: true });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm?.product) return;
    
    try {
      await api.delete(`/products/${deleteConfirm.product.id}`);
      // Refresh products
      const searchTerm = search.trim() || null;
      fetchProducts(1, false, selectedMarque || null, selectedCategorie || null, searchTerm);
      setDeleteConfirm(null);
    } catch (err) {
      alert('Failed to delete product');
      setDeleteConfirm(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  if (loading && products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <div>Loading products...</div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return <div style={{ color: 'red', padding: '1rem' }}>{error}</div>;
  }

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
        <div style={{ 
          display: 'flex', 
          gap: '0.75rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search products..."
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
            onChange={(e) => setSelectedMarque(e.target.value)}
            style={{
              flex: '0 1 150px',
              padding: '0.875rem 1rem',
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
              fontSize: '0.95rem',
              background: 'white',
              cursor: 'pointer'
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
            onChange={(e) => setSelectedCategorie(e.target.value)}
            style={{
              flex: '0 1 150px',
              padding: '0.875rem 1rem',
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
              fontSize: '0.95rem',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">📋 All Categories</option>
            {categories.map((categorie) => (
              <option key={categorie.id} value={categorie.id}>
                {categorie.nom}
              </option>
            ))}
          </select>
          
          {/* View Mode Toggle */}
          <div style={{
            display: 'flex',
            gap: '0.25rem',
            background: '#f8f9fa',
            padding: '0.25rem',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.5rem 0.75rem',
                border: 'none',
                borderRadius: '6px',
                background: viewMode === 'grid' ? '#667eea' : 'transparent',
                color: viewMode === 'grid' ? 'white' : '#666',
                cursor: 'pointer',
                fontSize: '1.1rem',
                transition: 'all 0.2s ease'
              }}
              title="Grid View"
            >
              ⏹️
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.5rem 0.75rem',
                border: 'none',
                borderRadius: '6px',
                background: viewMode === 'list' ? '#667eea' : 'transparent',
                color: viewMode === 'list' ? 'white' : '#666',
                cursor: 'pointer',
                fontSize: '1.1rem',
                transition: 'all 0.2s ease'
              }}
              title="List View"
            >
              ☰
            </button>
          </div>

          <button
            type="button"
            onClick={handleClearFilters}
            style={{
              padding: '0.875rem 1.5rem',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            🔄 Clear
          </button>
        </div>
        
        {/* Active Filters & Results Count */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          paddingTop: '0.75rem',
          borderTop: '1px solid #e5e7eb',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(search || selectedMarque || selectedCategorie) && (
              <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>
                Filters:
              </span>
            )}
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
          {total > 0 && (
            <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>
              {total} product{total !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
      </div>

      {/* Products Display */}
      {products.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem 1rem',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <p style={{ color: '#6b7280', fontSize: '1.1rem', fontWeight: 500, margin: 0 }}>
            No products found
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: '1rem' 
            }}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onViewDetails={() => setSelectedProduct(product)}
                  onEdit={onEdit}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {products.map((product) => (
                <ProductListItem
                  key={product.id}
                  product={product}
                  onViewDetails={() => setSelectedProduct(product)}
                  onEdit={onEdit}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          )}

          {/* Loading More Indicator */}
          {loadingMore && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
              <div style={{ color: '#6b7280' }}>Loading more products...</div>
            </div>
          )}

          {/* Intersection Observer Target */}
          <div ref={observerTarget} style={{ height: '20px' }} />
        </>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onEdit={onEdit}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Supprimer le produit"
          message={`Êtes-vous sûr de vouloir supprimer "${deleteConfirm.product?.nom}" ? Cette action est irréversible.`}
          confirmText="Supprimer"
          cancelText="Annuler"
          type="danger"
        />
      )}
    </div>
  );
};

// Compact Product Card Component
const ProductCard = ({ product, onViewDetails, onEdit, onDelete }) => {
  const priceLines = getPriceLines(product);
  const saleMode = getSaleModeBadge(product?.modeVente);

  return (
    <div 
      onClick={() => onViewDetails()}
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }}
    >
      {/* Image */}
      {product.image ? (
        <div style={{ 
          marginBottom: '0.6rem', 
          textAlign: 'center',
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '0.5rem',
          height: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          <img 
            src={product.image} 
            alt={product.nom}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
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
          marginBottom: '0.6rem',
          height: '120px',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#adb5bd',
          fontSize: '2rem',
          border: '2px dashed #dee2e6'
        }}>
          📦
        </div>
      )}

      {/* Name & Reference */}
      <div style={{ marginBottom: '0.5rem' }}>
        <h3 style={{ 
          margin: '0 0 0.3rem 0', 
          color: '#1f2937', 
          fontSize: '0.9rem', 
          fontWeight: 600,
          lineHeight: '1.3',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {product.nom}
        </h3>
        <span style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '0.15rem 0.5rem',
          borderRadius: '6px',
          fontSize: '0.7rem',
          fontWeight: 600
        }}>
          {product.reference}
        </span>
        {saleMode && (
          <div style={{
            marginTop: '0.4rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.2rem 0.5rem',
            background: '#eef2ff',
            color: '#4338ca',
            borderRadius: '999px',
            fontSize: '0.7rem',
            fontWeight: 600
          }}>
            <span>{saleMode.emoji}</span>
            <span>{saleMode.label}</span>
          </div>
        )}
      </div>

      {/* Price & Stock */}
      <div style={{ 
        background: '#f9fafb',
        borderRadius: '8px',
        padding: '0.5rem',
        marginBottom: '0.5rem',
        flex: 1
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', alignItems: 'center' }}>
          <span style={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 500 }}>Mode de vente</span>
          <span style={{ color: '#4338ca', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {saleMode?.emoji} {saleMode?.label}
          </span>
        </div>
        {priceLines.length > 0 ? (
          priceLines.map((line) => (
            <div key={`${product.id}-${line.label}`} style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.25rem'
            }}>
              <span style={{ color: '#6b7280', fontSize: '0.7rem' }}>{line.label}</span>
              <span style={{ color: '#1f2937', fontWeight: 700, fontSize: '0.8rem' }}>{line.value}</span>
            </div>
          ))
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.25rem'
          }}>
            <span style={{ color: '#6b7280', fontSize: '0.7rem' }}>Prix</span>
            <span style={{ color: '#9ca3af', fontWeight: 600, fontSize: '0.75rem' }}>Non défini</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 500 }}>Stock</span>
          <span style={{ 
            color: product.quantite_stock <= product.seuilAlerte ? '#ef4444' : '#10b981',
            fontWeight: 600,
            fontSize: '0.75rem'
          }}>
            {formatStockDisplay(product)}
          </span>
        </div>
      </div>

      {/* Brand & Category */}
      <div style={{ 
        fontSize: '0.7rem', 
        color: '#6b7280', 
        marginBottom: '0.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        gap: '0.5rem'
      }}>
        <span>🏷️ {product.marque?.nom}</span>
        <span>📋 {product.categorie?.nom}</span>
      </div>

      {/* Low Stock Alert */}
      {product.quantite_stock <= product.seuilAlerte && (
        <div style={{
          background: '#fee2e2',
          color: '#dc2626',
          padding: '0.3rem',
          borderRadius: '6px',
          marginBottom: '0.5rem',
          textAlign: 'center',
          fontSize: '0.7rem',
          fontWeight: 600
        }}>
          ⚠️ Low Stock
        </div>
      )}

      {/* Expiring Lots Alert */}
      {(() => {
        if (!product.lot_de_stock || product.lot_de_stock.length === 0) return null;
        
        const now = new Date();
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
        
        const expiringLots = product.lot_de_stock.filter(lot => {
          if (!lot.date_expiration) return false;
          // Ignore lots with no remaining quantity
          if (typeof lot.quantite_restante === 'number' && lot.quantite_restante <= 0) return false;
          const expirationDate = new Date(lot.date_expiration);
          return expirationDate > now && expirationDate <= threeMonthsFromNow;
        });
        
        if (expiringLots.length === 0) return null;
        
        const earliestExpiration = new Date(Math.min(...expiringLots.map(lot => new Date(lot.date_expiration))));
        const daysUntilExpiration = Math.ceil((earliestExpiration - now) / (1000 * 60 * 60 * 24));
        
        return (
          <div style={{
            background: daysUntilExpiration <= 30 ? '#fee2e2' : '#fef3c7',
            color: daysUntilExpiration <= 30 ? '#dc2626' : '#d97706',
            padding: '0.3rem',
            borderRadius: '6px',
            marginBottom: '0.5rem',
            textAlign: 'center',
            fontSize: '0.7rem',
            fontWeight: 600
          }}>
            {daysUntilExpiration <= 30 ? '🚨' : '⚠️'} Expire dans {daysUntilExpiration}j
          </div>
        );
      })()}
    </div>
  );
};

// List View Item Component
const ProductListItem = ({ product, onViewDetails, onEdit, onDelete }) => {
  const priceLines = getPriceLines(product);
  const saleMode = getSaleModeBadge(product?.modeVente);

  return (
    <div 
      onClick={() => onViewDetails()}
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        display: 'grid',
        gridTemplateColumns: '120px 1fr',
        gap: '1rem',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }}
    >
      {/* Image */}
      <div style={{
        width: '120px',
        height: '120px',
        background: '#f8f9fa',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.nom}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <span style={{ fontSize: '2.5rem' }}>📦</span>
        )}
      </div>

      {/* Details */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.1rem', fontWeight: 600 }}>
            {product.nom}
          </h3>
          <span style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 600
          }}>
            {product.reference}
          </span>
          {saleMode && (
            <span style={{
              background: '#eef2ff',
              color: '#4338ca',
              padding: '0.25rem 0.6rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <span>{saleMode.emoji}</span>
              <span>{saleMode.label}</span>
            </span>
          )}
        </div>
        {product.description && (
          <p style={{ 
            color: '#6b7280', 
            fontSize: '0.9rem', 
            margin: '0 0 0.5rem 0',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {product.description}
          </p>
        )}
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <span style={{ color: '#6b7280', display: 'block' }}>Prix:</span>
            {priceLines.length > 0 ? (
              priceLines.map((line) => (
                <div key={`${product.id}-${line.label}`} style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.85rem' }}>
                  {line.label}: {line.value}
                </div>
              ))
            ) : (
              <div style={{ color: '#9ca3af', fontWeight: 600 }}>Non défini</div>
            )}
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Stock: </span>
            <span style={{ 
              fontWeight: 600,
              color: product.quantite_stock <= product.seuilAlerte ? '#ef4444' : '#10b981'
            }}>
              {formatStockDisplay(product)}
            </span>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>🏷️ </span>
            <span>{product.marque?.nom}</span>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>📋 </span>
            <span>{product.categorie?.nom}</span>
          </div>
        </div>
        
        {/* Alerts */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          {product.quantite_stock <= product.seuilAlerte && (
            <div style={{
              background: '#fee2e2',
              color: '#dc2626',
              padding: '0.25rem 0.5rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              ⚠️ Low Stock
            </div>
          )}
          {(() => {
            if (!product.lot_de_stock || product.lot_de_stock.length === 0) return null;
            
            const now = new Date();
            const threeMonthsFromNow = new Date();
            threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
            
            const expiringLots = product.lot_de_stock.filter(lot => {
              if (!lot.date_expiration) return false;
              const expirationDate = new Date(lot.date_expiration);
              return expirationDate > now && expirationDate <= threeMonthsFromNow;
            });
            
            if (expiringLots.length === 0) return null;
            
            const earliestExpiration = new Date(Math.min(...expiringLots.map(lot => new Date(lot.date_expiration))));
            const daysUntilExpiration = Math.ceil((earliestExpiration - now) / (1000 * 60 * 60 * 24));
            
            return (
              <div style={{
                background: daysUntilExpiration <= 30 ? '#fee2e2' : '#fef3c7',
                color: daysUntilExpiration <= 30 ? '#dc2626' : '#d97706',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                {daysUntilExpiration <= 30 ? '🚨' : '⚠️'} Expire dans {daysUntilExpiration}j
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default ProductList;
