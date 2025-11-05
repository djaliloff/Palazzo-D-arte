import React, { useEffect, useState } from 'react';
import PrettyDatePicker from '../components/PrettyDatePicker';
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
  const [brandAmounts, setBrandAmounts] = useState([]);
  const [topByBrand, setTopByBrand] = useState([]);
  const [topByCategory, setTopByCategory] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [categoryAmounts, setCategoryAmounts] = useState([]);
  const [clientTypeFilter, setClientTypeFilter] = useState('');
  const [hoverIndex, setHoverIndex] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchStats();
    fetchSalesStats();
    fetchBrandAmounts();
    fetchCategoryAmounts();
    fetchTopProducts();
    fetchTopClients();
  }, [filters]);

  useEffect(() => {
    fetchTopClients();
  }, [clientTypeFilter]);

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

  const buildDateParams = () => {
    const params = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    return params;
  };

  const fetchBrandAmounts = async () => {
    try {
      const params = buildDateParams();
      const res = await api.get('/stats/brands/amounts', { params });
      setBrandAmounts(res.data || []);
    } catch (e) {
      console.error('Failed to load brand amounts', e);
    }
  };

  const fetchCategoryAmounts = async () => {
    try {
      const params = buildDateParams();
      // Primary endpoint (if implemented in backend)
      const res = await api.get('/stats/categories/amounts', { params });
      setCategoryAmounts(res.data || []);
    } catch (e) {
      // Fallback: derive totals from top-products by category if the endpoint doesn't exist (404)
      try {
        const params = buildDateParams();
        const alt = await api.get('/stats/categories/top-products', { params });
        const groups = alt.data || [];
        const totals = groups.map(g => ({
          categorieId: g.categorieId,
          categorie: g.categorie,
          total: (g.products || []).reduce((s, p) => s + (parseFloat(p.montant || 0) || 0), 0)
        }));
        setCategoryAmounts(totals);
      } catch (altErr) {
        // Quietly ignore in UI; avoid noisy console during StrictMode double-invoke
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Category totals unavailable:', altErr?.response?.status || altErr?.message);
        }
        setCategoryAmounts([]);
      }
    }
  };

  const fetchTopProducts = async () => {
    try {
      const params = buildDateParams();
      params.limit = 5;
      const [byBrand, byCategory] = await Promise.all([
        api.get('/stats/brands/top-products', { params }),
        api.get('/stats/categories/top-products', { params })
      ]);
      setTopByBrand(byBrand.data || []);
      setTopByCategory(byCategory.data || []);
    } catch (e) {
      console.error('Failed to load top products', e);
    }
  };

  const fetchTopClients = async () => {
    try {
      const params = buildDateParams();
      if (clientTypeFilter) params.type = clientTypeFilter;
      params.limit = 10;
      const res = await api.get('/stats/top-clients', { params });
      setTopClients(res.data || []);
    } catch (e) {
      console.error('Failed to load top clients', e);
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

  // Calculate max value for chart scaling (consider sales, net and returns)
  const maxChartValue = salesByDay.length > 0 
    ? Math.max(...salesByDay.map(d => Math.max(d.sales || 0, d.net || 0, d.returns || 0)))
    : 0;

  const salesTrendData = (salesByDay || []).map(d => ({
    dateLabel: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    sales: Number(d.sales || 0),
    net: Number(d.net || 0),
    returns: Number(d.returns || 0)
  }));

  const chartData = salesTrendData.slice(-30);
  const svgWidth = 900;
  const svgHeight = 320;
  const paddingLeft = 48;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 32;
  const innerWidth = svgWidth - paddingLeft - paddingRight;
  const innerHeight = svgHeight - paddingTop - paddingBottom;
  const yMax = chartData.length > 0 ? Math.max(...chartData.map(d => Math.max(d.sales, d.net, d.returns))) : 0;
  const yScale = (v) => yMax === 0 ? paddingTop + innerHeight : paddingTop + innerHeight - (v / yMax) * innerHeight;
  const xScale = (i) => paddingLeft + (chartData.length <= 1 ? innerWidth / 2 : (i * innerWidth) / (chartData.length - 1));

  const areaPath = () => {
    if (chartData.length === 0) return '';
    let d = `M ${xScale(0)} ${yScale(chartData[0].sales)}`;
    for (let i = 1; i < chartData.length; i++) {
      d += ` L ${xScale(i)} ${yScale(chartData[i].sales)}`;
    }
    // close to baseline
    d += ` L ${xScale(chartData.length - 1)} ${paddingTop + innerHeight}`;
    d += ` L ${xScale(0)} ${paddingTop + innerHeight} Z`;
    return d;
  };
  const linePath = () => {
    if (chartData.length === 0) return '';
    let d = `M ${xScale(0)} ${yScale(chartData[0].net)}`;
    for (let i = 1; i < chartData.length; i++) {
      d += ` L ${xScale(i)} ${yScale(chartData[i].net)}`;
    }
    return d;
  };
  // 7-point moving average for Net
  const windowSize = Math.min(7, chartData.length);
  const movingAvg = chartData.map((_, i) => {
    const start = Math.max(0, i - windowSize + 1);
    const slice = chartData.slice(start, i + 1);
    const avg = slice.reduce((s, p) => s + p.net, 0) / slice.length;
    return avg;
  });
  const movingAvgPath = () => {
    if (chartData.length === 0) return '';
    let d = `M ${xScale(0)} ${yScale(movingAvg[0])}`;
    for (let i = 1; i < chartData.length; i++) {
      d += ` L ${xScale(i)} ${yScale(movingAvg[i])}`;
    }
    return d;
  };

  // Highlights & analytics
  const netValues = chartData.map(d => d.net);
  const salesValues = chartData.map(d => d.sales);
  const returnsValues = chartData.map(d => d.returns);
  const totalNet = netValues.reduce((s, v) => s + v, 0);
  const totalSalesSum = salesValues.reduce((s, v) => s + v, 0);
  const totalReturnsSum = returnsValues.reduce((s, v) => s + v, 0);
  const avgDaily = chartData.length ? totalNet / chartData.length : 0;
  const bestIdx = netValues.length ? netValues.indexOf(Math.max(...netValues)) : -1;
  const worstIdx = netValues.length ? netValues.indexOf(Math.min(...netValues)) : -1;
  const stdDev = (() => {
    if (netValues.length === 0) return 0;
    const mean = avgDaily;
    const variance = netValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / netValues.length;
    return Math.sqrt(variance);
  })();
  const coeffVar = avgDaily !== 0 ? (stdDev / avgDaily) * 100 : 0;
  const returnRate = totalSalesSum > 0 ? (totalReturnsSum / totalSalesSum) * 100 : 0;
  // Simple period-over-period growth (first half vs second half of the window)
  const mid = Math.floor(chartData.length / 2);
  const firstHalf = chartData.slice(0, mid).reduce((s, d) => s + d.net, 0);
  const secondHalf = chartData.slice(mid).reduce((s, d) => s + d.net, 0);
  const growth = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

  // Streaks above/below average
  const calcStreaks = () => {
    let best = 0, current = 0;
    let worst = 0, currentBelow = 0;
    netValues.forEach(v => {
      if (v >= avgDaily) {
        current += 1; best = Math.max(best, current);
        currentBelow = 0;
      } else {
        current = 0; currentBelow += 1; worst = Math.max(worst, currentBelow);
      }
    });
    return { best, worst };
  };
  const streaks = calcStreaks();

  // Returns line path (for a dedicated returns mini-chart)
  const returnsLinePath = () => {
    if (chartData.length === 0) return '';
    let d = `M ${xScale(0)} ${yScale(chartData[0].returns)}`;
    for (let i = 1; i < chartData.length; i++) {
      d += ` L ${xScale(i)} ${yScale(chartData[i].returns)}`;
    }
    return d;
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
            <PrettyDatePicker
              value={filters.startDate}
              onChange={(v) => handleFilterChange('startDate', v)}
              placeholder="mm/dd/yyyy"
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
            <PrettyDatePicker
              value={filters.endDate}
              onChange={(v) => handleFilterChange('endDate', v)}
              placeholder="mm/dd/yyyy"
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

      {/* Sales Chart (pure SVG, no external chart libs to avoid hook issues) */}
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

          <div style={{ height: svgHeight, overflowX: 'auto' }}>
            <svg width={svgWidth} height={svgHeight} style={{ minWidth: svgWidth }}>
              {/* Axes */}
              <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + innerHeight} stroke="#e5e7eb" />
              <line x1={paddingLeft} y1={paddingTop + innerHeight} x2={paddingLeft + innerWidth} y2={paddingTop + innerHeight} stroke="#e5e7eb" />
              {/* Grid lines */}
              {[0,0.25,0.5,0.75,1].map((t,i) => {
                const y = paddingTop + innerHeight - t*innerHeight;
                return <line key={i} x1={paddingLeft} y1={y} x2={paddingLeft + innerWidth} y2={y} stroke="#f1f5f9" />
              })}
              {/* Area for Sales */}
              <defs>
                <linearGradient id="areaSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity="0.35" />
                  <stop offset="95%" stopColor="#667eea" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <path d={areaPath()} fill="url(#areaSales)" stroke="none" />
              {/* Line for Net */}
              <path d={linePath()} fill="none" stroke="#10b981" strokeWidth="2" />
              {/* Moving average */}
              <path d={movingAvgPath()} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" />
              {/* Bars for Returns */}
              {chartData.map((d, i) => {
                const x = xScale(i) - 4;
                const y = yScale(d.returns);
                const h = paddingTop + innerHeight - y;
                return <rect key={i} x={x} y={y} width={8} height={h} fill="#ef4444" rx={2} />
              })}
              {/* Hover overlay (full plot area) */}
              <rect
                x={paddingLeft}
                y={paddingTop}
                width={innerWidth}
                height={innerHeight}
                fill="transparent"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const clamped = Math.max(paddingLeft, Math.min(paddingLeft + innerWidth, x));
                  const t = innerWidth > 0 ? (clamped - paddingLeft) / innerWidth : 0;
                  const idx = Math.round(t * Math.max(chartData.length - 1, 0));
                  setHoverIndex(idx);
                }}
                onMouseLeave={() => setHoverIndex(null)}
              />
              {/* Tooltip */}
              {hoverIndex !== null && chartData[hoverIndex] && (
                (() => {
                  const d = chartData[hoverIndex];
                  const tx = xScale(hoverIndex);
                  const ty = yScale(d.net) - 10;
                  const boxW = 160; const boxH = 66;
                  const bx = Math.min(Math.max(tx - boxW / 2, paddingLeft + 4), paddingLeft + innerWidth - boxW - 4);
                  const by = Math.max(ty - boxH - 8, paddingTop + 6);
                  return (
                    <g key="tooltip">
                      <line x1={tx} y1={ty} x2={tx} y2={paddingTop + innerHeight} stroke="#93c5fd" strokeDasharray="3 3" />
                      <circle cx={tx} cy={ty} r={4} fill="#10b981" stroke="white" strokeWidth={2} />
                      <rect x={bx} y={by} rx={8} ry={8} width={boxW} height={boxH} fill="white" stroke="#e5e7eb" />
                      <text x={bx + 10} y={by + 18} fontSize="12" fontWeight="700" fill="#111827">{d.dateLabel}</text>
                      <text x={bx + 10} y={by + 36} fontSize="12" fill="#6b7280">Sales: <tspan fill="#374151" fontWeight="700">{d.sales.toFixed(2)} DA</tspan></text>
                      <text x={bx + 10} y={by + 52} fontSize="12" fill="#6b7280">Net: <tspan fill="#10b981" fontWeight="700">{d.net.toFixed(2)} DA</tspan>  ·  Returns: <tspan fill="#ef4444" fontWeight="700">{d.returns.toFixed(2)} DA</tspan></text>
                    </g>
                  );
                })()
              )}
              {/* X tick labels */}
              {chartData.map((d, i) => (
                <text key={`x-${i}`} x={xScale(i)} y={paddingTop + innerHeight + 16} fontSize="10" textAnchor="middle" fill="#6b7280">
                  {d.dateLabel}
                </text>
              ))}
              {/* Legend */}
              <g transform={`translate(${paddingLeft}, ${paddingTop})`}>
                <rect x={0} y={-12} width={220} height={16} fill="white" />
                <circle cx={6} cy={-4} r={4} fill="#667eea" />
                <text x={16} y={-0} fontSize="12" fill="#374151">Sales</text>
                <circle cx={70} cy={-4} r={4} fill="#10b981" />
                <text x={80} y={-0} fontSize="12" fill="#374151">Net</text>
                <rect x={115} y={-8} width={8} height={8} fill="#ef4444" />
                <text x={130} y={-0} fontSize="12" fill="#374151">Returns</text>
                <line x1={180} y1={-4} x2={196} y2={-4} stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" />
                <text x={200} y={-0} fontSize="12" fill="#374151">MA(7)</text>
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* Highlights */}
      {salesByDay && salesByDay.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Avg Daily Net</div>
            <div style={{ fontWeight: 800, color: '#4f46e5', fontSize: '1.25rem' }}>{avgDaily.toFixed(2)} DA</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#065f46' }}>Best Day</div>
            <div style={{ fontWeight: 800, color: '#059669', fontSize: '1.25rem' }}>{bestIdx >= 0 ? chartData[bestIdx].net.toFixed(2) : '—'} DA</div>
            <div style={{ fontSize: '0.75rem', color: '#065f46' }}>{bestIdx >= 0 ? chartData[bestIdx].dateLabel : ''}</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#7f1d1d' }}>Worst Day</div>
            <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '1.25rem' }}>{worstIdx >= 0 ? chartData[worstIdx].net.toFixed(2) : '—'} DA</div>
            <div style={{ fontSize: '0.75rem', color: '#7f1d1d' }}>{worstIdx >= 0 ? chartData[worstIdx].dateLabel : ''}</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#7c2d12' }}>Growth vs prev</div>
            <div style={{ fontWeight: 800, color: growth >= 0 ? '#16a34a' : '#dc2626', fontSize: '1.25rem' }}>{growth.toFixed(1)}%</div>
            <div style={{ fontSize: '0.75rem', color: '#7c2d12' }}>Std Dev: {stdDev.toFixed(2)} DA</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#075985' }}>Return Rate</div>
            <div style={{ fontWeight: 800, color: '#0369a1', fontSize: '1.25rem' }}>{returnRate.toFixed(1)}%</div>
            <div style={{ fontSize: '0.75rem', color: '#075985' }}>Returns / Sales</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#5b21b6' }}>Volatility (CV)</div>
            <div style={{ fontWeight: 800, color: '#7c3aed', fontSize: '1.25rem' }}>{coeffVar.toFixed(1)}%</div>
            <div style={{ fontSize: '0.75rem', color: '#5b21b6' }}>Std Dev / Mean</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#155e75' }}>Streaks</div>
            <div style={{ fontWeight: 800, color: '#0891b2', fontSize: '1.25rem' }}>↑{streaks.best} / ↓{streaks.worst}</div>
            <div style={{ fontSize: '0.75rem', color: '#155e75' }}>Consecutive ≥avg / &lt; avg</div>
          </div>
        </div>
      )}

      {/* Returns Trend removed as requested */}

      {/* Top 5 Days Table */}
      {salesByDay && salesByDay.length > 0 && (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, marginBottom: '1rem' }}>Top Days (by Net)</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Sales</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Returns</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Net</th>
                </tr>
              </thead>
              <tbody>
                {[...chartData].sort((a,b) => b.net - a.net).slice(0,5).map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem' }}>{d.dateLabel}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{d.sales.toFixed(2)} DA</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#dc2626' }}>{d.returns.toFixed(2)} DA</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: '#667eea' }}>{d.net.toFixed(2)} DA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Amount per Brand */}
      {brandAmounts && brandAmounts.length > 0 && (
        <div style={{
          background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', marginTop: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Montant total par marque</h2>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              Showing <strong style={{ color: '#667eea' }}>{Math.min(brandAmounts.length, 20)}</strong> of <strong style={{ color: '#667eea' }}>{brandAmounts.length}</strong>
            </div>
          </div>
          {/* Donut pie for brands */}
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {(() => {
              const data = [...brandAmounts].slice(0, 8);
              const total = data.reduce((s, b) => s + (parseFloat(b.total || 0) || 0), 0);
              const colors = ['#667eea','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f472b6','#22c55e'];
              const cx = 140, cy = 140, r = 110, rIn = 60;
              let angle = -Math.PI / 2;
              const parts = data.map((b, idx) => {
                const val = parseFloat(b.total || 0) || 0;
                const frac = total > 0 ? (val / total) : 0;
                const a = frac * Math.PI * 2;
                const start = angle; const end = angle + a; angle = end;
                const large = a > Math.PI ? 1 : 0;
                const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
                const x2 = cx + r * Math.cos(end),   y2 = cy + r * Math.sin(end);
                const xi = cx + rIn * Math.cos(end), yi = cy + rIn * Math.sin(end);
                const xj = cx + rIn * Math.cos(start), yj = cy + rIn * Math.sin(start);
                const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi} ${yi} A ${rIn} ${rIn} 0 ${large} 0 ${xj} ${yj} Z`;
                // label position
                const mid = (start + end) / 2;
                const lx = cx + (r + 16) * Math.cos(mid);
                const ly = cy + (r + 16) * Math.sin(mid);
                return (
                  <g key={idx}>
                    <path d={d} fill={colors[idx % colors.length]} stroke="white" strokeWidth="1"/>
                    {frac > 0.06 && (
                      <text x={lx} y={ly} fontSize="11" fill="#374151" textAnchor="middle">
                        {(frac*100).toFixed(0)}%
                      </text>
                    )}
                  </g>
                );
              });
              return (
                <svg width={280} height={280}>
                  <defs>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.08" />
                    </filter>
                  </defs>
                  <g filter="url(#shadow)">{parts}</g>
                  <circle cx={cx} cy={cy} r={rIn-1} fill="white" />
                  <text x={cx} y={cy-8} textAnchor="middle" fontSize="12" fill="#6b7280">Total</text>
                  <text x={cx} y={cy+12} textAnchor="middle" fontSize="14" fontWeight="700" fill="#374151">{total.toFixed(0)} DA</text>
                </svg>
              );
            })()}
            <div style={{ minWidth: 260, flex: 1 }}>
              {[...brandAmounts].slice(0, 8).map((b, idx) => {
                const total = brandAmounts.reduce((s, x) => s + (parseFloat(x.total || 0) || 0), 0);
                const val = parseFloat(b.total || 0) || 0;
                const pct = total > 0 ? (val / total) * 100 : 0;
                return (
                  <div key={b.marqueId} style={{ display: 'grid', gridTemplateColumns: '14px 1fr auto auto', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span style={{ width: 12, height: 12, borderRadius: 2, background: ['#667eea','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f472b6','#22c55e'][idx % 8] }} />
                    <span style={{ color: '#374151' }}>{b.marque}</span>
                    <span style={{ color: '#6b7280', fontSize: 12 }}>{pct.toFixed(0)}%</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 600, color: '#667eea' }}>{val.toFixed(0)} DA</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Marque</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {brandAmounts.slice(0, 20).map((b) => (
                  <tr key={b.marqueId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{b.marque}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: '#667eea' }}>{parseFloat(b.total || 0).toFixed(2)} DA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Products per Brand */}
      {topByBrand && topByBrand.length > 0 && (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Produits les plus achetés par marque</h2>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Showing up to 10 products per marque</div>
          </div>
          {topByBrand.map(group => (
            <div key={group.marqueId} style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>{group.marque}</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Produit</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Quantité</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.products.slice(0, 10).map(p => (
                      <tr key={p.produitId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{p.produitNom || p.reference}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{parseFloat(p.quantite || 0).toFixed(2)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: '#667eea' }}>{parseFloat(p.montant || 0).toFixed(2)} DA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top Products per Category */}
      {topByCategory && topByCategory.length > 0 && (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Produits les plus achetés par catégorie</h2>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Showing up to 10 products per catégorie</div>
          </div>
          {topByCategory.map(group => (
            <div key={group.categorieId} style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>{group.categorie}</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Produit</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Quantité</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.products.slice(0, 10).map(p => (
                      <tr key={p.produitId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{p.produitNom || p.reference}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{parseFloat(p.quantite || 0).toFixed(2)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: '#667eea' }}>{parseFloat(p.montant || 0).toFixed(2)} DA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Donut pie for category net totals */}
      {categoryAmounts && categoryAmounts.length > 0 && (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Montant total par catégorie</h2>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              Showing <strong style={{ color: '#667eea' }}>{Math.min(categoryAmounts.length, 20)}</strong> of <strong style={{ color: '#667eea' }}>{categoryAmounts.length}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {(() => {
              const data = [...categoryAmounts].slice(0, 8);
              const total = data.reduce((s, c) => s + (parseFloat(c.total || 0) || 0), 0);
              const colors = ['#667eea','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f472b6','#22c55e'];
              const cx = 140, cy = 140, r = 110, rIn = 60;
              let angle = -Math.PI / 2;
              const parts = data.map((c, idx) => {
                const val = parseFloat(c.total || 0) || 0;
                const frac = total > 0 ? (val / total) : 0;
                const a = frac * Math.PI * 2;
                const start = angle; const end = angle + a; angle = end;
                const large = a > Math.PI ? 1 : 0;
                const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
                const x2 = cx + r * Math.cos(end),   y2 = cy + r * Math.sin(end);
                const xi = cx + rIn * Math.cos(end), yi = cy + rIn * Math.sin(end);
                const xj = cx + rIn * Math.cos(start), yj = cy + rIn * Math.sin(start);
                const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi} ${yi} A ${rIn} ${rIn} 0 ${large} 0 ${xj} ${yj} Z`;
                const mid = (start + end) / 2;
                const lx = cx + (r + 16) * Math.cos(mid);
                const ly = cy + (r + 16) * Math.sin(mid);
                return (
                  <g key={idx}>
                    <path d={d} fill={colors[idx % colors.length]} stroke="white" strokeWidth="1"/>
                    {frac > 0.06 && (
                      <text x={lx} y={ly} fontSize="11" fill="#374151" textAnchor="middle">{(frac*100).toFixed(0)}%</text>
                    )}
                  </g>
                );
              });
              return (
                <svg width={280} height={280}>
                  <g>{parts}</g>
                  <circle cx={cx} cy={cy} r={rIn-1} fill="white" />
                  <text x={cx} y={cy-8} textAnchor="middle" fontSize="12" fill="#6b7280">Total</text>
                  <text x={cx} y={cy+12} textAnchor="middle" fontSize="14" fontWeight="700" fill="#374151">{total.toFixed(0)} DA</text>
                </svg>
              );
            })()}
            <div style={{ minWidth: 260, flex: 1 }}>
              {[...categoryAmounts].slice(0, 8).map((c, idx) => {
                const total = categoryAmounts.reduce((s, x) => s + (parseFloat(x.total || 0) || 0), 0);
                const val = parseFloat(c.total || 0) || 0;
                const pct = total > 0 ? (val / total) * 100 : 0;
                return (
                  <div key={c.categorieId || idx} style={{ display: 'grid', gridTemplateColumns: '14px 1fr auto auto', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span style={{ width: 12, height: 12, borderRadius: 2, display: 'inline-block', background: ['#667eea','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f472b6','#22c55e'][idx % 8] }} />
                    <span style={{ color: '#374151' }}>{c.categorie || c.nom}</span>
                    <span style={{ color: '#6b7280', fontSize: 12 }}>{pct.toFixed(0)}%</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 600, color: '#667eea' }}>{val.toFixed(0)} DA</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Top Clients with Type Filter */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Meilleurs clients</h2>
          <select
            value={clientTypeFilter}
            onChange={(e) => setClientTypeFilter(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
          >
            <option value="">Tous</option>
            <option value="SIMPLE">Simple</option>
            <option value="PEINTRE">Peintre</option>
          </select>
        </div>
        {topClients && topClients.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Client</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Achats</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {topClients.slice(0, 10).map(c => (
                  <tr key={c.clientId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{c.prenom || ''} {c.nom || ''}</td>
                    <td style={{ padding: '0.75rem' }}>{c.type}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{c.count}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: '#667eea' }}>{parseFloat(c.total || 0).toFixed(2)} DA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: '#6b7280' }}>Aucun résultat</div>
        )}
      </div>

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
                {salesStats.slice(0, 20).map((sale, index) => (
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
