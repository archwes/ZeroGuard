/**
 * 🔐 Tipos e Esquemas de Itens do Cofre
 * 
 * Definições com segurança de tipo para todos os tipos de itens do cofre:
 * - Senhas (credenciais)
 * - Cartões de pagamento
 * - Notas seguras
 * - Documentos de identidade
 * - Arquivos
 * - Segredos TOTP
 * - Chaves de API
 * 
 * Todos os itens são criptografados antes do armazenamento.
 * Estes tipos representam a estrutura em TEXTO CLARO antes da criptografia.
 * 
 * @module vault/types
 */

/**
 * Interface base de item do cofre
 */
export interface BaseVaultItem {
  id: string;                    // UUID
  userId: string;                // Proprietário
  createdAt: Date;
  updatedAt: Date;
  favorite: boolean;
  tags: string[];
  notes?: string;                // Notas adicionais
  customFields?: CustomField[];  // Campos definidos pelo usuário
}

/**
 * Definição de campo personalizado
 */
export interface CustomField {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'password' | 'email' | 'url' | 'tel';
  hidden: boolean;  // Valor deve ser mascarado?
}

/**
 * Pasta/Categoria para organização
 */
export interface VaultFolder {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  userId: string;
  parentId?: string;  // For nested folders
}

// ============================================================================
// PASSWORD VAULT ITEM
// ============================================================================

/**
 * Password credential item
 * 
 * Used for website logins, app credentials, etc.
 * Most common vault item type.
 */
export interface PasswordVaultItem extends BaseVaultItem {
  type: 'password';
  name: string;                  // E.g., "GitHub Account"
  username?: string;             // Email or username
  password: string;              // The actual password
  url?: string;                  // Website URL
  totp?: string;                 // TOTP secret (if using built-in 2FA)
  
  // Auto-fill metadata
  autoFillEnabled: boolean;
  urlMatch: 'exact' | 'host' | 'startsWith';
  
  // Security
  passwordStrength?: number;     // Cached strength score
  passwordChanged?: Date;        // Last password change
  compromised: boolean;          // Found in breach database
  
  // Additional fields
  securityQuestions?: SecurityQuestion[];
}

export interface SecurityQuestion {
  question: string;
  answer: string;  // Also encrypted
}

// ============================================================================
// PAYMENT CARD VAULT ITEM
// ============================================================================

/**
 * Payment card (credit/debit)
 * 
 * PCI DSS considerations:
 * - Full card number encrypted
 * - CVV never stored long-term (enter when needed)
 * - Masked display (show last 4 digits only)
 */
export interface CardVaultItem extends BaseVaultItem {
  type: 'card';
  cardholderName: string;
  cardNumber: string;            // Full number (encrypted)
  last4: string;                 // Last 4 digits (for display, stored separately)
  expiryMonth: string;           // MM
  expiryYear: string;            // YYYY
  cvv?: string;                  // Security code (optional, temporary)
  pin?: string;                  // PIN (optional)
  
  cardType: 'credit' | 'debit' | 'prepaid';
  brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';
  
  billingAddress?: Address;
  
  // Metadata
  nickname?: string;             // E.g., "Travel Card"
  color?: string;                // For visual identification
}

export interface Address {
  street: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

// ============================================================================
// SECURE NOTE VAULT ITEM
// ============================================================================

/**
 * Encrypted note
 * 
 * For storing sensitive information that doesn't fit other categories:
 * - Server passwords
 * - WiFi credentials
 * - Safe combinations
 * - Recovery codes
 */
export interface NoteVaultItem extends BaseVaultItem {
  type: 'note';
  title: string;
  content: string;               // Markdown supported
  
  // Organization
  category?: 'personal' | 'work' | 'server' | 'network' | 'other';
  pinned: boolean;
}

// ============================================================================
// IDENTITY VAULT ITEM
// ============================================================================

/**
 * Identity document (passport, driver's license, SSN, etc.)
 * 
 * For storing government IDs and personal information.
 * Useful for form auto-fill and identity verification.
 */
export interface IdentityVaultItem extends BaseVaultItem {
  type: 'identity';
  documentType: 'passport' | 'drivers_license' | 'national_id' | 'ssn' | 'other';
  
  // Personal information
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;           // ISO date
  nationality?: string;
  
  // Document details
  documentNumber: string;
  issuingCountry: string;
  issuingAuthority?: string;
  issueDate?: string;
  expiryDate?: string;
  
  // Additional
  address?: Address;
  phone?: string;
  email?: string;
  
  // Document scan (encrypted file reference)
  attachmentId?: string;
}

// ============================================================================
// FILE VAULT ITEM
// ============================================================================

/**
 * Encrypted file storage
 * 
 * Files are encrypted client-side before upload.
 * Metadata is also encrypted (filename, size, etc.).
 */
export interface FileVaultItem extends BaseVaultItem {
  type: 'file';
  fileName: string;
  fileSize: number;              // Bytes
  mimeType: string;
  
  // Encrypted file reference
  storageKey: string;            // Server storage identifier
  
  // Metadata (for display)
  thumbnail?: string;            // Base64 thumbnail (for images)
  
  // Organization
  category?: 'document' | 'image' | 'backup' | 'other';
}

// ============================================================================
// TOTP AUTHENTICATOR ITEM
// ============================================================================

/**
 * TOTP (Time-based One-Time Password) secret
 * 
 * Built-in authenticator like Google Authenticator.
 * Generates 6-digit codes for 2FA.
 */
export interface TOTPVaultItem extends BaseVaultItem {
  type: 'totp';
  issuer: string;                // E.g., "GitHub"
  accountName: string;           // E.g., "user@example.com"
  secret: string;                // Base32 encoded secret
  
