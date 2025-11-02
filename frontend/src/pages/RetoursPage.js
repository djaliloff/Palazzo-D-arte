import React, { useState } from 'react';
import RetourList from '../components/RetourList';
import RetourForm from '../components/RetourForm';

const RetoursPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFormSuccess = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Retours (Returns)</h1>
        {!showForm && (
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
            + New Return
          </button>
        )}
      </div>

      {showForm ? (
        <RetourForm
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      ) : null}

      <RetourList key={refreshKey} />
    </div>
  );
};

export default RetoursPage;

