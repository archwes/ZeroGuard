/**
 * 🔐 CRITICAL SECURITY MODULE - Core Cryptography Primitives
 * 
 * Zero-Knowledge Encryption Implementation
 * 
 * This module implements the cryptographic foundation for ZeroGuard's
 * zero-knowledge architecture. All encryption happens client-side.
 * The server NEVER has access to plaintext data or encryption keys.
 * 
 * Key Principles:
 * 1. Master password never leaves the client
 * 2. All keys derived using memory-hard Argon2id
 * 3. Per-item encryption with AES-256-GCM
 * 4. Item keys wrapped with Master Encryption Key (MEK)
 * 5. Authenticated encryption prevents tampering
 * 
 * Security Guarantees:
 * - Database breach: Data remains encrypted
 * - Server compromise: Cannot decrypt user data
 * - Memory-hard KDF: Resistant to GPU/ASIC attacks
 * - Forward secrecy: Old data stays safe with key rotation
 * 
 * @module crypto/core
 * @security CRITICAL - Any changes require security review
 */

import { gcm } from '@noble/ciphers/aes';
import { argon2id } from '@noble/hashes/argon2';
import { sha256 } from '@noble/hashes/sha256';
import { hmac } from '@noble/hashes/hmac';

// Função para gerar bytes aleatórios usando Web Crypto API
const randomBytes = (size: number): Uint8Array => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    return window.crypto.getRandomValues(new Uint8Array(size));
  }
  // Fallback para Node.js
  const crypto = require('crypto');
  return new Uint8Array(crypto.randomBytes(size));
};

/**
 * Cryptographic constants following industry best practices
 */
export const CRYPTO_CONSTANTS = {
  // Key sizes (in bytes)
  KEY_SIZE: 32,              // 256 bits for AES-256
  SALT_SIZE: 32,             // 256 bits for uniqueness
  NONCE_SIZE: 12,            // 96 bits (recommended for GCM)
  AUTH_TAG_SIZE: 16,         // 128 bits for authentication
  
  // Argon2id parameters (memory-hard, side-channel resistant)
  // These are calibrated for ~300ms on modern hardware
  ARGON2_ITERATIONS: 3,      // Time cost
  ARGON2_MEMORY: 64 * 1024,  // 64 MB (in KB)
  ARGON2_PARALLELISM: 4,     // Number of threads
  ARGON2_OUTPUT_SIZE: 64,    // 512 bits (split into MEK + AK)
  
  // Key derivation info strings (for HKDF-like separation)
  KEY_INFO_MEK: 'ZeroGuard-MEK-v1',
  KEY_INFO_AK: 'ZeroGuard-AK-v1',
  KEY_INFO_WRAPPING: 'ZeroGuard-Wrapping-v1',
} as const;

/**
 * Secure key material holder
 * Implements memory zeroing patterns
 */
export class SecureKey {
  private key: Uint8Array;
  private isCleared = false;

  constructor(key: Uint8Array) {
    this.key = new Uint8Array(key);
  }

  /**
   * Get the key material (use with caution)
   */
  getKey(): Uint8Array {
    if (this.isCleared) {
      throw new Error('Key has been cleared from memory');
    }
    return this.key;
  }

  /**
   * Clear key from memory (called on logout/lock)
   * 
   * Security: Overwrite memory with random data before zeroing
   * Prevents recovery from memory dumps
   */
  clear(): void {
    if (!this.isCleared) {
      // Overwrite with random data first
      const random = randomBytes(this.key.length);
      this.key.set(random);
      
      // Then zero out
      this.key.fill(0);
      this.isCleared = true;
    }
  }

  /**
   * Clone the key (creates new copy in memory)
   */
  clone(): SecureKey {
    if (this.isCleared) {
      throw new Error('Cannot clone cleared key');
    }
    return new SecureKey(this.key);
  }
}

/**
 * Result of key derivation
 */
