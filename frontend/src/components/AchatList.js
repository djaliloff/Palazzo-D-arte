import React, { useEffect, useState } from 'react';
import api from '../services/api';

const AchatList = () => {
  const [achats, setAchats] = useState([]);
  const [filteredAchats, setFilteredAchats] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAchat, setSelectedAchat] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    clientId: ''
  });
  const [showVersementModal, setShowVersementModal] = useState(false);
  const [versementInput, setVersementInput] = useState('');
  const [notification, setNotification] = useState({ open: false, type: 'info', message: '' });

  useEffect(() => {
    fetchAchats();
    fetchClients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [achats, filters]);

  // Close notification toast when clicking anywhere on the page
  useEffect(() => {
    if (!notification.open) return;

    const handleClickAnywhere = () => {
      setNotification((prev) => ({ ...prev, open: false }));
    };

    window.addEventListener('click', handleClickAnywhere);
    return () => window.removeEventListener('click', handleClickAnywhere);
  }, [notification.open]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data.filter(c => c.actif));
    } catch (err) {
      console.error('Failed to load clients:', err);
    }
  };

  const fetchAchats = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.clientId) params.clientId = filters.clientId;

      const response = await api.get('/achats', { params });
      setAchats(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load purchases');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...achats];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(achat =>
        achat.numeroBon?.toLowerCase().includes(searchLower) ||
        `${achat.client?.prenom || ''} ${achat.client?.nom || ''}`.toLowerCase().includes(searchLower) ||
        achat.client?.email?.toLowerCase().includes(searchLower) ||
        achat.client?.telephone?.includes(searchLower)
      );
    }

    // Date range filter (client-side)
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      filtered = filtered.filter(a => new Date(a.dateAchat) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      // include entire day
      to.setHours(23,59,59,999);
      filtered = filtered.filter(a => new Date(a.dateAchat) <= to);
    }

    setFilteredAchats(filtered);
  };

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      dateFrom: '',
      dateTo: '',
      clientId: ''
    });
    setTimeout(() => {
      fetchAchats();
    }, 0);
  };

  const getStatusBadgeColor = (statut) => {
    switch (statut) {
      case 'VALIDE': 
        return { bg: '#e8f5e9', color: '#2e7d32', text: 'Valide' };
      case 'RETOURNE_PARTIEL': 
        return { bg: '#fff3e0', color: '#e65100', text: 'Retourné Partiel' };
      case 'RETOURNE_TOTAL': 
        return { bg: '#ffebee', color: '#c62828', text: 'Retourné Total' };
      default: 
        return { bg: '#f5f5f5', color: '#666', text: statut };
    }
  };

  const getClientTypeBadgeColor = (type) => {
    switch (type) {
      case 'PEINTRE':
        return { bg: '#fff9c4', color: '#f57f17', text: 'Peintre' };
      case 'SIMPLE':
      default:
        return { bg: '#e3f2fd', color: '#1976d2', text: 'Client' };
    }
  };

  // Calculer le montant total des retours pour un achat
  const calculateTotalReturns = (achat) => {
    if (!achat.retours || achat.retours.length === 0) {
      return 0;
    }
    return achat.retours.reduce((total, retour) => {
      return total + (parseFloat(retour.montantRembourse) || 0);
    }, 0);
  };

  // Calculer le prix réel (après retours)
  const calculateRealPrice = (achat) => {
    const totalReturns = calculateTotalReturns(achat);
    const prixInitial = parseFloat(achat.prix_total_remise || 0);
    return Math.max(0, prixInitial - totalReturns);
  };

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
      <p style={{ color: '#6b7280', fontSize: '1.1rem', fontWeight: 500 }}>Loading purchases...</p>
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

  const viewDetails = async (achatId) => {
    try {
      const response = await api.get(`/achats/${achatId}`);
      setSelectedAchat(response.data);
    } catch (err) {
      setNotification({ open: true, type: 'error', message: 'Failed to load purchase details' });
      console.error(err);
    }
  };

  const closeDetails = () => {
    setSelectedAchat(null);
  };

  const generatePDF = async () => {
    if (!selectedAchat) return;

    // Filtrer les lignes complètement retournées
    const filteredLines = (selectedAchat.ligneAchats || []).filter((ligne) => {
      const returnedQty = (ligne.ligneRetours || []).reduce((sum, lr) => sum + (lr.quantiteRetournee || 0), 0);
      return returnedQty < ligne.quantite;
    });

    // Calculer les montants effectifs en tenant compte des retours
    const totalReturns = parseFloat(selectedAchat.montant_retourne || 0);
    const prixTotalRemise = parseFloat(selectedAchat.prix_total_remise || 0);
    const prixEffectif = typeof selectedAchat.prix_effectif === 'number'
      ? selectedAchat.prix_effectif
      : Math.max(0, prixTotalRemise - totalReturns);
    const versment = parseFloat(selectedAchat.versment || 0);
    const resteAPayer = Math.max(0, prixEffectif - versment);

    try {
      // Dynamic import for PDF library
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header
      doc.setFontSize(20);
      doc.text('BON D\'ACHAT', pageWidth / 2, 20, { align: 'center' });
    
      doc.setFontSize(12);
      doc.text(`N°: ${selectedAchat.numeroBon}`, 14, 35);
      doc.text(`Date: ${new Date(selectedAchat.dateAchat).toLocaleDateString()}`, 14, 42);
      doc.text(`Heure: ${new Date(selectedAchat.dateAchat).toLocaleTimeString()}`, 14, 49);

      // Client Info
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('CLIENT', 14, 65);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(11);
      doc.text(`Nom: ${selectedAchat.client?.prenom || ''} ${selectedAchat.client?.nom || ''}`, 14, 72);
      if (selectedAchat.client?.telephone) {
        doc.text(`Téléphone: ${selectedAchat.client.telephone}`, 14, 79);
      }
      if (selectedAchat.client?.email) {
        doc.text(`Email: ${selectedAchat.client.email}`, 14, 86);
      }

      // Items Table (sans les lignes totalement retournées)
      const tableData = filteredLines.map((ligne) => [
        ligne.produit?.nom || 'N/A',
        `${ligne.quantite} ${ligne.produit?.uniteMesure || ''}`,
        `${parseFloat(ligne.prixUnitaire).toFixed(2)} DA`,
        `${parseFloat(ligne.remise || 0).toFixed(2)} DA`,
        `${parseFloat(ligne.sousTotal).toFixed(2)} DA`
      ]) || [];

      let finalY;
      if (doc.autoTable) {
        doc.autoTable({
          startY: 95,
          head: [['Produit', 'Quantité', 'Prix Unitaire', 'Remise', 'Sous-Total']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [102, 126, 234], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 25, halign: 'right' },
            4: { cellWidth: 30, halign: 'right' }
          }
        });
        finalY = doc.lastAutoTable.finalY + 10;
      } else {
        // Fallback: simple table without autoTable
        let yPos = 95;
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Produit', 14, yPos);
        doc.text('Qté', 80, yPos);
        doc.text('Prix U.', 105, yPos);
        doc.text('Remise', 130, yPos);
        doc.text('Sous-Total', 155, yPos);
        yPos += 8;
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        selectedAchat.ligneAchats?.forEach((ligne) => {
          doc.text((ligne.produit?.nom || 'N/A').substring(0, 25), 14, yPos);
          doc.text(`${ligne.quantite}`, 80, yPos);
          doc.text(`${parseFloat(ligne.prixUnitaire).toFixed(2)}`, 105, yPos);
          doc.text(`${parseFloat(ligne.remise || 0).toFixed(2)}`, 130, yPos);
          doc.text(`${parseFloat(ligne.sousTotal).toFixed(2)}`, 155, yPos);
          yPos += 6;
        });
        finalY = yPos + 5;
      }

      // Totals
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('TOTAL', pageWidth - 20, finalY, { align: 'right' });
      doc.setFont(undefined, 'normal');
      doc.setFontSize(11);
      doc.text(`Sous-total: ${parseFloat(selectedAchat.prix_total || 0).toFixed(2)} DA`, pageWidth - 20, finalY + 7, { align: 'right' });
      doc.text(`Remise globale: ${parseFloat(selectedAchat.remiseGlobale || 0).toFixed(2)} DA`, pageWidth - 20, finalY + 14, { align: 'right' });
      doc.text(`Montant retours: ${totalReturns.toFixed(2)} DA`, pageWidth - 20, finalY + 21, { align: 'right' });
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(102, 126, 234);
      doc.text(`TOTAL EFFECTIF: ${prixEffectif.toFixed(2)} DA`, pageWidth - 20, finalY + 29, { align: 'right' });
      doc.setTextColor(0, 0, 0);

      // Versement & Reste
      doc.setFontSize(11);
      doc.text(`Versement: ${versment.toFixed(2)} DA`, pageWidth - 20, finalY + 36, { align: 'right' });
      doc.text(`Reste: ${resteAPayer.toFixed(2)} DA`, pageWidth - 20, finalY + 43, { align: 'right' });

      // Notes
      if (selectedAchat.notes) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`Notes: ${selectedAchat.notes}`, 14, finalY + 45);
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Imprimé le ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Save PDF
      doc.save(`Bon_Achat_${selectedAchat.numeroBon}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setNotification({ open: true, type: 'error', message: "Erreur lors de la génération du PDF. Vérifiez les bibliothèques." });
    }
  };

  const printPDF = () => {
    if (!selectedAchat) return;

    // Filtrer les lignes complètement retournées
    const filteredLines = (selectedAchat.ligneAchats || []).filter((ligne) => {
      const returnedQty = (ligne.ligneRetours || []).reduce((sum, lr) => sum + (lr.quantiteRetournee || 0), 0);
      return returnedQty < ligne.quantite;
    });

    // Calculer les montants effectifs en tenant compte des retours
    const totalReturns = parseFloat(selectedAchat.montant_retourne || 0);
    const prixTotalRemise = parseFloat(selectedAchat.prix_total_remise || 0);
    const prixEffectif = typeof selectedAchat.prix_effectif === 'number'
      ? selectedAchat.prix_effectif
      : Math.max(0, prixTotalRemise - totalReturns);
    const versment = parseFloat(selectedAchat.versment || 0);
    const resteAPayer = Math.max(0, prixEffectif - versment);

    // Create a print-friendly window
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bon d'Achat - ${selectedAchat.numeroBon}</title>
        <style>
          @media print {
            @page { margin: 20mm; }
            body { margin: 0; }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #667eea;
          }
          .info-section {
            margin-bottom: 20px;
          }
          .info-section h2 {
            font-size: 16px;
            margin-bottom: 10px;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background-color: #667eea;
            color: white;
            padding: 10px;
            text-align: left;
            font-weight: bold;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #ddd;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .totals {
            margin-top: 20px;
            text-align: right;
          }
          .totals div {
            margin: 5px 0;
          }
          .total-final {
            font-size: 18px;
            font-weight: bold;
            color: #667eea;
            border-top: 2px solid #ddd;
            padding-top: 10px;
            margin-top: 10px;
          }
          .notes {
            margin-top: 20px;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BON D'ACHAT</h1>
        </div>
        
        <div class="info-section">
          <div><strong>N°:</strong> ${selectedAchat.numeroBon}</div>
          <div><strong>Date:</strong> ${new Date(selectedAchat.dateAchat).toLocaleString()}</div>
        </div>
        
        <div class="info-section">
          <h2>CLIENT</h2>
          <div><strong>Nom:</strong> ${selectedAchat.client?.prenom || ''} ${selectedAchat.client?.nom || ''}</div>
          ${selectedAchat.client?.telephone ? `<div><strong>Téléphone:</strong> ${selectedAchat.client.telephone}</div>` : ''}
          ${selectedAchat.client?.email ? `<div><strong>Email:</strong> ${selectedAchat.client.email}</div>` : ''}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th>Quantité</th>
              <th style="text-align: right;">Prix Unitaire</th>
              <th style="text-align: right;">Remise</th>
              <th style="text-align: right;">Sous-Total</th>
            </tr>
          </thead>
          <tbody>
            ${filteredLines.map(ligne => `
              <tr>
                <td>${ligne.produit?.nom || 'N/A'}</td>
                <td>${ligne.quantite} ${ligne.produit?.uniteMesure || ''}</td>
                <td style="text-align: right;">${parseFloat(ligne.prixUnitaire).toFixed(2)} DA</td>
                <td style="text-align: right;">${parseFloat(ligne.remise || 0).toFixed(2)} DA</td>
                <td style="text-align: right;">${parseFloat(ligne.sousTotal).toFixed(2)} DA</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
        
        <div class="totals">
          <div><strong>Sous-total:</strong> ${parseFloat(selectedAchat.prix_total || 0).toFixed(2)} DA</div>
          <div><strong>Remise globale:</strong> ${parseFloat(selectedAchat.remiseGlobale || 0).toFixed(2)} DA</div>
          <div><strong>Montant retours:</strong> ${totalReturns.toFixed(2)} DA</div>
          <div class="total-final"><strong>TOTAL EFFECTIF: ${prixEffectif.toFixed(2)} DA</strong></div>
          <div><strong>Versement:</strong> ${versment.toFixed(2)} DA</div>
          <div><strong>Reste:</strong> ${resteAPayer.toFixed(2)} DA</div>
        </div>
        
        ${selectedAchat.notes ? `
          <div class="notes">
            <strong>Notes:</strong> ${selectedAchat.notes}
          </div>
        ` : ''}
        
        <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #666;">
          Imprimé le ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div>
      {/* Notification Popup */}
      {notification.open && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: notification.type === 'error' ? '#fee2e2' : notification.type === 'success' ? '#dcfce7' : '#e0e7ff',
          color: '#111827',
          border: '1px solid rgba(0,0,0,0.1)',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
          zIndex: 1100
        }}
          onClick={() => setNotification({ ...notification, open: false })}
        >
          {notification.message}
        </div>
      )}

      {/* Versement Modal */}
      {showVersementModal && selectedAchat && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050
        }}
        onClick={() => setShowVersementModal(false)}
        >
          <div style={{
            background: 'white', padding: '1.5rem', borderRadius: '10px', width: '100%', maxWidth: '420px', boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Ajouter un versement</h3>
            <div style={{ marginBottom: '0.75rem', color: '#6b7280' }}>
              Total: {parseFloat(selectedAchat.prix_total_remise || 0).toFixed(2)} DA • Déjà versé: {parseFloat(selectedAchat.versment || 0).toFixed(2)} DA
            </div>
            <input
              type="number"
              value={versementInput}
              onChange={(e) => setVersementInput(e.target.value)}
              min="0"
              step="0.01"
              placeholder="Montant (DA)"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowVersementModal(false)}
                style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer' }}
              >Annuler</button>
              <button
                onClick={async () => {
                  const amount = parseFloat(versementInput);
                  if (isNaN(amount) || amount <= 0) {
                    setNotification({ open: true, type: 'error', message: 'Veuillez saisir un montant positif.' });
                    return;
                  }
                  const current = parseFloat(selectedAchat.versment || 0);
                  const totalReturns = parseFloat(selectedAchat.montant_retourne || 0);
                  const prixTotalRemise = parseFloat(selectedAchat.prix_total_remise || 0);
                  const prixEffectif = typeof selectedAchat.prix_effectif === 'number'
                    ? selectedAchat.prix_effectif
                    : Math.max(0, prixTotalRemise - totalReturns);
                  const resteAPayer = Math.max(0, prixEffectif - current);

                  if (amount > resteAPayer) {
                    setNotification({ open: true, type: 'error', message: `Le versement dépasse le reste à payer après retours. Maximum: ${resteAPayer.toFixed(2)} DA` });
                    return;
                  }
                  try {
                    // Le backend attend la propriété "versment" dans le body
                    await api.put(`/achats/${selectedAchat.id}/versment`, { versment: amount });
                    const refreshed = await api.get(`/achats/${selectedAchat.id}`);
                    setSelectedAchat(refreshed.data);
                    await fetchAchats();
                    setNotification({ open: true, type: 'success', message: 'Versement ajouté avec succès.' });
                    setShowVersementModal(false);
                  } catch (e) {
                    setNotification({ open: true, type: 'error', message: e.response?.data?.message || "Erreur lors de l'ajout du versement" });
                  }
                }}
                style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedAchat && (
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
        onClick={closeDetails}
        >
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Purchase Details</h2>
              <button
                onClick={closeDetails}
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
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Purchase Number:</strong> {selectedAchat.numeroBon}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Date:</strong> {new Date(selectedAchat.dateAchat).toLocaleString()}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Client:</strong> {selectedAchat.client?.prenom} {selectedAchat.client?.nom}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Staff:</strong> {selectedAchat.utilisateur?.nom} {selectedAchat.utilisateur?.prenom}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Status:</strong> 
              <span style={{
                marginLeft: '0.5rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                ...getStatusBadgeColor(selectedAchat.statut)
              }}>
                {selectedAchat.statut}
              </span>
            </div>
            
            <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
              <strong style={{ marginBottom: '1rem', display: 'block' }}>Items:</strong>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '0.9rem'
                }}>
                  <thead>
                    <tr style={{ 
                      background: '#f5f5f5',
                      borderBottom: '2px solid #ddd'
                    }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Product</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>Quantity</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Unit Price</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Discount</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAchat.ligneAchats?.map((ligne, idx) => {
                      const quantiteRetournee = parseFloat(ligne.quantiteRetournee || 0);
                      const montantRetourne = quantiteRetournee > 0 ? quantiteRetournee * parseFloat(ligne.prixUnitaire) : 0;
                      const sousTotalReel = parseFloat(ligne.sousTotal) - montantRetourne;
                      const hasReturn = quantiteRetournee > 0;
                      
                      return (
                      <tr key={idx} style={{ 
                          borderBottom: '1px solid #eee',
                          background: hasReturn ? '#fff5f5' : 'transparent'
                      }}>
                        <td style={{ padding: '0.75rem', color: '#333' }}>
                          {ligne.produit?.nom || 'N/A'}
                            {hasReturn && (
                              <div style={{ 
                                fontSize: '0.75rem', 
                                color: '#ef4444',
                                marginTop: '0.25rem'
                              }}>
                                ⚠️ Retourné: {quantiteRetournee} {ligne.produit?.uniteMesure || ''}
                              </div>
                            )}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', color: '#333' }}>
                            <div>
                          {ligne.quantite} {ligne.produit?.uniteMesure || ''}
                            </div>
                            {hasReturn && (
                              <div style={{ 
                                fontSize: '0.75rem', 
                                color: '#ef4444',
                                marginTop: '0.25rem'
                              }}>
                                ({ligne.quantite - quantiteRetournee} restant)
                              </div>
                            )}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#666' }}>
                          {parseFloat(ligne.prixUnitaire).toFixed(2)} DA
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#666' }}>
                          {parseFloat(ligne.remise || 0).toFixed(2)} DA
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#333', fontWeight: 500 }}>
                            <div>
                              {sousTotalReel.toFixed(2)} DA
                            </div>
                            {hasReturn && (
                              <div style={{ 
                                fontSize: '0.75rem', 
                                color: '#ef4444',
                                marginTop: '0.25rem',
                                textDecoration: 'line-through',
                                opacity: 0.7
                              }}>
                                ({parseFloat(ligne.sousTotal).toFixed(2)} initial)
                              </div>
                            )}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ 
              marginTop: '1.5rem', 
              paddingTop: '1rem', 
              borderTop: '2px solid #ddd',
              background: '#f8f9fa',
              padding: '1rem',
              borderRadius: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ color: '#666' }}>
                  <strong>Subtotal:</strong>
                </div>
                <div style={{ color: '#333', fontWeight: 500 }}>
                  {parseFloat(selectedAchat.prix_total || 0).toFixed(2)} DA
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ color: '#666' }}>
                  <strong>Global Discount:</strong>
                </div>
                <div style={{ color: '#333', fontWeight: 500 }}>
                  {parseFloat(selectedAchat.remiseGlobale || 0).toFixed(2)} DA
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ color: '#666' }}>
                  <strong>Versement:</strong>
                </div>
                <div style={{ color: '#10b981', fontWeight: 600 }}>
                  {parseFloat(selectedAchat.versment || 0).toFixed(2)} DA
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ color: '#666' }}>
                  <strong>Reste à payer:</strong>
                </div>
                <div style={{ color: '#ef4444', fontWeight: 600 }}>
                  {(Math.max(0, (parseFloat(selectedAchat.prix_total_remise || 0) - parseFloat(selectedAchat.versment || 0))).toFixed(2))} DA
                </div>
              </div>
              {calculateTotalReturns(selectedAchat) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #ddd' }}>
                  <div style={{ color: '#ef4444' }}>
                    <strong>Retours:</strong>
                  </div>
                  <div style={{ color: '#ef4444', fontWeight: 500 }}>
                    - {calculateTotalReturns(selectedAchat).toFixed(2)} DA
                  </div>
                </div>
              )}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                paddingTop: '0.5rem',
                borderTop: '2px solid #ddd',
                marginTop: '0.5rem'
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#667eea' }}>
                  <strong>Total {calculateTotalReturns(selectedAchat) > 0 ? '(après retours)' : ''}:</strong>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#667eea' }}>
                  {calculateRealPrice(selectedAchat).toFixed(2)} DA
                  {calculateTotalReturns(selectedAchat) > 0 && (
                    <div style={{ 
                      fontSize: '0.85rem', 
                      color: '#ef4444',
                      marginTop: '0.25rem',
                      textDecoration: 'line-through',
                      opacity: 0.7,
                      fontWeight: 'normal'
                    }}>
                      (Initial: {parseFloat(selectedAchat.prix_total_remise || 0).toFixed(2)} DA)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedAchat.retours && selectedAchat.retours.length > 0 && (
              <div style={{ 
                marginTop: '1.5rem', 
                paddingTop: '1rem', 
                borderTop: '2px solid #ddd'
              }}>
                <strong style={{ marginBottom: '1rem', display: 'block', color: '#ef4444' }}>
                  Retours ({selectedAchat.retours.length}):
                </strong>
                {selectedAchat.retours.map((retour, idx) => (
                  <div key={idx} style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    background: '#fff5f5',
                    borderRadius: '8px',
                    border: '1px solid #fecaca'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 600, color: '#333' }}>
                        {retour.numeroRetour}
                      </div>
                      <div style={{ fontWeight: 600, color: '#ef4444' }}>
                        {parseFloat(retour.montantRembourse || 0).toFixed(2)} DA
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                      Type: {retour.typeRetour} | Date: {new Date(retour.dateRetour).toLocaleDateString()}
                    </div>
                    {retour.motif && (
                      <div style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                        Motif: {retour.motif}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedAchat.notes && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
                <strong>Notes:</strong>
                <p style={{ marginTop: '0.5rem', color: '#666' }}>{selectedAchat.notes}</p>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => { setVersementInput(''); setShowVersementModal(true); }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                ➕ Ajouter versement
              </button>
              <button
                onClick={generatePDF}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                💾 Save PDF
              </button>
              <button
                onClick={printPDF}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                🖨️ Print
              </button>
              <button
                onClick={closeDetails}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb'
      }}>
      <div style={{ 
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1f2937'
            }}>
              Purchases List
            </h2>
            <p style={{ 
              margin: '0.25rem 0 0 0', 
              fontSize: '0.9rem', 
              color: '#6b7280' 
            }}>
              Showing <strong style={{ color: '#667eea' }}>{Math.min(filteredAchats.length, 50)}</strong> of <strong style={{ color: '#667eea' }}>{achats.length}</strong> purchases
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          marginBottom: '1.5rem',
          padding: '1.25rem',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: '1rem', 
            marginBottom: '1rem' 
          }}>
            <div style={{ flex: '1 1 300px', minWidth: '200px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 600, 
                fontSize: '0.9rem',
                color: '#374151'
              }}>
                🔍 Rechercher
              </label>
              <input
                type="text"
                placeholder="Bon N°, Client, Email, Téléphone..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
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
            <div style={{ flex: '0 1 180px', minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>
                📅 Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem' }}
              />
            </div>
            <div style={{ flex: '0 1 180px', minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>
                📅 Date To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem' }}
              />
            </div>
            <div style={{ flex: '0 1 180px', minWidth: '150px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 600, 
                fontSize: '0.9rem',
                color: '#374151'
              }}>
                👤 Client
              </label>
              <select
                value={filters.clientId}
                onChange={(e) => {
                  handleFilterChange('clientId', e.target.value);
                  fetchAchats();
                }}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  background: 'white',
                  cursor: 'pointer',
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
              >
                <option value="">Tous les clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.prenom} {client.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(filters.search || filters.dateFrom || filters.dateTo || filters.clientId) && (
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
              paddingTop: '0.75rem',
              borderTop: '1px solid #e5e7eb',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>
                Active filters:
              </span>
              {filters.search && (
                <span style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 500
                }}>
                  Search: {filters.search}
                </span>
              )}
              {filters.dateFrom && (
                <span style={{ background: '#10b981', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 500 }}>
                  From: {filters.dateFrom}
                </span>
              )}
              {filters.dateTo && (
                <span style={{ background: '#10b981', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 500 }}>
                  To: {filters.dateTo}
                </span>
              )}
              {filters.clientId && (
                <span style={{
                  background: '#f59e0b',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 500
                }}>
                  Client: {clients.find(c => c.id === parseInt(filters.clientId))?.prenom} {clients.find(c => c.id === parseInt(filters.clientId))?.nom}
                </span>
              )}
              <button
                onClick={handleClearFilters}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#b91c1c';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
                }}
              >
                ✕ Clear All
              </button>
            </div>
          )}
        </div>

        {filteredAchats.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem 1rem',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '1.1rem',
              fontWeight: 500,
              margin: 0
            }}>
              No purchases found
            </p>
            <p style={{ 
              color: '#9ca3af', 
              fontSize: '0.9rem',
              marginTop: '0.5rem'
            }}>
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div style={{ 
            overflowX: 'auto',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '0.9rem',
              background: 'white'
            }}>
              <thead>
                <tr style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white'
                }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>BON N°</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>CLIENT</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>TELEPHONE</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>TYPE</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem' }}>AMOUNT</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem' }}>VERSEMENT</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem' }}>RESTE</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>DATE</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredAchats.slice(0, 50).map((achat, index) => {
                  const statusBadge = getStatusBadgeColor(achat.statut);
                  const typeBadge = getClientTypeBadgeColor(achat.client?.type);
                  return (
                    <tr key={achat.id} style={{ 
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background 0.2s',
                      background: index % 2 === 0 ? 'white' : '#f9fafb',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.transform = 'scale(1.001)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#f9fafb';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onClick={() => viewDetails(achat.id)}
                    >
                      <td style={{ 
                        padding: '1rem', 
                        fontWeight: 600,
                        color: '#6b7280'
                      }}>
                        #{achat.numeroBon}
                      </td>
                      <td style={{ 
                        padding: '1rem',
                        fontWeight: 600,
                        color: '#1f2937'
                      }}>
                        {achat.client?.prenom || ''} {achat.client?.nom || ''}
                      </td>
                      <td style={{ padding: '1rem', color: '#6b7280' }}>
                        {achat.client?.telephone ? (
                          <a 
                            href={`tel:${achat.client.telephone}`}
                            style={{ 
                              color: '#667eea',
                              textDecoration: 'none',
                              transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#5568d3'}
                            onMouseLeave={(e) => e.target.style.color = '#667eea'}
                          >
                            {achat.client.telephone}
                          </a>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: typeBadge.bg === '#fff9c4' 
                            ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                            : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                          color: typeBadge.color,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          display: 'inline-block'
                        }}>
                          {typeBadge.text}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '1rem', 
                        textAlign: 'right', 
                        fontWeight: 700, 
                        fontSize: '0.95rem',
                        color: '#667eea'
                      }}>
                        {calculateRealPrice(achat).toFixed(2)} DA
                        {calculateTotalReturns(achat) > 0 && (
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#ef4444',
                            marginTop: '0.25rem',
                            textDecoration: 'line-through',
                            opacity: 0.7
                          }}>
                            (Initial: {parseFloat(achat.prix_total_remise).toFixed(2)} DA)
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: '#10b981', fontWeight: 700 }}>
                        {parseFloat(achat.versment || 0).toFixed(2)} DA
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: '#ef4444', fontWeight: 700 }}>
                        {(Math.max(0, (parseFloat(achat.prix_total_remise || 0) - parseFloat(achat.versment || 0))).toFixed(2))} DA
                      </td>
                      <td style={{ padding: '1rem', color: '#6b7280' }}>
                        {new Date(achat.dateAchat).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: statusBadge.bg === '#e8f5e9'
                            ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                            : statusBadge.bg === '#fff3e0'
                            ? 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)'
                            : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                          color: statusBadge.color,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          display: 'inline-block'
                        }}>
                          {statusBadge.text}
                        </span>
                      </td>
                      
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchatList;
