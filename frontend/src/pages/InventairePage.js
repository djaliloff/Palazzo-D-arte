import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatStockDisplay } from '../components/ProductList';

const InventairePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleExportExcel = () => {
    if (!products || products.length === 0) {
      return;
    }

    const headers = ['Reference', 'Produit', 'Quantite'];
    const rows = products.map((p) => [
      p.reference ?? '',
      p.nom ?? '',
      formatStockDisplay(p) ?? '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row
        .map((cell) => {
          const value = String(cell ?? '');
          const escaped = value.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(';')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'inventaire.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/products', {
          params: {
            page: 1,
            limit: 500,
          },
        });

        const responseData = response.data.products || response.data;
        setProducts(responseData);
        setError('');
      } catch (err) {
        console.error('Failed to load inventory products', err);
        setError('Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="page-section">
        <header className="page-header">
          <h1 className="page-title">Inventaire</h1>
        </header>
        <div style={{ textAlign: 'center', padding: '3rem' }}>⏳ Chargement de l\'inventaire...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-section">
        <header className="page-header">
          <h1 className="page-title">Inventaire</h1>
        </header>
        <div style={{ color: 'red', padding: '1rem' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="page-section">
      <header className="page-header">
        <h1 className="page-title">Inventaire</h1>
        <div className="page-actions">
          <button
            type="button"
            className="action-button action-button--secondary"
            onClick={handleExportExcel}
            disabled={!products || products.length === 0}
          >
            <span className="action-button__icon" aria-hidden="true">📥</span>
            Exporter Excel
          </button>
        </div>
      </header>

      <div
        style={{
          overflowX: 'auto',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          background: 'white',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.9rem',
          }}
        >
          <thead>
            <tr
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>
                Référence
              </th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>
                Produit
              </th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem' }}>
                Quantité en stock
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem 1rem' }}>{product.reference}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{product.nom}</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                  {formatStockDisplay(product)}
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6b7280' }}>
                  Aucun produit trouvé dans l\'inventaire.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventairePage;
