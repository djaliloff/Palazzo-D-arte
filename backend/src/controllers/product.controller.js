import prisma from '../config/db.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { retirerStock } from '../services/stock.service.js';

/**
 * Helper function to recalculate stock from lots
 * 
 * STOCK RECALCULATION LOGIC:
 * ============================================================
 * This function recalculates quantite_stock based on LotDeStock records.
 * 
 * For perishable products (perissable = true):
 * - Only counts lots that are NOT expired (date_expiration > now)
 * - Expired lots are excluded from available stock
 * - This ensures quantite_stock reflects only sellable inventory
 * 
 * For non-perishable products (perissable = false):
 * - Counts ALL lots regardless of expiration date
 * - Since non-perishable products don't have expiration dates,
 *   all lots are considered available
 * 
 * The recalculated value is then stored in quantite_stock to keep
 * it synchronized with the actual lot data.
 * ============================================================
 * 
 * @param {number} produitId - The ID of the product to recalculate stock for
 * @returns {Promise<number>} - The recalculated stock quantity
 */
const recalculerStockFromLots = async (produitId) => {
  const produit = await prisma.produit.findUnique({
    where: { id: parseInt(produitId) },
    include: {
      lot_de_stock: true
    }
  });

  if (!produit) {
    throw new Error('Product not found');
  }

  // For non-perishable products, stock is managed directly on quantite_stock
  // and not recomputed from lots. Simply return current stock.
  if (!produit.perissable) {
    return produit.quantite_stock;
  }

  const now = new Date();
  let totalStock = 0;

  if (produit.perissable) {
    // For perishable products: sum only non-expired lots
    // Expired products should not be counted as available stock
    for (const lot of produit.lot_de_stock) {
      if (lot.date_expiration && new Date(lot.date_expiration) > now) {
        totalStock += lot.quantite_restante;
      }
    }
  } else {
    // For non-perishable products: sum all lots
    // Non-perishable products don't have expiration dates,
    // so all lots are considered available
    for (const lot of produit.lot_de_stock) {
      totalStock += lot.quantite_restante;
    }
  }

  // Update product's quantite_stock to match the calculated value
  // This ensures quantite_stock always reflects the actual available stock
  await prisma.produit.update({
    where: { id: parseInt(produitId) },
    data: {
      quantite_stock: totalStock
    }
  });

  return totalStock;
};

/**
 * Get all products
 * GET /api/products
 */
export const getAllProducts = asyncHandler(async (req, res) => {
  const { search, marqueId, categorieId, actif, page, limit } = req.query;

  const where = {
    deleted: false
  };

  if (search) {
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { reference: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (marqueId) {
    where.marqueId = parseInt(marqueId);
  }

  if (categorieId) {
    where.categorieId = parseInt(categorieId);
  }

  if (actif !== undefined) {
    where.actif = actif === 'true';
  }

  // Pagination
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  // Get total count for pagination
  const total = await prisma.produit.count({ where });

  const produits = await prisma.produit.findMany({
    where,
    include: {
      marque: true,
      categorie: true,
      lot_de_stock: {
        orderBy: {
          date_expiration: 'asc'
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limitNum
  });

  res.json({
    products: produits,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      hasMore: skip + produits.length < total
    }
  });
});

/**
 * Get product by ID
 * GET /api/products/:id
 */
export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const produit = await prisma.produit.findUnique({
    where: { id: parseInt(id) },
    include: {
      marque: true,
      categorie: true,
      lot_de_stock: {
        orderBy: {
          date_expiration: 'asc'
        }
      }
    }
  });

  if (!produit || produit.deleted) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Product not found'
    });
  }

  // Recalculate stock from lots to ensure accuracy
  try {
    await recalculerStockFromLots(produit.id);
    // Refetch to get updated stock
    const updatedProduit = await prisma.produit.findUnique({
      where: { id: parseInt(id) },
      include: {
        marque: true,
        categorie: true,
        lot_de_stock: {
          orderBy: {
            date_expiration: 'asc'
          }
        }
      }
    });
    res.json(updatedProduit);
  } catch (error) {
  res.json(produit);
  }
});

