import app from './src/app.js';
import { config } from './src/config/env.js';
import { logger } from './src/utils/logger.js';

// Start server
app.listen(config.port, () => {
  logger.success(`🚀 Server running on http://localhost:${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});