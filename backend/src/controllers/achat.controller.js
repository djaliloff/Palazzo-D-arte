import prisma from '../config/db.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { retirerStock } from '../services/stock.service.js';
import { computeSalePrice } from '../services/produit.service.js';

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

  // Calculate actual prices after returns
  const achatsWithCalculatedPrices = achats.map(achat => {
    // Calculate total returned amount
    let totalReturned = 0;
    if (achat.retours && achat.retours.length > 0) {
      for (const retour of achat.retours) {
        if (retour.ligneRetours && retour.ligneRetours.length > 0) {
          for (const ligneRetour of retour.ligneRetours) {
            totalReturned += ligneRetour.montantLigne || 0;
          }
        }
      }
    }

    // Calculate actual price (original - returns)
    const prix_effectif = Math.max(0, achat.prix_total_remise - totalReturned);

    // Determine statut based on returns
    let calculatedStatut = achat.statut;
    if (achat.ligneAchats && achat.ligneAchats.length > 0) {
      const allLinesReturned = achat.ligneAchats.every(ligne => {
        const totalReturned = ligne.ligneRetours?.reduce((sum, lr) => sum + (lr.quantiteRetournee || 0), 0) || 0;
        return totalReturned >= ligne.quantite;
      });
      
      const someLinesReturned = achat.ligneAchats.some(ligne => {
        const totalReturned = ligne.ligneRetours?.reduce((sum, lr) => sum + (lr.quantiteRetournee || 0), 0) || 0;
        return totalReturned > 0;
      });

      if (allLinesReturned) {
        calculatedStatut = 'RETOURNE_TOTAL';
      } else if (someLinesReturned) {
        calculatedStatut = 'RETOURNE_PARTIEL';
      }
    }

    return {
      ...achat,
      prix_effectif,
      montant_retourne: totalReturned,
      statut: calculatedStatut
    };
  });

  res.json(achatsWithCalculatedPrices);
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

  // Calculate actual price after returns
  let totalReturned = 0;
  if (achat.retours && achat.retours.length > 0) {
    for (const retour of achat.retours) {
      if (retour.ligneRetours && retour.ligneRetours.length > 0) {
        for (const ligneRetour of retour.ligneRetours) {
          totalReturned += ligneRetour.montantLigne || 0;
        }
      }
    }
  }

  const prix_effectif = Math.max(0, achat.prix_total_remise - totalReturned);

  // Determine statut
  let calculatedStatut = achat.statut;
  if (achat.ligneAchats && achat.ligneAchats.length > 0) {
    const allLinesReturned = achat.ligneAchats.every(ligne => {
      const ligneTotalReturned = ligne.ligneRetours?.reduce((sum, lr) => sum + (lr.quantiteRetournee || 0), 0) || 0;
      return ligneTotalReturned >= ligne.quantite;
    });
    
    const someLinesReturned = achat.ligneAchats.some(ligne => {
      const ligneTotalReturned = ligne.ligneRetours?.reduce((sum, lr) => sum + (lr.quantiteRetournee || 0), 0) || 0;
      return ligneTotalReturned > 0;
    });

    if (allLinesReturned) {
      calculatedStatut = 'RETOURNE_TOTAL';
    } else if (someLinesReturned) {
      calculatedStatut = 'RETOURNE_PARTIEL';
    }
  }

  res.json({
    ...achat,
    prix_effectif,
    montant_retourne: totalReturned,
    statut: calculatedStatut
  });
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

  const includeRelations = {
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
  };

  try {
    const result = await prisma.$transaction(async (tx) => {
      let prix_total = 0;
      const preparedLines = [];

      for (const ligne of ligneAchats) {
        const produit = await tx.produit.findUnique({
          where: { id: ligne.produitId }
        });

        if (!produit || produit.deleted) {
          throw Object.assign(new Error(`Product with id ${ligne.produitId} not found`), {
            status: 404,
            error: 'Not Found'
          });
        }

        if (!produit.actif) {
          throw Object.assign(new Error(`Product ${produit.nom} is not active`), {
            status: 400,
            error: 'Validation Error'
          });
        }

        const quantite = Number(ligne.quantite);
        if (!Number.isFinite(quantite) || quantite <= 0) {
          throw Object.assign(new Error(`Invalid quantity for ${produit.nom}`), {
            status: 400,
            error: 'Validation Error'
          });
        }

        const vendreTotal = Boolean(ligne.vendreTotal);

        const { montant, prixUtilise, quantiteRetrait } = computeSalePrice({
          modeVente: produit.modeVente,
          prixTotal: produit.prixTotal,
          prixPartiel: produit.prixPartiel,
          uniteMesure: produit.uniteMesure,
          poids: produit.poids,
          quantite,
          vendreTotal
        });

        const remiseLigne = Number(ligne.remise) || 0;
        if (remiseLigne < 0) {
          throw Object.assign(new Error(`Invalid discount for ${produit.nom}`), {
            status: 400,
            error: 'Validation Error'
          });
        }

        const sousTotal = montant - remiseLigne;
        if (sousTotal < 0) {
          throw Object.assign(new Error(`Discount exceeds line total for ${produit.nom}`), {
            status: 400,
            error: 'Validation Error'
          });
        }

        // Stock withdrawal inside transaction to avoid race conditions
        await retirerStock(produit.id, quantiteRetrait, tx);

        prix_total += sousTotal;
        // Only persist fields that exist on LigneAchat in Prisma schema
        preparedLines.push({
          produitId: produit.id,
          quantite,
          prixUnitaire: prixUtilise,
          remise: remiseLigne,
          sousTotal
        });
      }

      const remise = Number(remiseGlobale) || 0;
      if (remise < 0) {
        throw Object.assign(new Error('Global discount must be positive'), {
          status: 400,
          error: 'Validation Error'
        });
      }

      const prix_total_remise = prix_total - remise;
      if (prix_total_remise < 0) {
        throw Object.assign(new Error('Global discount exceeds total amount'), {
          status: 400,
          error: 'Validation Error'
        });
      }
      const versmentValue = Number(versment) || 0;
      if (versmentValue < 0) {
        throw Object.assign(new Error('Versment must be positive'), {
          status: 400,
          error: 'Validation Error'
        });
      }

      // 1. Create achat with a temporary numeroBon (required non-null field)
      const createdAchat = await tx.achat.create({
        data: {
          numeroBon: 'TEMP',
          clientId: parseInt(clientId),
          utilisateurId: req.user.id,
          prix_total,
          remiseGlobale: remise,
          prix_total_remise,
          notes,
          versment: versmentValue,
          ligneAchats: {
            create: preparedLines
          }
        }
      });

      // 2. Generate numeroBon based on current date + auto-incremented id
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const datePart = `${yyyy}${mm}${dd}`;
      const idPart = String(createdAchat.id).padStart(6, '0');
      const numeroBon = `${datePart}-${idPart}`;

      // 3. Update achat with the final numeroBon and return full object with relations
      const achat = await tx.achat.update({
        where: { id: createdAchat.id },
        data: { numeroBon },
        include: includeRelations
      });

      return achat;
    });

    logger.success(`Purchase created: ${result.numeroBon}`);
    return res.status(201).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        error: error.error,
        message: error.message
      });
    }

    logger.error('Failed to create purchase', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create purchase'
    });
  }
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

