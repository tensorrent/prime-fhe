/**
 * noisy-affine-lwe-reduction.ts
 * =================================================================
 * Noisy Affine Extension & Noise Growth Bound Engine over F_P.
 * Implements noise-injected affine ciphertexts: C = (k * m + e) mod P.
 * =================================================================
 */

export class NoisyAffineLweReductionEngine {
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
   * Noisy Affine Encryption: C = (k * m + e) mod P
   */
  public encryptNoisy(m: bigint, key: bigint, error: bigint): { ciphertext: bigint; initial_noise: bigint } {
    const plain = ((m % this.p) + this.p) % this.p;
    const k = ((key % this.p) + this.p) % this.p;
    const e = ((error % 1000n) + 1000n) % 1000n;
    const c = (k * plain + e) % this.p;
    return { ciphertext: c, initial_noise: e };
  }

  /**
   * Decryption given secret key k and noise term e: m = (C - e) * k^-1 mod P
   */
  public decryptNoisy(c: bigint, key: bigint, error: bigint): bigint {
    const k_inv = this.modInverse(key, this.p);
    const raw = (c - error + this.p) % this.p;
    return (raw * k_inv) % this.p;
  }

  /**
   * Homomorphic Addition of Noisy Ciphertexts: Noise adds linearly e_add = e1 + e2
   */
  public addNoisy(c1: bigint, c2: bigint): bigint {
    return (c1 + c2) % this.p;
  }
}