/**
 * Create product
 * POST /api/products
 */
export const createProduct = asyncHandler(async (req, res) => {
  const {
    reference,
    nom,
    description,
    image,
    modeVente,
    prixTotal,
    prixPartiel,
    uniteMesure,
    poids,
    marqueId,
    categorieId,
    seuilAlerte,
    perissable,
    date_expiration,
    quantite_stock
  } = req.body;

  if (!nom || !marqueId || !categorieId) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Name, brand and category are required'
    });
  }

  const saleMode = (modeVente || 'TOTAL').toUpperCase();
  if (!['TOTAL', 'PARTIAL', 'BOTH'].includes(saleMode)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid sale mode'
    });
  }

  const parsedPrixTotal = prixTotal != null && prixTotal !== '' ? parseFloat(prixTotal) : null;
  const parsedPrixPartiel = prixPartiel != null && prixPartiel !== '' ? parseFloat(prixPartiel) : null;
  const parsedUnite = uniteMesure ? uniteMesure.toUpperCase() : null;
  const parsedPoids = poids != null && poids !== '' ? parseFloat(poids) : null;

  if (saleMode !== 'PARTIAL' && (!parsedPrixTotal || isNaN(parsedPrixTotal))) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Total price is required for total sale modes'
    });
  }

  if (saleMode !== 'TOTAL') {
    if (!parsedPrixPartiel || isNaN(parsedPrixPartiel)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Partial price is required for partial sale modes'
      });
    }
    if (!parsedUnite) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Unit of measure is required for partial sale modes'
      });
    }
  }

  // Generate unique reference if not provided
  let productReference = reference;
  if (!productReference) {
    // Find all products with references starting with 'P-'
    const productsWithP = await prisma.produit.findMany({
      where: {
        reference: {
          startsWith: 'P-',
          mode: 'insensitive'
        }
      },
      select: {
        reference: true
      },
      orderBy: {
        reference: 'desc'
      }
    });

    let nextNumber = 1;
    if (productsWithP && productsWithP.length > 0) {
      // Extract the highest number from references
      const numbers = productsWithP
        .map(p => {
          const match = p.reference.match(/P-(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(n => n > 0);
      
      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1;
      }
    }

    // Format as P-001, P-002, etc.
    productReference = `P-${String(nextNumber).padStart(3, '0')}`;
    
    // Ensure uniqueness (in case of race condition)
    let exists = await prisma.produit.findUnique({
      where: { reference: productReference }
    });
    
    while (exists) {
      nextNumber++;
      productReference = `P-${String(nextNumber).padStart(3, '0')}`;
      exists = await prisma.produit.findUnique({
        where: { reference: productReference }
      });
    }
  } else {
    // Check if provided reference already exists
    const existingProduct = await prisma.produit.findUnique({
      where: { reference: productReference }
    });
    
    if (existingProduct) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Reference already exists'
      });
    }
  }

  // Validate expiration date for perishable products with initial stock
  const initialStock = parseFloat(quantite_stock) || 0;
  if (perissable && initialStock > 0 && !date_expiration) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Expiration date is required for perishable products with initial stock'
    });
  }

  // Create product with initial stock = 0 (will be recalculated from lots)
  const produit = await prisma.produit.create({
    data: {
      reference: productReference,
      nom,
      description,
      image,
      modeVente: saleMode,
      prixTotal: saleMode === 'PARTIAL' ? null : parsedPrixTotal,
      prixPartiel: saleMode === 'TOTAL' ? null : parsedPrixPartiel,
      uniteMesure: saleMode === 'TOTAL' ? null : parsedUnite,
      poids: parsedPoids,
      marqueId: parseInt(marqueId),
      categorieId: parseInt(categorieId),
      seuilAlerte: seuilAlerte ? parseFloat(seuilAlerte) : 5,
      // For perishable products, stock is driven by lots.
      // For non-perishable products, we store the initial stock directly.
      quantite_stock: perissable ? 0 : initialStock,
      perissable: perissable !== undefined ? Boolean(perissable) : false
    },
    include: {
      marque: true,
      categorie: true
    }
  });

  // Create initial lot if stock is provided
  if (perissable && initialStock > 0) {
    await prisma.lotDeStock.create({
      data: {
        produitId: produit.id,
        quantite: initialStock,
        quantite_restante: initialStock,
        date_expiration: date_expiration ? new Date(date_expiration) : null
      }
    });

    // Recalculate stock from lots
    await recalculerStockFromLots(produit.id);
  }

  // Refetch product with updated stock
  const updatedProduit = await prisma.produit.findUnique({
    where: { id: produit.id },
    include: {
      marque: true,
      categorie: true
    }
  });

  logger.success(`Product created: ${updatedProduit.nom} (perissable: ${updatedProduit.perissable})`);
  res.status(201).json(updatedProduit);
});

