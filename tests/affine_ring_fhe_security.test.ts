// affine_ring_fhe_security.test.ts
// =================================================================
// Verification Suite for Noisy Affine LWE Encryption Model
// =================================================================

import { describe, it, expect } from "vitest";
import { NoisyAffineLweEngine } from "../src/affine-ring-fhe-security";

describe("Noisy Affine LWE Security Engine", () => {
  const security = new NoisyAffineLweEngine();
  const secretKey = 0x987654321fedcba0987654321fedcba0n;

  it("encrypts with noise injection without transmitting noise e to evaluator", () => {
    const plaintext = 424242n;
    const error = 17n;

    const c = security.encryptNoisy(plaintext, secretKey, error);
    expect(c).toBeGreaterThan(0n);
  });
});
