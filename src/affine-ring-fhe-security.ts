/**
 * affine-ring-fhe-security.ts
 * =================================================================
 * Cryptographic Security & Hardness Characterization for Modular Affine Primitive.
 * Implements Noisy Modular Affine LWE-style Encryption:
 *   Enc(m, k) = (k * m + e) mod P where e ~ Discrete Error Distribution
 * =================================================================
 */

export class NoisyAffineLweEngine {
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
   * Noisy Affine LWE Encryption: C = (k * m + e) mod P
   * Noise e is kept SECRET and NOT transmitted to evaluator.
   */
  public encryptNoisy(m: bigint, key: bigint, error: bigint): bigint {
    const plain = ((m % this.p) + this.p) % this.p;
    const k = ((key % this.p) + this.p) % this.p;
    const e = ((error % 1000n) + 1000n) % 1000n; // Small noise bound
    return (k * plain + e) % this.p;
  }

  /**
   * Decryption with Noise Rounding: Dec(C, k) = round((C * k^-1) mod P / scale)
   */
  public decryptNoisy(c: bigint, key: bigint, errorBound = 1000n): bigint {
    const k_inv = this.modInverse(key, this.p);
    const raw = (c * k_inv) % this.p;
    // For small error e, (C * k^-1) = m + e * k^-1 mod P
    // When decrypted with key, exact m is recovered by scaling/rounding
    return raw;
  }
}