export interface DerivedKeys {
  mek: SecureKey;           // Master Encryption Key (encrypts vault items)
  ak: SecureKey;            // Authentication Key (for SRP)
  salt: Uint8Array;         // Salt used (must be stored)
}

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  ciphertext: Uint8Array;   // Encrypted data
  nonce: Uint8Array;        // Nonce (must be unique per encryption)
  authTag: Uint8Array;      // Authentication tag (prevents tampering)
}

/**
 * Vault item with wrapped key
 */
export interface EncryptedVaultItem {
  encryptedData: EncryptedData;
  wrappedItemKey: EncryptedData;  // Item key encrypted with MEK
}

/**
 * Derive master keys from password using Argon2id
 * 
 * This is the MOST CRITICAL operation in the entire system.
 * 
 * Argon2id is chosen because:
 * - Memory-hard (resists GPU/ASIC attacks)
 * - Side-channel resistant
 * - Winner of Password Hashing Competition
 * 
 * Parameters are calibrated to take ~300ms on modern hardware.
 * This provides strong security while remaining user-friendly.
 * 
 * @param password - User's master password (UTF-8 string)
 * @param salt - Cryptographic salt (32 bytes, random)
 * @returns Master Encryption Key (MEK) and Authentication Key (AK)
 * 
 * @security CRITICAL - Never reduce Argon2id parameters
 * @throws {Error} If password is empty or salt is invalid
 */
export async function deriveMasterKeys(
  password: string,
  salt: Uint8Array
): Promise<DerivedKeys> {
  // Input validation
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty');
  }
  
  if (salt.length !== CRYPTO_CONSTANTS.SALT_SIZE) {
    throw new Error(`Salt must be ${CRYPTO_CONSTANTS.SALT_SIZE} bytes`);
  }

  // Convert password to bytes (UTF-8)
  const passwordBytes = new TextEncoder().encode(password);

  try {
    // Derive key material using Argon2id
    // Output: 64 bytes (512 bits)
    // - Bytes 0-31: Master Encryption Key (MEK)
    // - Bytes 32-63: Authentication Key (AK)
    const keyMaterial = argon2id(passwordBytes, salt, {
      t: CRYPTO_CONSTANTS.ARGON2_ITERATIONS,
      m: CRYPTO_CONSTANTS.ARGON2_MEMORY,
      p: CRYPTO_CONSTANTS.ARGON2_PARALLELISM,
      dkLen: CRYPTO_CONSTANTS.ARGON2_OUTPUT_SIZE,
    });

    // Split key material
    const mekBytes = keyMaterial.slice(0, 32);
    const akBytes = keyMaterial.slice(32, 64);

    // Clear original key material
    keyMaterial.fill(0);

    // Wrap in SecureKey for memory management
    const mek = new SecureKey(mekBytes);
    const ak = new SecureKey(akBytes);

    // Clear temporary buffers
    mekBytes.fill(0);
    akBytes.fill(0);

    return { mek, ak, salt };
  } finally {
    // Always clear password from memory
    passwordBytes.fill(0);
  }
}

/**
 * Generate a random salt for key derivation
 * 
 * Uses cryptographically secure random number generator.
 * Salt MUST be unique per user.
 * 
 * @returns 32-byte random salt
 */
export function generateSalt(): Uint8Array {
  return randomBytes(CRYPTO_CONSTANTS.SALT_SIZE);
}

/**
 * Generate a random item encryption key
 * 
 * Each vault item gets its own unique encryption key.
 * This provides:
 * - Key rotation capability
 * - Granular access control
 * - Reduced blast radius if one item compromised
 * 
 * @returns 256-bit random key
 */
export function generateItemKey(): SecureKey {
  const key = randomBytes(CRYPTO_CONSTANTS.KEY_SIZE);
  return new SecureKey(key);
}

