// homomorphic_prime_fhe.test.ts
// =================================================================
// Verification Suite for Fully Homomorphic Encryption (FHE) Engine over F_137
// =================================================================

import { describe, it, expect } from "vitest";
import { HomomorphicPrimeFheEngine } from "../src/homomorphic-prime-fhe";

describe("Fully Homomorphic Encryption (FHE) Engine over F_137", () => {
  it("encrypts and decrypts plaintexts accurately via O(1) Anti-Map Inverse", () => {
    const engine = new HomomorphicPrimeFheEngine(17);
    const c = engine.encrypt(42);
    const dec = engine.decrypt(c);
    expect(dec).toBe(42);
  });

  it("performs Homomorphic Addition without noise growth", () => {
    const engine = new HomomorphicPrimeFheEngine(17);
    const c1 = engine.encrypt(15);
    const c2 = engine.encrypt(27);

    const c_add = engine.addHomomorphic(c1, c2);
    const dec_add = engine.decrypt(c_add);

    expect(dec_add).toBe((15 + 27) % 137); // 42!
    expect(c_add.noise_level).toBe(0);
  });

  it("performs Homomorphic Multiplication without noise growth or bootstrapping", () => {
    const engine = new HomomorphicPrimeFheEngine(17);
    const c1 = engine.encrypt(7);
    const c2 = engine.encrypt(9);

    const c_mult = engine.multiplyHomomorphic(c1, c2);
    const dec_mult = engine.decrypt(c_mult);

    expect(dec_mult).toBe((7 * 9) % 137); // 63!
    expect(c_mult.noise_level).toBe(0);
  });
});
