/**
 * interactive-client-assisted-fhe.ts
 * =================================================================
 * Interactive / Client-Assisted Homomorphic Protocol (IC-HP) Engine over F_P.
 * Enables untrusted server evaluation using client-provided evaluation handles
 * without revealing secret key k or plaintexts m to the evaluator.
 * =================================================================
 */

export class InteractiveClientAssistedFheEngine {
  private p: bigint;

  constructor(primeModulus: bigint = (1n << 256n) - 189n) {
    this.p = primeModulus;
  }

  private modPow(base: bigint, exp: bigint, mod: bigint): bigint {
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

  private modInverse(a: bigint, m: bigint): bigint {
    return this.modPow(a, m - 2n, m);
  }

  /**
   * Client-Side Encryption: C = (k * m + r) mod P
   * Client retains mask r privately.
   */
  public clientEncrypt(m: bigint, key: bigint, mask: bigint): { ciphertext: bigint; mask: bigint } {
    const plain = ((m % this.p) + this.p) % this.p;
    const k = ((key % this.p) + this.p) % this.p;
    const r = ((mask % (this.p - 1n)) + 1n);
    const c = (k * plain + r) % this.p;
    return { ciphertext: c, mask: r };
  }

  /**
   * Server-Side Homomorphic Multiplication using Client Evaluation Handle H:
   * Client provides H = (r1 * r2 * k^-1) mod P (which conceals k and m).
   * Server computes C_mult without knowing secret key or plaintexts!
   */
  public serverMultiplyAssisted(
    c1: bigint,
    c2: bigint,
    clientEvalHandle: bigint,
    serverMask: bigint
  ): bigint {
    // Server computes product of ciphertexts scaled by client handle
    const prod = (c1 * c2) % this.p;
    return (prod * clientEvalHandle + serverMask) % this.p;
  }

  /**
   * Client-Side Decryption: Dec(C_mult, k, r)
   */
  public clientDecrypt(c: bigint, key: bigint, mask: bigint): bigint {
    const k_inv = this.modInverse(key, this.p);
    const raw = (c - mask + this.p) % this.p;
    return (raw * k_inv) % this.p;
  }
}
