/**
 * Web Crypto API utilities for End-to-End Encryption
 */

export const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  return keyPair;
};

export const exportPublicKey = async (key: CryptoKey): Promise<string> => {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  const exportedAsString = String.fromCharCode.apply(null, Array.from(new Uint8Array(exported)));
  return window.btoa(exportedAsString);
};

export const exportPrivateKey = async (key: CryptoKey): Promise<string> => {
  const exported = await window.crypto.subtle.exportKey("pkcs8", key);
  const exportedAsString = String.fromCharCode.apply(null, Array.from(new Uint8Array(exported)));
  return window.btoa(exportedAsString);
};

export const importPublicKey = async (pem: string): Promise<CryptoKey> => {
  const binaryDerString = window.atob(pem);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  return await window.crypto.subtle.importKey(
    "spki",
    binaryDer.buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
};

export const importPrivateKey = async (pem: string): Promise<CryptoKey> => {
  const binaryDerString = window.atob(pem);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  return await window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
};

export const encryptMessage = async (publicKeyPem: string, message: string): Promise<string> => {
  try {
    const publicKey = await importPublicKey(publicKeyPem);
    const encoded = new TextEncoder().encode(message);
    
    // Generate AES key
    const aesKey = await window.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    
    // Encrypt message with AES
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      aesKey,
      encoded
    );
    
    // Export and encrypt AES key with RSA
    const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
    const encryptedAesKey = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      rawAesKey
    );
    
    // Combine encrypted key, iv, and ciphertext
    // Format: base64(encryptedAesKey) + "." + base64(iv) + "." + base64(ciphertext)
    const keyB64 = window.btoa(String.fromCharCode(...new Uint8Array(encryptedAesKey)));
    const ivB64 = window.btoa(String.fromCharCode(...iv));
    const msgB64 = window.btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
    
    return `${keyB64}.${ivB64}.${msgB64}`;
  } catch (err) {
    console.error("Encryption error:", err);
    return message; // fallback if encryption fails
  }
};

export const decryptMessage = async (privateKeyPem: string, encryptedPayload: string): Promise<string> => {
  try {
    const parts = encryptedPayload.split('.');
    if (parts.length !== 3) return encryptedPayload; // Not an encrypted message
    
    const privateKey = await importPrivateKey(privateKeyPem);
    
    const encryptedAesKey = new Uint8Array(window.atob(parts[0]).split('').map(c => c.charCodeAt(0)));
    const iv = new Uint8Array(window.atob(parts[1]).split('').map(c => c.charCodeAt(0)));
    const ciphertext = new Uint8Array(window.atob(parts[2]).split('').map(c => c.charCodeAt(0)));
    
    // Decrypt AES key
    const rawAesKey = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedAesKey
    );
    
    // Import AES key
    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      rawAesKey,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
    
    // Decrypt message
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      aesKey,
      ciphertext
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error("Decryption error:", err);
    return encryptedPayload; // return original string if it wasn't encrypted or failed
  }
};
