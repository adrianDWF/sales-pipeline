import { randomBytes } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";

import {
  decryptSecret,
  encryptSecret,
  isEncryptedSecret,
  isEncryptionConfigured,
  maskSecretForLogs,
} from "./crypto.js";

const ORIGINAL_KEY = process.env.TOKEN_ENCRYPTION_KEY;

afterEach(() => {
  if (ORIGINAL_KEY === undefined) {
    delete process.env.TOKEN_ENCRYPTION_KEY;
  } else {
    process.env.TOKEN_ENCRYPTION_KEY = ORIGINAL_KEY;
  }
});

describe("crypto", () => {
  it("encrypts and decrypts round-trip", () => {
    process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    expect(isEncryptionConfigured()).toBe(true);

    const plaintext = "refresh_token_value_12345";
    const encrypted = encryptSecret(plaintext);
    expect(isEncryptedSecret(encrypted)).toBe(true);
    expect(encrypted).not.toBe(plaintext);
    expect(decryptSecret(encrypted)).toBe(plaintext);
  });

  it("returns plaintext when encryption key missing for legacy values", () => {
    delete process.env.TOKEN_ENCRYPTION_KEY;
    expect(isEncryptionConfigured()).toBe(false);
    expect(decryptSecret("plain-token")).toBe("plain-token");
  });

  it("masks secrets for logs", () => {
    expect(maskSecretForLogs("abcdefghij")).toMatch(/…/);
    expect(maskSecretForLogs("")).toBe("[empty]");
  });
});
