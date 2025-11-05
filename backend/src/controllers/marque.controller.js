import prisma from '../config/db.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

export const getAllMarques = asyncHandler(async (req, res) => {
  const marques = await prisma.marque.findMany({
    where: { actif: true },
    orderBy: { nom: 'asc' }
  });
  res.json(marques);
});


















