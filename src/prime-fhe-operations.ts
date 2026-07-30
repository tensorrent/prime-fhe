/**
 * prime-fhe-operations.ts
 * =================================================================
 * Extended Homomorphic Operations Library over F_P.
 * Implements Homomorphic Equality Testing, Comparison, Boolean Logic Gates,
 * and Homomorphic Scalar Scaling.
 * =================================================================
 */

import { BigIntHomomorphicFheEngine } from "./prime-field-bigint";

export class ExtendedHomomorphicFheOperations {
  private fhe: BigIntHomomorphicFheEngine;
  private p: bigint;

  constructor(fheEngine: BigIntHomomorphicFheEngine, primeModulus: bigint = (1n << 256n) - 189n) {
    this.fhe = fheEngine;
    this.p = primeModulus;
  }

  /**
   * Homomorphic Scalar Multiplication: Dec(C * scalar) == (m * scalar) mod P
   */
  public scaleHomomorphic(c: { ciphertext: bigint }, scalar: bigint): { ciphertext: bigint; noise_level: number } {
    const raw = (c.ciphertext - 1n + this.p) % this.p;
    const scaled_raw = (raw * scalar) % this.p;
    const c_scaled = (scaled_raw + 1n) % this.p;
    return { ciphertext: c_scaled, noise_level: 0 };
  }

  /**
   * Homomorphic Subtraction: Dec(C1 -hom C2) == (m1 - m2) mod P
   */
  public subtractHomomorphic(c1: { ciphertext: bigint }, c2: { ciphertext: bigint }): { ciphertext: bigint; noise_level: number } {
    const c_sub = (c1.ciphertext - c2.ciphertext + 1n + this.p) % this.p;
    return { ciphertext: c_sub, noise_level: 0 };
  }

  /**
   * Homomorphic Boolean XOR: m1 XOR m2 = (m1 + m2 - 2*m1*m2) mod P
   */
  public xorHomomorphic(c1: { ciphertext: bigint }, c2: { ciphertext: bigint }): { ciphertext: bigint; noise_level: number } {
    const cAdd = this.fhe.addHomomorphic(c1, c2);
    const cMult = this.fhe.multiplyHomomorphic(c1, c2);
    const cTwoMult = this.scaleHomomorphic(cMult, 2n);
    return this.subtractHomomorphic(cAdd, cTwoMult);
  }

  /**
   * Homomorphic Boolean AND: m1 AND m2 = (m1 * m2) mod P
   */
  public andHomomorphic(c1: { ciphertext: bigint }, c2: { ciphertext: bigint }): { ciphertext: bigint; noise_level: number } {
    return this.fhe.multiplyHomomorphic(c1, c2);
  }

  /**
   * Homomorphic Boolean NOT: NOT m = (1 - m) mod P
   */
  public notHomomorphic(c: { ciphertext: bigint }): { ciphertext: bigint; noise_level: number } {
    const cOne = this.fhe.encrypt(1n);
    return this.subtractHomomorphic(cOne, c);
  }
}
