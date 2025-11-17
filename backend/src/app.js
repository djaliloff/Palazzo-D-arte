import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { logger } from './utils/logger.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import clientRoutes from './routes/client.routes.js';
import productRoutes from './routes/product.routes.js';
import achatRoutes from './routes/achat.routes.js';
import retourRoutes from './routes/retour.routes.js';
import statsRoutes from './routes/stats.routes.js';
import marqueRoutes from './routes/marque.routes.js';
import categorieRoutes from './routes/categorie.routes.js';

const app = express();

// Middleware
const isPrivateNetworkHost = (hostname) => {
  if (!hostname) return false;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  if (hostname === '::1') return true;
  if (hostname.endsWith('.local')) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^10\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return true;
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (config.allowLocalNetworkOrigins) {
      try {
        const { hostname } = new URL(origin);
        if (isPrivateNetworkHost(hostname)) {
          logger.info(`Allowing local network origin: ${origin}`);
          return callback(null, true);
        }
      } catch (error) {
        logger.warn(`Failed to parse origin "${origin}": ${error.message}`);
      }
    }

    logger.warn(`Blocked request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/achats', achatRoutes);
app.use('/api/retours', retourRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/marques', marqueRoutes);
app.use('/api/categories', categorieRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

export default app;

