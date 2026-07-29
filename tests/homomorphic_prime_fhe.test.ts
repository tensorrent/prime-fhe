// homomorphic_prime_fhe.test.ts
// =================================================================
// Pure Mathematical Verification Suite for Homomorphic FHE Primitive over F_137
// =================================================================

import { describe, it, expect } from "vitest";
import { HomomorphicPrimeFheEngine } from "../src/homomorphic-prime-fhe";
import { affineMap, antiMap } from "../src/prime-field-137";

describe("Pure F_137 Homomorphic FHE Primitive", () => {
  it("verifies O(1) Anti-Map exact inverse identity antiMap(affineMap(x)) == x", () => {
    for (let x = 0; x < 137; x++) {
      const mapped = affineMap(x);
      const restored = antiMap(mapped);
      expect(restored).toBe(x);
    }
  });

  it("encrypts and decrypts plaintexts accurately", () => {
    const fhe = new HomomorphicPrimeFheEngine(17);
    const c = fhe.encrypt(42);
    const dec = fhe.decrypt(c);
    expect(dec).toBe(42);
  });

  it("performs Homomorphic Addition with zero noise growth", () => {
    const fhe = new HomomorphicPrimeFheEngine(17);
    const c1 = fhe.encrypt(15);
    const c2 = fhe.encrypt(27);

    const cAdd = fhe.addHomomorphic(c1, c2);
    const decAdd = fhe.decrypt(cAdd);

    expect(decAdd).toBe((15 + 27) % 137);
    expect(cAdd.noise_level).toBe(0);
  });

  it("performs Homomorphic Multiplication with zero noise growth or bootstrapping", () => {
    const fhe = new HomomorphicPrimeFheEngine(17);
    const c1 = fhe.encrypt(7);
    const c2 = fhe.encrypt(9);

    const cMult = fhe.multiplyHomomorphic(c1, c2);
    const decMult = fhe.decrypt(cMult);

    expect(decMult).toBe((7 * 9) % 137);
    expect(cMult.noise_level).toBe(0);
  });
});
