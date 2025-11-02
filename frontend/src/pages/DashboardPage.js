import React, { useEffect, useState } from 'react';
import api from '../services/api';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalPurchases: 0,
    totalReturns: 0,
    activeClients: 0,
    lowStockCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/stats/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading dashboard...</div>;
  }

  const statsCards = [
    {
      title: 'Total Sales',
      value: `${stats.totalSales.toLocaleString()} DA`,
      color: '#667eea',
      icon: '💰'
    },
    {
      title: 'Total Purchases',
      value: stats.totalPurchases,
      color: '#4CAF50',
      icon: '🛒'
    },
    {
      title: 'Total Returns',
      value: `${stats.totalReturns.toLocaleString()} DA`,
      color: '#f44336',
      icon: '↩️'
    },
    {
      title: 'Active Clients',
      value: stats.activeClients,
      color: '#FF9800',
      icon: '👥'
    },
    {
      title: 'Low Stock Alerts',
      value: stats.lowStockCount,
      color: stats.lowStockCount > 0 ? '#c33' : '#4CAF50',
      icon: '⚠️'
    }
  ];

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Dashboard</h1>
      
      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {statsCards.map((stat, idx) => (
          <div key={idx} style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderLeft: `4px solid ${stat.color}`
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              {stat.icon}
            </div>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold',
              color: stat.color,
              marginBottom: '0.25rem'
            }}>
              {stat.value}
            </div>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>
              {stat.title}
            </div>
          </div>
        ))}
      </div>

      {/* Welcome Message */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0' }}>Welcome to Paint Store Management</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Manage your inventory, sales, and returns all in one place
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;

