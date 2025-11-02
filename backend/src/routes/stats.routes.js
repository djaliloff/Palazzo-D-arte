import express from 'express';
import {
  getDashboardStats,
  getSalesStats
} from '../controllers/stats.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireStaff } from '../middlewares/role.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(requireStaff);

// Dashboard statistics
router.get('/dashboard', getDashboardStats);

// Sales statistics
router.get('/sales', getSalesStats);

export default router;

