import type { FastifyReply, FastifyRequest } from 'fastify';

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

type DbClient = {
  query: <T = unknown>(
    text: string,
    params?: Array<unknown>
  ) => Promise<{ rows: T[]; rowCount: number }>;
  execute: (
    text: string,
    params?: Array<unknown>
  ) => Promise<{ rowCount: number }>;
};

declare module 'fastify' {
  interface FastifyInstance {
    db: DbClient;
    auditLog: (event: AuditEvent) => Promise<void>;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
