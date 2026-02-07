/**
 * Server configuration
 * 
 * All sensitive values loaded from environment variables.
 * NEVER commit secrets to version control.
 */

import { config as loadEnv } from 'dotenv';

loadEnv();

export const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://vault_user:password@localhost:5432/zeroguard',
  
  // Redis (session store)
  redis: process.env.REDIS_URL
    ? {
        url: process.env.REDIS_URL,
      }
    : null,
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION',
  cookieSecret: process.env.COOKIE_SECRET || 'CHANGE_THIS_IN_PRODUCTION',
  
  // Rate limiting
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    window: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
  },
  
  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3001',
  ],
  
  // File storage
  fileStorage: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/zip',
      'text/plain',
    ],
    storagePath: process.env.STORAGE_PATH || './uploads',
  },
  
  // Security
  argon2: {
    memoryCost: 65536, // 64MB
    timeCost: 3,
    parallelism: 4,
  },
  
  // Email (for future notifications)
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    from: process.env.EMAIL_FROM || 'noreply@zeroguard.io',
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
} as const;

// Validate critical configuration
if (config.env === 'production') {
  if (config.jwtSecret === 'CHANGE_THIS_IN_PRODUCTION') {
    throw new Error('JWT_SECRET must be set in production');
  }
  
  if (config.cookieSecret === 'CHANGE_THIS_IN_PRODUCTION') {
    throw new Error('COOKIE_SECRET must be set in production');
  }
  
  if (!config.databaseUrl.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be set in production');
  }
}