/**
 * Update product
 * PUT /api/products/:id
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  const produitExistant = await prisma.produit.findUnique({
    where: { id: parseInt(id) }
  });

  if (!produitExistant) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Product not found'
    });
  }

  // Remove fields that shouldn't be updated directly
  delete data.id;
  delete data.createdAt;
  delete data.date_expiration; // date_expiration is for lots, not product
  delete data.quantite_stock; // Stock should be managed through lots, not direct update

  // Convert foreign keys to integers if present
  if (data.marqueId) data.marqueId = parseInt(data.marqueId);
  if (data.categorieId) data.categorieId = parseInt(data.categorieId);

  // Convert boolean fields
  if (data.perissable !== undefined) data.perissable = Boolean(data.perissable);

  // Determine final mode and pricing
  const saleMode = (data.modeVente || produitExistant.modeVente).toUpperCase();
  if (!['TOTAL', 'PARTIAL', 'BOTH'].includes(saleMode)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid sale mode'
    });
  }

  const prixTotalValue =
    data.prixTotal !== undefined
      ? (data.prixTotal === null || data.prixTotal === '' ? null : parseFloat(data.prixTotal))
      : produitExistant.prixTotal;

  const prixPartielValue =
    data.prixPartiel !== undefined
      ? (data.prixPartiel === null || data.prixPartiel === '' ? null : parseFloat(data.prixPartiel))
      : produitExistant.prixPartiel;

  const uniteValue =
    data.uniteMesure !== undefined
      ? (data.uniteMesure ? data.uniteMesure.toUpperCase() : null)
      : produitExistant.uniteMesure;

  if (saleMode !== 'PARTIAL' && (!prixTotalValue || isNaN(prixTotalValue))) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Total price is required for total sale modes'
    });
  }

  if (saleMode !== 'TOTAL') {
    if (!prixPartielValue || isNaN(prixPartielValue)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Partial price is required for partial sale modes'
      });
    }
    if (!uniteValue) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Unit of measure is required for partial sale modes'
      });
    }
  }

  data.modeVente = saleMode;
  data.prixTotal = saleMode === 'PARTIAL' ? null : prixTotalValue;
  data.prixPartiel = saleMode === 'TOTAL' ? null : prixPartielValue;
  data.uniteMesure = saleMode === 'TOTAL' ? null : uniteValue;

  if (data.poids !== undefined) {
    data.poids = data.poids === null || data.poids === '' ? null : parseFloat(data.poids);
  }

  if (data.seuilAlerte !== undefined) {
    data.seuilAlerte = data.seuilAlerte === '' ? produitExistant.seuilAlerte : parseFloat(data.seuilAlerte);
  }

  const produit = await prisma.produit.update({
    where: { id: parseInt(id) },
    data,
    include: {
      marque: true,
      categorie: true
    }
  });

  logger.success(`Product updated: ${produit.nom}`);
  res.json(produit);
});

/**
 * Delete product (soft delete)
 * DELETE /api/products/:id
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const produit = await prisma.produit.update({
    where: { id: parseInt(id) },
    data: { deleted: true, actif: false }
  });

  logger.success(`Product deleted: ${produit.nom}`);
  res.json({ message: 'Product deleted successfully' });
});

/**
 * Get products with lots expiring within 3 months
 * GET /api/products/alerts/expiring
 */
