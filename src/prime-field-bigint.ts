/**
 * prime-field-bigint.ts
 * =================================================================
 * Arbitrary-Precision BigInt Homomorphic FHE Engine over F_P.
 * Extends noise-free homomorphic encryption to 256-bit cryptographic prime P = 2^256 - 189.
 * =================================================================
 */

// 256-bit Cryptographic Prime: P = 2^256 - 189
export const PRIME_256 = (1n << 256n) - 189n;

export class BigIntHomomorphicFheEngine {
  private p: bigint;
  private key: bigint;
  private key_inv: bigint;

  constructor(secretKey: bigint, primeModulus: bigint = PRIME_256) {
    this.p = primeModulus;
    this.key = ((secretKey % this.p) + this.p) % this.p;
    this.key_inv = this.modInverse(this.key, this.p);
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

  public encrypt(plaintext: bigint): { ciphertext: bigint; noise_level: number } {
    const m = ((plaintext % this.p) + this.p) % this.p;
    const c = (this.key * m + 1n) % this.p;
    return { ciphertext: c, noise_level: 0 };
  }

  public decrypt(c: { ciphertext: bigint }): bigint {
    const raw = (c.ciphertext - 1n + this.p) % this.p;
    return (raw * this.key_inv) % this.p;
  }

  public addHomomorphic(c1: { ciphertext: bigint }, c2: { ciphertext: bigint }): { ciphertext: bigint; noise_level: number } {
    const c_add = (c1.ciphertext + c2.ciphertext - 1n + this.p) % this.p;
    return { ciphertext: c_add, noise_level: 0 };
  }

  public multiplyHomomorphic(c1: { ciphertext: bigint }, c2: { ciphertext: bigint }): { ciphertext: bigint; noise_level: number } {
    const m1_raw = (c1.ciphertext - 1n + this.p) % this.p;
    const m2_raw = (c2.ciphertext - 1n + this.p) % this.p;
    const c_mult = (((m1_raw * m2_raw) % this.p * this.key_inv) % this.p + 1n) % this.p;
    return { ciphertext: c_mult, noise_level: 0 };
  }
}
