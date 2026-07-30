// affine_ring_fhe_security.test.ts
// =================================================================
// Verification Suite for Security & Cryptographic Characterization
// =================================================================

import { describe, it, expect } from "vitest";
import { AffineRingSecurityCharacterization } from "../src/affine-ring-fhe-security";

describe("Affine-Ring Cryptographic Security & Ephemeral Salt Characterization", () => {
  const security = new AffineRingSecurityCharacterization();
  const secretKey = 0x987654321fedcba0987654321fedcba0n;

  it("encrypts and decrypts with randomized ephemeral salt masking", () => {
    const plaintext = 424242n;
    const salt = 13579n;

    const c = security.encryptRandomized(plaintext, secretKey, salt);
    const dec = security.decryptRandomized(c, secretKey);

    expect(dec).toBe(plaintext);
  });

  it("produces distinct ciphertexts for identical plaintexts under different salts", () => {
    const plaintext = 100n;

    const c1 = security.encryptRandomized(plaintext, secretKey, 111n);
    const c2 = security.encryptRandomized(plaintext, secretKey, 999n);

    expect(c1.ciphertext).not.toBe(c2.ciphertext);
    expect(security.decryptRandomized(c1, secretKey)).toBe(plaintext);
    expect(security.decryptRandomized(c2, secretKey)).toBe(plaintext);
  });
});
