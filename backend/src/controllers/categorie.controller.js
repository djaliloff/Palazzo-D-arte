import prisma from '../config/db.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

export const getAllCategories = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const where = {};

  if (status === 'inactive') {
    where.actif = false;
  } else if (status === 'all') {
    // no actif filter, return all categories
  } else {
    // default to active categories
    where.actif = true;
  }

  const categories = await prisma.categorie.findMany({
    where,
    orderBy: { nom: 'asc' }
  });
  res.json(categories);
});

export const createCategory = asyncHandler(async (req, res) => {
  const { nom, description, actif = true, image } = req.body;

  if (!nom) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Name is required'
    });
  }

  const existingCategory = await prisma.categorie.findUnique({
    where: { nom }
  });

  if (existingCategory) {
    return res.status(409).json({
      error: 'Validation Error',
      message: 'Category name already exists'
    });
  }

  const category = await prisma.categorie.create({
    data: {
      nom,
      description: description || null,
      actif: Boolean(actif),
      image: image || null
    }
  });

  logger.success(`Category created: ${category.nom}`);

  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nom, description, actif, image } = req.body;

  const data = {};

  if (nom !== undefined) {
    data.nom = nom;
  }

  if (description !== undefined) {
    data.description = description === null ? null : description;
  }

  if (actif !== undefined) {
    data.actif = Boolean(actif);
  }

  if (image !== undefined) {
    data.image = image || null;
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'No valid fields provided for update'
    });
  }

  const category = await prisma.categorie.update({
    where: { id: parseInt(id, 10) },
    data
  });

  logger.success(`Category updated: ${category.nom}`);
  res.json(category);
});

























