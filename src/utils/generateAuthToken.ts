import { randomBytes } from 'crypto';

/**
 * Generates a secure random token (32 characters)
 * Format: Base62 encoded (0-9, A-Z, a-z) for URL safety
 */
export function generateAuthToken(): string {
  // Generate 20 random bytes (160 bits of entropy)
  const bytes = randomBytes(20);
  
  // Convert to Base62 (0-9, A-Z, a-z)
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    // Use modulo to select a character from our charset
    result += chars[byte % chars.length];
  }
  
  return result;
}