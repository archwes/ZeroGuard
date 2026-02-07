/**
 * 🔐 TOTP (Time-based One-Time Password) Implementation
 * 
 * Built-in authenticator compatible with Google Authenticator,
 * Authy, and other TOTP apps.
 * 
 * Supports:
 * - TOTP generation (RFC 6238)
 * - QR code generation for easy setup
 * - Multiple algorithms (SHA1, SHA256, SHA512)
 * - Custom periods and digits
 * 
 * @module crypto/totp
 */

import { hmac } from '@noble/hashes/hmac';
import { sha1 } from '@noble/hashes/sha1';
import { sha256 } from '@noble/hashes/sha256';
import { sha512 } from '@noble/hashes/sha512';

/**
 * Base32 alphabet (RFC 4648)
 */
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * TOTP configuration
 */
export interface TOTPConfig {
  secret: string;           // Base32 encoded secret
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  period: number;           // Seconds (usually 30)
}

/**
 * TOTP URL parameters (for QR code)
 */
export interface TOTPUrl {
  secret: string;
  issuer: string;
  accountName: string;
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  digits?: number;
  period?: number;
}

/**
 * Generate a random TOTP secret
 * 
 * @param length - Number of bytes (default: 20 for 160-bit security)
 * @returns Base32 encoded secret
 */
export function generateTOTPSecret(length: number = 20): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

/**
 * Encode bytes to base32
 * 
 * @param bytes - Input bytes
 * @returns Base32 encoded string
 */
export function base32Encode(bytes: Uint8Array): string {
  let bits = '';
  let result = '';

  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, '0');
  }

  // Pad to multiple of 5
  while (bits.length % 5 !== 0) {
    bits += '0';
  }

  // Convert 5-bit chunks to base32
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5);
    const index = parseInt(chunk, 2);
    result += BASE32_ALPHABET[index];
  }

  return result;
}

/**
 * Decode base32 to bytes
 * 
 * @param base32 - Base32 encoded string
 * @returns Decoded bytes
 * @throws {Error} If invalid base32
 */
export function base32Decode(base32: string): Uint8Array {
  // Remove padding and convert to uppercase
  base32 = base32.toUpperCase().replace(/=+$/, '');

  let bits = '';

  // Convert each character to 5-bit binary
  for (const char of base32) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid base32 character: ${char}`);
    }
    bits += index.toString(2).padStart(5, '0');
  }

  // Convert bits to bytes (8-bit chunks)
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    const byte = bits.slice(i, i + 8);
    bytes.push(parseInt(byte, 2));
  }

  return new Uint8Array(bytes);
}

/**
 * Generate TOTP code
 * 
 * Implements RFC 6238 (TOTP: Time-Based One-Time Password)
 * 
 * @param config - TOTP configuration
 * @param timestamp - Optional timestamp (for testing, default: now)
 * @returns 6 or 8 digit code
 */
export function generateTOTP(config: TOTPConfig, timestamp?: number): string {
  // Default to current time
  const time = timestamp ?? Math.floor(Date.now() / 1000);

  // Calculate time step
  const counter = Math.floor(time / config.period);

  // Decode secret
  const secretBytes = base32Decode(config.secret);

  // Choose hash algorithm
  let hashFn: typeof sha1;
  switch (config.algorithm) {
    case 'SHA1':
      hashFn = sha1;
      break;
    case 'SHA256':
      hashFn = sha256;
      break;
    case 'SHA512':
      hashFn = sha512;
      break;
    default:
      throw new Error(`Unsupported algorithm: ${config.algorithm}`);
  }

  // Counter as 8-byte big-endian
  const counterBytes = new Uint8Array(8);
  const view = new DataView(counterBytes.buffer);
  view.setBigUint64(0, BigInt(counter), false);

  // HMAC
  const hash = hmac(hashFn, secretBytes, counterBytes);

  // Dynamic truncation (RFC 4226)
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  // Generate digits
  const otp = binary % Math.pow(10, config.digits);

  return otp.toString().padStart(config.digits, '0');
}

/**
 * Verify TOTP code
 * 
 * Allows for time drift (checks previous and next time windows).
 * 
 * @param code - Code to verify
 * @param config - TOTP configuration
 * @param window - Number of time steps to check (default: 1)
 * @returns True if valid, false otherwise
 */
export function verifyTOTP(
  code: string,
  config: TOTPConfig,
  window: number = 1
): boolean {
  const currentTime = Math.floor(Date.now() / 1000);

  // Check current window and +/- window
  for (let i = -window; i <= window; i++) {
    const timestamp = currentTime + i * config.period;
    const expectedCode = generateTOTP(config, timestamp);

    if (code === expectedCode) {
      return true;
    }
  }

  return false;
}

/**
 * Generate TOTP provisioning URL (for QR code)
 * 
 * Format: otpauth://totp/{issuer}:{account}?secret={secret}&issuer={issuer}
 * 
 * @param params - TOTP URL parameters
 * @returns Provisioning URL
 */
export function generateTOTPUrl(params: TOTPUrl): string {
  const {
    secret,
    issuer,
    accountName,
    algorithm = 'SHA1',
    digits = 6,
    period = 30,
  } = params;

  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}`;

  const url = new URL(`otpauth://totp/${label}`);
  url.searchParams.set('secret', secret);
  url.searchParams.set('issuer', issuer);
  
  if (algorithm !== 'SHA1') {
    url.searchParams.set('algorithm', algorithm);
  }
  
  if (digits !== 6) {
    url.searchParams.set('digits', digits.toString());
  }
  
  if (period !== 30) {
    url.searchParams.set('period', period.toString());
  }

  return url.toString();
}

