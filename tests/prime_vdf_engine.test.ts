// prime_vdf_engine.test.ts
// =================================================================
// Verification Suite for Prime Affine Verifiable Delay Function (VDF) Engine
// =================================================================

import { describe, it, expect } from "vitest";
import {
  powMod,
  evaluateVdfSequential,
  verifyVdfLogarithmic,
} from "../src/prime-vdf-engine";

describe("Prime Affine Group Verifiable Delay Function (VDF) Engine", () => {
  const M = 137n;

  it("evaluates VDF sequentially and verifies in O(log N) logarithmic steps", () => {
    const proof = evaluateVdfSequential(5n, 1000n, M);
    expect(proof.x_input).toBe(5n);
    expect(proof.steps_N).toBe(1000n);

    const isValid = verifyVdfLogarithmic(proof);
    expect(isValid).toBe(true);
  });

  it("rejects tampered VDF output proofs in O(log N) time", () => {
    const proof = evaluateVdfSequential(5n, 1000n, M);
    const tamperedProof = { ...proof, y_output: 99n };

    const isValid = verifyVdfLogarithmic(tamperedProof);
    expect(isValid).toBe(false);
  });
});
