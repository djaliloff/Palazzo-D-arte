import React, { useState } from 'react';
import api from '../services/api';

const ClientForm = () => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    type: 'SIMPLE'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await api.post('/clients', formData);
      setMessage('Client created successfully!');
      // Reset form
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        adresse: '',
        type: 'SIMPLE'
      });
      // Reload page to show updated list
      window.location.reload();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error creating client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      background: 'white', 
      padding: '1.5rem', 
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '2rem'
    }}>
      <h2>Add New Client</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label>First Name *</label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>
          <div>
            <label>Last Name</label>
            <input
              type="text"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>
          <div>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>
          <div>
            <label>Phone</label>
            <input
              type="text"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Address</label>
            <input
              type="text"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Client Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            >
              <option value="SIMPLE">Simple</option>
              <option value="PEINTRE">Peintre</option>
            </select>
          </div>
        </div>
        {message && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: message.includes('Error') ? '#fee' : '#efe',
            color: message.includes('Error') ? '#c33' : '#3c3',
            borderRadius: '4px'
          }}>
            {message}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 2rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Creating...' : 'Create Client'}
        </button>
      </form>
    </div>
  );
};

export default ClientForm;

