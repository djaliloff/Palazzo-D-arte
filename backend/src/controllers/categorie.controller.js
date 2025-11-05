import prisma from '../config/db.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.categorie.findMany({
    where: { actif: true },
    orderBy: { nom: 'asc' }
  });
  res.json(categories);
});


















