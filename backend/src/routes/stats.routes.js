import express from 'express';
import {
  getDashboardStats,
  getSalesStats,
  getAmountsByBrand,
  getTopProductsPerBrand,
  getTopProductsPerCategory,
  getTopClients
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

// Amount per brand
router.get('/brands/amounts', getAmountsByBrand);

// Top products per brand
router.get('/brands/top-products', getTopProductsPerBrand);

// Top products per category
router.get('/categories/top-products', getTopProductsPerCategory);

// Top clients (optional type filter)
router.get('/top-clients', getTopClients);

export default router;

