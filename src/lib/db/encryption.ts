/**
 * Encryption utilities using @reverbia/sdk
 *
 * This module wraps the SDK's encryption functions and provides
 * utilities for encrypting/decrypting sensitive data in IndexedDB.
 */

import {
  encryptData,
  decryptData,
  decryptDataBytes,
  useEncryption,
} from "@reverbia/sdk/react";

// Re-export SDK encryption functions
export { encryptData, decryptData, decryptDataBytes, useEncryption };

/**
 * Encrypt a JSON object
 */
export async function encryptJSON<T>(data: T): Promise<string> {
  const jsonString = JSON.stringify(data);
  return encryptData(jsonString);
}

/**
 * Decrypt a JSON object
 */
export async function decryptJSON<T>(encryptedHex: string): Promise<T> {
  const jsonString = await decryptData(encryptedHex);
  return JSON.parse(jsonString) as T;
}

/**
 * Encrypt sensitive fields in an object
 * Only encrypts specified fields, leaves others untouched
 */
export async function encryptFields<T extends Record<string, unknown>>(
  data: T,
  fieldsToEncrypt: (keyof T)[]
): Promise<T & { _encrypted: (keyof T)[] }> {
  const result = { ...data } as T & { _encrypted: (keyof T)[] };

  for (const field of fieldsToEncrypt) {
    if (data[field] !== null && data[field] !== undefined) {
      const value = data[field];
      const encrypted = await encryptData(
        typeof value === "string" ? value : JSON.stringify(value)
      );
      (result as Record<string, unknown>)[field as string] = encrypted;
    }
  }

  result._encrypted = fieldsToEncrypt;
  return result;
}

/**
 * Decrypt sensitive fields in an object
 */
export async function decryptFields<T extends Record<string, unknown>>(
  data: T & { _encrypted?: (keyof T)[] }
): Promise<Omit<T, "_encrypted">> {
  const { _encrypted, ...rest } = data;
  const result = { ...rest } as T;

  if (_encrypted) {
    for (const field of _encrypted) {
      const encryptedValue = data[field];
      if (typeof encryptedValue === "string") {
        try {
          const decrypted = await decryptData(encryptedValue);
          // Try to parse as JSON, fallback to string
          try {
            (result as Record<string, unknown>)[field as string] = JSON.parse(decrypted);
          } catch {
            (result as Record<string, unknown>)[field as string] = decrypted;
          }
        } catch (error) {
          console.error(`Failed to decrypt field ${String(field)}:`, error);
        }
      }
    }
  }

  return result;
}

/**
 * Check if encryption is available (key has been initialized)
 */
export function isEncryptionReady(): boolean {
  // The SDK stores the key in localStorage after initialization
  // We can check if it exists
  if (typeof window === "undefined") return false;

  try {
    // The SDK uses a specific key pattern in localStorage
    const keys = Object.keys(localStorage);
    return keys.some((key) => key.includes("encryption") || key.includes("crypto"));
  } catch {
    return false;
  }
}
