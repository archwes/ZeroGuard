import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error({ err: error }, 'request failed');

  const statusCode = error.statusCode ?? 500;
  const message = statusCode >= 500 ? 'Internal Server Error' : error.message;

  reply.code(statusCode).send({
    error: statusCode >= 500 ? 'Internal Server Error' : 'Request Error',
    message,
  });
}
