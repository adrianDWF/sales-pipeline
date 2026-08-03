import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ENCRYPTION_PREFIX = "enc1:";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("Missing TOKEN_ENCRYPTION_KEY");
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes (base64-encoded)");
  }

  return key;
}

export function isEncryptionConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

export function encryptSecret(plaintext: string): string {
  if (!plaintext) return plaintext;

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString("base64url");

  return `${ENCRYPTION_PREFIX}${payload}`;
}

export function decryptSecret(value: string): string {
  if (!value) return value;
  if (!value.startsWith(ENCRYPTION_PREFIX)) {
    return value;
  }

  const key = getEncryptionKey();
  const payload = Buffer.from(value.slice(ENCRYPTION_PREFIX.length), "base64url");
  const iv = payload.subarray(0, IV_LENGTH);
  const tag = payload.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = payload.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function isEncryptedSecret(value: string): boolean {
  return value.startsWith(ENCRYPTION_PREFIX);
}

export function maskSecretForLogs(value: string | null | undefined): string {
  if (!value) return "[empty]";
  if (value.length <= 8) return "[redacted]";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export function encryptTokenField(value: string | null): string | null {
  if (value === null) return null;
  if (!isEncryptionConfigured()) return value;
  return encryptSecret(value);
}

export function decryptTokenField(value: string | null): string | null {
  if (value === null) return null;
  if (!value.startsWith(ENCRYPTION_PREFIX)) return value;
  if (!isEncryptionConfigured()) {
    throw new Error("Encrypted token found but TOKEN_ENCRYPTION_KEY is not configured");
  }
  return decryptSecret(value);
}
