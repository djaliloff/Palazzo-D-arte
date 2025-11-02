import prisma from '../config/db.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

/**
 * Get all products
 * GET /api/products
 */
export const getAllProducts = asyncHandler(async (req, res) => {
  const { search, marqueId, categorieId, actif } = req.query;

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

  const produits = await prisma.produit.findMany({
    where,
    include: {
      marque: true,
      categorie: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(produits);
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
      categorie: true
    }
  });

  if (!produit || produit.deleted) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Product not found'
    });
  }

  res.json(produit);
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
    venduParUnite
  } = req.body;

  if (!reference || !nom || !prixUnitaire || !marqueId || !categorieId) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Reference, name, unit price, brand and category are required'
    });
  }

  const produit = await prisma.produit.create({
    data: {
      reference,
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
      quantite_stock: parseFloat(req.body.quantite_stock) || 0,
      quantite_depos: parseFloat(req.body.quantite_depos) || 0,
      date_expiration: req.body.date_expiration ? new Date(req.body.date_expiration) : null,
      venduParUnite: venduParUnite !== undefined ? venduParUnite : true
    },
    include: {
      marque: true,
      categorie: true
    }
  });

  logger.success(`Product created: ${produit.nom}`);
  res.status(201).json(produit);
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

  // Convert foreign keys to integers if present
  if (data.marqueId) data.marqueId = parseInt(data.marqueId);
  if (data.categorieId) data.categorieId = parseInt(data.categorieId);

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

  // Calculate new quantities
  const newQuantiteStock = (produit.quantite_stock || 0) + (parseFloat(quantite_stock_ajout) || 0);
  const newQuantiteDepos = (produit.quantite_depos || 0) + (parseFloat(quantite_depos_ajout) || 0);

  // Update product
  const updateData = {
    quantite_stock: newQuantiteStock,
    quantite_depos: newQuantiteDepos
  };

  // Update expiration date if provided
  if (date_expiration) {
    updateData.date_expiration = new Date(date_expiration);
  }

  const updatedProduit = await prisma.produit.update({
    where: { id: parseInt(produitId) },
    data: updateData,
    include: {
      marque: true,
      categorie: true
    }
  });

  logger.success(`Stock added to product: ${updatedProduit.nom} (Stock: +${quantite_stock_ajout || 0}, Depot: +${quantite_depos_ajout || 0})`);
  res.json(updatedProduit);
});

