import { PrismaClient } from '@prisma/client';
import { config } from './env.js';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: config.databaseUrl,
    },
  },
});

export default prisma;

