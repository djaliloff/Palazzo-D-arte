import React from 'react';

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

  return label || unit?.toLowerCase();
};

const formatStockDisplay = (product) => {
  const quantity = Number(product?.quantite_stock ?? 0);

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

const ProductDetailModal = ({ product, onClose, onEdit, onDelete }) => {
  if (!product) return null;

  const priceLines = getPriceLines(product);
  const saleMode = getSaleModeBadge(product?.modeVente);

  return (
    <div
      style={{
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
        zIndex: 2000,
        padding: '2rem',
        overflow: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          borderRadius: '24px',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          maxWidth: '1000px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
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

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '0',
          overflow: 'hidden',
          flex: 1
        }}>
          {/* Left Column - Image */}
          <div style={{
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            padding: '3rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderRight: '1px solid rgba(0, 0, 0, 0.05)'
          }}>
            {product.image ? (
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '2rem',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '400px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}>
                  {product.reference}
                </div>
                <img
                  src={product.image}
                  alt={product.nom}
                  style={{
                    width: '100%',
                    height: '400px',
                    objectFit: 'contain',
                    borderRadius: '12px'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div style={{
                height: '400px',
                width: '100%',
                maxWidth: '400px',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                borderRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#adb5bd',
                border: '2px dashed #dee2e6',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}>
                <span style={{ fontSize: '5rem', marginBottom: '1rem' }}>📦</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>No Image Available</span>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              width: '100%',
              maxWidth: '400px',
              marginTop: '2rem'
            }}>
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit(product);
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                  }}
                >
                  <span>✏️</span>
                  <span>Edit Product</span>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    onDelete(product);
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)';
                  }}
                >
                  <span>🗑️</span>
                  <span>Delete Product</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div style={{
            padding: '3rem 2.5rem',
            overflowY: 'auto',
            background: 'white'
          }}>
            {/* Header */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h1 style={{
                margin: '0 0 0.75rem 0',
                fontSize: '2.5rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: '1.2',
                letterSpacing: '-0.02em'
              }}>
                {product.nom}
              </h1>
              {product.description && (
                <p style={{
                  color: '#6b7280',
                  fontSize: '1.1rem',
                  lineHeight: '1.7',
                  margin: '0 0 1.5rem 0'
                }}>
                  {product.description}
                </p>
              )}
            </div>

            {/* Details Grid */}
            <div style={{
              display: 'grid',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {/* Price */}
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                padding: '2rem',
                borderRadius: '16px',
                border: '2px solid #fcd34d',
                boxShadow: '0 4px 20px rgba(252, 211, 77, 0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '100px',
                  height: '100px',
                  background: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  filter: 'blur(20px)'
                }} />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.75rem'
                }}>
                  <span style={{ fontSize: '2rem' }}>{saleMode.emoji}</span>
                  <span style={{
                    color: '#78350f',
                    fontWeight: 700,
                    fontSize: '1rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>
                    {saleMode.label}
                  </span>
                </div>
                {priceLines.length > 0 ? (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {priceLines.map((line) => (
                      <div
                        key={`${product.id}-${line.label}`}
                        style={{
                          fontSize: '2.5rem',
                          fontWeight: 800,
                          color: '#78350f',
                          lineHeight: '1.1'
                        }}
                      >
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{line.label}</div>
                        <div>
                          {line.value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: '#92400e'
                  }}>
                    Prix non défini pour ce mode de vente.
                  </div>
                )}
              </div>

              {/* Stock Information */}
              <div style={{
                background: product.quantite_stock <= product.seuilAlerte
                  ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
                  : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                padding: '2rem',
                borderRadius: '16px',
                border: `2px solid ${product.quantite_stock <= product.seuilAlerte ? '#fca5a5' : '#6ee7b7'}`,
                boxShadow: `0 4px 20px ${product.quantite_stock <= product.seuilAlerte ? 'rgba(252, 165, 165, 0.2)' : 'rgba(110, 231, 183, 0.2)'}`,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-30px',
                  left: '-30px',
                  width: '120px',
                  height: '120px',
                  background: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  filter: 'blur(30px)'
                }} />
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem'
                  }}>
                    <span style={{ fontSize: '1.75rem' }}>📦</span>
                    <span style={{
                      color: product.quantite_stock <= product.seuilAlerte ? '#991b1b' : '#065f46',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}>
                      Stock
                    </span>
                  </div>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: product.quantite_stock <= product.seuilAlerte ? '#991b1b' : '#065f46',
                    lineHeight: '1.2'
                  }}>
                    {formatStockDisplay(product)}
                  </div>
                </div>
              </div>

              {product.quantite_stock <= product.seuilAlerte && (
                <div style={{
                  background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                  color: '#dc2626',
                  padding: '1.5rem',
                  borderRadius: '16px',
                  textAlign: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  border: '2px solid #fecaca',
                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                  <span>Low Stock Alert - Below Threshold ({product.seuilAlerte})</span>
                </div>
              )}

              {/* Additional Info */}
              <div style={{
                background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
                padding: '2rem',
                borderRadius: '16px',
                border: '2px solid #e5e7eb',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
              }}>
                <h3 style={{
                  margin: '0 0 1.5rem 0',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: '#1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>ℹ️</span>
                  <span>Additional Information</span>
                </h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  >
                    <span style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🏷️ Brand
                    </span>
                    <span style={{ color: '#1f2937', fontWeight: 700, fontSize: '1rem' }}>
                      {product.marque?.nom || 'N/A'}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  >
                    <span style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      📋 Category
                    </span>
                    <span style={{ color: '#1f2937', fontWeight: 700, fontSize: '1rem' }}>
                      {product.categorie?.nom || 'N/A'}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  >
                    <span style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      📏 Unité de mesure
                    </span>
                    <span style={{ color: '#1f2937', fontWeight: 700, fontSize: '1rem' }}>
                      {product.uniteMesure ? getUnitLabel(product.uniteMesure, 1) : 'N/A'}
                    </span>
                  </div>
                  {product.poids && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      background: 'white',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    >
                      <span style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ⚖️ Weight
                      </span>
                      <span style={{ color: '#1f2937', fontWeight: 700, fontSize: '1rem' }}>
                        {product.poids} KG
                      </span>
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  >
                    <span style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ⏰ Perishable
                    </span>
                    <span style={{ color: '#1f2937', fontWeight: 700, fontSize: '1rem' }}>
                      {product.perissable ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lots Information */}
            {product.lot_de_stock && product.lot_de_stock.length > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
                padding: '2rem',
                borderRadius: '16px',
                border: '2px solid #e5e7eb',
                marginTop: '1.5rem',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
              }}>
                <h3 style={{
                  margin: '0 0 1.5rem 0',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: '#1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>📦</span>
                  <span>Stock Lots ({product.lot_de_stock.length})</span>
                </h3>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.75rem',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {product.lot_de_stock.map((lot, index) => {
                    const isExpired = product.perissable && lot.date_expiration && new Date(lot.date_expiration) <= new Date();
                    const expirationDate = lot.date_expiration ? new Date(lot.date_expiration) : null;
                    const threeMonthsFromNow = new Date();
                    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
                    const isExpiringSoon = expirationDate && expirationDate > new Date() && expirationDate <= threeMonthsFromNow;
                    const daysUntilExpiration = isExpiringSoon ? Math.ceil((expirationDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
                    return (
                      <div 
                        key={lot.id}
                        style={{
                          background: isExpired 
                            ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' 
                            : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                          padding: '1.25rem',
                          borderRadius: '12px',
                          border: `2px solid ${isExpired ? '#fca5a5' : '#e5e7eb'}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          boxShadow: isExpired 
                            ? '0 2px 8px rgba(252, 165, 165, 0.2)' 
                            : '0 2px 8px rgba(0, 0, 0, 0.05)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpired) {
                            e.currentTarget.style.borderColor = '#667eea';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpired) {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                          }
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontWeight: 700, 
                            color: isExpired ? '#991b1b' : '#1f2937', 
                            marginBottom: '0.5rem',
                            fontSize: '1.1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <span style={{ 
                              background: isExpired ? '#dc2626' : '#667eea',
                              color: 'white',
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}>
                              {index + 1}
                            </span>
                            <span>{lot.quantite} {product.uniteMesure}</span>
                          </div>
                          {lot.date_expiration ? (
                            <div>
                              <div style={{ 
                                fontSize: '0.95rem', 
                                color: isExpired ? '#dc2626' : isExpiringSoon ? '#d97706' : '#059669',
                                fontWeight: isExpired ? 700 : 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem'
                              }}>
                                <span style={{ fontSize: '1.1rem' }}>
                                  {isExpired ? '❌' : isExpiringSoon ? '⚠️' : '⏰'}
                                </span>
                                <span>Expires: {new Date(lot.date_expiration).toLocaleDateString()}</span>
                                {isExpired && (
                                  <span style={{
                                    background: '#dc2626',
                                    color: 'white',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    marginLeft: '0.5rem'
                                  }}>
                                    EXPIRED
                                  </span>
                                )}
                                {isExpiringSoon && !isExpired && (
                                  <span style={{
                                    background: daysUntilExpiration <= 30 ? '#dc2626' : '#d97706',
                                    color: 'white',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    marginLeft: '0.5rem'
                                  }}>
                                    {daysUntilExpiration <= 30 ? '🚨' : '⚠️'} {daysUntilExpiration} jour{daysUntilExpiration > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              {isExpiringSoon && !isExpired && daysUntilExpiration <= 30 && (
                                <div style={{
                                  background: '#fee2e2',
                                  color: '#991b1b',
                                  padding: '0.5rem',
                                  borderRadius: '8px',
                                  fontSize: '0.85rem',
                                  fontWeight: 600,
                                  marginTop: '0.25rem'
                                }}>
                                  🚨 Expiration imminente ! Utiliser ce lot en priorité.
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ 
                              fontSize: '0.95rem', 
                              color: '#6b7280',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.5rem'
                            }}>
                              <span>📅</span>
                              <span>No expiration date</span>
                            </div>
                          )}
                          <div style={{ 
                            fontSize: '0.85rem', 
                            color: isExpired ? '#b91c1c' : '#9ca3af',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <span>📆</span>
                            <span>Created: {new Date(lot.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {product.perissable && (
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '1.25rem',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    color: '#92400e',
                    fontWeight: 600,
                    border: '1px solid #fcd34d',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
                    <span>For perishable products, expired lots are excluded from stock calculation</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
