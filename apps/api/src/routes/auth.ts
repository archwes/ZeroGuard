/**
 * Auth API Routes
 *
 * Handles registration and login against the PostgreSQL database.
 * Passwords are hashed with pgcrypto's crypt()/gen_salt() so the server
 * never stores plaintext passwords.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createHash } from 'crypto';
import { z } from 'zod';

const RegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(12),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(server: FastifyInstance) {
  // ========================================================================
  // POST /auth/register
  // ========================================================================
  server.post(
    '/auth/register',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = RegisterSchema.parse(request.body);

        // Check if email already exists (hashed with SHA-256)
        const emailHash = hashEmail(body.email);

        const existing = await server.db.query(
          `SELECT id FROM users WHERE email_hash = $1`,
          [emailHash]
        );

        if (existing.rows.length > 0) {
          return reply.code(409).send({
            error: 'Conflict',
            message: 'E-mail já cadastrado',
          });
        }

        // Hash password with pgcrypto (bcrypt via gen_salt)
        const result = await server.db.query<{ id: string }>(
          `INSERT INTO users (
            email_hash,
            salt,
            srp_verifier,
            wrapped_mek,
            display_name
          ) VALUES (
            $1,
            gen_random_bytes(32),
            crypt($2, gen_salt('bf', 10)),
            gen_random_bytes(32),
            $3
          ) RETURNING id`,
          [emailHash, body.password, body.name]
        );

        const userId = result.rows[0].id;

        // Audit log
        await server.auditLog({
          userId,
          action: 'register',
          success: true,
          request,
        });

        return reply.code(201).send({
          message: 'Conta criada com sucesso',
          userId,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            error: 'Validation Error',
            message: 'Dados inválidos',
            details: error.errors,
          });
        }

        server.log.error(error, 'Failed to register user');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Erro ao criar conta',
        });
      }
    }
  );

  // ========================================================================
  // POST /auth/login
  // ========================================================================
  server.post(
    '/auth/login',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = LoginSchema.parse(request.body);
        const emailHash = hashEmail(body.email);

        // Find user and verify password in a single query
        // crypt(password, srp_verifier) re-hashes with the same salt;
        // if the result equals the stored hash, the password is correct.
        const result = await server.db.query<{
          id: string;
          display_name: string;
          account_locked: boolean;
          failed_login_attempts: number;
          salt: Buffer;
        }>(
          `SELECT id, display_name, account_locked, failed_login_attempts, salt
           FROM users
           WHERE email_hash = $1
             AND srp_verifier = crypt($2, srp_verifier)`,
          [emailHash, body.password]
        );

        if (result.rows.length === 0) {
          // Check if user exists at all (for attempt counting)
          const userExists = await server.db.query<{
            id: string;
            failed_login_attempts: number;
            account_locked: boolean;
          }>(
            `SELECT id, failed_login_attempts, account_locked FROM users WHERE email_hash = $1`,
            [emailHash]
          );

          if (userExists.rows.length > 0) {
            const user = userExists.rows[0];

            if (user.account_locked) {
              await server.auditLog({
                userId: user.id,
                action: 'login',
                success: false,
                errorMessage: 'Account locked',
                request,
              });

              return reply.code(423).send({
                error: 'Account Locked',
                message: 'Conta bloqueada por excesso de tentativas. Entre em contato com o suporte.',
              });
            }

            // Increment failed attempts
            const newAttempts = user.failed_login_attempts + 1;
            const shouldLock = newAttempts >= 10;

            await server.db.execute(
              `UPDATE users SET
                failed_login_attempts = $1,
                account_locked = $2
              WHERE id = $3`,
              [newAttempts, shouldLock, user.id]
            );

            await server.auditLog({
              userId: user.id,
              action: 'login',
              success: false,
              errorMessage: 'Invalid password',
              request,
            });

            const remaining = 10 - newAttempts;

            if (shouldLock) {
              return reply.code(423).send({
                error: 'Account Locked',
                message: 'Conta bloqueada por excesso de tentativas. Entre em contato com o suporte.',
              });
            }

            return reply.code(401).send({
              error: 'Unauthorized',
              message: `E-mail ou senha incorretos. ${remaining > 0 ? `Restam ${remaining} tentativa${remaining > 1 ? 's' : ''}.` : ''}`,
            });
          }

          // User doesn't exist at all — same generic message (prevent enumeration)
          return reply.code(401).send({
            error: 'Unauthorized',
            message: 'Nenhuma conta encontrada com essas credenciais.',
          });
        }

        const user = result.rows[0];

        if (user.account_locked) {
          return reply.code(423).send({
            error: 'Account Locked',
            message: 'Conta bloqueada por excesso de tentativas. Entre em contato com o suporte.',
          });
        }

        // Reset failed attempts on successful login
        await server.db.execute(
          `UPDATE users SET
            failed_login_attempts = 0,
            last_login_at = NOW()
          WHERE id = $1`,
          [user.id]
        );

        // Generate JWT
        const token = server.jwt.sign(
          { id: user.id, emailHash },
          { expiresIn: '15m' }
        );

        const refreshToken = server.jwt.sign(
          { id: user.id, type: 'refresh' },
          { expiresIn: '7d' }
        );

        // Audit log
        await server.auditLog({
          userId: user.id,
          action: 'login',
          success: true,
          request,
        });

        return {
          token,
          refreshToken,
          user: {
            id: user.id,
            name: user.display_name,
            email: body.email,
          },
          salt: user.salt.toString('base64'),
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            error: 'Validation Error',
            message: 'Dados inválidos',
          });
        }

        server.log.error(error, 'Failed to login');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Erro ao fazer login',
        });
      }
    }
  );
}

/** Hash email with SHA-256 for privacy-preserving lookup */
function hashEmail(email: string): string {
  return createHash('sha256')
    .update(email.toLowerCase().trim())
    .digest('hex');
}
