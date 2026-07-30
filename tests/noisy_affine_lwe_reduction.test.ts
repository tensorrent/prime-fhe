// noisy_affine_lwe_reduction.test.ts
// =================================================================
// Verification Suite for Noisy Affine Reduction & Noise Propagation
// =================================================================

import { describe, it, expect } from "vitest";
import { NoisyAffineLweReductionEngine } from "../src/noisy-affine-lwe-reduction";

describe("Noisy Affine LWE Noise Propagation Engine", () => {
  const engine = new NoisyAffineLweReductionEngine();
  const secretKey = 0x123456789abcdef0n;

  it("encrypts and decrypts noisy ciphertexts via noise cancellation", () => {
    const m = 42n;
    const e = 15n;

    const { ciphertext: c } = engine.encryptNoisy(m, secretKey, e);
    const dec = engine.decryptNoisy(c, secretKey, e);

    expect(dec).toBe(m);
  });

  it("performs noisy homomorphic addition with linear noise growth (e1 + e2)", () => {
    const m1 = 15n;
    const m2 = 27n;
    const e1 = 5n;
    const e2 = 9n;

    const { ciphertext: c1 } = engine.encryptNoisy(m1, secretKey, e1);
    const { ciphertext: c2 } = engine.encryptNoisy(m2, secretKey, e2);

    const cAdd = engine.addNoisy(c1, c2);
    const decAdd = engine.decryptNoisy(cAdd, secretKey, e1 + e2);

    expect(decAdd).toBe(m1 + m2);
  });
});
