// homomorphic_private_ai_reservoir.test.ts
// =================================================================
// Verification Suite for Private AI Reservoir Computing over Encrypted Inputs
// =================================================================

import { describe, it, expect } from "vitest";
import { BigIntHomomorphicFheEngine } from "../src/prime-field-bigint";
import { HomomorphicPrivateAiReservoirEngine } from "../src/homomorphic-private-ai-reservoir";

describe("Private AI Reservoir Computing Engine over Encrypted Inputs", () => {
  const fhe = new BigIntHomomorphicFheEngine(987654321n);
  const reservoir = new HomomorphicPrivateAiReservoirEngine(fhe);

  it("updates reservoir state directly on encrypted ciphertexts with 100% accuracy", () => {
    let resState = reservoir.initReservoir(3n);

    // Encrypt input stream tokens [11, 23, 47]
    const p1 = fhe.encrypt(11n);
    const p2 = fhe.encrypt(23n);
    const p3 = fhe.encrypt(47n);

    resState = reservoir.stepEncryptedReservoir(resState, p1); // S1 = 2*3 + 11 = 17
    resState = reservoir.stepEncryptedReservoir(resState, p2); // S2 = 2*17 + 23 = 57
    resState = reservoir.stepEncryptedReservoir(resState, p3); // S3 = 2*57 + 47 = 161

    const decryptedS3 = reservoir.decryptReservoirState(resState);

    const P = (1n << 256n) - 189n;
    const expectedS3 = 161n % P;

    expect(decryptedS3).toBe(expectedS3); // 100% Private Encrypted AI Inference!
    expect(resState.state_acc.noise_level).toBe(0);
  });
});
