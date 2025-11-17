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
    <div className="page-section">
      <header className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </header>

      {/* Stats Grid */}
      <section className="metrics-grid">
        {statsCards.map((stat, idx) => (
          <article
            key={idx}
            className="metric-card"
            style={{
              borderLeftColor: stat.color,
              userSelect: 'none'
            }}
          >
            <div className="metric-card__icon" aria-hidden="true">
              {stat.icon}
            </div>
            <div className="metric-card__value" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="metric-card__label">{stat.title}</div>
          </article>
        ))}
      </section>

      {/* Recent Purchases */}
      <section className="section-card">
        <header className="section-card__header">
          <h2 className="section-card__title">Recent Purchases</h2>
        </header>
        {recentAchats.length === 0 ? (
          <p className="section-card__empty">
            Aucun achat récent
          </p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>BON N°</th>
                  <th>CLIENT</th>
                  <th>TELEPHONE</th>
                  <th>TYPE</th>
                  <th className="data-table__cell--numeric">AMOUNT</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {recentAchats.map((achat) => {
                  const statusBadge = getStatusBadgeColor(achat.statut);
                  const typeBadge = getClientTypeBadgeColor(achat.client?.type);
                  return (
                    <tr
                      key={achat.id}
                      style={{ userSelect: 'none' }}
                    >
                      <td className="data-table__cell--strong">
                        {achat.numeroBon}
                      </td>
                      <td>
                        {achat.client?.prenom || ''} {achat.client?.nom || ''}
                      </td>
                      <td>
                        {achat.client?.telephone || '—'}
                      </td>
                      <td>
                        <span className="badge" style={{ background: typeBadge.bg, color: typeBadge.color }}>
                          {typeBadge.text}
                        </span>
                      </td>
                      <td className="data-table__cell--numeric data-table__cell--strong">
                        {calculateRealPrice(achat).toFixed(2)} DA
                        {calculateTotalReturns(achat) > 0 && (
                          <div className="data-table__note">
                            ({parseFloat(achat.prix_total_remise).toFixed(2)} initial)
                          </div>
                        )}
                      </td>
                      <td>
                        {new Date(achat.dateAchat).toLocaleDateString()}
                      </td>
                      <td>
                        <span className="badge" style={{ background: statusBadge.bg, color: statusBadge.color }}>
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
      </section>
    </div>
  );
};

export default DashboardPage;

