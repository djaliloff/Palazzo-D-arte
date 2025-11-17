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
    <div className="page-section">
      <header className="page-header">
        <h1 className="page-title">Products</h1>
        {!showForm && !showAddStockForm && (
          <div className="page-actions">
            <button
              type="button"
              className="action-button action-button--secondary"
              onClick={() => setShowAddStockForm(true)}
            >
              <span className="action-button__icon" aria-hidden="true">📦</span>
              Add to Stock
            </button>
            <button
              type="button"
              className="action-button action-button--primary"
              onClick={handleAdd}
            >
              <span className="action-button__icon" aria-hidden="true">＋</span>
              Add Product
            </button>
          </div>
        )}
      </header>

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

