// multi_key_threshold_fhe.test.ts
// =================================================================
// Verification Suite for Multi-Key & Threshold FHE Engine
// =================================================================

import { describe, it, expect } from "vitest";
import { MultiKeyThresholdFheEngine } from "../src/multi-key-threshold-fhe";

describe("Multi-Key & Threshold Secret Sharing FHE Engine", () => {
  const engine = new MultiKeyThresholdFheEngine();

  it("combines 3 participant key shares and performs joint threshold decryption", () => {
    const k1 = 12345n;
    const k2 = 67890n;
    const k3 = 54321n;
    const keyShares = [k1, k2, k3];

    const jointKey = engine.combineKeyShares(keyShares);
    const m = 424242n;

    const c = engine.encryptJoint(m, jointKey);
    const decrypted = engine.finalThresholdDecrypt(c, keyShares);

    expect(decrypted).toBe(m); // 100% Threshold MPC Decryption!
  });
});
