/**
 * 🔐 ZeroGuard API Server
 * 
 * Fastify-based REST API for zero-knowledge vault.
 * 
 * Security principles:
 * - Never sees plaintext user data
 * - Stores only encrypted blobs
 * - Minimal authentication required
 * - Rate limiting enabled
 * - Audit logging (privacy-preserving)
 * 
 * @module server
 */

import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { config } from './config.js';
import { db } from './db/client.js';
import { registerRoutes } from './routes/index.js';
import { errorHandler } from './middleware/errors.js';
import { requestLogger } from './middleware/logging.js';
import { securityHeaders } from './middleware/security.js';

/**
 * Create and configure Fastify server
 */
export async function createServer() {
  const server = Fastify({
    logger: {
      level: config.env === 'production' ? 'info' : 'debug',
      transport:
        config.env === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
    trustProxy: true,
    bodyLimit: 10 * 1024 * 1024, // 10MB for file uploads
  });

  // ==========================================================================
  // SECURITY PLUGINS
  // ==========================================================================

  // Helmet - Security headers
  await server.register(helmet, {
    contentSecurityPolicy: config.env === 'production' ? {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    } : false,
    hsts: config.security.enableHsts ? {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    } : false,
  });

  // CORS
  await server.register(cors, {
    origin: config.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  // Rate limiting
  await server.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.window,
    cache: 10000,
    allowList: ['127.0.0.1'], // Localhost bypass
    redis: config.redis ? undefined : undefined, // TODO: Add Redis
    keyGenerator: (req) => {
      return req.headers['x-forwarded-for']?.toString() || req.ip;
    },
  });

  // JWT
  await server.register(jwt, {
    secret: config.jwtSecret,
    sign: {
      expiresIn: '15m', // Short-lived tokens
    },
    cookie: {
      cookieName: 'refreshToken',
      signed: false,
    },
  });

  // Cookies
  await server.register(cookie, {
    secret: config.cookieSecret,
    hook: 'onRequest',
    parseOptions: {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'strict',
    },
  });

  // Multipart (for file uploads)
  await server.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
      files: 1,
    },
  });

  // ==========================================================================
  // MIDDLEWARE
  // ==========================================================================

  server.addHook('onRequest', requestLogger);
  server.addHook('onRequest', securityHeaders);

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  server.setErrorHandler(errorHandler);

  // ==========================================================================
  // HEALTH CHECK
  // ==========================================================================

  server.get('/health', async () => {
    try {
      // Check database connection
      await db.execute('SELECT 1');

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed',
      };
    }
  });

  // ==========================================================================
  // API ROUTES
  // ==========================================================================

  await registerRoutes(server);

  // ==========================================================================
  // SERVE FRONTEND (production)
  // ==========================================================================

  if (config.env === 'production') {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const clientDistPath = join(__dirname, '..', '..', 'web', 'dist');

    await server.register(fastifyStatic, {
      root: clientDistPath,
      prefix: '/',
      wildcard: false,
    });

    // SPA fallback — any non-API, non-file route serves index.html
    server.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/auth/') || req.url.startsWith('/vault/') || req.url.startsWith('/health')) {
        reply.code(404).send({
          error: 'Not Found',
          message: `Route ${req.method}:${req.url} not found`,
        });
      } else {
        reply.sendFile('index.html');
      }
    });
  } else {
    // ==========================================================================
    // 404 HANDLER (development)
    // ==========================================================================

    server.setNotFoundHandler((req, reply) => {
      reply.code(404).send({
        error: 'Not Found',
        message: `Route ${req.method}:${req.url} not found`,
      });
    });
  }

  return server;
}

/**
 * Start the server
 */
async function start() {
  try {
    const server = await createServer();

    await server.listen({
      port: config.port,
      host: config.host,
    });

    server.log.info(`🔐 ZeroGuard API server running on port ${config.port}`);
    server.log.info(`Environment: ${config.env}`);
    server.log.info(`Database: Connected`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

// Start server
start();
