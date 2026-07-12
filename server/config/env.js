import dotenv from 'dotenv';

dotenv.config();

const required = (key, fallback) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 5000),
  mongoUri: required('MONGO_URI', 'mongodb://localhost:27017/expensio'),
  jwtSecret: required('JWT_SECRET', 'dev-only-secret-change-me'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', 'dev-only-refresh-secret-change-me'),
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  bcryptCost: Number(process.env.BCRYPT_COST || 12),
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  resetTokenTtlMinutes: Number(process.env.RESET_TOKEN_TTL_MINUTES || 30),
};

// Fail fast in production if dev fallbacks are still in use.
if (env.isProduction) {
  const missing = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'CLIENT_ORIGIN'].filter(
    (key) => !process.env[key]
  );
  if (missing.length > 0) {
    throw new Error(`Production requires these environment variables: ${missing.join(', ')}`);
  }
}
