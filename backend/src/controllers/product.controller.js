import prisma from '../config/db.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

/**
 * Helper function to recalculate stock from lots
 * For perishable products: only counts non-expired lots
 * For non-perishable products: counts all lots
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

  const now = new Date();
  let totalStock = 0;

  if (produit.perissable) {
    // For perishable products: sum only non-expired lots
    for (const lot of produit.lot_de_stock) {
      if (lot.date_expiration && new Date(lot.date_expiration) > now) {
        totalStock += lot.quantite;
      }
    }
  } else {
    // For non-perishable products: sum all lots
    for (const lot of produit.lot_de_stock) {
      totalStock += lot.quantite;
    }
  }

  // Update product stock
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
    prixUnitaire,
    prixTotal,
    poids,
    uniteMesure,
    marqueId,
    categorieId,
    seuilAlerte,
    venduParUnite,
    perissable,
    date_expiration,
    quantite_stock
  } = req.body;

  if (!nom || !prixUnitaire || !marqueId || !categorieId) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Name, unit price, brand and category are required'
    });
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
      prixUnitaire,
      prixTotal: prixTotal || prixUnitaire,
      poids,
      uniteMesure: uniteMesure || 'PIECE',
      marqueId: parseInt(marqueId),
      categorieId: parseInt(categorieId),
      seuilAlerte: seuilAlerte || 5,
      quantite_stock: 0, // Will be calculated from lots
      quantite_depos: parseFloat(req.body.quantite_depos) || 0,
      venduParUnite: venduParUnite !== undefined ? venduParUnite : true,
      perissable: perissable !== undefined ? Boolean(perissable) : false
    },
    include: {
      marque: true,
      categorie: true
    }
  });

  // Create initial lot if stock is provided
  if (initialStock > 0) {
    await prisma.lotDeStock.create({
      data: {
        produitId: produit.id,
        quantite: initialStock,
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
  if (data.venduParUnite !== undefined) data.venduParUnite = Boolean(data.venduParUnite);

  // Convert numeric fields
  if (data.prixUnitaire !== undefined) data.prixUnitaire = parseFloat(data.prixUnitaire);
  if (data.prixTotal !== undefined) data.prixTotal = parseFloat(data.prixTotal);
  if (data.poids !== undefined) data.poids = data.poids ? parseFloat(data.poids) : null;
  if (data.seuilAlerte !== undefined) data.seuilAlerte = parseFloat(data.seuilAlerte);
  if (data.quantite_depos !== undefined) data.quantite_depos = parseFloat(data.quantite_depos);

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
 * Get products with lots expiring within 6 months
 * GET /api/products/alerts/expiring
 */
export const getExpiringLots = asyncHandler(async (req, res) => {
  const now = new Date();
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  // Find all lots expiring within 6 months
  const lots = await prisma.lotDeStock.findMany({
    where: {
      date_expiration: {
        gte: now,
        lte: sixMonthsFromNow
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
 * Add stock and/or depot quantities to a product
 * POST /api/products/add-stock
 */
export const addStockToProduct = asyncHandler(async (req, res) => {
  const {
    produitId,
    quantite_stock_ajout,
    quantite_depos_ajout,
    date_expiration
  } = req.body;

  if (!produitId) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Product ID is required'
    });
  }

  if (!quantite_stock_ajout && !quantite_depos_ajout) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'At least one quantity (stock or depot) must be provided'
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

  // Update depot quantity if provided
  let updateData = {};
  if (quantite_depos_ajout) {
    const newQuantiteDepos = (produit.quantite_depos || 0) + parseFloat(quantite_depos_ajout);
    updateData.quantite_depos = newQuantiteDepos;
  }

  // Add stock using lot system if stock quantity is provided
  if (quantite_stock_ajout) {
    // Validate expiration date for perishable products
    if (produit.perissable && !date_expiration) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Expiration date is required for perishable products'
      });
    }

    if (produit.perissable && date_expiration) {
      const expDate = new Date(date_expiration);
      if (isNaN(expDate.getTime()) || expDate <= new Date()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Valid future expiration date is required for perishable products'
        });
      }
    }

    // Create lot
    await prisma.lotDeStock.create({
      data: {
        produitId: parseInt(produitId),
        quantite: parseFloat(quantite_stock_ajout),
        date_expiration: date_expiration ? new Date(date_expiration) : null
      }
    });

    // Recalculate stock from lots
    await recalculerStockFromLots(produitId);
  } else if (quantite_depos_ajout) {
    // If only depot is updated, still recalculate stock to ensure it's accurate
    await recalculerStockFromLots(produitId);
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

  logger.success(`Stock added to product: ${updatedProduit.nom} (Stock: +${quantite_stock_ajout || 0}, Depot: +${quantite_depos_ajout || 0})`);
  res.json(updatedProduit);
});

