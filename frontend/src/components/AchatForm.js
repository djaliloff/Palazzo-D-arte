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

const ProductCard = ({ product, cartItem, onAddToCart, onUpdateCart, onAddFullProduct, viewMode = 'grid' }) => {
  const defaultQty = product.venduParUnite ? '0.1' : '1';
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
    // Ensure whole number for non-venduParUnite products, one-decimal for floats
    const finalQty = product.venduParUnite ? Math.round(qty * 10) / 10 : Math.floor(qty);
    
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

  const minValue = product.venduParUnite ? 0.1 : 1;
  const stepValue = product.venduParUnite ? 0.1 : 1;
  // Le bouton "Acheter la totalité" est affiché si :
  // - Le produit est fractionnable (venduParUnite)
  // - Le produit a un poids défini (paquet complet)
  // - Le produit a un prixTotal défini
  // - Il y a au moins une pièce complète disponible (quantite_stock >= 1)
  const canBuyFull = product.venduParUnite && product.poids && product.prixTotal && product.quantite_stock >= 1;

  const isList = viewMode === 'list';

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      padding: isList ? '0.6rem' : '0.75rem',
      background: 'white',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      transition: 'all 0.15s ease',
      display: isList ? 'flex' : 'block',
      alignItems: isList ? 'center' : 'initial',
      gap: isList ? '0.75rem' : '0'
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
            width: isList ? '64px' : '100%',
            height: isList ? '64px' : '110px',
            objectFit: 'contain',
            borderRadius: '6px',
            marginBottom: isList ? '0' : '0.4rem',
            background: '#f5f5f5'
          }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      <div style={{ 
        fontWeight: 600, 
        marginBottom: isList ? '0.15rem' : '0.4rem', 
        fontSize: '0.95rem', 
        color: '#1f2937',
        lineHeight: '1.35'
      }}>
        {product.nom}
      </div>
      <div style={{ 
        fontSize: '0.8rem', 
        color: '#6b7280', 
        marginBottom: isList ? '0.4rem' : '0.5rem',
        lineHeight: '1.45'
      }}>
        <div style={{ marginBottom: '0.25rem' }}>
          <strong>Reference:</strong> {product.reference} | <strong>Stock:</strong> {formatStockDisplay(product)}
      </div>
        {product.poids && (
          <div style={{ 
            marginTop: isList ? '0.25rem' : '0.35rem', 
            padding: '0.35rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.8rem'
          }}>
            📦 Paquet: {product.poids} {product.uniteMesure} - {product.prixTotal} DA
          </div>
        )}
      </div>
      <div style={{ 
        fontWeight: 700, 
        color: '#667eea', 
        marginBottom: isList ? '0.25rem' : '0.6rem',
        fontSize: isList ? '0.9rem' : '0.95rem',
        padding: isList ? '0.25rem 0.4rem' : '0.35rem',
        background: '#f3f4f6',
        borderRadius: '6px',
        textAlign: 'center',
        alignSelf: isList ? 'flex-start' : 'auto',
        display: 'inline-block'
      }}>
        💰 {product.prixUnitaire} DA / {product.uniteMesure}
      </div>
      {isList && (<div style={{ flex: 1 }} />)}
      
      {/* Bouton pour acheter la totalité du produit */}
      {canBuyFull && (
        <button
          type="button"
          onClick={handleBuyFullProduct}
          style={{
            width: isList ? 'auto' : '100%',
            padding: isList ? '0.5rem 0.6rem' : '0.55rem 0.7rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: isList ? '0' : '0.6rem',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 3px 6px rgba(16, 185, 129, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
          }}
        >
          🛒 total ({product.poids} {product.uniteMesure} - {product.prixTotal} DA)
        </button>
      )}

      {/* Section pour acheter par quantité spécifiée */}
      <div style={{ 
        padding: isList ? '0.2rem' : '0.6rem',
        background: isList ? 'transparent' : (canBuyFull ? '#f8f9fa' : 'transparent'),
        borderRadius: '6px',
        border: isList ? 'none' : (canBuyFull ? '1px solid #e9ecef' : 'none')
      }}>
        {canBuyFull && !isList && (
          <div style={{ 
            fontSize: '0.72rem', 
            color: '#666', 
            marginBottom: '0.4rem',
            fontWeight: 500,
            textAlign: 'center'
          }}>
            Ou acheter par {product.uniteMesure.toLowerCase()}:
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: isList ? 0 : '0.4rem' }}>
        <input
          type="number"
          value={quantityInput}
          onChange={handleQuantityChange}
          min={minValue}
          max={product.quantite_stock}
          step={stepValue}
          inputMode="decimal"
          placeholder="Qty"
          style={{
            flex: isList ? 'unset' : 1,
              padding: isList ? '0.5rem' : '0.55rem',
              border: '1.5px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.85rem',
              transition: 'all 0.15s ease',
              outline: 'none',
              width: isList ? '90px' : 'auto'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            if (product.venduParUnite) {
              const v = parseFloat(e.target.value);
              if (!isNaN(v) && v > 0) {
                const rounded = Math.round(v * 10) / 10;
                setQuantityInput(rounded.toFixed(1));
              }
            }
          }}
        />
        <button
          type="button"
          onClick={handleAddToCartClick}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 3px 6px rgba(102, 126, 234, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(102, 126, 234, 0.2)';
            }}
          style={{
              padding: isList ? '0.5rem 0.8rem' : '0.55rem 0.9rem',
              background: cartItem ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
              borderRadius: '8px',
            cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.15s ease',
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

const AchatForm = ({ onSuccess, onCancel, inline = false, initialClient = null }) => {
  const [step, setStep] = useState('client'); // 'client' or 'products'
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
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
    if (initialClient) {
      setSelectedClient(initialClient);
      setStep('products');
    }
  }, [initialClient]);

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
    const qty = quantite || (product.venduParUnite ? '0.1' : '1');
    const parsed = parseFloat(qty);
    const finalQty = product.venduParUnite ? Math.round(parsed * 10) / 10 : Math.floor(parsed);
    
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
          } else {
            qty = Math.round(qty * 10) / 10;
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
  const limitedClients = filteredClients.slice(0, 20);

  const innerContainer = (
      <div>
        {!inline && (
          <button
            onClick={onCancel}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              color: '#1f2937',
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ef4444';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.color = '#1f2937';
              e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
          >
            ✕
          </button>
        )}

        

        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            color: '#dc2626',
            padding: '1.25rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            border: '2px solid #fca5a5',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: 600
          }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <span>{error}</span>
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
              maxHeight: '260px', 
              overflowY: 'auto', 
              marginBottom: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '0.25rem'
            }}>
              {limitedClients.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No clients found</p>
              ) : (
                limitedClients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => {
                      setSelectedClient(client);
                      setStep('products');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      border: selectedClient?.id === client.id ? '2px solid #667eea' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      marginBottom: '0.35rem',
                      cursor: 'pointer',
                      background: selectedClient?.id === client.id ? '#f0f4ff' : 'white',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(102, 126, 234, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = selectedClient?.id === client.id ? '#667eea' : '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.25 }}>
                        {client.prenom} {client.nom}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        {client.email || client.telephone || '—'}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#667eea', fontWeight: 600 }}>
                      Select →
                    </div>
                  </div>
                ))
              )}
            </div>
            {filteredClients.length > 20 && (
              <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem' }}>
                Showing 20 of {filteredClients.length}. Refine your search to see others.
              </div>
            )}

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>View:</span>
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  style={{
                    padding: '0.35rem 0.65rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  {viewMode === 'grid' ? 'List' : 'Grid'}
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
                gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(220px, 1fr))' : '1fr',
                gap: viewMode === 'grid' ? '0.75rem' : '0.5rem',
                marginBottom: '1.5rem',
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
                    viewMode={viewMode}
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
                        onBlur={(e) => {
                          const v = parseFloat(e.target.value);
                          if (!isNaN(v)) {
                            const normalized = item.venduParUnite ? (Math.round(v * 10) / 10).toFixed(1) : Math.floor(v).toString();
                            updateCartItem(item.produitId, 'quantite', normalized);
                          }
                        }}
                        min={item.venduParUnite ? 0.1 : 1}
                        max={item.maxQuantite}
                        step={item.venduParUnite ? 0.1 : 1}
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
                      width: '90%', 
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
                      width: '90%', 
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
                  padding: '0.75rem',
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
  );

  if (inline) {
    return (
      <div style={{
        background: 'transparent',
        padding: '0',
        borderRadius: '0',
        maxWidth: 'none',
        width: '100%',
        position: 'relative'
      }}>
        
        {innerContainer}
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem'
    }}
    onClick={onCancel}
    >
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        padding: '2.5rem',
        borderRadius: '24px',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        
        {innerContainer}
      </div>
    </div>
  );
};

export default AchatForm;
