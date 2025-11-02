import React, { useState } from 'react';
import AchatList from '../components/AchatList';
import AchatForm from '../components/AchatForm';

const AchatsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFormSuccess = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Achats (Purchases)</h1>
        <button
          onClick={() => setShowForm(true)}
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
          + New Purchase
        </button>
      </div>

      {showForm ? (
        <AchatForm
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      ) : null}

      <AchatList key={refreshKey} />
    </div>
  );
};

export default AchatsPage;

