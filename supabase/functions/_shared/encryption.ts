/**
 * Encryption utilities for securing user API keys in Supabase Edge Functions
 * Uses AES-256-GCM encryption with Deno's native crypto API
 */

const ENCRYPTION_KEY_NAME = 'API_KEY_ENCRYPTION_SECRET';

/**
 * Get the encryption key from environment variables
 * The key should be a 32-byte (256-bit) secret stored in Supabase secrets
 */
function getEncryptionKey(): string {
  const key = Deno.env.get(ENCRYPTION_KEY_NAME);
  if (!key) {
    throw new Error(`${ENCRYPTION_KEY_NAME} environment variable not set`);
  }
  if (key.length !== 32) {
    throw new Error(`${ENCRYPTION_KEY_NAME} must be exactly 32 characters (256 bits)`);
  }
  return key;
}

/**
 * Encrypt an API key using AES-256-GCM
 * @param plaintext The API key to encrypt
 * @returns Base64-encoded string containing IV + encrypted data
 */
export async function encryptApiKey(plaintext: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const encryptionSecret = getEncryptionKey();
    
    // Generate random 12-byte IV for GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Import the encryption key
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(encryptionSecret),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    // Combine IV + encrypted data
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);
    
    // Base64 encode for storage
    return btoa(String.fromCharCode(...result));
  } catch (error) {
    console.error('[encryption] Failed to encrypt API key:', error);
    throw new Error('Failed to encrypt API key');
  }
}

/**
 * Decrypt an API key encrypted with encryptApiKey
 * @param ciphertext Base64-encoded string containing IV + encrypted data
 * @returns Decrypted API key
 */
export async function decryptApiKey(ciphertext: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const encryptionSecret = getEncryptionKey();
    
    // Base64 decode
    const data = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);
    
    // Import the decryption key
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(encryptionSecret),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    // Convert back to string
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('[encryption] Failed to decrypt API key:', error);
    throw new Error('Failed to decrypt API key');
  }
}

/**
 * Test if a string can be decrypted (useful for validation)
 */
export async function canDecrypt(ciphertext: string): Promise<boolean> {
  try {
    await decryptApiKey(ciphertext);
    return true;
  } catch {
    return false;
  }
}
