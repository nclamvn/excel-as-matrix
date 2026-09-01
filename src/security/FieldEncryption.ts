// ═══════════════════════════════════════════════════════════════════════════
// FIELD-LEVEL ENCRYPTION — At-rest encryption for sensitive cell data
// Uses AES-256-GCM via Web Crypto API with PBKDF2 key derivation
// ═══════════════════════════════════════════════════════════════════════════

import { loggers } from '@/utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface EncryptedValue {
  __encrypted: true;
  ciphertext: string; // Base64-encoded
  iv: string; // Base64-encoded initialization vector
  salt: string; // Base64-encoded salt for key derivation
  version: 1;
}

export interface EncryptionConfig {
  enabled: boolean;
  /** Columns marked as sensitive (e.g., ['SSN', 'Credit Card', 'Salary']) */
  sensitiveColumns: string[];
  /** Cell ranges marked as sensitive (e.g., ['D1:D1000']) */
  sensitiveRanges: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ─────────────────────────────────────────────────────────────────────────────
// FieldEncryption Class
// ─────────────────────────────────────────────────────────────────────────────

export class FieldEncryption {
  private cachedKey: CryptoKey | null = null;
  private cachedSalt: Uint8Array | null = null;
  private config: EncryptionConfig = {
    enabled: false,
    sensitiveColumns: [],
    sensitiveRanges: [],
  };

  /**
   * Initialize with a user-provided passphrase.
   * The passphrase is never stored — only the derived key is kept in memory.
   */
  async init(passphrase: string): Promise<void> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    this.cachedKey = await this.deriveKey(passphrase, salt);
    this.cachedSalt = salt;
    this.config.enabled = true;
    loggers.admin.info('Field encryption initialized');
  }

  /**
   * Initialize with existing salt (for decrypting previously encrypted data)
   */
  async initWithSalt(passphrase: string, salt: Uint8Array): Promise<void> {
    this.cachedKey = await this.deriveKey(passphrase, salt);
    this.cachedSalt = salt;
    this.config.enabled = true;
  }

  /**
   * Derive an AES-256-GCM key from passphrase using PBKDF2
   */
  private async deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt.buffer as ArrayBuffer,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt a cell value
   */
  async encrypt(value: unknown): Promise<EncryptedValue> {
    if (!this.cachedKey || !this.cachedSalt) {
      throw new Error('Encryption not initialized. Call init() first.');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(value));
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      this.cachedKey,
      data
    );

    return {
      __encrypted: true,
      ciphertext: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
      salt: arrayBufferToBase64(this.cachedSalt.buffer as ArrayBuffer),
      version: 1,
    };
  }

  /**
   * Decrypt an encrypted value
   */
  async decrypt(encrypted: EncryptedValue): Promise<unknown> {
    if (!this.cachedKey) {
      throw new Error('Encryption not initialized. Call init() first.');
    }

    // If salt differs, re-derive key
    const salt = new Uint8Array(base64ToArrayBuffer(encrypted.salt));
    if (
      this.cachedSalt &&
      arrayBufferToBase64(salt.buffer as ArrayBuffer) !==
        arrayBufferToBase64(this.cachedSalt.buffer as ArrayBuffer)
    ) {
      throw new Error('Salt mismatch — data was encrypted with a different passphrase');
    }

    const iv = new Uint8Array(base64ToArrayBuffer(encrypted.iv));
    const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      this.cachedKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  }

  /**
   * Check if a value is encrypted
   */
  isEncrypted(value: unknown): value is EncryptedValue {
    return (
      typeof value === 'object' &&
      value !== null &&
      '__encrypted' in value &&
      (value as EncryptedValue).__encrypted === true
    );
  }

  /**
   * Encrypt a value if encryption is enabled, otherwise pass through
   */
  async encryptIfEnabled(value: unknown): Promise<unknown> {
    if (!this.config.enabled || !this.cachedKey) return value;
    return this.encrypt(value);
  }

  /**
   * Decrypt a value if it's encrypted, otherwise pass through
   */
  async decryptIfNeeded(value: unknown): Promise<unknown> {
    if (!this.isEncrypted(value)) return value;
    return this.decrypt(value);
  }

  /**
   * Check if a cell position is in a sensitive range
   */
  isSensitiveCell(_row: number, col: number, columnHeaders?: string[]): boolean {
    // Check by column header name
    if (columnHeaders && col < columnHeaders.length) {
      const header = columnHeaders[col]?.toLowerCase() || '';
      if (this.config.sensitiveColumns.some((s) => header.includes(s.toLowerCase()))) {
        return true;
      }
    }

    // Check by range (simplified — full implementation would parse ranges)
    return false;
  }

  /**
   * Update encryption configuration
   */
  updateConfig(config: Partial<EncryptionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current config
   */
  getConfig(): EncryptionConfig {
    return { ...this.config };
  }

  /**
   * Check if encryption is ready
   */
  get isReady(): boolean {
    return this.config.enabled && this.cachedKey !== null;
  }

  /**
   * Clear encryption state (logout)
   */
  clear(): void {
    this.cachedKey = null;
    this.cachedSalt = null;
    this.config.enabled = false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton Export
// ─────────────────────────────────────────────────────────────────────────────

export const fieldEncryption = new FieldEncryption();
