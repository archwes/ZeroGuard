/**
 * 🔐 Password Security Utilities
 * 
 * Comprehensive password strength checking and secure generation.
 * 
 * Security Requirements:
 * - Master password: 12+ chars, high entropy
 * - Generated passwords: Configurable strength
 * - No common passwords or patterns
 * - Entropy calculation
 * 
 * @module crypto/password
 */

// @ts-ignore - zxcvbn types podem não estar disponíveis
import zxcvbn from 'zxcvbn';

/**
 * Password strength levels
 */
export enum PasswordStrength {
  VERY_WEAK = 0,
  WEAK = 1,
  FAIR = 2,
  STRONG = 3,
  VERY_STRONG = 4,
}

/**
 * Password requirements for master password
 */
export const MASTER_PASSWORD_REQUIREMENTS = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
  minStrength: PasswordStrength.STRONG,
};

/**
 * Character sets for password generation
 */
const CHARSET_LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const CHARSET_UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHARSET_NUMBERS = '0123456789';
const CHARSET_SPECIAL = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const CHARSET_AMBIGUOUS = 'il1Lo0O';

/**
 * Password strength result
 */
export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number;              // zxcvbn score (0-4)
  entropy: number;            // Bits of entropy
  crackTime: string;          // Human-readable crack time
  suggestions: string[];      // Improvement suggestions
  warning: string;            // Warning message (if any)
  meetsRequirements: boolean; // For master password validation
  errors: string[];           // Specific requirement violations
}

/**
 * Password generation options
 */
export interface PasswordGeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  special: boolean;
  excludeAmbiguous: boolean;
  minNumbers?: number;
  minSpecial?: number;
}

/**
 * Analyze password strength using zxcvbn
 * 
 * zxcvbn is the industry standard for password strength estimation.
 * It was developed by Dropbox and is used by:
 * - 1Password
 * - Bitwarden
 * - GitHub
 * - Stripe
 * 
 * It detects:
 * - Dictionary words
 * - Common patterns (dates, sequences, repeated chars)
 * - Leetspeak substitutions
 * - Keyboard patterns
 * 
 * @param password - Password to analyze
 * @param userInputs - User-specific words to check against (email, name, etc.)
 * @returns Detailed strength analysis
 */
