import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';
import '../styles/MarquesPage.css';

const MarquesPage = () => {
  const [marques, setMarques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMarque, setEditingMarque] = useState(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeFinancialMarque, setActiveFinancialMarque] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [amountSubmitting, setAmountSubmitting] = useState(false);
  const [formData, setFormData] = useState(() => ({
    nom: '',
    description: '',
    actif: true,
    image: ''
  }));
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [toast, setToast] = useState({ open: false, type: 'info', message: '' });

  const fetchMarques = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/marques', {
        params: { status: statusFilter }
      });
      setMarques(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load brands');
      console.error(err);
      setToast({ open: true, type: 'error', message: 'Failed to load brands' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchMarques();
  }, [fetchMarques]);

  useEffect(() => {
    if (!toast.open) return;
    const timer = setTimeout(() => {
      setToast(prev => ({ ...prev, open: false }));
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.open]);

  const showToast = (type, message) => {
    setToast({ open: true, type, message });
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      actif: true,
      image: ''
    });
    setFormError('');
    setImagePreview('');
  };

  const openAddModal = () => {
    resetForm();
    setIsEditing(false);
    setEditingMarque(null);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    resetForm();
    setIsEditing(false);
    setEditingMarque(null);
    setShowFormModal(false);
  };

  const openEditModal = (marque) => {
    setFormData({
      nom: marque.nom || '',
      description: marque.description || '',
      actif: Boolean(marque.actif),
      image: marque.image || ''
    });
    setImagePreview(marque.image || '');
    setFormError('');
    setIsEditing(true);
    setEditingMarque(marque);
    setShowFormModal(true);
  };

  const resetFinancialState = () => {
    setActiveFinancialMarque(null);
    setAmountInput('');
    setAmountSubmitting(false);
    setShowCreditModal(false);
    setShowPaymentModal(false);
  };

  const openCreditModal = (marque) => {
    setActiveFinancialMarque(marque);
    setAmountInput('');
    setShowCreditModal(true);
    setShowPaymentModal(false);
  };

  const openPaymentModal = (marque) => {
    setActiveFinancialMarque(marque);
    setAmountInput('');
    setShowPaymentModal(true);
    setShowCreditModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file') {
      const file = files && files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        setFormError('Please select a valid image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setFormError('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setFormData(prev => ({
          ...prev,
          image: base64
        }));
        setImagePreview(base64);
        setFormError('');
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nom.trim()) {
      setFormError('Name is required');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const payload = {
        nom: formData.nom.trim(),
        description: formData.description.trim() || null,
        actif: Boolean(formData.actif),
        image: formData.image || null
      };

      if (isEditing && editingMarque) {
        await api.put(`/marques/${editingMarque.id}`, payload);
        showToast('success', 'Brand updated successfully');
      } else {
        await api.post('/marques', payload);
        showToast('success', 'Brand created successfully');
      }

      await fetchMarques();
      closeFormModal();
    } catch (err) {
      const message = err.response?.data?.message || (isEditing ? 'Failed to update brand' : 'Failed to create brand');
      setFormError(message);
      showToast('error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinancialSubmit = async (type) => {
    if (!activeFinancialMarque) return;

    const value = parseFloat(amountInput);
    if (Number.isNaN(value) || value <= 0) {
      showToast('error', 'Please enter a positive amount');
      return;
    }

    const outstanding = Math.max(0, (activeFinancialMarque.credit || 0) - (activeFinancialMarque.versment || 0));
    if (type === 'versment' && value > outstanding + 0.0001) {
      showToast('error', `Payment exceeds outstanding credit. Remaining: ${outstanding.toFixed(2)} DA`);
      return;
    }

    setAmountSubmitting(true);

    try {
      await api.put(`/marques/${activeFinancialMarque.id}/${type === 'credit' ? 'credit' : 'versment'}`, {
        amount: value
      });

      await fetchMarques();
      showToast('success', type === 'credit' ? 'Credit added successfully' : 'Payment recorded successfully');
      resetFinancialState();
    } catch (err) {
      const message = err.response?.data?.message || 'Operation failed';
      showToast('error', message);
      setAmountSubmitting(false);
    }
  };

  const filteredMarques = marques.filter(marque =>
    marque.nom?.toLowerCase().includes(search.toLowerCase()) ||
    marque.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ 
      textAlign: 'center', 
      padding: '4rem 2rem',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
      <p style={{ color: '#6b7280', fontSize: '1.1rem', fontWeight: 500 }}>Loading brands...</p>
    </div>
  );
  
  if (error) return (
    <div style={{ 
      padding: '2rem',
      background: '#fef2f2',
      borderRadius: '12px',
      border: '1px solid #fecaca',
      color: '#dc2626',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
      <p style={{ fontWeight: 600 }}>{error}</p>
    </div>
  );

  return (
    <div className="page-section">
      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
      />

      <header className="page-header">
        <h1 className="page-title">Brands</h1>
        <div className="page-actions">
          <button
            type="button"
            className="action-button action-button--primary"
            onClick={openAddModal}
          >
            <span className="action-button__icon" aria-hidden="true">＋</span>
            Add Brand
          </button>
        </div>
      </header>

      <section className="section-card">
        <header className="section-card__header">
          <div>
            <h2 className="section-card__title">Brands List</h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
              Showing <strong style={{ color: '#667eea' }}>{filteredMarques.length}</strong> of <strong style={{ color: '#667eea' }}>{marques.length}</strong> brands
            </p>
          </div>
          <div className="page-actions" style={{ gap: '0.5rem' }}>
            {['active', 'inactive', 'all'].map((status) => (
              <button
                key={status}
                type="button"
                className={`action-button ${statusFilter === status ? 'action-button--primary' : ''}`}
                style={{
                  background: statusFilter === status
                    ? undefined
                    : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                  color: statusFilter === status ? '#ffffff' : '#374151'
                }}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? 'All' : status === 'active' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
        </header>

        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <input
            type="text"
            placeholder="🔍 Search brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease',
              outline: 'none',
              background: 'white'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {filteredMarques.length === 0 ? (
          <p className="section-card__empty">No brands found</p>
        ) : (
          <div className="brand-grid">
            {filteredMarques.map((marque) => {
              const credit = Number(marque.credit || 0);
              const versment = Number(marque.versment || 0);
              const outstanding = Math.max(0, credit - versment);

              return (
                <article
                  key={marque.id}
                  className="brand-card"
                  onClick={() => openEditModal(marque)}
                >
                  <div
                    className={`brand-card__status ${marque.actif ? 'brand-card__status--active' : 'brand-card__status--inactive'}`}
                  >
                    {marque.actif ? 'Active' : 'Inactive'}
                  </div>

                  <div className="brand-card__image">
                    {marque.image ? (
                      <img src={marque.image} alt={marque.nom} />
                    ) : (
                      <div className="brand-card__placeholder" aria-hidden="true">
                        {marque.nom?.charAt(0)?.toUpperCase() || '🏷️'}
                      </div>
                    )}
                  </div>

                  <div className="brand-card__body">
                    <h3 className="brand-card__title">{marque.nom}</h3>
                    {marque.description && (
                      <p className="brand-card__description">{marque.description}</p>
                    )}
                  </div>

                  <div className="brand-card__stats">
                    <div className="brand-card__stat">
                      <span>Credit</span>
                      <strong>{credit.toFixed(2)} DA</strong>
                    </div>
                    <div className="brand-card__stat">
                      <span>Payments</span>
                      <strong>{versment.toFixed(2)} DA</strong>
                    </div>
                    <div className="brand-card__stat">
                      <span>Reste</span>
                      <strong>{outstanding.toFixed(2)} DA</strong>
                    </div>
                  </div>

                  <div className="brand-card__actions">
                    <button
                      type="button"
                      className="action-button action-button--secondary brand-card__action-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openCreditModal(marque);
                      }}
                    >
                      Acheter
                    </button>
                    <button
                      type="button"
                      className="action-button action-button--primary brand-card__action-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openPaymentModal(marque);
                      }}
                    >
                      verser
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {showFormModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}
          onClick={closeFormModal}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '20px',
              padding: '2rem',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 25px 70px rgba(15, 23, 42, 0.35)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeFormModal}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                border: 'none',
                background: 'rgba(255,255,255,0.9)',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.1rem',
                color: '#1f2937',
                boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
                e.currentTarget.style.color = '#1f2937';
              }}
            >
              ✕
            </button>

            <div style={{ marginBottom: '1.5rem' }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: '#1f2937'
                }}
              >
                {isEditing ? 'Edit Brand' : 'Add Brand'}
              </h2>
              <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280', fontSize: '0.95rem' }}>
                {isEditing
                  ? 'Update the brand information below. Existing values are pre-filled.'
                  : 'Provide the basic information for this brand. Images are uploaded locally.'}
              </p>
            </div>

            {formError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  marginBottom: '1rem',
                  fontWeight: 600
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1f2937' }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    placeholder="e.g., Vinci"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1f2937' }}>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Describe the brand"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.95rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1f2937' }}>
                    Brand Image
                  </label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #d1d5db'
                    }}
                  />
                  {imagePreview && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                        padding: '0.5rem',
                        background: '#f8fafc'
                      }}
                    >
                      <img
                        src={imagePreview}
                        alt="Brand preview"
                        style={{
                          width: '100%',
                          maxHeight: '180px',
                          objectFit: 'contain',
                          borderRadius: '8px'
                        }}
                      />
                    </div>
                  )}
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: 600, color: '#1f2937' }}>
                  <input
                    type="checkbox"
                    name="actif"
                    checked={formData.actif}
                    onChange={handleInputChange}
                    style={{ width: '18px', height: '18px' }}
                  />
                  Active brand
                </label>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={closeFormModal}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb',
                      background: '#fff',
                      color: '#374151',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: '0.75rem 1.75rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: submitting
                        ? 'linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 100%)'
                        : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: submitting ? 'wait' : 'pointer',
                      boxShadow: '0 12px 30px rgba(99, 102, 241, 0.35)'
                    }}
                  >
                    {submitting ? 'Saving...' : isEditing ? 'Update Brand' : 'Save Brand'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {(showCreditModal || showPaymentModal) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 1100
          }}
          onClick={resetFinancialState}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.35)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={resetFinancialState}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                border: 'none',
                background: 'transparent',
                fontSize: '1.25rem',
                cursor: 'pointer'
              }}
              aria-label="Close"
            >
              ✕
            </button>

            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1f2937' }}>
              {showCreditModal ? 'Add Credit' : 'Record Payment'}
            </h2>
            <p style={{ margin: '0.5rem 0 1rem 0', color: '#6b7280', fontSize: '0.95rem' }}>
              {activeFinancialMarque ? activeFinancialMarque.nom : ''}
            </p>

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1f2937' }}>
              Amount (DA)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '1rem',
                marginBottom: '1.5rem'
              }}
            />

            {showPaymentModal && activeFinancialMarque && (
              <p style={{ fontSize: '0.85rem', color: '#f97316', marginTop: '-1rem', marginBottom: '1.5rem' }}>
                Outstanding credit: {Math.max(0, (activeFinancialMarque.credit || 0) - (activeFinancialMarque.versment || 0)).toFixed(2)} DA
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={resetFinancialState}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  color: '#374151',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={amountSubmitting}
                onClick={() => handleFinancialSubmit(showCreditModal ? 'credit' : 'versment')}
                style={{
                  padding: '0.6rem 1.4rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: showCreditModal ? 'linear-gradient(135deg, #10b981 0%, #047857 100%)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: amountSubmitting ? 'wait' : 'pointer',
                  boxShadow: '0 10px 25px rgba(76, 29, 149, 0.25)'
                }}
              >
                {amountSubmitting ? 'Saving...' : showCreditModal ? 'Add Credit' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarquesPage;