export const getExpiringLots = asyncHandler(async (req, res) => {
  const now = new Date();
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

  // Find all lots expiring within 3 months and that still have remaining quantity
  const lots = await prisma.lotDeStock.findMany({
    where: {
      date_expiration: {
        gte: now,
        lte: threeMonthsFromNow
      },
      quantite_restante: {
        gt: 0
      }
    },
    include: {
      produit: {
        include: {
          marque: true,
          categorie: true
        }
      }
    },
    orderBy: {
      date_expiration: 'asc'
    }
  });

  // Group by product and calculate days until expiration
  const productsMap = new Map();
  
  lots.forEach(lot => {
    if (!lot.produit || lot.produit.deleted) return;
    
    const daysUntilExpiration = Math.ceil((new Date(lot.date_expiration) - now) / (1000 * 60 * 60 * 24));
    const productId = lot.produit.id;
    
    if (!productsMap.has(productId)) {
      productsMap.set(productId, {
        produit: lot.produit,
        lots: [],
        earliestExpiration: lot.date_expiration,
        daysUntilExpiration: daysUntilExpiration
      });
    }
    
    const productData = productsMap.get(productId);
    productData.lots.push({
      id: lot.id,
      quantite: lot.quantite,
      date_expiration: lot.date_expiration,
      daysUntilExpiration: daysUntilExpiration
    });
    
    // Update earliest expiration if needed
    if (new Date(lot.date_expiration) < new Date(productData.earliestExpiration)) {
      productData.earliestExpiration = lot.date_expiration;
      productData.daysUntilExpiration = daysUntilExpiration;
    }
  });

  // Convert map to array
  const productsWithExpiringLots = Array.from(productsMap.values());
  
  res.json({
    count: productsWithExpiringLots.length,
    products: productsWithExpiringLots
  });
});

/**
 * Get low stock products (below threshold)
 * GET /api/products/alerts/low-stock
 */
export const getLowStockProducts = asyncHandler(async (req, res) => {
  // Fetch all active products
  const allProduits = await prisma.produit.findMany({
    where: {
      deleted: false,
      actif: true
    },
    include: {
      marque: true,
      categorie: true
    }
  });

  // Filter products where stock is below or equal to threshold
  const lowStockProducts = allProduits.filter(
    produit => produit.quantite_stock <= produit.seuilAlerte
  );

  // Sort by stock ascending
  lowStockProducts.sort((a, b) => a.quantite_stock - b.quantite_stock);

  res.json(lowStockProducts);
});

/**
 * Add stock to a product
 * POST /api/products/add-stock
 * 
 * STOCK ADDITION LOGIC:
 * ============================================================
 * This function handles adding stock to products using the lot system.
 * 
 * quantite_stock (Current Available Stock):
 * - Updated through the lot system
 * - For perishable products: creates a new LotDeStock with expiration date
 * - For non-perishable products: creates a LotDeStock without expiration date
 * - quantite_stock is recalculated from all lots after adding
 * 
 * For perishable products:
 * - Requires a valid future expiration date
 * - Creates a new lot with the expiration date
 * - quantite_stock is recalculated to include only non-expired lots
 * 
 * For non-perishable products:
 * - No expiration date required
 * - Creates a lot without expiration date
 * - quantite_stock is recalculated from all lots
 * ============================================================
 */
