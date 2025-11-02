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
        <h1 style={{ 
          margin: 0, 
          fontSize: '2rem', 
          fontWeight: 700, 
          color: '#1f2937',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Retours (Returns)
        </h1>
        <button
          onClick={() => setShowForm(true)}
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
            <span>+</span> New Return
          </button>
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

