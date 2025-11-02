import prisma from '../config/db.js';
import { comparePassword, hashPassword } from '../utils/hash.js';
import { generateToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Email and password are required'
    });
  }

  const utilisateur = await prisma.utilisateur.findUnique({
    where: { email }
  });

  if (!utilisateur) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid credentials'
    });
  }

  const isPasswordValid = await comparePassword(password, utilisateur.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid credentials'
    });
  }

  if (!utilisateur.actif) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Account is deactivated'
    });
  }

  // Update last login
  await prisma.utilisateur.update({
    where: { id: utilisateur.id },
    data: { lastLogin: new Date() }
  });

  const token = generateToken({
    id: utilisateur.id,
    email: utilisateur.email,
    role: utilisateur.role,
    nom: utilisateur.nom,
    prenom: utilisateur.prenom
  });

  logger.success(`User ${utilisateur.email} logged in`);

  res.json({
    token,
    user: {
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      role: utilisateur.role
    }
  });
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.utilisateur.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,
      actif: true,
      lastLogin: true,
      createdAt: true
    }
  });

  res.json(user);
});

/**
 * Change password
 * PUT /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Current password and new password are required'
    });
  }

  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: req.user.id }
  });

  const isPasswordValid = await comparePassword(currentPassword, utilisateur.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Current password is incorrect'
    });
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.utilisateur.update({
    where: { id: req.user.id },
    data: { password: hashedPassword }
  });

  logger.success(`Password changed for user ${utilisateur.email}`);

  res.json({ message: 'Password changed successfully' });
});

