import prisma from '../config/db.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

export const getAllMarques = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const where = {};

  if (status === 'inactive') {
    where.actif = false;
  } else if (status === 'all') {
    // include all brands regardless of status
  } else {
    where.actif = true;
  }

  const marques = await prisma.marque.findMany({
    where,
    orderBy: { nom: 'asc' }
  });
  res.json(marques);
});

export const createMarque = asyncHandler(async (req, res) => {
  const { nom, description, actif = true, image } = req.body;

  if (!nom) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Name is required'
    });
  }

  const existingMarque = await prisma.marque.findUnique({
    where: { nom }
  });

  if (existingMarque) {
    return res.status(409).json({
      error: 'Validation Error',
      message: 'Brand name already exists'
    });
  }

  const marque = await prisma.marque.create({
    data: {
      nom,
      description: description || null,
      actif: Boolean(actif),
      image: image || null
    }
  });

  logger.success(`Brand created: ${marque.nom}`);

  res.status(201).json(marque);
});

export const updateMarque = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nom, description, actif, image } = req.body;

  const data = {};

  if (nom !== undefined) {
    const existingMarque = await prisma.marque.findFirst({
      where: {
        nom,
        id: { not: parseInt(id, 10) }
      }
    });

    if (existingMarque) {
      return res.status(409).json({
        error: 'Validation Error',
        message: 'Brand name already exists'
      });
    }

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

  const marque = await prisma.marque.update({
    where: { id: parseInt(id, 10) },
    data
  });

  logger.success(`Brand updated: ${marque.nom}`);
  res.json(marque);
});

export const addMarqueCredit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  const value = parseFloat(amount);
  if (Number.isNaN(value) || value <= 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Amount must be a positive number'
    });
  }

  const marque = await prisma.marque.update({
    where: { id: parseInt(id, 10) },
    data: {
      credit: { increment: value }
    }
  });

  logger.success(`Credit added to brand ${marque.nom}: +${value}`);
  res.json({
    marque,
    remainingCredit: Math.max(0, marque.credit - marque.versment)
  });
});

export const addMarqueVersment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  const value = parseFloat(amount);
  if (Number.isNaN(value) || value <= 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Amount must be a positive number'
    });
  }

  const marque = await prisma.marque.findUnique({
    where: { id: parseInt(id, 10) }
  });

  if (!marque) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Brand not found'
    });
  }

  if (marque.versment + value > marque.credit + 0.0001) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Payment exceeds outstanding credit'
    });
  }

  const updated = await prisma.marque.update({
    where: { id: marque.id },
    data: {
      versment: { increment: value }
    }
  });

  logger.success(`Payment recorded for brand ${updated.nom}: +${value}`);
  res.json({
    marque: updated,
    remainingCredit: Math.max(0, updated.credit - updated.versment)
  });
});

























