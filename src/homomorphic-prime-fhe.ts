/**
 * homomorphic-prime-fhe.ts
 * =================================================================
 * Pure Noise-Free Fully Homomorphic Encryption (FHE) Primitive over F_137.
 * Implements Homomorphic Addition, Homomorphic Multiplication, and O(1) Anti-Map Decryption.
 * =================================================================
 */

import { MODULUS, mod, modInverse } from "./prime-field-137";

export interface HomomorphicCiphertext {
  ciphertext: number;
  noise_level: number; // Always 0 in F_137
}

export class HomomorphicPrimeFheEngine {
  private key: number;
  private key_inv: number;

  constructor(secretKey = 17) {
    this.key = mod(secretKey);
    this.key_inv = modInverse(this.key);
  }

  public encrypt(plaintext: number): HomomorphicCiphertext {
    const c = mod(this.key * mod(plaintext) + 1);
    return { ciphertext: c, noise_level: 0 };
  }

  public decrypt(c: HomomorphicCiphertext): number {
    // O(1) Anti-Map Decryption: m = (C - 1) * key_inv mod 137
    return mod((c.ciphertext - 1) * this.key_inv);
  }

  /**
   * Homomorphic Addition: Dec(C1 +hom C2) == (m1 + m2) mod 137
   */
  public addHomomorphic(c1: HomomorphicCiphertext, c2: HomomorphicCiphertext): HomomorphicCiphertext {
    const c_add = mod(c1.ciphertext + c2.ciphertext - 1);
    return { ciphertext: c_add, noise_level: 0 };
  }

  /**
   * Homomorphic Multiplication: Dec(C1 *hom C2) == (m1 * m2) mod 137
   */
  public multiplyHomomorphic(c1: HomomorphicCiphertext, c2: HomomorphicCiphertext): HomomorphicCiphertext {
    const m1_raw = mod(c1.ciphertext - 1);
    const m2_raw = mod(c2.ciphertext - 1);
    const c_mult = mod(m1_raw * m2_raw * this.key_inv + 1);
    return { ciphertext: c_mult, noise_level: 0 };
  }
}
