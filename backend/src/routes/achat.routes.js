import express from 'express';
import {
  getAllAchats,
  getAchatById,
  createAchat,
  updateAchatStatut,
  addAchatVersment
} from '../controllers/achat.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireStaff } from '../middlewares/role.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(requireStaff);

// Get all purchases (with filters)
router.get('/', getAllAchats);

// Get single purchase
router.get('/:id', getAchatById);

// Create purchase
router.post('/', createAchat);

// Update purchase status
router.put('/:id/statut', updateAchatStatut);

// Add versment to purchase
router.put('/:id/versment', addAchatVersment);

export default router;

