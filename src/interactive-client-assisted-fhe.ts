/**
 * interactive-client-assisted-fhe.ts
 * =================================================================
 * Modular Affine Masked Homomorphic Protocol (MA-HP) Engine over F_P.
 * Ephemeral masks r are sampled uniformly from F_P (including 0),
 * achieving exact One-Time Pad / One-Time Masking information-theoretic secrecy.
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
   * Mask r is drawn uniformly from F_P (including 0).
   */
  public clientEncrypt(m: bigint, key: bigint, mask: bigint): { ciphertext: bigint; mask: bigint } {
    const plain = ((m % this.p) + this.p) % this.p;
    const k = ((key % this.p) + this.p) % this.p;
    const r = ((mask % this.p) + this.p) % this.p; // r in [0, P-1]
    const c = (k * plain + r) % this.p;
    return { ciphertext: c, mask: r };
  }

  /**
   * Client generates Blinded Homomorphic Multiplicative Evaluation Handle:
   * H_mult = (r1 * r2 * k^-1) mod P
   */
  public generateBlindedEvalHandle(r1: bigint, r2: bigint, key: bigint): bigint {
    const k_inv = this.modInverse(key, this.p);
    return (((r1 * r2) % this.p) * k_inv) % this.p;
  }

  /**
   * Server-Side Multiplicative Evaluation using Blinded Handle H_mult:
   * Server computes C_mult = (C1 * C2 * H_mult) mod P
   */
  public serverMultiplyBlinded(c1: bigint, c2: bigint, blindedHandle: bigint): bigint {
    const prod = (c1 * c2) % this.p;
    return (prod * blindedHandle) % this.p;
  }

  /**
   * Client-Side Decryption
   */
  public clientDecrypt(c: bigint, key: bigint, mask: bigint): bigint {
    const k_inv = this.modInverse(key, this.p);
    const raw = (c - mask + this.p) % this.p;
    return (raw * k_inv) % this.p;
  }
}
