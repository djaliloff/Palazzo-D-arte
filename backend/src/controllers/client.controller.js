import prisma from '../config/db.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

/**
 * Get all clients
 * GET /api/clients
 */
export const getAllClients = asyncHandler(async (req, res) => {
  const { search, type, actif } = req.query;

  const where = {};

  if (search) {
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { prenom: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { telephone: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (type) {
    where.type = type;
  }

  if (actif !== undefined) {
    where.actif = actif === 'true';
  }

  const clients = await prisma.client.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          achats: true,
          retours: true
        }
      },
      achats: {
        select: {
          prix_total_remise: true
        }
      }
    }
  });

  // Calculate total spent for each client
  const clientsWithTotal = clients.map(client => {
    const totalSpent = client.achats.reduce((sum, achat) => sum + (achat.prix_total_remise || 0), 0);
    return {
      ...client,
      totalSpent
    };
  });

  res.json(clientsWithTotal);
});

/**
 * Get client by ID
 * GET /api/clients/:id
 */
export const getClientById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const client = await prisma.client.findUnique({
    where: { id: parseInt(id) },
    include: {
      _count: {
        select: {
          achats: true,
          retours: true
        }
      }
    }
  });

  if (!client) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Client not found'
    });
  }

  res.json(client);
});

/**
 * Create client
 * POST /api/clients
 */
export const createClient = asyncHandler(async (req, res) => {
  const { nom, prenom, email, telephone, adresse, type } = req.body;

  if (!nom) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Name is required'
    });
  }

  const client = await prisma.client.create({
    data: {
      nom,
      prenom,
      email,
      telephone,
      adresse,
      type: type || 'SIMPLE'
    }
  });

  logger.success(`Client created: ${client.nom} ${client.prenom || ''}`);

  res.status(201).json(client);
});

/**
 * Update client
 * PUT /api/clients/:id
 */
export const updateClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nom, prenom, email, telephone, adresse, type, actif } = req.body;

  const client = await prisma.client.update({
    where: { id: parseInt(id) },
    data: {
      nom,
      prenom,
      email,
      telephone,
      adresse,
      type,
      actif
    }
  });

  logger.success(`Client updated: ${client.nom}`);
  res.json(client);
});

/**
 * Delete client (soft delete by setting actif to false)
 * DELETE /api/clients/:id
 */
export const deleteClient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const client = await prisma.client.update({
    where: { id: parseInt(id) },
    data: { actif: false }
  });

  logger.success(`Client deactivated: ${client.nom}`);
  res.json({ message: 'Client deactivated successfully' });
});

