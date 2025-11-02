import React, { useEffect, useState } from 'react';
import api from '../services/api';

const StatisticsPage = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalPurchases: 0,
    totalReturns: 0,
    activeClients: 0,
    lowStockCount: 0
  });
  const [salesStats, setSalesStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
    fetchSalesStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/stats/dashboard');
      setStats(response.data);
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
      const response = await api.get('/stats/sales');
      setSalesStats(response.data);
    } catch (err) {
      console.error('Failed to load sales stats:', err);
    }
  };

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
      bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'Total Purchases',
      value: stats.totalPurchases || 0,
      icon: '🛒',
      color: '#10b981',
      bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
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
      color: '#3b82f6',
      bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
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
      <div style={{ marginBottom: '2rem' }}>
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

      {/* Sales Statistics */}
      {salesStats && (
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
            Sales Statistics
          </h2>
          
          {salesStats.totalCount !== undefined && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Count</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#667eea' }}>
                  {salesStats.totalCount || 0}
                </div>
              </div>
              <div style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Amount</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#667eea' }}>
                  {parseFloat(salesStats.totalAmount?._sum?.prix_total || 0).toFixed(2)} DA
                </div>
              </div>
              <div style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Average Amount</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#667eea' }}>
                  {parseFloat(salesStats.averageAmount || 0).toFixed(2)} DA
                </div>
              </div>
            </div>
          )}

          {Array.isArray(salesStats) && salesStats.length > 0 && (
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#1f2937', fontSize: '1.1rem', fontWeight: 600 }}>
                Top Products by Sales
              </h3>
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
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>Product</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}>Quantity</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem' }}>Total Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesStats.map((sale, index) => (
                      <tr key={index} style={{
                        borderBottom: '1px solid #e5e7eb',
                        background: index % 2 === 0 ? 'white' : '#f9fafb'
                      }}>
                        <td style={{ padding: '1rem', fontWeight: 600, color: '#1f2937' }}>
                          {sale.produit?.nom || sale.produit?.reference || 'N/A'}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                          {sale._sum?.quantite || 0}
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
      )}
    </div>
  );
};

export default StatisticsPage;

