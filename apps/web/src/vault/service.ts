/**
 * 🔐 Vault Service - Client-Side Vault Operations
 * 
 * Handles encryption, decryption, and management of vault items.
 * All cryptographic operations happen here before data leaves the client.
 * 
 * @module vault/service
 */

import {
  SecureKey,
  encryptVaultItem,
  decryptVaultItem,
  bytesToBase64,
  base64ToBytes,
  serializeEncrypted,
  deserializeEncrypted,
  type EncryptedVaultItem,
} from '../crypto/core';

import type {
  VaultItem,
  EncryptedVaultItemDTO,
  VaultItemMetadata,
} from './types';

/**
 * Vault service class
 * 
 * Manages vault items with client-side encryption.
 * Never exposes plaintext to network or storage.
 */
export class VaultService {
  private mek: SecureKey;

  constructor(masterEncryptionKey: SecureKey) {
    this.mek = masterEncryptionKey;
  }

  /**
   * Encrypt a vault item for storage
   * 
   * Process:
   * 1. Serialize item to JSON
   * 2. Generate random item key
   * 3. Encrypt item with item key (AES-256-GCM)
   * 4. Wrap item key with MEK
   * 5. Encrypt metadata separately
   * 
   * @param item - Plaintext vault item
   * @returns Encrypted item ready for transmission
   */
  encryptItem(item: VaultItem): EncryptedVaultItemDTO {
    // Extract metadata (for client-side search/filtering)
    const metadata: VaultItemMetadata = {
      name: this.extractName(item),
      favorite: item.favorite,
      tags: item.tags,
      folderId: undefined, // TODO: Add folder support
    };

    // Add type-specific metadata
    if (item.type === 'password') {
      metadata.username = item.username;
      metadata.url = item.url;
    } else if (item.type === 'card') {
      metadata.last4 = item.last4;
    }

    // Serialize item to JSON
    const itemJSON = JSON.stringify(item);
    const itemBytes = new TextEncoder().encode(itemJSON);

    // Encrypt item
    const encrypted = encryptVaultItem(itemBytes, this.mek);

    // Serialize metadata
    const metadataJSON = JSON.stringify(metadata);
    const metadataBytes = new TextEncoder().encode(metadataJSON);

    // Encrypt metadata
    const encryptedMetadata = encryptVaultItem(metadataBytes, this.mek);

    // Build DTO
    return {
      id: item.id,
      userId: item.userId,
      type: item.type,
      encryptedData: bytesToBase64(encrypted.encryptedData.ciphertext),
      encryptedKey: bytesToBase64(encrypted.wrappedItemKey.ciphertext),
      nonce: bytesToBase64(encrypted.encryptedData.nonce),
      authTag: bytesToBase64(encrypted.encryptedData.authTag),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      encryptedMetadata: serializeEncrypted(encryptedMetadata.encryptedData),
    };
  }

  /**
   * Decrypt a vault item from storage
   * 
   * @param dto - Encrypted vault item from server
   * @returns Decrypted vault item
   * @throws {Error} If decryption fails (corrupted data or wrong key)
   */
  decryptItem(dto: EncryptedVaultItemDTO): VaultItem {
    // Reconstruct encrypted structure
    const encrypted: EncryptedVaultItem = {
      encryptedData: {
        ciphertext: base64ToBytes(dto.encryptedData),
        nonce: base64ToBytes(dto.nonce),
        authTag: base64ToBytes(dto.authTag),
      },
      wrappedItemKey: {
        ciphertext: base64ToBytes(dto.encryptedKey),
        nonce: base64ToBytes(dto.nonce),
        authTag: base64ToBytes(dto.authTag),
      },
    };

    // Decrypt item
    const decryptedBytes = decryptVaultItem(encrypted, this.mek);

    // Parse JSON
    const itemJSON = new TextDecoder().decode(decryptedBytes);
    const item = JSON.parse(itemJSON) as VaultItem;

    // Convert date strings back to Date objects
    item.createdAt = new Date(item.createdAt);
    item.updatedAt = new Date(item.updatedAt);

    return item;
  }

  /**
   * Decrypt only metadata (for search/filtering without full decryption)
   * 
   * @param dto - Encrypted vault item
   * @returns Decrypted metadata
   */
  decryptMetadata(dto: EncryptedVaultItemDTO): VaultItemMetadata {
    if (!dto.encryptedMetadata) {
      // Fallback: decrypt full item
      const item = this.decryptItem(dto);
      return {
        name: this.extractName(item),
        favorite: item.favorite,
        tags: item.tags,
      };
    }

    // Reconstruct encrypted metadata
    const encryptedMetadata = deserializeEncrypted(dto.encryptedMetadata);
    
    const encrypted: EncryptedVaultItem = {
      encryptedData: encryptedMetadata,
      wrappedItemKey: {
        ciphertext: base64ToBytes(dto.encryptedKey),
        nonce: base64ToBytes(dto.nonce),
        authTag: base64ToBytes(dto.authTag),
      },
    };

    // Decrypt metadata
    const decryptedBytes = decryptVaultItem(encrypted, this.mek);
    const metadataJSON = new TextDecoder().decode(decryptedBytes);
    
    return JSON.parse(metadataJSON);
  }

