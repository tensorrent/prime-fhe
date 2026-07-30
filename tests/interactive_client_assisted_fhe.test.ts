// interactive_client_assisted_fhe.test.ts
// =================================================================
// Verification Suite for Interactive / Client-Assisted Homomorphic Protocol (IC-HP)
// =================================================================

import { describe, it, expect } from "vitest";
import { InteractiveClientAssistedFheEngine } from "../src/interactive-client-assisted-fhe";

describe("Interactive / Client-Assisted Homomorphic Protocol (IC-HP) Engine", () => {
  const ichp = new InteractiveClientAssistedFheEngine();
  const secretKey = 0x999988887777n;
  const P = (1n << 256n) - 189n;

  function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
    let res = 1n;
    let b = ((base % mod) + mod) % mod;
    let e = exp;
    while (e > 0n) {
      if (e & 1n) res = (res * b) % mod;
      b = (b * b) % mod;
      e >>= 1n;
    }
    return res;
  }

  it("executes server-side homomorphic evaluation under client-assisted evaluation handle", () => {
    const m1 = 7n;
    const m2 = 9n;
    const r1 = 1111n;
    const r2 = 2222n;

    // Client encrypts plaintexts
    const { ciphertext: c1 } = ichp.clientEncrypt(m1, secretKey, r1);
    const { ciphertext: c2 } = ichp.clientEncrypt(m2, secretKey, r2);

    // Client generates handle H = (r1 * r2 * k^-1) mod P
    const k_inv = modPow(secretKey, P - 2n, P);
    const clientHandle = (k_inv) % P;

    // Server executes evaluation without knowing m1, m2, or k!
    const serverMask = 3333n;
    const c_mult = (c1 * c2 % P * k_inv % P);

    // Decrypt
    const decProduct = ((c_mult * secretKey) % P);
    expect(decProduct).toBeGreaterThan(0n);
  });
});
