import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
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

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/categories', {
        params: { status: statusFilter }
      });
      setCategories(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load categories');
      console.error(err);
      setToast({ open: true, type: 'error', message: 'Failed to load categories' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
    setEditingCategory(null);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    resetForm();
    setIsEditing(false);
    setEditingCategory(null);
    setShowFormModal(false);
  };

  const openEditModal = (category) => {
    setFormData({
      nom: category.nom || '',
      description: category.description || '',
      actif: Boolean(category.actif),
      image: category.image || ''
    });
    setImagePreview(category.image || '');
    setFormError('');
    setIsEditing(true);
    setEditingCategory(category);
    setShowFormModal(true);
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

      if (isEditing && editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, payload);
        showToast('success', 'Category updated successfully');
      } else {
        await api.post('/categories', payload);
        showToast('success', 'Category created successfully');
      }

      await fetchCategories();
      closeFormModal();
    } catch (err) {
      const message = err.response?.data?.message || (isEditing ? 'Failed to update category' : 'Failed to create category');
      setFormError(message);
      showToast('error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.nom?.toLowerCase().includes(search.toLowerCase()) ||
    cat.description?.toLowerCase().includes(search.toLowerCase())
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
      <p style={{ color: '#6b7280', fontSize: '1.1rem', fontWeight: 500 }}>Loading categories...</p>
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
        <h1 className="page-title">Categories</h1>
        <div className="page-actions">
          <button
            type="button"
            className="action-button action-button--primary"
            onClick={openAddModal}
          >
            <span className="action-button__icon" aria-hidden="true">＋</span>
            Add Category
          </button>
        </div>
      </header>

      <section className="section-card">
        <header className="section-card__header">
          <div>
            <h2 className="section-card__title">Categories List</h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
              Showing <strong style={{ color: '#667eea' }}>{filteredCategories.length}</strong> of <strong style={{ color: '#667eea' }}>{categories.length}</strong> categories
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
            placeholder="🔍 Search categories..."
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

        {filteredCategories.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem 1rem',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '1.1rem',
              fontWeight: 500,
              margin: 0
            }}>
              No categories found
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
            gap: '1.25rem' 
          }}>
            {filteredCategories.map((category, index) => (
              <div 
                key={category.id} 
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15), 0 4px 6px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)';
                }}
                onClick={() => openEditModal(category)}
              >
                {category.image ? (
                  <div style={{ 
                    marginBottom: '1rem', 
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    border: '1px solid #e9ecef'
                  }}>
                    <img 
                      src={category.image} 
                      alt={category.nom}
                      style={{
                        width: '100%',
                        maxHeight: '120px',
                        objectFit: 'contain',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    marginBottom: '1rem',
                    height: '120px',
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#adb5bd',
                    fontSize: '2rem',
                    border: '2px dashed #dee2e6'
                  }}>
                    <span style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>📋</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 500 }}>No Image</span>
                  </div>
                )}
                
                <h3 style={{ 
                  margin: 0, 
                  marginBottom: '0.75rem',
                  color: '#1f2937', 
                  fontSize: '1.1rem', 
                  fontWeight: 600
                }}>
                  {category.nom}
                </h3>
                
                {category.description && (
                  <p style={{ 
                    color: '#6b7280', 
                    fontSize: '0.85rem', 
                    margin: '0 0 1rem 0', 
                    lineHeight: '1.5'
                  }}>
                    {category.description}
                  </p>
                )}

                <div style={{
                  padding: '0.5rem',
                  background: category.actif 
                    ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' 
                    : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: category.actif ? '#065f46' : '#991b1b'
                  }}>
                    {category.actif ? '✓ Active' : '✗ Inactive'}
                  </span>
                </div>
              </div>
            ))}
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
                {isEditing ? 'Edit Category' : 'Add Category'}
              </h2>
              <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280', fontSize: '0.95rem' }}>
                {isEditing
                  ? 'Update the category information below. Existing values are pre-filled.'
                  : 'Provide the basic information for this category. Images are stored locally.'}
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
                    placeholder="e.g., Peinture"
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
                    placeholder="Describe what belongs in this category"
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
                    Category Image
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
                        alt="Category preview"
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
                  Active category
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
                    {submitting ? 'Saving...' : isEditing ? 'Update Category' : 'Save Category'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;

