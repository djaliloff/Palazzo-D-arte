import express from 'express';
import {
  login,
  getMe,
  changePassword
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, getMe);
router.put('/change-password', authenticate, changePassword);

export default router;

