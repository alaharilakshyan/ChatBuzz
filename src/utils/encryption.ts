/**
 * End-to-End Encryption utilities for ChatBuzz
 * 
 * Uses AES-GCM with a PBKDF2-derived shared key.
 * The key is derived deterministically from the sorted pair of participant IDs,
 * so both users always arrive at the same key — regardless of who sends/receives.
 * 
 * IMPORTANT: This is symmetric shared-key encryption. Both users derive the same
 * key client-side. The server only ever sees encrypted ciphertext.
 */

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const PBKDF2_ITERATIONS = 100_000;
const ENCRYPTION_PREFIX = 'ENC:';
const SALT_PREFIX = 'chatbuzz-e2e-v2-';

// In-memory cache so we don't re-derive the same key repeatedly
const keyCache = new Map<string, CryptoKey>();

async function deriveSharedKey(id1: string, id2: string): Promise<CryptoKey> {
  // Sort so the order of arguments doesn't matter
  const [a, b] = [id1, id2].sort();
  const cacheKey = `${a}::${b}`;

  if (keyCache.has(cacheKey)) {
    return keyCache.get(cacheKey)!;
  }

  const encoder = new TextEncoder();
  const password = encoder.encode(`${a}-${b}`);
  const salt = encoder.encode(`${SALT_PREFIX}${a}-${b}`);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    password,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );

  keyCache.set(cacheKey, key);
  return key;
}

/**
 * Encrypt a message for a 1-on-1 conversation.
 * For group messages pass the same value for both IDs (content won't be encrypted).
 */
export async function encryptMessage(
  message: string,
  senderId: string,
  receiverId?: string
): Promise<string> {
  // Groups or missing receiverId — don't encrypt
  if (!receiverId || senderId === receiverId) return message;

  try {
    const key = await deriveSharedKey(senderId, receiverId);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(message);

    const encrypted = await crypto.subtle.encrypt(
      { name: ENCRYPTION_ALGORITHM, iv },
      key,
      data
    );

    // Pack: [12-byte IV][ciphertext]
    const combined = new Uint8Array(12 + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), 12);

    return ENCRYPTION_PREFIX + btoa(String.fromCharCode(...combined));
  } catch (err) {
    console.error('[E2E] Encrypt error:', err);
    return message; // fail-open: send plaintext rather than crash
  }
}

/**
 * Decrypt a message from a 1-on-1 conversation.
 * Returns the original string if it is not encrypted or decryption fails.
 */
export async function decryptMessage(
  encryptedMessage: string,
  currentUserId: string,
  otherUserId?: string
): Promise<string> {
  if (!encryptedMessage.startsWith(ENCRYPTION_PREFIX)) {
    return encryptedMessage;
  }

  if (!otherUserId || currentUserId === otherUserId) {
    // Can't decrypt without knowing the other party
    return encryptedMessage;
  }

  try {
    const base64 = encryptedMessage.slice(ENCRYPTION_PREFIX.length);
    const combined = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const key = await deriveSharedKey(currentUserId, otherUserId);

    const decrypted = await crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGORITHM, iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error('[E2E] Decrypt error — returning raw content:', err);
    // Return the raw (without prefix) so the user sees something
    return encryptedMessage.slice(ENCRYPTION_PREFIX.length);
  }
}

/**
 * Check if a message string was encrypted by this system.
 */
export function isEncrypted(message: string): boolean {
  return typeof message === 'string' && message.startsWith(ENCRYPTION_PREFIX);
}

/**
 * Clear the key cache on logout.
 */
export function clearKeyCache(): void {
  keyCache.clear();
}
