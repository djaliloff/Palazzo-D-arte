import express from 'express';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} from '../controllers/client.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireStaff } from '../middlewares/role.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all clients (with filters)
router.get('/', requireStaff, getAllClients);

// Get single client
router.get('/:id', requireStaff, getClientById);

// Create client
router.post('/', requireStaff, createClient);

// Update client
router.put('/:id', requireStaff, updateClient);

// Delete client
router.delete('/:id', requireStaff, deleteClient);

export default router;

