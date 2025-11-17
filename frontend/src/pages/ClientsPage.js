import React, { useState } from 'react';
import ClientList from '../components/ClientList';
import ClientForm from '../components/ClientForm';

const ClientsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => {
    setEditingClient(null);
    setShowForm(true);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingClient(null);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="page-section">
      <header className="page-header">
        <h1 className="page-title">Clients</h1>
        {!showForm && (
          <div className="page-actions">
            <button
              type="button"
              className="action-button action-button--primary"
              onClick={handleAdd}
            >
              <span className="action-button__icon" aria-hidden="true">＋</span>
              Add Client
            </button>
          </div>
        )}
      </header>

      {showForm && (
        <ClientForm
          client={editingClient}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingClient(null);
          }}
        />
      )}

      <ClientList key={refreshKey} onEdit={handleEdit} refreshKey={refreshKey} />
    </div>
  );
};

export default ClientsPage;

