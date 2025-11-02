import prisma from '../config/db.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

/**
 * Get all purchases
 * GET /api/achats
 */
export const getAllAchats = asyncHandler(async (req, res) => {
  const { clientId, statut, startDate, endDate } = req.query;

  const where = {};

  if (clientId) {
    where.clientId = parseInt(clientId);
  }

  if (statut) {
    where.statut = statut;
  }

  if (startDate || endDate) {
    where.dateAchat = {};
    if (startDate) where.dateAchat.gte = new Date(startDate);
    if (endDate) where.dateAchat.lte = new Date(endDate);
  }

  const achats = await prisma.achat.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true
        }
      },
      utilisateur: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true
        }
      },
      ligneAchats: {
        include: {
          produit: {
            select: {
              id: true,
              reference: true,
              nom: true,
              uniteMesure: true
            }
          },
          ligneRetours: {
            include: {
              retour: {
                select: {
                  id: true,
                  numeroRetour: true,
                  dateRetour: true
                }
              }
            }
          }
        }
      },
      retours: {
        include: {
          ligneRetours: {
            include: {
              produit: {
                select: {
                  id: true,
                  reference: true,
                  nom: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(achats);
});

/**
 * Get achat by ID
 * GET /api/achats/:id
 */
export const getAchatById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const achat = await prisma.achat.findUnique({
    where: { id: parseInt(id) },
    include: {
      client: true,
      utilisateur: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true
        }
      },
      ligneAchats: {
        include: {
          produit: {
            include: {
              marque: true,
              categorie: true
            }
          },
          ligneRetours: {
            include: {
              retour: {
                select: {
                  id: true,
                  numeroRetour: true,
                  dateRetour: true,
                  typeRetour: true
                }
              },
              produit: {
                select: {
                  id: true,
                  reference: true,
                  nom: true
                }
              }
            }
          }
        }
      },
      retours: {
        include: {
          ligneRetours: {
            include: {
              produit: {
                select: {
                  id: true,
                  reference: true,
                  nom: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!achat) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Purchase not found'
    });
  }

  res.json(achat);
});

/**
 * Create achat
 * POST /api/achats
 */
export const createAchat = asyncHandler(async (req, res) => {
  const { clientId, ligneAchats, remiseGlobale, notes, versment } = req.body;

  if (!clientId || !ligneAchats || ligneAchats.length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Client and at least one product are required'
    });
  }

  // Calculate totals
  let prix_total = 0;
  
  for (const ligne of ligneAchats) {
    const produit = await prisma.produit.findUnique({
      where: { id: ligne.produitId }
    });

    if (!produit) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Product with id ${ligne.produitId} not found`
      });
    }

    // Check stock availability
    // Si le produit a un poids défini et que l'unité de mesure est KG,
    // convertir les kg achetés en fraction de pièce pour la validation
    let quantiteToCheck = ligne.quantite;
    if (produit.poids && produit.uniteMesure === 'KG' && produit.venduParUnite) {
      // Convertir les kg achetés en fraction de pièce
      quantiteToCheck = ligne.quantite / produit.poids;
    }
    
    if (quantiteToCheck > produit.quantite_stock) {
      // Formater le message d'erreur selon le type de produit
      let availableStock = produit.quantite_stock;
      if (produit.poids && produit.uniteMesure === 'KG' && produit.venduParUnite) {
        const piecesCompletes = Math.floor(produit.quantite_stock);
        const resteEnKg = (produit.quantite_stock - piecesCompletes) * produit.poids;
        if (resteEnKg > 0 && piecesCompletes > 0) {
          availableStock = `${piecesCompletes} pièce${piecesCompletes > 1 ? 's' : ''} et ${resteEnKg.toFixed(2)} kg`;
        } else if (piecesCompletes > 0) {
          availableStock = `${piecesCompletes} pièce${piecesCompletes > 1 ? 's' : ''}`;
        } else {
          availableStock = `${resteEnKg.toFixed(2)} kg`;
        }
      } else {
        availableStock = `${produit.quantite_stock} ${produit.uniteMesure}`;
      }
      
      return res.status(400).json({
        error: 'Validation Error',
        message: `Insufficient stock for ${produit.nom}. Available: ${availableStock}`
      });
    }

    const prixLigne = (ligne.prixUnitaire || produit.prixUnitaire) * ligne.quantite;
    prix_total += prixLigne - (ligne.remise || 0);
  }

  const remise = remiseGlobale || 0;
  const prix_total_remise = prix_total - remise;

  // Create achat with ligneAchats
  const achat = await prisma.achat.create({
    data: {
      numeroBon: `BON-${Date.now()}`,
      clientId: parseInt(clientId),
      utilisateurId: req.user.id,
      prix_total,
      remiseGlobale: remise,
      prix_total_remise,
      notes,
      versment: parseFloat(versment) || 0,
      ligneAchats: {
        create: ligneAchats.map(ligne => ({
          produitId: ligne.produitId,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire || undefined,
          remise: ligne.remise || 0,
          sousTotal: ligne.quantite * (ligne.prixUnitaire || 0) - (ligne.remise || 0)
        }))
      }
    },
    include: {
      client: true,
      utilisateur: {
        select: {
          id: true,
          nom: true,
          prenom: true
        }
      },
      ligneAchats: {
        include: {
          produit: {
            include: {
              marque: true,
              categorie: true
            }
          }
        }
      }
    }
  });

  // Update stock for each product
  for (const ligne of ligneAchats) {
    const produit = await prisma.produit.findUnique({
      where: { id: ligne.produitId }
    });

    if (!produit) continue;

    let quantiteToDecrement = ligne.quantite;

    // Si le produit a un poids défini et que l'unité de mesure est KG,
    // convertir les kg achetés en fraction de pièce
    if (produit.poids && produit.uniteMesure === 'KG' && produit.venduParUnite) {
      // Convertir les kg achetés en fraction de pièce
      // Par exemple: 2 kg / 10 kg = 0.2 pièce
      quantiteToDecrement = ligne.quantite / produit.poids;
    }

    await prisma.produit.update({
      where: { id: ligne.produitId },
      data: {
        quantite_stock: {
          decrement: quantiteToDecrement
        }
      }
    });
  }

  logger.success(`Purchase created: ${achat.numeroBon}`);
  res.status(201).json(achat);
});

/**
 * Update achat statut
 * PUT /api/achats/:id/statut
 */
export const updateAchatStatut = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;

  const achat = await prisma.achat.update({
    where: { id: parseInt(id) },
    data: { statut }
  });

  logger.success(`Purchase status updated: ${achat.numeroBon} -> ${statut}`);
  res.json(achat);
});

