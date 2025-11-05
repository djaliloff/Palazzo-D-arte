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
        <h1 style={{ 
          margin: 0, 
          fontSize: '2rem', 
          fontWeight: 700, 
          color: '#1f2937',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Achats (Purchases)
        </h1>
      </div>

      {/* New purchase form entry removed on request */}

      <AchatList key={refreshKey} />
    </div>
  );
};

export default AchatsPage;

