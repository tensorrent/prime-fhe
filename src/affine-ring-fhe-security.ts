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
   * Scaling factor Δ. The plaintext lives in the HIGH bits and the noise in the
   * low ones, which is what makes rounding able to separate them.
   *
   * This is not decoration — it is the whole reason a noisy scheme can decrypt
   * at all. Without it, C·k⁻¹ = m + e·k⁻¹ mod P, and e·k⁻¹ is a full-range field
   * element however small e is, so the plaintext is unrecoverable. (The previous
   * implementation returned exactly that value; see the regression test.)
   */
  public readonly scale: bigint = 1n << 200n;

  /**
   * Noisy Affine LWE-style Encryption: C = k·(Δ·m + e) mod P.
   *
   * ⚠️ SECURITY NOTE, stated plainly: this is a ONE-DIMENSIONAL construction
   * with a tiny error relative to P. LWE hardness comes from lattice DIMENSION;
   * at dimension 1 with |e| < 2^10 in a 2^256 field there is no hardness to
   * appeal to. This path exists to make the noise/depth trade-off measurable —
   * it is NOT the security story.
   *
   * The secure path in this codebase is the uniform-mask protocol in
   * interactive-client-assisted-fhe.ts, which is information-theoretically
   * secret and, being noise-free, needs no bootstrapping at all.
   */
  public encryptNoisy(m: bigint, key: bigint, error: bigint): bigint {
    const plain = ((m % this.p) + this.p) % this.p;
    const k = ((key % this.p) + this.p) % this.p;
    const e = ((error % 1000n) + 1000n) % 1000n; // small noise bound
    return (k * ((this.scale * plain + e) % this.p)) % this.p;
  }

  /**
   * Decryption with noise rounding: m = round((C·k⁻¹ mod P) / Δ).
   *
   * Recovers m exactly while |e| < Δ/2 — that inequality IS the noise budget,
   * and it is what shrinks under homomorphic evaluation. Contrast the masked
   * protocol, where the mask is removed by exact subtraction and no budget
   * exists to exhaust.
   */
  public decryptNoisy(c: bigint, key: bigint, _errorBound = 1000n): bigint {
    const k_inv = this.modInverse(((key % this.p) + this.p) % this.p, this.p);
    const scaled = (c * k_inv) % this.p; // = Δ·m + e (mod P)
    // Round to nearest multiple of Δ rather than truncating, so an error that
    // pushes the value just below a boundary still lands on the right plaintext.
    return (scaled + this.scale / 2n) / this.scale;
  }

  /**
   * Remaining noise budget as a fraction of Δ/2 — how much evaluation the
   * ciphertext can still absorb before decryption fails. Exposed so the
   * bootstrapping cliff is measurable rather than theoretical.
   */
  public noiseBudgetRemaining(currentError: bigint): number {
    const ceiling = this.scale / 2n;
    const used = currentError < 0n ? -currentError : currentError;
    if (used >= ceiling) return 0;
    return Number(((ceiling - used) * 10000n) / ceiling) / 10000;
  }
}
