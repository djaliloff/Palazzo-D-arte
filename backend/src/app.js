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

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

export default app;

