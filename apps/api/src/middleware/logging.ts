import type { FastifyReply, FastifyRequest } from 'fastify';

export async function requestLogger(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  request.log.info(
    {
      method: request.method,
      url: request.url,
      ip: request.ip,
    },
    'request received'
  );
}
