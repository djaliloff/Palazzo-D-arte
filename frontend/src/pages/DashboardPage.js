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
  const [recentAchats, setRecentAchats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentAchats();
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

  const fetchRecentAchats = async () => {
    try {
      const response = await api.get('/achats', {
        params: { limit: 5 }
      });
      // Get only the first 5
      setRecentAchats(response.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to load recent purchases:', error);
    }
  };

  const getStatusBadgeColor = (statut) => {
    switch (statut) {
      case 'VALIDE': 
        return { bg: '#e8f5e9', color: '#2e7d32', text: 'Valide' };
      case 'RETOURNE_PARTIEL': 
        return { bg: '#fff3e0', color: '#e65100', text: 'Retourné Partiel' };
      case 'RETOURNE_TOTAL': 
        return { bg: '#ffebee', color: '#c62828', text: 'Retourné Total' };
      default: 
        return { bg: '#f5f5f5', color: '#666', text: statut };
    }
  };

  const getClientTypeBadgeColor = (type) => {
    switch (type) {
      case 'PEINTRE':
        return { bg: '#fff9c4', color: '#f57f17', text: 'Peintre' };
      case 'SIMPLE':
      default:
        return { bg: '#e3f2fd', color: '#1976d2', text: 'Client' };
    }
  };

  // Calculer le montant total des retours pour un achat
  const calculateTotalReturns = (achat) => {
    if (!achat.retours || achat.retours.length === 0) {
      return 0;
    }
    return achat.retours.reduce((total, retour) => {
      return total + (parseFloat(retour.montantRembourse) || 0);
    }, 0);
  };

  // Calculer le prix réel (après retours)
  const calculateRealPrice = (achat) => {
    const totalReturns = calculateTotalReturns(achat);
    const prixInitial = parseFloat(achat.prix_total_remise || 0);
    return Math.max(0, prixInitial - totalReturns);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading dashboard...</div>;
  }

  const statsCards = [
    {
      title: "Today's Net Sales",
      value: `${(stats.todayNetSales || 0).toLocaleString()} DA`,
      color: '#667eea',
      icon: '💰'
    },
    {
      title: "Today's Purchases",
      value: stats.todayPurchases,
      color: '#4CAF50',
      icon: '🛒'
    },
    {
      title: "Today's Returns",
      value: `${(stats.todayReturns || 0).toLocaleString()} DA`,
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
      <h1 style={{ 
        margin: 0, 
        marginBottom: '2rem',
        fontSize: '2rem', 
        fontWeight: 700, 
        color: '#1f2937',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        Dashboard
      </h1>
      
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

      {/* Recent Purchases */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 1.5rem 0', color: '#333' }}>Recent Purchases</h2>
        {recentAchats.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
            Aucun achat récent
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '0.9rem'
            }}>
              <thead>
                <tr style={{ 
                  background: '#f5f5f5',
                  borderBottom: '2px solid #ddd'
                }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>BON N°</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>CLIENT</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>TELEPHONE</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>TYPE</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>AMOUNT</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>DATE</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {recentAchats.map((achat) => {
                  const statusBadge = getStatusBadgeColor(achat.statut);
                  const typeBadge = getClientTypeBadgeColor(achat.client?.type);
                  return (
                    <tr key={achat.id} style={{ 
                      borderBottom: '1px solid #eee',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <td style={{ padding: '0.75rem', color: '#333', fontWeight: 500 }}>
                        {achat.numeroBon}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#333' }}>
                        {achat.client?.prenom || ''} {achat.client?.nom || ''}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#666' }}>
                        {achat.client?.telephone || '—'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          background: typeBadge.bg,
                          color: typeBadge.color,
                          display: 'inline-block'
                        }}>
                          {typeBadge.text}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#333', fontWeight: 500 }}>
                        {calculateRealPrice(achat).toFixed(2)} DA
                        {calculateTotalReturns(achat) > 0 && (
                          <div style={{ 
                            fontSize: '0.7rem', 
                            color: '#ef4444',
                            marginTop: '0.25rem',
                            textDecoration: 'line-through',
                            opacity: 0.7,
                            fontWeight: 'normal'
                          }}>
                            ({parseFloat(achat.prix_total_remise).toFixed(2)} initial)
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#666' }}>
                        {new Date(achat.dateAchat).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          background: statusBadge.bg,
                          color: statusBadge.color,
                          display: 'inline-block'
                        }}>
                          {statusBadge.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;

