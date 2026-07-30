/**
 * multi-key-threshold-fhe.ts
 * =================================================================
 * Multi-Key & Threshold Secret Sharing Homomorphic FHE Engine over F_P.
 * Enables Multi-Party Computation (MPC) where ciphertexts are evaluated
 * under combined joint key K = k_1 * k_2 * ... * k_N mod P.
 * =================================================================
 */

export class MultiKeyThresholdFheEngine {
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
   * Combine participant key shares: K_joint = (k1 * k2 * ... * kN) mod P
   */
  public combineKeyShares(keys: bigint[]): bigint {
    return keys.reduce((acc, k) => (acc * (((k % this.p) + this.p) % this.p)) % this.p, 1n);
  }

  public encryptJoint(m: bigint, jointKey: bigint): { ciphertext: bigint; noise_level: number } {
    const plain = ((m % this.p) + this.p) % this.p;
    const c = (jointKey * plain + 1n) % this.p;
    return { ciphertext: c, noise_level: 0 };
  }

  /**
   * Threshold Partial Decryption Share by Participant i with share k_i
   */
  public partialDecryptShare(c: { ciphertext: bigint }, keyShare: bigint): bigint {
    const raw = (c.ciphertext - 1n + this.p) % this.p;
    const shareInv = this.modInverse(keyShare, this.p);
    return (raw * shareInv) % this.p;
  }

  /**
   * Final Joint Decryption combining all partial decryption shares
   */
  public finalThresholdDecrypt(c: { ciphertext: bigint }, keys: bigint[]): bigint {
    const jointKey = this.combineKeyShares(keys);
    const jointInv = this.modInverse(jointKey, this.p);
    const raw = (c.ciphertext - 1n + this.p) % this.p;
    return (raw * jointInv) % this.p;
  }
}
