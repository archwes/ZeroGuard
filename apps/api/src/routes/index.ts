import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { db } from '../db/client.js';
import { vaultRoutes } from './vault.js';
import { authRoutes } from './auth.js';

type AuditEvent = {
  userId?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  success: boolean;
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
  request?: FastifyRequest;
};

async function auditLog(server: FastifyInstance, event: AuditEvent) {
  try {
    const ipAddress = event.request?.ip ?? null;
    const userAgent = event.request?.headers['user-agent'] ?? null;

    await server.db.query(
      `INSERT INTO audit_log (
        user_id,
        action,
        resource_type,
        resource_id,
        ip_address,
        user_agent,
        success,
        error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        event.userId ?? null,
        event.action,
        event.resourceType ?? null,
        event.resourceId ?? null,
        ipAddress,
        userAgent,
        event.success,
        event.errorMessage ?? null,
      ]
    );
  } catch (error) {
    server.log.error({ err: error }, 'failed to write audit log');
  }
}

async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (error) {
    request.log.warn({ err: error }, 'unauthorized');
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid or missing token',
    });
  }
}

export async function registerRoutes(server: FastifyInstance) {
  server.decorate('db', db);
  server.decorate('auditLog', async (event: AuditEvent) => auditLog(server, event));
  server.decorate('authenticate', authenticate);

  await server.register(authRoutes);
  await server.register(vaultRoutes);
}
