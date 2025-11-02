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
          }
        }
      },
      retours: true
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
          ligneRetours: true
        }
      },
      retours: {
        include: {
          ligneRetours: {
            include: {
              produit: true
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
  const { clientId, ligneAchats, remiseGlobale, notes } = req.body;

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
    if (ligne.quantite > produit.quantite_stock) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Insufficient stock for ${produit.nom}. Available: ${produit.quantite_stock}`
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
    await prisma.produit.update({
      where: { id: ligne.produitId },
      data: {
        quantite_stock: {
          decrement: ligne.quantite
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

