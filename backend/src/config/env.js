import dotenv from 'dotenv';

dotenv.config();

const primaryDatabaseEnvVar = process.env.DATABASE_URL
  ? 'DATABASE_URL'
  : process.env.LOCAL_DATABASE_URL
    ? 'LOCAL_DATABASE_URL'
    : null;

if (!primaryDatabaseEnvVar) {
  console.error('❌ Missing required environment variable: DATABASE_URL (or LOCAL_DATABASE_URL for local setups)');
  process.exit(1);
}

const rawDatabaseUrl = process.env[primaryDatabaseEnvVar];
let databaseUrl = rawDatabaseUrl;

try {
  const url = new URL(rawDatabaseUrl);
  const isNeonHost = url.hostname.includes('neon.tech');

  if (isNeonHost && !url.searchParams.has('sslmode')) {
    url.searchParams.set('sslmode', 'require');
    databaseUrl = url.toString();
    console.log('ℹ Added sslmode=require to DATABASE_URL for Neon host');
  }
} catch (error) {
  console.error(`❌ Invalid ${primaryDatabaseEnvVar}: ${error.message}`);
  process.exit(1);
}

// Ensure Prisma sees the resolved URL even when LOCAL_DATABASE_URL is used
process.env.DATABASE_URL = databaseUrl;

try {
  const { hostname, port } = new URL(databaseUrl);
  console.log(`ℹ Using ${primaryDatabaseEnvVar} for database connection (${hostname}:${port || 'default'})`);
} catch (error) {
  // Should not happen because URL was already validated, but guard just in case
  console.warn('⚠ Unable to log database connection host:', error.message);
}

const allowLocalNetworkOrigins = process.env.ALLOW_LOCAL_NETWORK_ORIGINS !== 'false';
const localDevIp = process.env.LOCAL_DEV_IP || null;

const corsOrigins = (() => {
  const defaults = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  if (localDevIp) {
    defaults.push(`http://${localDevIp}:3000`);
  }

  const origins = new Set(defaults);

  const raw = process.env.CORS_ORIGIN;
  if (raw) {
    raw
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
      .forEach((origin) => origins.add(origin));
  }

  return Array.from(origins);
})();

console.log('ℹ Allowed CORS origins:', corsOrigins.join(', '));

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins,
  corsOrigin: corsOrigins[0] || 'http://localhost:3000',
  allowLocalNetworkOrigins,
  localDevIp,
};

console.log('✅ Environment variables loaded');

