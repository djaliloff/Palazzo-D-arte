import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AchatForm from '../components/AchatForm';

const LancerAchatPage = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(true);

  const handleFormSuccess = () => {
    // Rediriger vers la page Historique d'Achats après création réussie
    navigate('/achats');
  };

  const handleCancel = () => {
    // Si l'utilisateur annule, rediriger vers la page Historique d'Achats
    navigate('/achats');
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
          🛒 Lancer un Achat
        </h1>
      </div>

      {showForm && (
        <AchatForm
          onSuccess={handleFormSuccess}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default LancerAchatPage;