export function analyzePasswordStrength(
  password: string,
  userInputs: string[] = []
): PasswordStrengthResult {
  const errors: string[] = [];

  // Basic validation
  if (!password) {
    return {
      strength: PasswordStrength.VERY_WEAK,
      score: 0,
      entropy: 0,
      crackTime: 'instant',
      suggestions: ['Password cannot be empty'],
      warning: 'No password provided',
      meetsRequirements: false,
      errors: ['Password is required'],
    };
  }

  // Length check
  if (password.length < MASTER_PASSWORD_REQUIREMENTS.minLength) {
    errors.push(
      `Password must be at least ${MASTER_PASSWORD_REQUIREMENTS.minLength} characters`
    );
  }

  if (password.length > MASTER_PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(
      `Password must not exceed ${MASTER_PASSWORD_REQUIREMENTS.maxLength} characters`
    );
  }

  // Character requirements
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (MASTER_PASSWORD_REQUIREMENTS.requireUppercase && !hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (MASTER_PASSWORD_REQUIREMENTS.requireLowercase && !hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (MASTER_PASSWORD_REQUIREMENTS.requireNumbers && !hasNumbers) {
    errors.push('Password must contain at least one number');
  }

  if (MASTER_PASSWORD_REQUIREMENTS.requireSpecial && !hasSpecial) {
    errors.push('Password must contain at least one special character');
  }

  // Use zxcvbn for advanced analysis
  const result = zxcvbn(password, userInputs);

  // Calculate entropy (rough estimate)
  const charsetSize = 
    (hasLowercase ? 26 : 0) +
    (hasUppercase ? 26 : 0) +
    (hasNumbers ? 10 : 0) +
    (hasSpecial ? 32 : 0);
  
  const entropy = Math.log2(Math.pow(charsetSize, password.length));

  // Map zxcvbn score to our enum
  const strength = result.score as PasswordStrength;

  // Check if meets requirements
  const meetsRequirements =
    errors.length === 0 &&
    strength >= MASTER_PASSWORD_REQUIREMENTS.minStrength;

  return {
    strength,
    score: result.score,
    entropy: Math.round(entropy),
    crackTime: String(result.crack_times_display.offline_slow_hashing_1e4_per_second),
    suggestions: result.feedback.suggestions,
    warning: result.feedback.warning,
    meetsRequirements,
    errors,
  };
}

/**
 * Generate a cryptographically secure random password
 * 
 * Uses Web Crypto API for CSPRNG (Cryptographically Secure PRNG).
 * Never use Math.random() for passwords!
 * 
 * @param options - Generation options
 * @returns Random password string
 * 
 * @security Uses crypto.getRandomValues() - DO NOT change
 */
export function generateSecurePassword(
  options: PasswordGeneratorOptions
): string {
  // Build character set
  let charset = '';
  
  if (options.lowercase) {
    charset += CHARSET_LOWERCASE;
  }
  
  if (options.uppercase) {
    charset += CHARSET_UPPERCASE;
  }
  
  if (options.numbers) {
    charset += CHARSET_NUMBERS;
  }
  
  if (options.special) {
    charset += CHARSET_SPECIAL;
  }

  // Remove ambiguous characters if requested
  if (options.excludeAmbiguous) {
    charset = charset
      .split('')
      .filter(c => !CHARSET_AMBIGUOUS.includes(c))
      .join('');
  }

  if (charset.length === 0) {
    throw new Error('No character types selected for password generation');
  }

  if (options.length < 4) {
    throw new Error('Password length must be at least 4 characters');
  }

  if (options.length > 256) {
    throw new Error('Password length must not exceed 256 characters');
  }

  // Generate password
  let password = '';
  const randomValues = new Uint32Array(options.length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < options.length; i++) {
    password += charset[randomValues[i] % charset.length];
  }

  // Ensure minimum requirements are met
  const requiredChars: string[] = [];
  
  if (options.uppercase) requiredChars.push(CHARSET_UPPERCASE);
  if (options.lowercase) requiredChars.push(CHARSET_LOWERCASE);
  if (options.numbers) requiredChars.push(CHARSET_NUMBERS);
  if (options.special) requiredChars.push(CHARSET_SPECIAL);

  // Check if all required character types are present
  const hasAllRequired = requiredChars.every(set => {
    return password.split('').some(c => set.includes(c));
  });

  // If requirements not met, regenerate (recursive with limit)
  if (!hasAllRequired) {
    // Prevent infinite recursion
    let attempts = 0;
    while (!hasAllRequired && attempts < 10) {
      password = generateSecurePassword(options);
      attempts++;
    }
    
    // If still failing, manually inject required characters
    if (!hasAllRequired) {
      password = ensureRequiredCharacters(password, options);
    }
  }

  return password;
}

/**
 * Ensure password contains all required character types
 * 
 * @param password - Generated password
 * @param options - Generation options
 * @returns Password with required characters
 */
function ensureRequiredCharacters(
  password: string,
  options: PasswordGeneratorOptions
): string {
  const passwordArray = password.split('');
  const randomIndices = new Uint32Array(4);
  crypto.getRandomValues(randomIndices);

  let idx = 0;

  if (options.uppercase && !/[A-Z]/.test(password)) {
    const randomChar = CHARSET_UPPERCASE[randomIndices[idx] % CHARSET_UPPERCASE.length];
    passwordArray[randomIndices[idx] % passwordArray.length] = randomChar;
    idx++;
  }

  if (options.lowercase && !/[a-z]/.test(password)) {
    const randomChar = CHARSET_LOWERCASE[randomIndices[idx] % CHARSET_LOWERCASE.length];
    passwordArray[randomIndices[idx] % passwordArray.length] = randomChar;
    idx++;
  }

  if (options.numbers && !/[0-9]/.test(password)) {
    const randomChar = CHARSET_NUMBERS[randomIndices[idx] % CHARSET_NUMBERS.length];
    passwordArray[randomIndices[idx] % passwordArray.length] = randomChar;
    idx++;
  }

  if (options.special && !/[^A-Za-z0-9]/.test(password)) {
    const randomChar = CHARSET_SPECIAL[randomIndices[idx] % CHARSET_SPECIAL.length];
    passwordArray[randomIndices[idx] % passwordArray.length] = randomChar;
  }

  return passwordArray.join('');
}

/**
 * Generate a memorable passphrase using random words
 * 
 * Passphrases are easier to remember and can be stronger than complex passwords.
 * 
 * Example: "correct-horse-battery-staple"
 * 
 * @param wordCount - Number of words (default: 4)
 * @param separator - Word separator (default: '-')
 * @param capitalize - Capitalize first letter (default: false)
 * @returns Random passphrase
 */
export function generatePassphrase(
  wordCount: number = 4,
  separator: string = '-',
  capitalize: boolean = false
): string {
  // EFF's long wordlist (7776 words)
  // In production, load from external file
  // For now, using a sample
  const wordlist = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb',
    'abstract', 'absurd', 'abuse', 'access', 'accident', 'account',
    'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across',
    // ... (would include full EFF wordlist in production)
  ];

  if (wordCount < 3 || wordCount > 10) {
    throw new Error('Word count must be between 3 and 10');
  }

  const words: string[] = [];
  const randomValues = new Uint32Array(wordCount);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < wordCount; i++) {
    let word = wordlist[randomValues[i] % wordlist.length];
    
    if (capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }
    
    words.push(word);
  }

  return words.join(separator);
}

