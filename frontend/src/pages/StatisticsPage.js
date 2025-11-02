import React, { useEffect, useState } from 'react';
import api from '../services/api';

const StatisticsPage = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    netSales: 0,
    totalPurchases: 0,
    totalReturns: 0,
    activeClients: 0,
    lowStockCount: 0
  });
  const [salesStats, setSalesStats] = useState(null);
  const [salesByDay, setSalesByDay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchStats();
    fetchSalesStats();
  }, [filters]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get('/stats/dashboard', { params });
      setStats(response.data);
      setSalesByDay(response.data.salesByDay || []);
      setError('');
    } catch (err) {
      setError('Failed to load statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesStats = async () => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      params.groupBy = 'product';

      const response = await api.get('/stats/sales', { params });
      setSalesStats(response.data);
    } catch (err) {
      console.error('Failed to load sales stats:', err);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: ''
    });
  };

  // Calculate max value for chart scaling
  const maxChartValue = salesByDay.length > 0 
    ? Math.max(...salesByDay.map(d => Math.max(d.sales || 0, d.net || 0)))
    : 0;

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
      <p style={{ color: '#6b7280', fontSize: '1.1rem', fontWeight: 500 }}>Loading statistics...</p>
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

  const statCards = [
    {
      title: 'Total Sales',
      value: `${parseFloat(stats.totalSales || 0).toFixed(2)} DA`,
      icon: '💰',
      color: '#667eea',
      bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      subtitle: 'Before returns'
    },
    {
      title: 'Net Sales',
      value: `${parseFloat(stats.netSales || 0).toFixed(2)} DA`,
      icon: '💵',
      color: '#10b981',
      bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      subtitle: 'After returns'
    },
    {
      title: 'Total Purchases',
      value: stats.totalPurchases || 0,
      icon: '🛒',
      color: '#3b82f6',
      bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
    },
    {
      title: 'Total Returns',
      value: `${parseFloat(stats.totalReturns || 0).toFixed(2)} DA`,
      icon: '↩️',
      color: '#f59e0b',
      bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    {
      title: 'Active Clients',
      value: stats.activeClients || 0,
      icon: '👥',
      color: '#8b5cf6',
      bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
    },
    {
      title: 'Low Stock Products',
      value: stats.lowStockCount || 0,
      icon: '⚠️',
      color: stats.lowStockCount > 0 ? '#ef4444' : '#10b981',
      bg: stats.lowStockCount > 0 
        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    }
  ];

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '2rem', 
          fontWeight: 700, 
          color: '#1f2937',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Statistics
        </h1>

        {/* Date Filters */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          alignItems: 'flex-end',
          flexWrap: 'wrap'
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#374151'
            }}>
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              style={{
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'all 0.2s ease'
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
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#374151'
            }}>
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              style={{
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'all 0.2s ease'
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
          {(filters.startDate || filters.endDate) && (
            <button
              onClick={resetFilters}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#5a6268';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#6c757d';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {statCards.map((stat, index) => (
          <div
            key={index}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
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
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: stat.bg,
              opacity: 0.1,
              borderRadius: '50%',
              transform: 'translate(30px, -30px)'
            }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: stat.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                {stat.icon}
              </div>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 500, marginBottom: '0.5rem' }}>
              {stat.title}
              {stat.subtitle && (
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                  {stat.subtitle}
                </div>
              )}
            </div>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 700, 
              color: stat.color,
              background: stat.bg,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Sales Chart */}
      {salesByDay && salesByDay.length > 0 && (
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          marginBottom: '2rem'
        }}>
          <h2 style={{ 
            margin: 0, 
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#1f2937'
          }}>
            Sales Trend
          </h2>
          
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.5rem',
            height: '300px',
            padding: '1rem',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            position: 'relative'
          }}>
            {salesByDay.map((day, index) => {
              const salesHeight = maxChartValue > 0 ? (day.sales / maxChartValue) * 100 : 0;
              const netHeight = maxChartValue > 0 ? (day.net / maxChartValue) * 100 : 0;
              const date = new Date(day.date);
              
              return (
                <div key={index} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: 0,
                    right: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    alignItems: 'center'
                  }}>
                    {/* Net Sales Bar */}
                    <div
                      style={{
                        width: '100%',
                        height: `${netHeight}%`,
                        background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                        borderRadius: '4px 4px 0 0',
                        minHeight: netHeight > 0 ? '2px' : '0',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                      }}
                      title={`Net: ${day.net.toFixed(2)} DA`}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.8';
                        e.currentTarget.style.transform = 'scaleY(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.transform = 'scaleY(1)';
                      }}
                    />
                    {/* Returns Bar (negative) */}
                    {day.returns > 0 && (
                      <div
                        style={{
                          width: '100%',
                          height: `${(day.returns / maxChartValue) * 100}%`,
                          background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
                          borderRadius: '0 0 4px 4px',
                          minHeight: '2px',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                        }}
                        title={`Returns: ${day.returns.toFixed(2)} DA`}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.8';
                          e.currentTarget.style.transform = 'scaleY(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.transform = 'scaleY(1)';
                        }}
                      />
                    )}
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    fontSize: '0.7rem',
                    color: '#6b7280',
                    transform: 'rotate(-45deg)',
                    transformOrigin: 'center',
                    whiteSpace: 'nowrap',
                    width: '60px',
                    textAlign: 'center',
                    left: '50%',
                    marginLeft: '-30px'
                  }}>
                    {date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              }} />
              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Net Sales</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              }} />
              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Returns</span>
            </div>
          </div>
        </div>
      )}

      {/* Sales Statistics */}
      {salesStats && Array.isArray(salesStats) && salesStats.length > 0 && (
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ 
            margin: 0, 
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#1f2937'
          }}>
            Top Products by Sales
          </h2>
          
          <div style={{
            overflowX: 'auto',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.9rem'
            }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white'
                }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>#</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>Product</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}>Quantity</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem' }}>Total Sales</th>
                </tr>
              </thead>
              <tbody>
                {salesStats.map((sale, index) => (
                  <tr key={index} style={{
                    borderBottom: '1px solid #e5e7eb',
                    background: index % 2 === 0 ? 'white' : '#f9fafb',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (index % 2 === 0) {
                      e.currentTarget.style.background = '#f3f4f6';
                    } else {
                      e.currentTarget.style.background = '#e5e7eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#f9fafb';
                  }}
                  >
                    <td style={{ padding: '1rem', color: '#6b7280', fontWeight: 600 }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#1f2937' }}>
                      {sale.produit?.nom || sale.produit?.reference || 'N/A'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                      {parseFloat(sale._sum?.quantite || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#667eea' }}>
                      {parseFloat(sale._sum?.sousTotal || 0).toFixed(2)} DA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;