export const addStockToProduct = asyncHandler(async (req, res) => {
  const {
    produitId,
    quantite_stock_ajout,
    date_expiration
  } = req.body;

  if (!produitId) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Product ID is required'
    });
  }

  if (!quantite_stock_ajout || quantite_stock_ajout <= 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Stock quantity must be provided and greater than 0'
    });
  }

  // Get current product
  const produit = await prisma.produit.findUnique({
    where: { id: parseInt(produitId) }
  });

  if (!produit || produit.deleted) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Product not found'
    });
  }

  // Validate expiration date for perishable products
  if (produit.perissable && !date_expiration) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Expiration date is required for perishable products'
    });
  }

  // Validate that expiration date is in the future
  if (produit.perissable && date_expiration) {
    const expDate = new Date(date_expiration);
    if (isNaN(expDate.getTime()) || expDate <= new Date()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Valid future expiration date is required for perishable products'
      });
    }
  }

  // Create a new lot for this stock addition
  // For perishable products: lot has expiration date
  // For non-perishable products: lot has no expiration date (null)
  if (produit.perissable) {
    await prisma.lotDeStock.create({
      data: {
        produitId: parseInt(produitId),
        quantite: parseFloat(quantite_stock_ajout),
        quantite_restante: parseFloat(quantite_stock_ajout),
        date_expiration: date_expiration ? new Date(date_expiration) : null
      }
    });

    // Recalculate quantite_stock from all lots
    // This ensures quantite_stock reflects the actual available stock
    await recalculerStockFromLots(produitId);
  } else {
    // For non-perishable products, update stock directly on the product
    const newStock = (produit.quantite_stock || 0) + parseFloat(quantite_stock_ajout);
    await prisma.produit.update({
      where: { id: parseInt(produitId) },
      data: { quantite_stock: newStock }
    });
  }

  // Get updated product
  const updatedProduit = await prisma.produit.findUnique({
    where: { id: parseInt(produitId) },
    include: {
      marque: true,
      categorie: true,
      lot_de_stock: {
        orderBy: {
          date_expiration: 'asc'
        }
      }
    }
  });

  logger.success(`Stock added to product: ${updatedProduit.nom} (Stock: +${quantite_stock_ajout || 0})`);
  res.json(updatedProduit);
});

/**
 * Withdraw stock from a product
 * POST /api/products/:id/retirer-stock
 * 
 * This endpoint handles stock withdrawal for both perishable and non-perishable products.
 * 
 * For non-perishable products:
 * - Simply subtracts the requested quantity from quantite_stock
 * 
 * For perishable products:
 * - Uses FEFO (First Expired First Out) logic
 * - Withdraws from lots with earliest expiration dates first
 * - Updates or deletes lots as needed
 * - Recalculates quantite_stock from remaining lots
 * 
 * Request body:
 * {
 *   "quantite": number  // The quantity to withdraw
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Successfully withdrew X units from stock",
 *   "product": {...},  // Updated product with current stock
 *   "withdrawnQuantity": number,
 *   "remainingStock": number,
 *   "lotsModified": [...]  // Only for perishable products
 * }
 */
export const retirerStockProduit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantite } = req.body;

  // Validate input
  if (!quantite || quantite <= 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Quantity must be provided and greater than 0'
    });
  }

  // Validate quantity is a number
  const quantiteDemandee = parseFloat(quantite);
  if (isNaN(quantiteDemandee)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Quantity must be a valid number'
    });
  }

  try {
    // Call the service function to handle stock withdrawal
    const result = await retirerStock(id, quantiteDemandee);

    logger.success(
      `Stock withdrawn from product ID ${id}: ${quantiteDemandee} units (Remaining: ${result.remainingStock})`
    );

    // Return success response
    res.json(result);
  } catch (error) {
    // Handle specific error messages from the service
    if (
      error.message.includes('Product not found') ||
      error.message.includes('not active')
    ) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }

    if (
      error.message.includes('Insufficient stock') ||
      error.message.includes('Quantity must')
    ) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    // Generic error handler
    logger.error(`Error withdrawing stock from product ${id}:`, error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to withdraw stock. Please try again later.'
    });
  }
});