/**
 * Estimate password entropy
 * 
 * Entropy is measured in bits. Higher is better.
 * - < 28 bits: Very weak
 * - 28-35 bits: Weak
 * - 36-59 bits: Fair
 * - 60-127 bits: Strong
 * - 128+ bits: Very strong
 * 
 * @param password - Password to analyze
 * @returns Entropy in bits
 */
export function calculateEntropy(password: string): number {
  if (!password) return 0;

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const charsetSize = 
    (hasLowercase ? 26 : 0) +
    (hasUppercase ? 26 : 0) +
    (hasNumbers ? 10 : 0) +
    (hasSpecial ? 32 : 0);

  return Math.log2(Math.pow(charsetSize, password.length));
}

/**
 * Check if password has been compromised (Have I Been Pwned)
 * 
 * Uses k-anonymity model:
 * 1. Hash password with SHA-1
 * 2. Send first 5 chars of hash to API
 * 3. API returns all hashes starting with those 5 chars
 * 4. Check if full hash is in the list
 * 
 * This ensures your password is never sent to the API.
 * 
 * @param password - Password to check
 * @returns True if compromised, false otherwise
 */
export async function checkPasswordCompromised(
  password: string
): Promise<boolean> {
  try {
    // Hash password with SHA-1
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const hashUpper = hashHex.toUpperCase();

    // Split hash: first 5 chars and rest
    const prefix = hashUpper.slice(0, 5);
    const suffix = hashUpper.slice(5);

    // Query API (k-anonymity)
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`
    );

    if (!response.ok) {
      console.error('Failed to check password breach status');
      return false; // Fail open (don't block user)
    }

    const text = await response.text();
    const hashes = text.split('\n');

    // Check if our hash suffix is in the results
    for (const line of hashes) {
      const [hashSuffix] = line.split(':');
      if (hashSuffix === suffix) {
        return true; // Password is compromised!
      }
    }

    return false; // Password not found in breaches
  } catch (error) {
    console.error('Error checking password:', error);
    return false; // Fail open
  }
}

/**
 * Default password generation presets
 */
export const PASSWORD_PRESETS = {
  strong: {
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    special: true,
    excludeAmbiguous: true,
  },
  maximum: {
    length: 32,
    uppercase: true,
    lowercase: true,
    numbers: true,
    special: true,
    excludeAmbiguous: false,
  },
  pin: {
    length: 6,
    uppercase: false,
    lowercase: false,
    numbers: true,
    special: false,
    excludeAmbiguous: false,
  },
  memorable: {
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    special: false,
    excludeAmbiguous: true,
  },
} as const;
