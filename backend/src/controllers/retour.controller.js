import prisma from '../config/db.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

/**
 * Get all retours
 * GET /api/retours
 */
export const getAllRetours = asyncHandler(async (req, res) => {
  const { clientId, achatId, typeRetour, startDate, endDate } = req.query;

  const where = {};

  if (clientId) {
    where.clientId = parseInt(clientId);
  }

  if (achatId) {
    where.achatId = parseInt(achatId);
  }

  if (typeRetour) {
    where.typeRetour = typeRetour;
  }

  if (startDate || endDate) {
    where.dateRetour = {};
    if (startDate) where.dateRetour.gte = new Date(startDate);
    if (endDate) where.dateRetour.lte = new Date(endDate);
  }

  const retours = await prisma.retour.findMany({
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
      achat: {
        select: {
          id: true,
          numeroBon: true,
          dateAchat: true
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
      ligneRetours: {
        include: {
          produit: {
            select: {
              id: true,
              reference: true,
              nom: true,
              uniteMesure: true
            }
          },
          ligneAchat: {
            select: {
              id: true,
              quantite: true,
              quantiteRetournee: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(retours);
});

/**
 * Get retour by ID
 * GET /api/retours/:id
 */
export const getRetourById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const retour = await prisma.retour.findUnique({
    where: { id: parseInt(id) },
    include: {
      client: true,
      achat: {
        include: {
          client: true,
          ligneAchats: {
            include: {
              produit: true
            }
          }
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
      ligneRetours: {
        include: {
          produit: {
            include: {
              marque: true,
              categorie: true
            }
          },
          ligneAchat: true
        }
      }
    }
  });

  if (!retour) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Return not found'
    });
  }

  res.json(retour);
});

/**
 * Create retour
 * POST /api/retours
 */
export const createRetour = asyncHandler(async (req, res) => {
  const { achatId, ligneRetours, motif, typeRetour } = req.body;

  if (!achatId || !ligneRetours || ligneRetours.length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Purchase ID and at least one product are required'
    });
  }

  // Get the achat
  const achat = await prisma.achat.findUnique({
    where: { id: achatId },
    include: {
      client: true,
      ligneAchats: {
        include: {
          produit: true
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

  // Validate and calculate totals
  let montantTotal = 0;
  const produitsToUpdate = [];

  for (const ligneRetour of ligneRetours) {
    const ligneAchat = await prisma.ligneAchat.findUnique({
      where: { id: ligneRetour.ligneAchatId },
      include: {
        produit: true
      }
    });

    if (!ligneAchat) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Purchase line ${ligneRetour.ligneAchatId} not found`
      });
    }

    // Check if return quantity is valid
    const quantiteRestante = ligneAchat.quantite - ligneAchat.quantiteRetournee;
    if (ligneRetour.quantiteRetournee > quantiteRestante) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid return quantity for ${ligneAchat.produit.nom}. Max: ${quantiteRestante}`
      });
    }

    const montantLigne = ligneRetour.quantiteRetournee * ligneAchat.prixUnitaire;
    montantTotal += montantLigne;

    produitsToUpdate.push({
      produit: ligneAchat.produit,
      quantite: ligneRetour.quantiteRetournee,
      ligneAchatId: ligneRetour.ligneAchatId
    });
  }

  // Create retour
  const retour = await prisma.retour.create({
    data: {
      numeroRetour: `RET-${Date.now()}`,
      achatId: parseInt(achatId),
      clientId: achat.clientId,
      utilisateurId: req.user.id,
      montantRembourse: montantTotal,
      typeRetour: typeRetour,
      motif: motif,
      ligneRetours: {
        create: ligneRetours.map(ligneRetour => {
          return {
            ligneAchatId: ligneRetour.ligneAchatId,
            produitId: ligneRetour.produitId,
            quantiteRetournee: ligneRetour.quantiteRetournee,
            montantLigne: ligneRetour.quantiteRetournee * ligneRetour.prixUnitaire,
            motifDetaille: ligneRetour.motifDetaille
          };
        })
      }
    },
    include: {
      client: true,
      achat: true,
      utilisateur: {
        select: {
          id: true,
          nom: true,
          prenom: true
        }
      },
      ligneRetours: {
        include: {
          produit: {
            include: {
              marque: true,
              categorie: true
            }
          },
          ligneAchat: true
        }
      }
    }
  });

  // Update stock and quantiteRetournee
  for (const item of produitsToUpdate) {
    // Restore stock
    await prisma.produit.update({
      where: { id: item.produit.id },
      data: {
        quantite_stock: {
          increment: item.quantite
        }
      }
    });

    // Update ligneAchat quantiteRetournee
    const ligneAchat = await prisma.ligneAchat.findUnique({
      where: { id: item.ligneAchatId }
    });

    await prisma.ligneAchat.update({
      where: { id: item.ligneAchatId },
      data: {
        quantiteRetournee: ligneAchat.quantiteRetournee + item.quantite
      }
    });
  }

  // Update achat statut if necessary
  const totalLignesAchat = achat.ligneAchats.length;
  const lignesAchat = await prisma.ligneAchat.findMany({
    where: {
      achatId: achatId
    }
  });
  
  const lignesTotalementRetournees = lignesAchat.filter(
    ligne => ligne.quantiteRetournee >= ligne.quantite
  ).length;

  let newStatut = achat.statut;
  if (lignesTotalementRetournees === totalLignesAchat) {
    newStatut = 'RETOURNE_TOTAL';
  } else if (lignesTotalementRetournees > 0) {
    newStatut = 'RETOURNE_PARTIEL';
  }

  if (newStatut !== achat.statut) {
    await prisma.achat.update({
      where: { id: achatId },
      data: { statut: newStatut }
    });
  }

  logger.success(`Return created: ${retour.numeroRetour}`);
  res.status(201).json(retour);
});

