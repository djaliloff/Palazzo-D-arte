import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getExpiringLots,
  addStockToProduct,
  retirerStockProduit
} from '../controllers/product.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireStaff } from '../middlewares/role.middleware.js';

const router = express.Router();

// Public route for products (can be accessed without auth if needed)
// If you want to protect it, uncomment the line below
// router.use(authenticate);

// Get all products (with filters)
router.get('/', getAllProducts);

// Get low stock alerts
router.get('/alerts/low-stock', getLowStockProducts);

// Get expiring lots alerts (within 6 months)
router.get('/alerts/expiring', getExpiringLots);

// Get single product
router.get('/:id', getProductById);

// Protected routes (require authentication)
router.use(authenticate);
router.use(requireStaff);

// Create product
router.post('/', createProduct);

// Add stock to product
router.post('/add-stock', addStockToProduct);

// Withdraw stock from product
// POST /api/products/:id/retirer-stock
// Body: { "quantite": number }
router.post('/:id/retirer-stock', retirerStockProduit);

// Update product
router.put('/:id', updateProduct);

// Delete product
router.delete('/:id', deleteProduct);

export default router;

