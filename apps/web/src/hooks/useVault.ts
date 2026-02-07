/// <reference types="vite/client" />
/**
 * Vault Hook — Manages encrypted vault items (zero-knowledge)
 *
 * All encryption/decryption happens CLIENT-SIDE.
 * The server only stores encrypted blobs — it can never see plaintext.
 *
 * Encryption flow (per item):
 *   1. Generate random 256-bit ItemKey
 *   2. AES-256-GCM encrypt plaintext with ItemKey → { ciphertext, nonce, authTag }
 *   3. Wrap ItemKey with MEK (also AES-256-GCM) → { ciphertext, nonce, authTag }
 *   4. Send both blobs (base64) to server
 *
 * MEK lifecycle:
 *   - Derived on login from master password via Argon2id (64 MB / 3 iter)
 *   - Held in memory only (never persisted)
 *   - Cleared on logout / lock
 */

import { create } from 'zustand';
import {
  SecureKey,
  deriveMasterKeys,
  generateSalt,
  encryptVaultItem,
  decryptVaultItem,
  bytesToBase64,
  base64ToBytes,
  CRYPTO_CONSTANTS,
} from '../crypto/core';
import { useAuth } from './useAuth';
import { apiFetch } from '../lib/api';

// ============================================================================
// Helpers — pack / unpack wrapped key
// ============================================================================
// The API stores a single `encryptedKey` blob. We concatenate
//   nonce (12 B) || ciphertext (32 B) || authTag (16 B) = 60 B
// so it survives the round-trip through the DB.

function packEncryptedKey(
  enc: { ciphertext: Uint8Array; nonce: Uint8Array; authTag: Uint8Array },
): Uint8Array {
  const packed = new Uint8Array(enc.nonce.length + enc.ciphertext.length + enc.authTag.length);
  packed.set(enc.nonce, 0);
  packed.set(enc.ciphertext, enc.nonce.length);
  packed.set(enc.authTag, enc.nonce.length + enc.ciphertext.length);
  return packed;
}

function unpackEncryptedKey(
  packed: Uint8Array,
): { ciphertext: Uint8Array; nonce: Uint8Array; authTag: Uint8Array } {
  const nonce = packed.slice(0, CRYPTO_CONSTANTS.NONCE_SIZE);
  const authTag = packed.slice(packed.length - CRYPTO_CONSTANTS.AUTH_TAG_SIZE);
  const ciphertext = packed.slice(CRYPTO_CONSTANTS.NONCE_SIZE, packed.length - CRYPTO_CONSTANTS.AUTH_TAG_SIZE);
  return { ciphertext, nonce, authTag };
}

// ============================================================================
// Types
// ============================================================================

export type VaultItemType = 'password' | 'card' | 'note' | 'identity' | 'file' | 'totp' | 'api-key' | 'license';

export interface VaultItemDisplay {
  id: string;
  type: VaultItemType;
  name: string;
  username?: string;
  maskedNumber?: string;
  favorite: boolean;
  lastUsed: string;
  plaintext?: Record<string, unknown>;
}

interface EncryptedItemDTO {
  id: string;
  type: string;
  encryptedData: string;   // base64
  encryptedKey: string;    // base64 (packed nonce||ct||tag)
  nonce: string;           // base64 — data nonce
  authTag: string;         // base64 — data authTag
  encryptedMetadata?: string;
  createdAt: string;
  updatedAt: string;
}

interface VaultState {
  mek: SecureKey | null;
  items: VaultItemDisplay[];
  loading: boolean;
  initialized: boolean;