/**
 * Add a versment (payment) to an achat
 * PUT /api/achats/:id/versment
 */
export const addAchatVersment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { versment } = req.body;

  const amountToAdd = parseFloat(versment);
  if (Number.isNaN(amountToAdd) || amountToAdd <= 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'versment must be a positive number'
    });
  }

  // Récupérer l'achat avec les retours pour calculer le prix effectif après retours
  const achat = await prisma.achat.findUnique({
    where: { id: parseInt(id) },
    include: {
      retours: {
        include: {
          ligneRetours: true
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

  // Calculer le montant total retourné (même logique que getAchatById)
  let totalReturned = 0;
  if (achat.retours && achat.retours.length > 0) {
    for (const retour of achat.retours) {
      if (retour.ligneRetours && retour.ligneRetours.length > 0) {
        for (const ligneRetour of retour.ligneRetours) {
          totalReturned += ligneRetour.montantLigne || 0;
        }
      }
    }
  }

  const prix_effectif = Math.max(0, achat.prix_total_remise - totalReturned);
  const resteAPayer = Math.max(0, prix_effectif - (achat.versment || 0));

  if (amountToAdd > resteAPayer) {
    return res.status(400).json({
      error: 'Validation Error',
      message: `Payment exceeds remaining amount. Maximum allowed: ${resteAPayer.toFixed(2)}`
    });
  }

  // Update versment by incrementing the current value
  const updatedAchat = await prisma.achat.update({
    where: { id: parseInt(id) },
    data: {
      versment: { increment: amountToAdd }
    },
    include: {
      client: true,
      utilisateur: {
        select: { id: true, nom: true, prenom: true, email: true }
      },
      ligneAchats: {
        include: {
          produit: {
            select: { id: true, reference: true, nom: true, uniteMesure: true }
          }
        }
      }
    }
  });

  logger.success(`Purchase payment added: ${updatedAchat.numeroBon} +${amountToAdd}`);
  res.json(updatedAchat);
});

