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
        <h1>Products</h1>
        {!showForm && !showAddStockForm && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setShowAddStockForm(true)}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 500
              }}
            >
              📦 Add to Stock/Dépôt
            </button>
            <button
              onClick={handleAdd}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 500
              }}
            >
              + Add Product
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

