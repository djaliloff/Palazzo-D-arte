import React, { useState } from 'react';
import ProductList from '../components/ProductList';
import ProductForm from '../components/ProductForm';
import AddStockForm from '../components/AddStockForm';

const ProductsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [showAddStockForm, setShowAddStockForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProduct(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleAddStockSuccess = () => {
    setShowAddStockForm(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '2rem', 
          fontWeight: 700, 
          color: '#1f2937',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Products
        </h1>
        {!showForm && !showAddStockForm && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setShowAddStockForm(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #4CAF50 0%, #10b981 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              style={{
                padding: '0.875rem 1.75rem',
                background: 'linear-gradient(135deg, #4CAF50 0%, #10b981 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              📦 Add to Stock/Dépôt
            </button>
            <button
              onClick={handleAdd}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #5568d3 0%, #667eea 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              style={{
                padding: '0.875rem 1.75rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>+</span> Add Product
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          onSuccess={handleFormSuccess}
          onCancel={handleCancel}
        />
      )}

      {showAddStockForm && (
        <AddStockForm
          onSuccess={handleAddStockSuccess}
          onCancel={() => setShowAddStockForm(false)}
        />
      )}

      <ProductList key={refreshKey} onEdit={handleEdit} />
    </div>
  );
};

export default ProductsPage;

