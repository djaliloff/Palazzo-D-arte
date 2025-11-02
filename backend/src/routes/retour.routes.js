import express from 'express';
import {
  getAllRetours,
  getRetourById,
  createRetour
} from '../controllers/retour.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireStaff } from '../middlewares/role.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(requireStaff);

// Get all returns (with filters)
router.get('/', getAllRetours);

// Get single return
router.get('/:id', getRetourById);

// Create return
router.post('/', createRetour);

export default router;

