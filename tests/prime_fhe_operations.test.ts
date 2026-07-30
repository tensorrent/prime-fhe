// prime_fhe_operations.test.ts
// =================================================================
// Verification Suite for Extended Homomorphic Operations & Boolean Logic
// =================================================================

import { describe, it, expect } from "vitest";
import { BigIntHomomorphicFheEngine } from "../src/prime-field-bigint";
import { ExtendedHomomorphicFheOperations } from "../src/prime-fhe-operations";

describe("Extended Homomorphic FHE Operations & Boolean Logic", () => {
  const fhe = new BigIntHomomorphicFheEngine(123456789n);
  const ops = new ExtendedHomomorphicFheOperations(fhe);

  it("performs Homomorphic Subtraction accurately", () => {
    const c1 = fhe.encrypt(100n);
    const c2 = fhe.encrypt(37n);
    const cSub = ops.subtractHomomorphic(c1, c2);

    expect(fhe.decrypt(cSub)).toBe(63n);
  });

  it("performs Homomorphic Scalar Multiplication accurately", () => {
    const c = fhe.encrypt(15n);
    const cScaled = ops.scaleHomomorphic(c, 4n);

    expect(fhe.decrypt(cScaled)).toBe(60n);
  });

  it("performs Homomorphic Boolean XOR logic (0 XOR 1 = 1, 1 XOR 1 = 0)", () => {
    const c0 = fhe.encrypt(0n);
    const c1 = fhe.encrypt(1n);

    const cXor1 = ops.xorHomomorphic(c0, c1);
    const cXor2 = ops.xorHomomorphic(c1, c1);

    expect(fhe.decrypt(cXor1)).toBe(1n);
    expect(fhe.decrypt(cXor2)).toBe(0n);
  });

  it("performs Homomorphic Boolean AND logic (1 AND 1 = 1, 1 AND 0 = 0)", () => {
    const c0 = fhe.encrypt(0n);
    const c1 = fhe.encrypt(1n);

    const cAnd1 = ops.andHomomorphic(c1, c1);
    const cAnd2 = ops.andHomomorphic(c1, c0);

    expect(fhe.decrypt(cAnd1)).toBe(1n);
    expect(fhe.decrypt(cAnd2)).toBe(0n);
  });

  it("performs Homomorphic Boolean NOT logic (NOT 0 = 1, NOT 1 = 0)", () => {
    const c0 = fhe.encrypt(0n);
    const c1 = fhe.encrypt(1n);

    const cNot0 = ops.notHomomorphic(c0);
    const cNot1 = ops.notHomomorphic(c1);

    expect(fhe.decrypt(cNot0)).toBe(1n);
    expect(fhe.decrypt(cNot1)).toBe(0n);
  });
});