  initializeMEK: (password: string, salt?: Uint8Array) => Promise<void>;
  clearMEK: () => void;
  loadItems: () => Promise<void>;
  createItem: (type: string, plaintext: Record<string, unknown>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

// ============================================================================
// Map frontend type → DB type (api-key → api_key)
// ============================================================================
function toDbType(frontendType: string): string {
  return frontendType === 'api-key' ? 'api_key' : frontendType;
}
function fromDbType(dbType: string): VaultItemType {
  const mapped = dbType === 'api_key' ? 'api-key' : dbType;
  return mapped as VaultItemType;
}

// ============================================================================
// Zustand Store
// ============================================================================

export const useVault = create<VaultState>()((set, get) => ({
  mek: null,
  items: [],
  loading: false,
  initialized: false,

  // ── MEK management ───────────────────────────────────────────────────────

  initializeMEK: async (password: string, salt?: Uint8Array) => {
    const derivationSalt = salt ?? generateSalt();
    const keys = await deriveMasterKeys(password, derivationSalt);
    set({ mek: keys.mek, initialized: true });
    keys.ak.clear(); // authentication key not needed client-side
  },

  clearMEK: () => {
    const { mek } = get();
    if (mek) mek.clear();
    set({ mek: null, items: [], initialized: false });
  },

  // ── Load & decrypt ───────────────────────────────────────────────────────

  loadItems: async () => {
    const { mek } = get();
    const token = useAuth.getState().token;
    if (!mek || !token) return;

    set({ loading: true });

    try {
      const res = await apiFetch('/vault/items');
      if (!res.ok) throw new Error('Falha ao carregar itens');

      const data = await res.json();
      const encryptedItems: EncryptedItemDTO[] = data.items || [];

      const decryptedItems: VaultItemDisplay[] = encryptedItems.map((dto) => {
        try {
          // Rebuild EncryptedData for data
          const encryptedData = {
            ciphertext: base64ToBytes(dto.encryptedData),
            nonce: base64ToBytes(dto.nonce),
            authTag: base64ToBytes(dto.authTag),
          };

          // Unpack wrapped key (nonce||ct||tag)
          const wrappedItemKey = unpackEncryptedKey(base64ToBytes(dto.encryptedKey));

          const decryptedBytes = decryptVaultItem(
            { encryptedData, wrappedItemKey },
            mek,
          );

          const plaintext = JSON.parse(new TextDecoder().decode(decryptedBytes));

          return {
            id: dto.id,
            type: fromDbType(dto.type),
            name:
              plaintext.name ||
              plaintext.title ||
              plaintext.product ||
              plaintext.fileName ||
              'Sem nome',
            username:
              plaintext.username ||
              plaintext.accountName ||
              plaintext.registeredEmail,
            maskedNumber: plaintext.last4
              ? `**** ${plaintext.last4}`
              : undefined,
            favorite: plaintext.favorite ?? false,
            lastUsed: dto.updatedAt,
            plaintext,
          };
        } catch {
          return {
            id: dto.id,
            type: fromDbType(dto.type),
            name: '[Erro de descriptografia]',
            favorite: false,
            lastUsed: dto.updatedAt,
          };
        }
      });

      set({ items: decryptedItems, loading: false });
    } catch (error) {
      console.error('Failed to load vault items:', error);
      set({ loading: false });
    }
  },

  // ── Create (encrypt client-side, POST to API) ───────────────────────────

  createItem: async (type: string, plaintext: Record<string, unknown>) => {
    const { mek } = get();
    const token = useAuth.getState().token;
    if (!mek || !token) throw new Error('Cofre não inicializado');

    // Serialize → encrypt
    const itemBytes = new TextEncoder().encode(JSON.stringify(plaintext));
    const encrypted = encryptVaultItem(itemBytes, mek);

    // Pack wrapped key into single blob
    const packedKey = packEncryptedKey(encrypted.wrappedItemKey);

    const payload = {
      type: toDbType(type),
      encryptedData: bytesToBase64(encrypted.encryptedData.ciphertext),
      encryptedKey: bytesToBase64(packedKey),
      nonce: bytesToBase64(encrypted.encryptedData.nonce),
      authTag: bytesToBase64(encrypted.encryptedData.authTag),
    };

    const res = await apiFetch('/vault/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Falha ao salvar item');
    }

    // Re-fetch so local list stays in sync
    await get().loadItems();
  },

  // ── Delete ───────────────────────────────────────────────────────────────

  deleteItem: async (id: string) => {
    const token = useAuth.getState().token;
    if (!token) throw new Error('Não autenticado');

    const res = await apiFetch(`/vault/items/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Falha ao deletar item');

    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },
}));