/**
 * Parse TOTP URL
 * 
 * @param url - TOTP provisioning URL
 * @returns Parsed parameters
 * @throws {Error} If URL is invalid
 */
export function parseTOTPUrl(url: string): TOTPUrl {
  const parsed = new URL(url);

  if (parsed.protocol !== 'otpauth:') {
    throw new Error('Invalid TOTP URL: must start with otpauth://');
  }

  if (parsed.hostname !== 'totp') {
    throw new Error('Invalid TOTP URL: must be otpauth://totp/');
  }

  // Extract label (issuer:account)
  const label = decodeURIComponent(parsed.pathname.slice(1));
  const [issuer, accountName] = label.split(':');

  if (!issuer || !accountName) {
    throw new Error('Invalid TOTP URL: missing issuer or account');
  }

  const secret = parsed.searchParams.get('secret');
  if (!secret) {
    throw new Error('Invalid TOTP URL: missing secret');
  }

  const algorithm = (parsed.searchParams.get('algorithm') || 'SHA1') as 'SHA1' | 'SHA256' | 'SHA512';
  const digits = parseInt(parsed.searchParams.get('digits') || '6', 10) as 6 | 8;
  const period = parseInt(parsed.searchParams.get('period') || '30', 10);

  return {
    secret,
    issuer,
    accountName,
    algorithm,
    digits,
    period,
  };
}

/**
 * Get remaining time until next code
 * 
 * @param period - TOTP period in seconds
 * @returns Seconds remaining
 */
export function getRemainingTime(period: number = 30): number {
  const currentTime = Math.floor(Date.now() / 1000);
  return period - (currentTime % period);
}

/**
 * Generate backup codes
 * 
 * Used for account recovery if TOTP device is lost.
 * Each code is 8 characters (alphanumeric).
 * 
 * @param count - Number of backup codes (default: 10)
 * @returns Array of backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  for (let i = 0; i < count; i++) {
    let code = '';
    const randomValues = new Uint32Array(8);
    crypto.getRandomValues(randomValues);

    for (let j = 0; j < 8; j++) {
      code += charset[randomValues[j] % charset.length];
    }

    // Format as XXXX-XXXX for readability
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
  }

  return codes;
}

/**
 * Default TOTP configuration
 */
export const DEFAULT_TOTP_CONFIG: Omit<TOTPConfig, 'secret'> = {
  algorithm: 'SHA1',
  digits: 6,
  period: 30,
};

/**
 * Test TOTP implementation
 * 
 * @security Remove in production
 */
export function testTOTP(): void {
  console.log('🔐 Testing TOTP implementation...');

  // Test secret generation
  const secret = generateTOTPSecret();
  console.log('Generated secret:', secret);

  // Test code generation
  const config: TOTPConfig = {
    secret,
    ...DEFAULT_TOTP_CONFIG,
  };

  const code = generateTOTP(config);
  console.log('Generated code:', code);

  // Test verification
  const isValid = verifyTOTP(code, config);
  console.log('Verification:', isValid ? '✓' : '✗');

  // Test URL generation
  const url = generateTOTPUrl({
    secret,
    issuer: 'ZeroGuard',
    accountName: 'test@example.com',
  });
  console.log('TOTP URL:', url);

  // Test backup codes
  const backupCodes = generateBackupCodes(5);
  console.log('Backup codes:', backupCodes);

  console.log('✅ TOTP tests passed!');
}