  /**
   * Extract display name from vault item
   */
  private extractName(item: VaultItem): string {
    switch (item.type) {
      case 'password':
        return item.name;
      case 'card':
        return item.nickname || `${item.brand} ${item.last4}`;
      case 'note':
        return item.title;
      case 'identity':
        return `${item.firstName} ${item.lastName} - ${item.documentType}`;
      case 'file':
        return item.fileName;
      case 'totp':
        return `${item.issuer} - ${item.accountName}`;
      case 'api_key':
        return item.name;
      case 'license':
        return item.product;
      default:
        return 'Unknown Item';
    }
  }

  /**
   * Batch decrypt items (more efficient)
   * 
   * @param dtos - Array of encrypted items
   * @returns Array of decrypted items
   */
  decryptItems(dtos: EncryptedVaultItemDTO[]): VaultItem[] {
    return dtos.map(dto => this.decryptItem(dto));
  }

  /**
   * Change master password (re-encrypt all item keys)
   * 
   * When user changes master password, we need to:
   * 1. Derive new MEK from new password
   * 2. Re-wrap all item keys with new MEK
   * 3. Item data itself doesn't need re-encryption
   * 
   * This is why we use key wrapping!
   * 
   * @param newMEK - New master encryption key
   * @param items - All user's encrypted items
   * @returns Updated encrypted items with re-wrapped keys
   */
  reEncryptItemKeys(
    newMEK: SecureKey,
    items: EncryptedVaultItemDTO[]
  ): EncryptedVaultItemDTO[] {
    return items.map(dto => {
      // Decrypt item with old MEK
      const item = this.decryptItem(dto);

      // Create new vault service with new MEK
      const newService = new VaultService(newMEK);

      // Re-encrypt with new MEK
      return newService.encryptItem(item);
    });
  }

  /**
   * Export vault (encrypted backup)
   * 
   * Creates an encrypted export file that can be imported later.
   * Uses same encryption scheme as vault items.
   * 
   * @param items - All vault items to export
   * @returns Encrypted backup blob
   */
  exportVault(items: VaultItem[]): Blob {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      items: items.map(item => this.encryptItem(item)),
    };

    const json = JSON.stringify(exportData, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  /**
   * Import vault from backup
   * 
   * @param blob - Encrypted backup file
   * @returns Decrypted vault items
   */
  async importVault(blob: Blob): Promise<VaultItem[]> {
    const text = await blob.text();
    const exportData = JSON.parse(text);

    if (exportData.version !== 1) {
      throw new Error('Unsupported export format version');
    }

    return this.decryptItems(exportData.items);
  }

  /**
   * Clear vault service (logout)
   * 
   * Zeroes out MEK from memory.
   * After this, vault service is unusable.
   */
  clear(): void {
    this.mek.clear();
  }
}

/**
 * Password security analyzer
 * 
 * Analyzes vault for security issues:
 * - Weak passwords
 * - Reused passwords
 * - Old passwords
 * - Compromised passwords
 */
export class VaultSecurityAnalyzer {
  /**
   * Analyze password security
   * 
   * @param items - All vault items
   * @returns Security analysis results
   */
  analyzePasswordSecurity(items: VaultItem[]): {
    weak: VaultItem[];
    reused: VaultItem[];
    old: VaultItem[];
    compromised: VaultItem[];
  } {
    const passwordItems = items.filter(
      (item): item is Extract<VaultItem, { type: 'password' }> =>
        item.type === 'password'
    );

    // Find weak passwords
    const weak = passwordItems.filter(item => {
      return (item.passwordStrength ?? 0) < 3; // Less than "strong"
    });

    // Find reused passwords
    const passwordMap = new Map<string, VaultItem[]>();
    passwordItems.forEach(item => {
      const existing = passwordMap.get(item.password) || [];
      existing.push(item);
      passwordMap.set(item.password, existing);
    });

    const reused = passwordItems.filter(item => {
      const duplicates = passwordMap.get(item.password) || [];
      return duplicates.length > 1;
    });

    // Find old passwords (90+ days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const old = passwordItems.filter(item => {
      const lastChanged = item.passwordChanged || item.updatedAt;
      return lastChanged < ninetyDaysAgo;
    });

    // Find compromised passwords
    const compromised = passwordItems.filter(item => item.compromised);

    return { weak, reused, old, compromised };
  }

  /**
   * Calculate security score (0-100)
   * 
   * @param items - All vault items
   * @returns Security score
   */
  calculateSecurityScore(items: VaultItem[]): number {
    const analysis = this.analyzePasswordSecurity(items);
    const passwordCount = items.filter(i => i.type === 'password').length;

    if (passwordCount === 0) return 100;

    const weakPenalty = (analysis.weak.length / passwordCount) * 30;
    const reusedPenalty = (analysis.reused.length / passwordCount) * 40;
    const oldPenalty = (analysis.old.length / passwordCount) * 20;
    const compromisedPenalty = (analysis.compromised.length / passwordCount) * 50;

    const totalPenalty = Math.min(
      100,
      weakPenalty + reusedPenalty + oldPenalty + compromisedPenalty
    );

    return Math.max(0, 100 - totalPenalty);
  }
}
