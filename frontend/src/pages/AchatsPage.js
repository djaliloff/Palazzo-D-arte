import React from 'react';
import AchatList from '../components/AchatList';

const AchatsPage = () => {
  return (
    <div className="page-section">
      <header className="page-header">
        <h1 className="page-title">Achats (Purchases)</h1>
      </header>

      <AchatList />
    </div>
  );
};

export default AchatsPage;

