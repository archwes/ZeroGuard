/**
 * 🔐 Vault API Routes
 * 
 * RESTful API for vault item management.
 * Server never sees plaintext data - only encrypted blobs.
 * 
 * @module routes/vault
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { nanoid } from 'nanoid';

/**
 * Encrypted vault item schema (for validation)
 */
const EncryptedVaultItemSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['password', 'card', 'note', 'identity', 'file', 'totp', 'api_key', 'license']),
  encryptedData: z.string(),
  encryptedKey: z.string(),
  nonce: z.string(),
  authTag: z.string(),
  encryptedMetadata: z.string().optional(),
});

/**
 * Request type extensions
 */
interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    emailHash: string;
  };
}

/**
 * Register vault routes
 */
export async function vaultRoutes(server: FastifyInstance) {
  // ==========================================================================
  // GET /vault/items - Fetch all vault items
  // ==========================================================================
  
  server.get(
    '/vault/items',
    {
      onRequest: [server.authenticate], // JWT middleware
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id: userId } = request.user;

        // Fetch all non-deleted items for user
        const items = await server.db.query(
          `SELECT 
            id, item_type as "itemType", 
            encrypted_data as "encryptedData",
            encrypted_key as "encryptedKey",
            nonce, auth_tag as "authTag",
            encrypted_metadata as "encryptedMetadata",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM vault_items 
          WHERE user_id = $1 AND deleted_at IS NULL 
          ORDER BY created_at DESC`,
          [userId]
        );

        // Log audit event
        await server.auditLog({
          userId,
          action: 'list_items',
          success: true,
          metadata: { count: items.rows.length },
        });

        return {
          items: items.rows.map(row => ({
            id: row.id,
            type: row.itemType,
            encryptedData: row.encryptedData.toString('base64'),
            encryptedKey: row.encryptedKey.toString('base64'),
            nonce: row.nonce.toString('base64'),
            authTag: row.authTag.toString('base64'),
            encryptedMetadata: row.encryptedMetadata?.toString('base64'),
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          })),
        };
      } catch (error) {
        server.log.error(error, 'Failed to fetch vault items');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch vault items',
        });
      }
    }
  );

  // ==========================================================================
  // GET /vault/items/:id - Fetch single vault item
  // ==========================================================================
  
  server.get(
    '/vault/items/:id',
    {
      onRequest: [server.authenticate],
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const { id: userId } = request.user;

        const result = await server.db.query(
          `SELECT 
            id, item_type as "itemType",
            encrypted_data as "encryptedData",
            encrypted_key as "encryptedKey",
            nonce, auth_tag as "authTag",
            encrypted_metadata as "encryptedMetadata",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM vault_items
          WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
          [id, userId]
        );

        if (result.rows.length === 0) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'Vault item not found',
          });
        }

        const row = result.rows[0];

        // Log audit event
        await server.auditLog({
          userId,
          action: 'read_item',
          resourceId: id,
          success: true,
        });

        return {
          id: row.id,
          type: row.itemType,
          encryptedData: row.encryptedData.toString('base64'),
          encryptedKey: row.encryptedKey.toString('base64'),
          nonce: row.nonce.toString('base64'),
          authTag: row.authTag.toString('base64'),
          encryptedMetadata: row.encryptedMetadata?.toString('base64'),
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
      } catch (error) {
        server.log.error(error, 'Failed to fetch vault item');
        return reply.code(500).send({
          error: 'Internal Server Error',
        });
      }
    }
  );

  // ==========================================================================
  // POST /vault/items - Create new vault item
  // ==========================================================================
  
  server.post(
    '/vault/items',
    {
      onRequest: [server.authenticate],
      schema: {
        body: EncryptedVaultItemSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id: userId } = request.user;
        const body = request.body as z.infer<typeof EncryptedVaultItemSchema>;

        const id = body.id || nanoid();

        // Convert base64 to bytea
        const encryptedData = Buffer.from(body.encryptedData, 'base64');
        const encryptedKey = Buffer.from(body.encryptedKey, 'base64');
        const nonce = Buffer.from(body.nonce, 'base64');
        const authTag = Buffer.from(body.authTag, 'base64');
        const encryptedMetadata = body.encryptedMetadata
          ? Buffer.from(body.encryptedMetadata, 'base64')
          : null;

        // Calculate storage size
        const itemSize = encryptedData.length + encryptedKey.length;

        // Check storage quota
        const userResult = await server.db.query(
          `SELECT storage_used, storage_limit FROM users WHERE id = $1`,
          [userId]
        );

        const { storage_used, storage_limit } = userResult.rows[0];

        if (storage_used + itemSize > storage_limit) {
          return reply.code(413).send({
            error: 'Storage Limit Exceeded',
            message: 'Your storage quota has been exceeded',
          });
        }

        // Insert vault item
        await server.db.query(
          `INSERT INTO vault_items (
            id, user_id, item_type,
            encrypted_data, encrypted_key, nonce, auth_tag, encrypted_metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [id, userId, body.type, encryptedData, encryptedKey, nonce, authTag, encryptedMetadata]
        );

        // Update storage usage
        await server.db.query(
          `UPDATE users SET storage_used = storage_used + $1 WHERE id = $2`,
          [itemSize, userId]
        );

        // Log audit event
        await server.auditLog({
          userId,
          action: 'create_item',
          resourceType: body.type,
          resourceId: id,
          success: true,
        });

        return reply.code(201).send({
          id,
          message: 'Vault item created successfully',
        });
      } catch (error) {
        server.log.error(error, 'Failed to create vault item');
        return reply.code(500).send({
          error: 'Internal Server Error',
        });
      }
    }
  );

  // ==========================================================================
  // PUT /vault/items/:id - Update vault item
  // ==========================================================================
  
  server.put(
    '/vault/items/:id',
    {
      onRequest: [server.authenticate],
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: EncryptedVaultItemSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const { id: userId } = request.user;
        const body = request.body as z.infer<typeof EncryptedVaultItemSchema>;

        // Verify ownership
        const existing = await server.db.query(
          `SELECT id FROM vault_items WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
          [id, userId]
        );

        if (existing.rows.length === 0) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'Vault item not found',
          });
        }

        // Convert base64 to bytea
        const encryptedData = Buffer.from(body.encryptedData, 'base64');
        const encryptedKey = Buffer.from(body.encryptedKey, 'base64');
        const nonce = Buffer.from(body.nonce, 'base64');
        const authTag = Buffer.from(body.authTag, 'base64');
        const encryptedMetadata = body.encryptedMetadata
          ? Buffer.from(body.encryptedMetadata, 'base64')
          : null;

        // Update vault item
        await server.db.query(
          `UPDATE vault_items SET
            item_type = $1,
            encrypted_data = $2,
            encrypted_key = $3,
            nonce = $4,
            auth_tag = $5,
            encrypted_metadata = $6,
            updated_at = NOW()
          WHERE id = $7 AND user_id = $8`,
          [body.type, encryptedData, encryptedKey, nonce, authTag, encryptedMetadata, id, userId]
        );

        // Log audit event
        await server.auditLog({
          userId,
          action: 'update_item',
          resourceType: body.type,
          resourceId: id,
          success: true,
        });

        return {
          message: 'Vault item updated successfully',
        };
      } catch (error) {
        server.log.error(error, 'Failed to update vault item');
        return reply.code(500).send({
          error: 'Internal Server Error',
        });
      }
    }
  );

  // ==========================================================================
  // DELETE /vault/items/:id - Delete vault item (soft delete)
  // ==========================================================================
  
  server.delete(
    '/vault/items/:id',
    {
      onRequest: [server.authenticate],
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const { id: userId } = request.user;

        // Soft delete
        const result = await server.db.query(
          `UPDATE vault_items SET deleted_at = NOW() 
          WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
          RETURNING id`,
          [id, userId]
        );

        if (result.rows.length === 0) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'Vault item not found',
          });
        }

        // Log audit event
        await server.auditLog({
          userId,
          action: 'delete_item',
          resourceId: id,
          success: true,
        });

        return {
          message: 'Vault item deleted successfully',
        };
      } catch (error) {
        server.log.error(error, 'Failed to delete vault item');
        return reply.code(500).send({
          error: 'Internal Server Error',
        });
      }
    }
  );

  // ==========================================================================
  // GET /vault/stats - Get vault statistics
  // ==========================================================================
  
  server.get(
    '/vault/stats',
    {
      onRequest: [server.authenticate],
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id: userId } = request.user;

        // Get item counts by type
        const counts = await server.db.query(
          `SELECT item_type, COUNT(*) as count
          FROM vault_items
          WHERE user_id = $1 AND deleted_at IS NULL
          GROUP BY item_type`,
          [userId]
        );

        // Get storage usage
        const storage = await server.db.query(
          `SELECT storage_used, storage_limit FROM users WHERE id = $1`,
          [userId]
        );

        const countMap: Record<string, number> = {};
        counts.rows.forEach(row => {
          countMap[row.item_type] = parseInt(row.count, 10);
        });

        return {
          totalItems: counts.rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0),
          passwordCount: countMap.password || 0,
          cardCount: countMap.card || 0,
          noteCount: countMap.note || 0,
          identityCount: countMap.identity || 0,
          fileCount: countMap.file || 0,
          totpCount: countMap.totp || 0,
          apiKeyCount: countMap.api_key || 0,
          licenseCount: countMap.license || 0,
          storageUsed: storage.rows[0].storage_used,
          storageLimit: storage.rows[0].storage_limit,
        };
      } catch (error) {
        server.log.error(error, 'Failed to fetch vault stats');
        return reply.code(500).send({
          error: 'Internal Server Error',
        });
      }
    }
  );
}
