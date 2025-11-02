import React, { useState, useEffect } from 'react';
import api from '../services/api';

// Fonction utilitaire pour formater l'affichage du stock
const formatStockDisplay = (product) => {
  // Si le produit a un poids défini et que l'unité de mesure est KG
  if (product.poids && product.uniteMesure === 'KG' && product.venduParUnite) {
    const quantiteStock = parseFloat(product.quantite_stock) || 0;
    const piecesCompletes = Math.floor(quantiteStock);
    const resteEnKg = (quantiteStock - piecesCompletes) * product.poids;
    
    if (resteEnKg > 0 && piecesCompletes > 0) {
      return `${piecesCompletes} pièce${piecesCompletes > 1 ? 's' : ''} et ${resteEnKg.toFixed(2)} kg`;
    } else if (piecesCompletes > 0) {
      return `${piecesCompletes} pièce${piecesCompletes > 1 ? 's' : ''}`;
    } else if (resteEnKg > 0) {
      return `${resteEnKg.toFixed(2)} kg`;
    }
  }
  
  // Affichage par défaut
  return `${product.quantite_stock} ${product.uniteMesure}`;
};

const ProductCard = ({ product, cartItem, onAddToCart, onUpdateCart, onAddFullProduct }) => {
  const defaultQty = product.venduParUnite ? '0.01' : '1';
  const [quantityInput, setQuantityInput] = useState(cartItem ? cartItem.quantite : defaultQty);

  useEffect(() => {
    if (cartItem) {
      setQuantityInput(cartItem.quantite);
    } else {
      setQuantityInput(defaultQty);
    }
  }, [cartItem, defaultQty]);

  const handleQuantityChange = (e) => {
    let value = e.target.value;
    // If not venduParUnite, ensure it's a whole number
    if (!product.venduParUnite && value && parseFloat(value)) {
      value = Math.floor(parseFloat(value)).toString();
    }
    setQuantityInput(value);
  };

  const handleAddToCartClick = () => {
    const qty = parseFloat(quantityInput);
    if (isNaN(qty) || qty <= 0) {
      return;
    }
    // Ensure whole number for non-venduParUnite products
    const finalQty = product.venduParUnite ? qty : Math.floor(qty);
    
    if (cartItem) {
      onUpdateCart(finalQty.toString());
    } else {
      onAddToCart(finalQty.toString());
    }
  };

  const handleBuyFullProduct = () => {
    if (onAddFullProduct && product.poids && product.prixTotal) {
      onAddFullProduct(product.poids, product.prixTotal);
    }
  };

  const minValue = product.venduParUnite ? 0.01 : 1;
  const stepValue = product.venduParUnite ? 0.01 : 1;
  // Le bouton "Acheter la totalité" est affiché si :
  // - Le produit est fractionnable (venduParUnite)
  // - Le produit a un poids défini (paquet complet)
  // - Le produit a un prixTotal défini
  // - Il y a au moins une pièce complète disponible (quantite_stock >= 1)
  const canBuyFull = product.venduParUnite && product.poids && product.prixTotal && product.quantite_stock >= 1;

  return (
    <div style={{
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      padding: '1.25rem',
      background: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'all 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = '#667eea';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = '#e5e7eb';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
    >
      {product.image && (
        <img
          src={product.image}
          alt={product.nom}
          style={{
            width: '100%',
            height: '150px',
            objectFit: 'contain',
            borderRadius: '6px',
            marginBottom: '0.5rem',
            background: '#f5f5f5'
          }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      <div style={{ 
        fontWeight: 600, 
        marginBottom: '0.5rem', 
        fontSize: '1rem', 
        color: '#1f2937',
        lineHeight: '1.4'
      }}>
        {product.nom}
      </div>
      <div style={{ 
        fontSize: '0.85rem', 
        color: '#6b7280', 
        marginBottom: '0.75rem',
        lineHeight: '1.5'
      }}>
        <div style={{ marginBottom: '0.25rem' }}>
          <strong>Reference:</strong> {product.reference} | <strong>Stock:</strong> {formatStockDisplay(product)}
      </div>
        {product.poids && (
          <div style={{ 
            marginTop: '0.5rem', 
            padding: '0.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}>
            📦 Paquet: {product.poids} {product.uniteMesure} - {product.prixTotal} DA
          </div>
        )}
      </div>
      <div style={{ 
        fontWeight: 700, 
        color: '#667eea', 
        marginBottom: '0.75rem',
        fontSize: '1.1rem',
        padding: '0.5rem',
        background: '#f3f4f6',
        borderRadius: '6px',
        textAlign: 'center'
      }}>
        💰 {product.prixUnitaire} DA / {product.uniteMesure}
      </div>
      
      {/* Bouton pour acheter la totalité du produit */}
      {canBuyFull && (
        <button
          type="button"
          onClick={handleBuyFullProduct}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '0.75rem',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
          }}
        >
          🛒 Acheter la totalité ({product.poids} {product.uniteMesure} - {product.prixTotal} DA)
        </button>
      )}

      {/* Section pour acheter par quantité spécifiée */}
      <div style={{ 
        padding: '0.75rem',
        background: canBuyFull ? '#f8f9fa' : 'transparent',
        borderRadius: '6px',
        border: canBuyFull ? '1px solid #e9ecef' : 'none'
      }}>
        {canBuyFull && (
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#666', 
            marginBottom: '0.5rem',
            fontWeight: 500,
            textAlign: 'center'
          }}>
            Ou acheter par {product.uniteMesure.toLowerCase()}:
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <input
          type="number"
          value={quantityInput}
          onChange={handleQuantityChange}
          min={minValue}
          max={product.quantite_stock}
          step={stepValue}
          placeholder="Qty"
          style={{
            flex: 1,
              padding: '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease',
              outline: 'none'
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
        <button
          type="button"
          onClick={handleAddToCartClick}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(102, 126, 234, 0.2)';
            }}
          style={{
              padding: '0.75rem 1.25rem',
              background: cartItem ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
              borderRadius: '8px',
            cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(102, 126, 234, 0.2)',
              whiteSpace: 'nowrap'
          }}
        >
            {cartItem ? '✓ Update' : '+ Add'}
        </button>
        </div>
      </div>
    </div>
  );
};

const AchatForm = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState('client'); // 'client' or 'products'
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productFilters, setProductFilters] = useState({
    search: '',
    marqueId: '',
    categorieId: ''
  });
  const [marques, setMarques] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({
    remiseGlobale: '0',
    versment: '0'
  });
  const [newClientData, setNewClientData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    type: 'SIMPLE'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClients();
    fetchProducts();
    fetchMarques();
    fetchCategories();
  }, []);

  useEffect(() => {
    applyProductFilters();
  }, [products, productFilters]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients', { params: { actif: 'true' } });
      setClients(response.data);
    } catch (err) {
      console.error('Failed to load clients:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products', { params: { actif: 'true', limit: 1000 } });
      // Handle both old format (array) and new format (object with products)
      const productsList = response.data.products || response.data;
      setProducts(productsList.filter(p => !p.deleted && p.quantite_stock > 0));
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const fetchMarques = async () => {
    try {
      const response = await api.get('/marques');
      setMarques(response.data.filter(m => m.actif));
    } catch (err) {
      console.error('Failed to load brands:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.filter(c => c.actif));
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const applyProductFilters = () => {
    let filtered = [...products];

    if (productFilters.search) {
      const searchLower = productFilters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.nom?.toLowerCase().includes(searchLower) ||
        p.reference?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }

    if (productFilters.marqueId) {
      filtered = filtered.filter(p => p.marqueId === parseInt(productFilters.marqueId));
    }

    if (productFilters.categorieId) {
      filtered = filtered.filter(p => p.categorieId === parseInt(productFilters.categorieId));
    }

    setFilteredProducts(filtered);
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/clients', newClientData);
      setSelectedClient(response.data);
      setShowNewClientForm(false);
      setStep('products');
      await fetchClients();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product, quantite = null) => {
    const qty = quantite || (product.venduParUnite ? '0.01' : '1');
    const finalQty = product.venduParUnite ? parseFloat(qty) : Math.floor(parseFloat(qty));
    
    if (isNaN(finalQty) || finalQty <= 0) {
      return;
    }

    const existingItem = cart.find(item => item.produitId === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.produitId === product.id
          ? { ...item, quantite: finalQty.toString() }
          : item
      ));
    } else {
      setCart([...cart, {
        produitId: product.id,
        nom: product.nom,
        quantite: finalQty.toString(),
        prixUnitaire: product.prixUnitaire,
        remise: '0',
        maxQuantite: product.quantite_stock,
        venduParUnite: product.venduParUnite
      }]);
    }
  };

  const addFullProductToCart = (produitId, poids, prixTotal) => {
    const product = products.find(p => p.id === produitId);
    if (!product) return;

    // Vérifier qu'il y a au moins une pièce complète disponible
    // Pour les produits avec poids, quantite_stock est en nombre de pièces
    // Il faut au moins 1 pièce complète pour acheter la totalité
    if (product.quantite_stock < 1) {
      const stockDisplay = formatStockDisplay(product);
      setError(`Stock insuffisant. Disponible: ${stockDisplay}, demandé: ${poids} ${product.uniteMesure} (1 pièce complète)`);
      return;
    }

    // Calculer le prix unitaire équivalent pour que le total soit égal à prixTotal
    const prixUnitaireEquivalent = prixTotal / poids;

    const existingItem = cart.find(item => item.produitId === produitId);
    
    if (existingItem) {
      // Remplacer l'item existant par la totalité
      setCart(cart.map(item =>
        item.produitId === produitId
          ? {
              ...item,
              quantite: poids.toString(),
              prixUnitaire: prixUnitaireEquivalent,
              remise: '0'
            }
          : item
      ));
    } else {
      setCart([...cart, {
        produitId: produitId,
        nom: product.nom,
        quantite: poids.toString(),
        prixUnitaire: prixUnitaireEquivalent,
        remise: '0',
        maxQuantite: product.quantite_stock,
        venduParUnite: product.venduParUnite
      }]);
    }
  };

  const updateCartItem = (produitId, field, value) => {
    setCart(cart.map(item => {
      if (item.produitId === produitId) {
        const updated = { ...item, [field]: value };
        // Validate quantity doesn't exceed stock
        if (field === 'quantite') {
          let qty = parseFloat(value);
          if (isNaN(qty) || qty <= 0) {
            return item;
          }
          // Ensure whole number for non-venduParUnite products
          if (!item.venduParUnite) {
            qty = Math.floor(qty);
          }
          if (qty > item.maxQuantite) {
            qty = item.maxQuantite;
          }
          updated.quantite = qty.toString();
        }
        return updated;
      }
      return item;
    }));
  };

  const removeFromCart = (produitId) => {
    setCart(cart.filter(item => item.produitId !== produitId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!selectedClient) {
      setError('Please select or create a client');
      setLoading(false);
      return;
    }

    if (cart.length === 0) {
      setError('Please add at least one product to cart');
      setLoading(false);
      return;
    }

    // Validate all cart items
    for (const item of cart) {
      const qty = parseFloat(item.quantite);
      if (isNaN(qty) || qty <= 0) {
        setError(`Invalid quantity for ${item.nom}`);
        setLoading(false);
        return;
      }
      if (qty > item.maxQuantite) {
        setError(`Quantity for ${item.nom} exceeds available stock`);
        setLoading(false);
        return;
      }
    }

    try {
      const data = {
        clientId: selectedClient.id,
        remiseGlobale: parseFloat(formData.remiseGlobale) || 0,
        versment: parseFloat(formData.versment) || 0,
        ligneAchats: cart.map(item => ({
          produitId: item.produitId,
          quantite: parseFloat(item.quantite),
          prixUnitaire: parseFloat(item.prixUnitaire),
          remise: parseFloat(item.remise) || 0
        }))
      };

      await api.post('/achats', data);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create purchase');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    let total = 0;
    cart.forEach(item => {
      total += parseFloat(item.prixUnitaire) * parseFloat(item.quantite) - (parseFloat(item.remise) || 0);
    });
    return total - (parseFloat(formData.remiseGlobale) || 0);
  };

  const filteredClients = clients.filter(client =>
    !clientSearch ||
    (client.nom?.toLowerCase().includes(clientSearch.toLowerCase())) ||
    (client.prenom?.toLowerCase().includes(clientSearch.toLowerCase())) ||
    (client.email?.toLowerCase().includes(clientSearch.toLowerCase())) ||
    (client.telephone?.includes(clientSearch))
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem'
    }}
    onClick={onCancel}
    >
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Create New Purchase</h2>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{
            background: '#fee',
            color: '#c33',
            padding: '1rem',
            borderRadius: '6px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {step === 'client' && (
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Select or Create Client</h3>
            
            {/* Client Search */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Search Client</label>
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Search by name, email, or phone..."
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>

            {/* Clients List */}
            <div style={{ 
              maxHeight: '300px', 
              overflowY: 'auto', 
              marginBottom: '1rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '0.5rem'
            }}>
              {filteredClients.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No clients found</p>
              ) : (
                filteredClients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => {
                      setSelectedClient(client);
                      setStep('products');
                    }}
                    style={{
                      padding: '1rem',
                      border: selectedClient?.id === client.id ? '2px solid #667eea' : '1px solid #ddd',
                      borderRadius: '6px',
                      marginBottom: '0.5rem',
                      cursor: 'pointer',
                      background: selectedClient?.id === client.id ? '#f0f4ff' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{client.prenom} {client.nom}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      {client.email || client.telephone || '—'}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Create New Client Button */}
            <button
              type="button"
              onClick={() => setShowNewClientForm(!showNewClientForm)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            >
              {showNewClientForm ? 'Cancel' : '+ Create New Client'}
            </button>

            {/* New Client Form */}
            {showNewClientForm && (
              <form onSubmit={handleCreateClient} style={{
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: '#f8f9fa',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>First Name *</label>
                    <input
                      type="text"
                      value={newClientData.nom}
                      onChange={(e) => setNewClientData({ ...newClientData, nom: e.target.value })}
                      required
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Last Name</label>
                    <input
                      type="text"
                      value={newClientData.prenom}
                      onChange={(e) => setNewClientData({ ...newClientData, prenom: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
                    <input
                      type="email"
                      value={newClientData.email}
                      onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Phone</label>
                    <input
                      type="text"
                      value={newClientData.telephone}
                      onChange={(e) => setNewClientData({ ...newClientData, telephone: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Type</label>
                    <select
                      value={newClientData.type}
                      onChange={(e) => setNewClientData({ ...newClientData, type: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
                    >
                      <option value="SIMPLE">Simple</option>
                      <option value="PEINTRE">Peintre</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Creating...' : 'Create Client & Continue'}
                </button>
              </form>
            )}

            {selectedClient && (
              <div style={{
                padding: '1rem',
                background: '#e8f5e9',
                borderRadius: '6px',
                marginTop: '1rem'
              }}>
                <strong>Selected Client:</strong> {selectedClient.prenom} {selectedClient.nom}
                <button
                  onClick={() => {
                    setSelectedClient(null);
                    setStep('products');
                  }}
                  style={{
                    marginLeft: '1rem',
                    padding: '0.5rem 1rem',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Continue to Products →
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'products' && selectedClient && (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <strong>Client:</strong> {selectedClient.prenom} {selectedClient.nom}
                <button
                  type="button"
                  onClick={() => {
                    setStep('client');
                    setSelectedClient(null);
                  }}
                  style={{
                    marginLeft: '1rem',
                    padding: '0.25rem 0.5rem',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Change Client
                </button>
              </div>
            </div>

            {/* Product Filters */}
            <div style={{
              padding: '1rem',
              background: '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <h4 style={{ margin: '0 0 1rem 0' }}>Filter Products</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productFilters.search}
                    onChange={(e) => setProductFilters({ ...productFilters, search: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <select
                    value={productFilters.marqueId}
                    onChange={(e) => setProductFilters({ ...productFilters, marqueId: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
                  >
                    <option value="">All Brands</option>
                    {marques.map(m => (
                      <option key={m.id} value={m.id}>{m.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={productFilters.categorieId}
                    onChange={(e) => setProductFilters({ ...productFilters, categorieId: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
                  >
                    <option value="">All Categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '0.5rem'
            }}>
              {filteredProducts.map(product => {
                const cartItem = cart.find(item => item.produitId === product.id);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    cartItem={cartItem}
                    onAddToCart={(qty) => addToCart(product, qty)}
                    onUpdateCart={(qty) => updateCartItem(product.id, 'quantite', qty)}
                    onAddFullProduct={(poids, prixTotal) => addFullProductToCart(product.id, poids, prixTotal)}
                  />
                );
              })}
            </div>

            {/* Shopping Cart */}
            {cart.length > 0 && (
              <div style={{
                border: '2px solid #667eea',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '1rem',
                background: '#f8f9ff'
              }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Shopping Cart ({cart.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {cart.map(item => (
                    <div key={item.produitId} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      background: 'white',
                      borderRadius: '6px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{item.nom}</div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                          {item.prixUnitaire} DA × 
                      <input
                        type="number"
                        value={item.quantite}
                        onChange={(e) => updateCartItem(item.produitId, 'quantite', e.target.value)}
                        min={item.venduParUnite ? 0.01 : 1}
                        max={item.maxQuantite}
                        step={item.venduParUnite ? 0.01 : 1}
                        style={{
                          width: '60px',
                          margin: '0 0.25rem',
                          padding: '0.25rem',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                          = {(parseFloat(item.prixUnitaire) * parseFloat(item.quantite)).toFixed(2)} DA
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.produitId)}
                        style={{
                          padding: '0.5rem',
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '2px solid #ddd',
                  textAlign: 'right',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#667eea'
                }}>
                  Total: {calculateTotal().toFixed(2)} DA
                </div>
              </div>
            )}

            {/* Discount, Versment and Final Total */}
            <div style={{ 
              padding: '1.5rem', 
              background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)', 
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              marginBottom: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>💵 Global Discount (DA)</label>
                <input
                  type="number"
                  value={formData.remiseGlobale}
                  onChange={(e) => setFormData({ ...formData, remiseGlobale: e.target.value })}
                  step="0.01"
                  min="0"
                    placeholder="0.00"
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
              <div>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>💰 Versment (DA)</label>
                <input
                  type="number"
                  value={formData.versment}
                  onChange={(e) => setFormData({ ...formData, versment: e.target.value })}
                  step="0.01"
                  min="0"
                    placeholder="0.00"
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
            </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>📊 Final Total</label>
                <div style={{
                  padding: '1.25rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '10px',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'white',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}>
                  {calculateTotal().toFixed(2)} DA
                </div>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'flex-end',
              paddingTop: '1.5rem',
              borderTop: '2px solid #e5e7eb'
            }}>
              <button
                type="button"
                onClick={onCancel}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                }}
                style={{
                  padding: '0.875rem 2rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#374151',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || cart.length === 0}
                onMouseEnter={(e) => {
                  if (!loading && cart.length > 0) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #5568d3 0%, #667eea 100%)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && cart.length > 0) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
                style={{
                  padding: '0.875rem 2rem',
                  border: 'none',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  cursor: loading || cart.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: (loading || cart.length === 0) ? 0.6 : 1,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  boxShadow: (loading || cart.length === 0) ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)'
                }}
              >
                {loading ? 'Creating...' : '✓ Confirm Purchase'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AchatForm;
