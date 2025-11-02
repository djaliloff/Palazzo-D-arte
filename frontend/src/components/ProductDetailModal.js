import React from 'react';

const ProductDetailModal = ({ product, onClose, onEdit }) => {
  if (!product) return null;

  const formatStockDisplay = (product) => {
    if (product.poids && product.uniteMesure === 'KG' && product.venduParUnite) {
      const quantiteStock = parseFloat(product.quantite_stock) || 0;
      const piecesCompletes = Math.floor(quantiteStock);
      const resteEnKg = (quantiteStock - piecesCompletes) * product.poids;
      
      if (resteEnKg > 0 && piecesCompletes > 0) {
        return `${piecesCompletes} pièce${piecesCompletes > 1 ? 's' : ''} et ${resteEnKg.toFixed(2)} kg`;
      } else if (piecesCompletes > 0) {
        return `${piecesCompletes} pièce${piecesCompletes > 1 ? 's' : ''}`;
      } else if (resteEnKg > 0) {
        return `${resteEnKg.toFixed(2)} kg`;
      }
    }
    return `${product.quantite_stock} ${product.uniteMesure}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '2rem',
        overflow: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
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
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(0, 0, 0, 0.5)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            color: 'white',
            fontSize: '1.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
            e.currentTarget.style.transform = 'rotate(90deg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
            e.currentTarget.style.transform = 'rotate(0deg)';
          }}
        >
          ✕
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', padding: '2rem' }}>
          {/* Left Column - Image */}
          <div>
            {product.image ? (
              <div style={{
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid #e9ecef',
                marginBottom: '1.5rem'
              }}>
                <img
                  src={product.image}
                  alt={product.nom}
                  style={{
                    width: '100%',
                    height: '400px',
                    objectFit: 'contain',
                    borderRadius: '8px'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div style={{
                height: '400px',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#adb5bd',
                border: '2px dashed #dee2e6',
                marginBottom: '1.5rem'
              }}>
                <span style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>No Image Available</span>
              </div>
            )}

            {/* Action Buttons */}
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(product);
                  onClose();
                }}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }}
              >
                ✏️ Edit Product
              </button>
            )}
          </div>

          {/* Right Column - Details */}
          <div>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '1rem',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
              }}>
                {product.reference}
              </div>
              <h1 style={{
                margin: 0,
                fontSize: '2rem',
                fontWeight: 700,
                color: '#1f2937',
                marginBottom: '0.5rem',
                lineHeight: '1.2'
              }}>
                {product.nom}
              </h1>
              {product.description && (
                <p style={{
                  color: '#6b7280',
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {product.description}
                </p>
              )}
            </div>

            {/* Details Grid */}
            <div style={{
              display: 'grid',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {/* Price */}
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid #fcd34d'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>💰</span>
                  <span style={{
                    color: '#78350f',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}>
                    Unit Price
                  </span>
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#78350f'
                }}>
                  {product.prixUnitaire} DA
                </div>
                {product.prixTotal && product.prixTotal !== product.prixUnitaire && (
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#92400e',
                    marginTop: '0.5rem'
                  }}>
                    Total: {product.prixTotal} DA
                  </div>
                )}
              </div>

              {/* Stock Information */}
              <div style={{
                background: product.quantite_stock <= product.seuilAlerte
                  ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
                  : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                padding: '1.25rem',
                borderRadius: '12px',
                border: `1px solid ${product.quantite_stock <= product.seuilAlerte ? '#fca5a5' : '#6ee7b7'}`,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>📦</span>
                    <span style={{
                      color: product.quantite_stock <= product.seuilAlerte ? '#991b1b' : '#065f46',
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}>
                      Stock
                    </span>
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: product.quantite_stock <= product.seuilAlerte ? '#991b1b' : '#065f46'
                  }}>
                    {formatStockDisplay(product)}
                  </div>
                </div>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>🏭</span>
                    <span style={{
                      color: product.quantite_stock <= product.seuilAlerte ? '#991b1b' : '#065f46',
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}>
                      Dépôt
                    </span>
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: product.quantite_stock <= product.seuilAlerte ? '#991b1b' : '#065f46'
                  }}>
                    {product.quantite_depos || 0} {product.uniteMesure}
                  </div>
                </div>
              </div>

              {product.quantite_stock <= product.seuilAlerte && (
                <div style={{
                  background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                  color: '#dc2626',
                  padding: '1rem',
                  borderRadius: '12px',
                  textAlign: 'center',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  border: '1px solid #fecaca',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)'
                }}>
                  ⚠️ Low Stock Alert - Below Threshold ({product.seuilAlerte})
                </div>
              )}

              {/* Additional Info */}
              <div style={{
                background: '#f9fafb',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#1f2937'
                }}>
                  Additional Information
                </h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <span style={{ color: '#6b7280', fontWeight: 500 }}>🏷️ Brand</span>
                    <span style={{ color: '#1f2937', fontWeight: 600 }}>
                      {product.marque?.nom || 'N/A'}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <span style={{ color: '#6b7280', fontWeight: 500 }}>📋 Category</span>
                    <span style={{ color: '#1f2937', fontWeight: 600 }}>
                      {product.categorie?.nom || 'N/A'}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <span style={{ color: '#6b7280', fontWeight: 500 }}>📏 Unit</span>
                    <span style={{ color: '#1f2937', fontWeight: 600 }}>
                      {product.uniteMesure}
                    </span>
                  </div>
                  {product.poids && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '0.75rem',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <span style={{ color: '#6b7280', fontWeight: 500 }}>⚖️ Weight</span>
                      <span style={{ color: '#1f2937', fontWeight: 600 }}>
                        {product.poids} KG
                      </span>
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#6b7280', fontWeight: 500 }}>🛒 Partial Units</span>
                    <span style={{ color: '#1f2937', fontWeight: 600 }}>
                      {product.venduParUnite ? '✅ Allowed' : '❌ Not Allowed'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;