  // TOTP parameters
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  period: number;                // Seconds (usually 30)
  
  // Additional
  iconUrl?: string;
  website?: string;
}

// ============================================================================
// API KEY VAULT ITEM
// ============================================================================

/**
 * API key storage
 * 
 * For storing API keys, tokens, and other programmatic credentials.
 */
export interface APIKeyVaultItem extends BaseVaultItem {
  type: 'api_key';
  name: string;                  // E.g., "AWS Access Key"
  service: string;               // E.g., "AWS", "Stripe", "GitHub"
  
  apiKey: string;                // The actual key/token
  apiSecret?: string;            // Secret (if applicable)
  
  // Metadata
  environment: 'production' | 'staging' | 'development';
  permissions?: string[];        // Scope/permissions
  expiresAt?: Date;
  lastUsed?: Date;
}

// ============================================================================
// LICENSE KEY VAULT ITEM
// ============================================================================

/**
 * Software license storage
 */
export interface LicenseVaultItem extends BaseVaultItem {
  type: 'license';
  product: string;               // Software name
  licenseKey: string;
  
  registeredTo?: string;
  registeredEmail?: string;
  
  purchaseDate?: Date;
  expiryDate?: Date;
  
  version?: string;
  seats?: number;                // Number of licenses
  
  vendor?: string;
  website?: string;
  supportUrl?: string;
}

// ============================================================================
// UNION TYPE & TYPE GUARDS
// ============================================================================

/**
 * Union of all vault item types
 */
export type VaultItem =
  | PasswordVaultItem
  | CardVaultItem
  | NoteVaultItem
  | IdentityVaultItem
  | FileVaultItem
  | TOTPVaultItem
  | APIKeyVaultItem
  | LicenseVaultItem;

/**
 * Type guards for vault items
 */
export function isPasswordItem(item: VaultItem): item is PasswordVaultItem {
  return item.type === 'password';
}

export function isCardItem(item: VaultItem): item is CardVaultItem {
  return item.type === 'card';
}

export function isNoteItem(item: VaultItem): item is NoteVaultItem {
  return item.type === 'note';
}

export function isIdentityItem(item: VaultItem): item is IdentityVaultItem {
  return item.type === 'identity';
}

export function isFileItem(item: VaultItem): item is FileVaultItem {
  return item.type === 'file';
}

export function isTOTPItem(item: VaultItem): item is TOTPVaultItem {
  return item.type === 'totp';
}

export function isAPIKeyItem(item: VaultItem): item is APIKeyVaultItem {
  return item.type === 'api_key';
}

export function isLicenseItem(item: VaultItem): item is LicenseVaultItem {
  return item.type === 'license';
}

// ============================================================================
// ENCRYPTED VAULT ITEM (Wire Format)
// ============================================================================

/**
 * Encrypted representation sent to server
 * 
 * This is what actually gets stored in the database.
 * No plaintext data is ever transmitted or stored.
 */
export interface EncryptedVaultItemDTO {
  id: string;
  userId: string;
  type: VaultItem['type'];
  
  // Encrypted payloads
  encryptedData: string;         // Base64 encoded encrypted item
  encryptedKey: string;          // Base64 encoded wrapped item key
  nonce: string;                 // Base64 encoded nonce
  authTag: string;               // Base64 encoded auth tag
  
  // Metadata (minimal, non-sensitive)
  createdAt: string;             // ISO date
  updatedAt: string;             // ISO date
  
  // Encrypted metadata (for search/organization)
  encryptedMetadata?: string;    // Contains: name, tags, favorite, etc.
}

/**
 * Searchable metadata (encrypted separately)
 * 
 * Allows client to filter/search without decrypting all items.
 */
export interface VaultItemMetadata {
  name: string;                  // Display name
  favorite: boolean;
  tags: string[];
  folderId?: string;
  
  // Type-specific preview data
  last4?: string;                // For cards
  username?: string;             // For passwords
  url?: string;                  // For passwords
}

// ============================================================================
// VAULT STATISTICS
// ============================================================================

/**
 * Vault security statistics
 */
export interface VaultStats {
  totalItems: number;
  
  // By type
  passwordCount: number;
  cardCount: number;
  noteCount: number;
  identityCount: number;
  fileCount: number;
  totpCount: number;
  
  // Security metrics
  weakPasswords: number;
  reusedPasswords: number;
  oldPasswords: number;          // Not changed in 90+ days
  compromisedPasswords: number;  // Found in breaches
  
  // Storage
  totalStorageUsed: number;      // Bytes
  storageLimit: number;          // Bytes
}

// ============================================================================
// SHARING & COLLABORATION
// ============================================================================

/**
 * Shared vault item
 * 
 * Future feature: Share items with other users.
 * Uses public key cryptography to wrap item keys.
 */
export interface SharedVaultItem {
  itemId: string;
  ownerId: string;
  sharedWithUserId: string;
  
  // Item key wrapped with recipient's public key
  wrappedKeyForRecipient: string;
  
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canShare: boolean;
  };
  
  sharedAt: Date;
  expiresAt?: Date;
}

// ============================================================================
// EMERGENCY ACCESS
// ============================================================================

/**
 * Emergency access / Dead man's switch
 * 
 * Allow trusted contact to access vault after waiting period.
 */
export interface EmergencyContact {
  id: string;
  userId: string;
  contactEmail: string;
  waitingPeriodDays: number;     // Default: 30 days
  
  status: 'pending' | 'active' | 'requested' | 'granted' | 'expired';
  
  // Recovery key wrapped with contact's key
  wrappedRecoveryKey?: string;
  
  requestedAt?: Date;
  grantedAt?: Date;
  
  // User can reject access during waiting period
  rejectedAt?: Date;
}
