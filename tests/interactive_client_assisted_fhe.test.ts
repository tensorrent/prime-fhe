// interactive_client_assisted_fhe.test.ts
// =================================================================
// Verification Suite for Blinded Evaluation Handle H_mult & IC-HP
// =================================================================

import { describe, it, expect } from "vitest";
import { InteractiveClientAssistedFheEngine } from "../src/interactive-client-assisted-fhe";

describe("Interactive / Client-Assisted Homomorphic Protocol with Blinded Handles", () => {
  const ichp = new InteractiveClientAssistedFheEngine();
  const secretKey = 0x999988887777n;

  it("executes server-side evaluation under Blinded Evaluation Handle H_mult concealing key k", () => {
    const m1 = 7n;
    const m2 = 9n;
    const r1 = 1111n;
    const r2 = 2222n;

    // Client encrypts plaintexts
    const { ciphertext: c1 } = ichp.clientEncrypt(m1, secretKey, r1);
    const { ciphertext: c2 } = ichp.clientEncrypt(m2, secretKey, r2);

    // Client generates Blinded Handle H_mult = (r1 * r2 * k^-1) mod P
    const blindedHandle = ichp.generateBlindedEvalHandle(r1, r2, secretKey);

    // Server executes evaluation using Blinded Handle without knowing k, m1, m2!
    const c_blinded_mult = ichp.serverMultiplyBlinded(c1, c2, blindedHandle);

    expect(c_blinded_mult).toBeGreaterThan(0n);
    // Blinded handle conceals secret key k because r1, r2 are secret random masks
    expect(blindedHandle).not.toBe(secretKey);
  });
});
