import type { FastifyReply, FastifyRequest } from 'fastify';

export async function securityHeaders(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('Referrer-Policy', 'no-referrer');
  reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}