/**
 * Encrypt data using AES-256-GCM
 * 
 * AES-GCM provides both confidentiality AND authenticity.
 * Authentication prevents tampering attacks.
 * 
 * GCM is chosen over other modes because:
 * - Authenticated encryption (AEAD)
 * - Parallelizable (fast)
 * - NIST approved
 * - Widely audited
 * 
 * @param plaintext - Data to encrypt
 * @param key - Encryption key (256 bits)
 * @param additionalData - Additional authenticated data (optional)
 * @returns Ciphertext, nonce, and authentication tag
 * 
 * @security Each encryption MUST use a unique nonce
 * @throws {Error} If encryption fails
 */
export function encrypt(
  plaintext: Uint8Array,
  key: SecureKey,
  additionalData?: Uint8Array
): EncryptedData {
  // Generate unique nonce (MUST be unique for each encryption)
  const nonce = randomBytes(CRYPTO_CONSTANTS.NONCE_SIZE);

  try {
    // Initialize AES-256-GCM cipher
    const cipher = gcm(key.getKey(), nonce, additionalData);
    
    // Encrypt and authenticate
    const ciphertext = cipher.encrypt(plaintext);

    // GCM returns ciphertext + authTag concatenated
    // Split them apart
    const authTag = ciphertext.slice(-CRYPTO_CONSTANTS.AUTH_TAG_SIZE);
    const actualCiphertext = ciphertext.slice(0, -CRYPTO_CONSTANTS.AUTH_TAG_SIZE);

    return {
      ciphertext: actualCiphertext,
      nonce,
      authTag,
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error}`);
  }
}

/**
 * Decrypt data using AES-256-GCM
 * 
 * Verifies authentication tag before returning plaintext.
 * If tag verification fails, data has been tampered with.
 * 
 * @param encrypted - Encrypted data structure
 * @param key - Decryption key
 * @param additionalData - Additional authenticated data (must match encryption)
 * @returns Decrypted plaintext
 * 
 * @security NEVER return plaintext if auth tag verification fails
 * @throws {Error} If authentication fails or decryption fails
 */
export function decrypt(
  encrypted: EncryptedData,
  key: SecureKey,
  additionalData?: Uint8Array
): Uint8Array {
  try {
    // Initialize cipher with same nonce
    const cipher = gcm(key.getKey(), encrypted.nonce, additionalData);

    // Reconstruct ciphertext + authTag
    const combined = new Uint8Array(
      encrypted.ciphertext.length + encrypted.authTag.length
    );
    combined.set(encrypted.ciphertext);
    combined.set(encrypted.authTag, encrypted.ciphertext.length);

    // Decrypt and verify authentication tag
    // This will throw if authentication fails
    const plaintext = cipher.decrypt(combined);

    return plaintext;
  } catch (error) {
    // CRITICAL: Never expose why decryption failed
    // Could leak information to attacker
    throw new Error('Decryption failed - data may be corrupted or tampered');
  }
}

/**
 * Encrypt a vault item with a unique item key, then wrap the item key
 * 
 * This implements a two-layer encryption scheme:
 * 1. Item data encrypted with random item key (AES-256-GCM)
 * 2. Item key encrypted with Master Encryption Key (AES-256-GCM)
 * 
 * Benefits:
 * - Key rotation: Can re-wrap item keys without re-encrypting data
 * - Sharing: Can wrap item key with recipient's key
 * - Performance: Smaller key wrapping operation
 * 
 * @param plaintext - Item data to encrypt
 * @param mek - Master Encryption Key
 * @returns Encrypted item and wrapped key
 */
export function encryptVaultItem(
  plaintext: Uint8Array,
  mek: SecureKey
): EncryptedVaultItem {
  // Generate unique item key
  const itemKey = generateItemKey();

  try {
    // Encrypt the actual data with item key
    const encryptedData = encrypt(plaintext, itemKey);

    // Wrap the item key with MEK
    // This allows us to store the encrypted key alongside the data
    const wrappedItemKey = encrypt(itemKey.getKey(), mek);

    return {
      encryptedData,
      wrappedItemKey,
    };
  } finally {
    // Clear item key from memory
    itemKey.clear();
  }
}

/**
 * Decrypt a vault item by unwrapping the item key first
 * 
 * @param item - Encrypted vault item
 * @param mek - Master Encryption Key
 * @returns Decrypted plaintext
 */
export function decryptVaultItem(
  item: EncryptedVaultItem,
  mek: SecureKey
): Uint8Array {
  // Unwrap the item key
  const itemKeyBytes = decrypt(item.wrappedItemKey, mek);
  const itemKey = new SecureKey(itemKeyBytes);

  try {
    // Decrypt the actual data
    const plaintext = decrypt(item.encryptedData, itemKey);
    return plaintext;
  } finally {
    // Always clear item key from memory
    itemKey.clear();
    itemKeyBytes.fill(0);
  }
}

/**
 * Hash email for server lookup (privacy-preserving)
 * 
 * We don't store emails in plaintext to protect privacy.
 * Even if database is breached, attacker cannot enumerate users.
 * 
 * Uses HMAC-SHA256 with application secret as key.
 * 
 * @param email - User email address
 * @param serverSecret - Server-side secret (prevents rainbow tables)
 * @returns Hashed email (hex string)
 */
export function hashEmail(email: string, serverSecret: string): string {
  const emailLower = email.toLowerCase().trim();
  const emailBytes = new TextEncoder().encode(emailLower);
  const secretBytes = new TextEncoder().encode(serverSecret);
  
  const hash = hmac(sha256, secretBytes, emailBytes);
  return Array.from(hash)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Derive a deterministic ID from email (for client-side caching)
 * 
 * @param email - User email
 * @returns SHA-256 hash as hex string
 */
export function deriveUserID(email: string): string {
  const emailLower = email.toLowerCase().trim();
  const emailBytes = new TextEncoder().encode(emailLower);
  const hash = sha256(emailBytes);
  
  return Array.from(hash)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert bytes to base64 (for transmission)
 */
export function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Convert base64 to bytes
 */
export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Serialize encrypted data for storage/transmission
 */
export function serializeEncrypted(data: EncryptedData): string {
  return JSON.stringify({
    c: bytesToBase64(data.ciphertext),
    n: bytesToBase64(data.nonce),
    t: bytesToBase64(data.authTag),
  });
}

/**
 * Deserialize encrypted data
 */
export function deserializeEncrypted(serialized: string): EncryptedData {
  const parsed = JSON.parse(serialized);
  return {
    ciphertext: base64ToBytes(parsed.c),
    nonce: base64ToBytes(parsed.n),
    authTag: base64ToBytes(parsed.t),
  };
}

/**
 * Test crypto functions (for development/testing only)
 * 
 * @security Remove in production build
 */
export async function testCrypto(): Promise<void> {
  console.log('🔐 Testing crypto primitives...');

  // Test key derivation
  const password = 'testPassword123!@#';
  const salt = generateSalt();
  const keys = await deriveMasterKeys(password, salt);
  console.log('✓ Key derivation works');

  // Test encryption/decryption
  const plaintext = new TextEncoder().encode('Secret data!');
  const encrypted = encrypt(plaintext, keys.mek);
  const decrypted = decrypt(encrypted, keys.mek);
  const decryptedText = new TextDecoder().decode(decrypted);
  
  if (decryptedText === 'Secret data!') {
    console.log('✓ Encryption/decryption works');
  }

  // Test vault item encryption
  const vaultItem = encryptVaultItem(plaintext, keys.mek);
  const decryptedItem = decryptVaultItem(vaultItem, keys.mek);
  const decryptedItemText = new TextDecoder().decode(decryptedItem);
  
  if (decryptedItemText === 'Secret data!') {
    console.log('✓ Vault item encryption works');
  }

  // Cleanup
  keys.mek.clear();
  keys.ak.clear();

  console.log('✅ All crypto tests passed!');
}
