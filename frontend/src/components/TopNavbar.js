import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/TopNavbar.css';

const TopNavbar = () => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [expiringLots, setExpiringLots] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    if (showNotifications) {
      fetchAllNotifications();
    }
  }, [showNotifications]);

  // Fetch counts on initial mount and when window gains focus
  useEffect(() => {
    fetchAllNotifications();
    const handleFocus = () => fetchAllNotifications();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAllNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const [expiringResponse, lowStockResponse] = await Promise.all([
        api.get('/products/alerts/expiring'),
        api.get('/products/alerts/low-stock')
      ]);
      setExpiringLots(expiringResponse.data.products || []);
      setLowStockProducts(lowStockResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setExpiringLots([]);
      setLowStockProducts([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const getInitials = () => {
    if (user?.nom && user?.prenom) {
      return `${user.nom.charAt(0)}${user.prenom.charAt(0)}`.toUpperCase();
    }
    return 'U';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const expiringCount = expiringLots.length;
  const lowStockCount = lowStockProducts.length;
  const totalNotificationCount = expiringCount + lowStockCount;

  return (
    <nav className="top-navbar">
      <div className="top-navbar-left">
      
      </div>

      <div className="top-navbar-right">
        {/* Notifications */}
        <div 
          className="icon-button" 
          onClick={() => setShowNotifications(!showNotifications)}
          style={{ position: 'relative' }}
          ref={notificationRef}
        >
          <span className="icon" style={{ fontSize: '1.4rem' }}>🔔</span>
          <span style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
              color: 'white',
              borderRadius: '50%',
              minWidth: '22px',
              height: '22px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              border: '3px solid white',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
              padding: totalNotificationCount > 9 ? '0 0.3rem' : '0'
            }}>
              {totalNotificationCount > 9 ? '9+' : totalNotificationCount}
            </span>
          {showNotifications && (
            <div className="notifications-dropdown" style={{ 
              maxHeight: '600px', 
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <div className="notification-header" style={{
                background: '#ffffff',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e5e7eb',
                position: 'sticky',
                top: 0,
                zIndex: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🔔</span>
                  <span style={{ 
                    fontWeight: 600, 
                    color: '#1f2937',
                    fontSize: '1rem'
                  }}>
                    Notifications
                  </span>
                </div>
              </div>
              
              <div style={{ padding: '0.5rem' }}>
                {loadingNotifications ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#9ca3af' }}>⏳</div>
                    <p style={{ color: '#9ca3af', fontWeight: 400, fontSize: '0.85rem' }}>Chargement...</p>
                  </div>
                ) : totalNotificationCount === 0 ? (
                  <div style={{ 
                    padding: '2rem', 
                    textAlign: 'center',
                    background: '#f9fafb',
                    margin: '0.5rem',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem', color: '#9ca3af' }}>✅</div>
                    <p style={{ 
                      color: '#6b7280', 
                      fontWeight: 500,
                      fontSize: '0.9rem'
                    }}>
                      Aucune alerte en cours
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Expiring Lots */}
                    {expiringLots.length > 0 && (
                      <>
                        <div style={{
                          padding: '0.75rem 1rem',
                          background: '#f9fafb',
                          margin: '0.5rem',
                          borderRadius: '8px',
                          fontWeight: 600,
                          color: '#6b7280',
                          fontSize: '0.85rem',
                          borderLeft: '3px solid #fbbf24'
                        }}>
                          ⏰ Lots en expiration
                        </div>
                        {expiringLots.map((item, index) => {
                          const isUrgent = item.daysUntilExpiration <= 30;
                          return (
                            <div 
                              key={item.produit.id || index}
                              style={{
                                padding: '1rem',
                                margin: '0.5rem',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                background: '#ffffff',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#d1d5db';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <div style={{ 
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                                marginBottom: '0.75rem'
                              }}>
                                <div style={{
                                  background: '#f9fafb',
                                  color: '#6b7280',
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '1.1rem',
                                  flexShrink: 0
                                }}>
                                  📦
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ 
                                    fontWeight: 600, 
                                    color: '#1f2937',
                                    marginBottom: '0.4rem',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.4'
                                  }}>
                                    {item.produit.nom}
                                  </div>
                                  <div style={{
                                    display: 'inline-block',
                                    background: '#f3f4f6',
                                    color: '#6b7280',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 500
                                  }}>
                                    {item.produit.reference}
                                  </div>
                                </div>
                              </div>
                              
                              <div style={{
                                background: '#f9fafb',
                                borderRadius: '6px',
                                padding: '0.75rem',
                                marginTop: '0.5rem'
                              }}>
                                <div style={{ 
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  marginBottom: '0.5rem'
                                }}>
                                  <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>⏰</span>
                                  <span style={{ 
                                    fontSize: '0.85rem', 
                                    color: '#6b7280'
                                  }}>
                                    Expire le: <strong style={{ color: '#1f2937' }}>{formatDate(item.earliestExpiration)}</strong>
                                  </span>
                                </div>
                                
                                <div style={{ 
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  marginBottom: '0.5rem'
                                }}>
                                  <span style={{ fontSize: '0.9rem' }}>
                                    {isUrgent ? '🚨' : '⚠️'}
                                  </span>
                                  <span style={{ 
                                    fontSize: '0.85rem',
                                    color: isUrgent ? '#dc2626' : '#f59e0b',
                                    fontWeight: 600
                                  }}>
                                    {item.daysUntilExpiration} jour{item.daysUntilExpiration > 1 ? 's' : ''} restant{item.daysUntilExpiration > 1 ? 's' : ''}
                                  </span>
                                </div>
                                
                                <div style={{ 
                                  fontSize: '0.75rem', 
                                  color: '#9ca3af',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}>
                                  <span>📊</span>
                                  <span>
                                    {item.lots.length} lot{item.lots.length > 1 ? 's' : ''} concerné{item.lots.length > 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                    
                    {/* Low Stock Products */}
                    {lowStockProducts.length > 0 && (
                      <>
                        <div style={{
                          padding: '0.75rem 1rem',
                          background: '#f9fafb',
                          margin: '0.5rem',
                          borderRadius: '8px',
                          fontWeight: 600,
                          color: '#6b7280',
                          fontSize: '0.85rem',
                          borderLeft: '3px solid #ef4444'
                        }}>
                          📦 Stock faible
                        </div>
                        {lowStockProducts.map((product, index) => {
                          const stockPercentage = (product.quantite_stock / product.seuilAlerte) * 100;
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
                              key={product.id || index}
                              style={{
                                padding: '1rem',
                                margin: '0.5rem',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                background: '#ffffff',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#d1d5db';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <div style={{ 
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                                marginBottom: '0.75rem'
                              }}>
                                <div style={{
                                  background: '#f9fafb',
                                  color: '#6b7280',
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '1.1rem',
                                  flexShrink: 0
                                }}>
                                  📦
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ 
                                    fontWeight: 600, 
                                    color: '#1f2937',
                                    marginBottom: '0.4rem',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.4'
                                  }}>
                                    {product.nom}
                                  </div>
                                  <div style={{
                                    display: 'inline-block',
                                    background: '#f3f4f6',
                                    color: '#6b7280',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 500
                                  }}>
                                    {product.reference}
                                  </div>
                                </div>
                              </div>
                              
                              <div style={{
                                background: '#f9fafb',
                                borderRadius: '6px',
                                padding: '0.75rem',
                                marginTop: '0.5rem'
                              }}>
                                <div style={{ 
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  marginBottom: '0.5rem'
                                }}>
                                  <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>⚠️</span>
                                  <span style={{ 
                                    fontSize: '0.85rem', 
                                    color: '#6b7280'
                                  }}>
                                    Stock actuel: <strong style={{ color: '#dc2626' }}>{formatStockDisplay(product)}</strong>
                                  </span>
                                </div>
                                
                                <div style={{ 
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  marginBottom: '0.5rem'
                                }}>
                                  <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>📊</span>
                                  <span style={{ 
                                    fontSize: '0.85rem',
                                    color: '#6b7280'
                                  }}>
                                    Seuil d'alerte: <strong style={{ color: '#1f2937' }}>{product.seuilAlerte} {product.uniteMesure}</strong>
                                  </span>
                                </div>
                                
                                <div style={{
                                  background: '#e5e7eb',
                                  borderRadius: '4px',
                                  height: '6px',
                                  overflow: 'hidden',
                                  marginTop: '0.5rem'
                                }}>
                                  <div style={{
                                    background: '#dc2626',
                                    height: '100%',
                                    width: `${Math.min(stockPercentage, 100)}%`,
                                    transition: 'width 0.3s ease'
                                  }} />
                                </div>
                                
                                <div style={{ 
                                  fontSize: '0.75rem', 
                                  color: '#9ca3af',
                                  marginTop: '0.25rem'
                                }}>
                                  {stockPercentage.toFixed(0)}% du seuil
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                    
                    {expiringLots.length === 0 && lowStockProducts.length === 0 && (
                      <div style={{ 
                        padding: '2rem', 
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                        margin: '0.5rem',
                        borderRadius: '12px',
                        border: '2px solid #6ee7b7'
                      }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <p style={{ 
                          color: '#065f46', 
                          fontWeight: 600,
                          fontSize: '1rem'
                        }}>
                          Aucune alerte en cours
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>


        {/* User Profile */}
        <div className="user-profile">
          <div className="user-avatar">{getInitials()}</div>
          <div className="user-details">
            <span className="user-name">{user?.nom} {user?.prenom}</span>
            <span className="user-email">{user?.email}</span>
            <span className="user-role">{user?.role}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;

