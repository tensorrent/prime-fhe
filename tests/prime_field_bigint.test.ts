// prime_field_bigint.test.ts
// =================================================================
// Verification Suite for 256-bit BigInt Homomorphic FHE Engine
// =================================================================

import { describe, it, expect } from "vitest";
import { BigIntHomomorphicFheEngine } from "../src/prime-field-bigint";

describe("256-bit BigInt Noise-Free Homomorphic FHE Engine", () => {
  const secretKey = 0x123456789abcdef0123456789abcdef0n;

  it("encrypts and decrypts 256-bit plaintexts accurately", () => {
    const fhe = new BigIntHomomorphicFheEngine(secretKey);
    const m = 0x9999888877776666555544443333222211110000n;
    const c = fhe.encrypt(m);
    const dec = fhe.decrypt(c);

    expect(dec).toBe(m);
  });

  it("performs 256-bit Homomorphic Addition with zero noise growth", () => {
    const fhe = new BigIntHomomorphicFheEngine(secretKey);
    const m1 = 12345678901234567890n;
    const m2 = 98765432109876543210n;

    const c1 = fhe.encrypt(m1);
    const c2 = fhe.encrypt(m2);
    const cAdd = fhe.addHomomorphic(c1, c2);

    expect(fhe.decrypt(cAdd)).toBe(m1 + m2);
    expect(cAdd.noise_level).toBe(0);
  });

  it("performs 256-bit Homomorphic Multiplication with zero noise growth or bootstrapping", () => {
    const fhe = new BigIntHomomorphicFheEngine(secretKey);
    const m1 = 123456789n;
    const m2 = 987654321n;

    const c1 = fhe.encrypt(m1);
    const c2 = fhe.encrypt(m2);
    const cMult = fhe.multiplyHomomorphic(c1, c2);

    expect(fhe.decrypt(cMult)).toBe(m1 * m2);
    expect(cMult.noise_level).toBe(0);
  });
});
