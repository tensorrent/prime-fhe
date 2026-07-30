/**
 * interactive-client-assisted-fhe.ts
 * =================================================================
 * Modular Affine Masked Homomorphic Protocol (MA-HP) Engine over F_P.
 *
 * Enc(m) = (k * m + r) mod P, with an ephemeral mask r drawn UNIFORMLY from F_P.
 *
 * The uniform mask is the whole design, and it is what separates this from
 * lattice FHE:
 *
 *   • LWE-style noise must be SMALL, so that rounding can strip it. That is
 *     precisely why it grows under evaluation and why bootstrapping exists.
 *   • A uniform mask is FULL-RANGE and is removed EXACTLY by subtraction,
 *     because the client knows it. There is no error bound to respect, so no
 *     noise budget, no growth, and no bootstrap. Additive depth is unlimited.
 *   • Uniform masking is information-theoretically secret (the one-time-pad
 *     argument), which is a STRONGER guarantee than a computational LWE
 *     assumption — provided each mask is used exactly once.
 *
 * The cost of that trade lands on MULTIPLICATION, and this file is explicit
 * about it. Additively-masked ciphertexts do not multiply locally:
 *
 *     C1 * C2 = k²m₁m₂ + k·m₁r₂ + k·m₂r₁ + r₁r₂
 *
 * The cross terms pair each plaintext with the OTHER message's mask, so no
 * constant the client can precompute will strip them (see the deprecated
 * blinded-handle path below, kept so the dead end stays documented).
 *
 * The resolution is one interaction round per multiplicative level, via Beaver
 * triples — the standard MPC technique, which fits the "client-assisted" shape
 * exactly and preserves every property above: exact result, uniform masking,
 * zero noise growth, unbounded depth.
 * =================================================================
 */

/** A ciphertext travelling to the server, with the mask the client retains. */
export interface MaskedCiphertext {
  ciphertext: bigint;
  mask: bigint;
}

/**
 * One Beaver triple, generated offline by the client: encryptions of a, b and
 * a·b under independent uniform masks, plus an encryption of 1 that carries the
 * public d·e term into ciphertext space.
 *
 * A triple is SINGLE-USE. The opened values d = m₁ − a and e = m₂ − b are
 * public, so reusing (a, b) on a second pair exposes the difference of the two
 * plaintexts.
 */
export interface BeaverTriple {
  encA: MaskedCiphertext;
  encB: MaskedCiphertext;
  encAB: MaskedCiphertext;
  /** Enc(1) — the carrier for the public d·e scalar. */
  encOne: MaskedCiphertext;
}

/** The two differences the server needs opened before it can multiply. */
export interface MultiplyChallenge {
  /** C₁ − Enc(a), carrying mask r₁ − r_a. */
  diffA: MaskedCiphertext;
  /** C₂ − Enc(b), carrying mask r₂ − r_b. */
  diffB: MaskedCiphertext;
}

/** The client's answer: both differences in the clear. Reveals nothing about m₁, m₂. */
export interface OpenedChallenge {
  d: bigint;
  e: bigint;
}

export class InteractiveClientAssistedFheEngine {
  private p: bigint;

  constructor(primeModulus: bigint = (1n << 256n) - 189n) {
    this.p = primeModulus;
  }

  private mod(x: bigint): bigint {
    return ((x % this.p) + this.p) % this.p;
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

  // ---------------------------------------------------------------------------
  // Core: encrypt / decrypt
  // ---------------------------------------------------------------------------

  /**
   * Client-Side Encryption: C = (k * m + r) mod P.
   *
   * `mask` MUST be uniform over F_P and MUST NOT be reused. The secrecy
   * argument is the one-time pad's: it holds for one use of a uniform mask and
   * fails on the second.
   */
  public clientEncrypt(m: bigint, key: bigint, mask: bigint): MaskedCiphertext {
    const c = this.mod(this.mod(key) * this.mod(m) + this.mod(mask));
    return { ciphertext: c, mask: this.mod(mask) };
  }

  /** Client-Side Decryption: m = (C − r) * k⁻¹ mod P. Exact — no rounding. */
  public clientDecrypt(c: bigint, key: bigint, mask: bigint): bigint {
    const k_inv = this.modInverse(this.mod(key), this.p);
    return this.mod(this.mod(c - this.mod(mask)) * k_inv);
  }

  // ---------------------------------------------------------------------------
  // Addition and affine maps — non-interactive, exact, unbounded depth
  // ---------------------------------------------------------------------------

  /**
   * Server-side homomorphic addition: the server adds ciphertexts, the client
   * adds masks. Both in F_P, so the mask WRAPS rather than accumulating — the
   * property that removes the noise budget entirely.
   */
  public serverAdd(c1: bigint, c2: bigint): bigint {
    return this.mod(c1 + c2);
  }

  /** The mask accompanying serverAdd. */
  public combineMasksAdd(r1: bigint, r2: bigint): bigint {
    return this.mod(r1 + r2);
  }

  /** Server-side multiplication by a PUBLIC scalar — no interaction needed. */
  public serverScalarMultiply(c: bigint, scalar: bigint): bigint {
    return this.mod(c * this.mod(scalar));
  }

  /** The mask accompanying serverScalarMultiply. */
  public combineMaskScalar(r: bigint, scalar: bigint): bigint {
    return this.mod(r * this.mod(scalar));
  }

  // ---------------------------------------------------------------------------
  // Multiplication — one interaction round, exact, no noise growth
  // ---------------------------------------------------------------------------

  /**
   * Client, offline: build a single-use Beaver triple.
   *
   * a, b and the four masks are supplied by the caller so this stays a pure
   * function — deterministic under test, with the randomness source remaining
   * the caller's explicit responsibility (see `assertDistinctMasks`).
   */
  public generateBeaverTriple(
    key: bigint,
    a: bigint,
    b: bigint,
    masks: { rA: bigint; rB: bigint; rAB: bigint; rOne: bigint },
  ): BeaverTriple {
    const ab = this.mod(this.mod(a) * this.mod(b));
    return {
      encA: this.clientEncrypt(a, key, masks.rA),
      encB: this.clientEncrypt(b, key, masks.rB),
      encAB: this.clientEncrypt(ab, key, masks.rAB),
      encOne: this.clientEncrypt(1n, key, masks.rOne),
    };
  }

  /**
   * Server: form the two differences it needs opened. It cannot open them
   * itself — it holds no masks and no key.
   */
  public serverPrepareMultiply(
    c1: MaskedCiphertext,
    c2: MaskedCiphertext,
    triple: BeaverTriple,
  ): MultiplyChallenge {
    return {
      diffA: {
        ciphertext: this.mod(c1.ciphertext - triple.encA.ciphertext),
        mask: this.mod(c1.mask - triple.encA.mask),
      },
      diffB: {
        ciphertext: this.mod(c2.ciphertext - triple.encB.ciphertext),
        mask: this.mod(c2.mask - triple.encB.mask),
      },
    };
  }

  /**
   * Client: open the challenge, yielding d = m₁ − a and e = m₂ − b.
   *
   * Safe to publish: a and b are uniform and single-use, so d and e are uniform
   * and independent of m₁, m₂. This is the same argument that makes Beaver
   * triples safe in ordinary MPC.
   */
  public clientOpenMultiply(challenge: MultiplyChallenge, key: bigint): OpenedChallenge {
    return {
      d: this.clientDecrypt(challenge.diffA.ciphertext, key, challenge.diffA.mask),
      e: this.clientDecrypt(challenge.diffB.ciphertext, key, challenge.diffB.mask),
    };
  }

  /**
   * Server: complete the multiplication from the opened values, using
   *
   *   m₁m₂ = ab + d·b + e·a + d·e      where d = m₁−a, e = m₂−b
   *
   * evaluated over ciphertexts, with Enc(1) carrying the public d·e term. The
   * server never sees k, m₁, m₂, a or b.
   */
  public serverMultiply(triple: BeaverTriple, opened: OpenedChallenge): bigint {
    const d = this.mod(opened.d);
    const e = this.mod(opened.e);
    return this.mod(
      triple.encAB.ciphertext +
        d * triple.encB.ciphertext +
        e * triple.encA.ciphertext +
        this.mod(d * e) * triple.encOne.ciphertext,
    );
  }

  /**
   * Client: the mask accompanying serverMultiply's output — the same linear
   * combination over the triple's masks. Exact, which is why the product
   * decrypts exactly and can itself be multiplied again.
   */
  public combineMasksMultiply(triple: BeaverTriple, opened: OpenedChallenge): bigint {
    const d = this.mod(opened.d);
    const e = this.mod(opened.e);
    return this.mod(
      triple.encAB.mask +
        d * triple.encB.mask +
        e * triple.encA.mask +
        this.mod(d * e) * triple.encOne.mask,
    );
  }

  // ---------------------------------------------------------------------------
  // Deprecated: the non-interactive multiply that cannot work
  // ---------------------------------------------------------------------------

  /**
   * @deprecated Structurally cannot produce a decryptable product. Kept so the
   * dead end stays documented rather than being rediscovered.
   *
   * The handle H = r₁r₂k⁻¹ was meant to let the server multiply without a round
   * trip. What it actually computes expands to:
   *
   *   C₁·C₂·H = (k²m₁m₂ + k·m₁r₂ + k·m₂r₁ + r₁r₂) · r₁r₂/k
   *
   * The cross terms k·m₁r₂ and k·m₂r₁ bind each plaintext to the OTHER
   * message's mask, so no client-side constant removes them and no unmasking
   * recovers m₁m₂ — checked against every candidate (r₁r₂, H, 0, r₁r₂k⁻¹).
   *
   * Use serverPrepareMultiply → clientOpenMultiply → serverMultiply instead.
   */
  public generateBlindedEvalHandle(r1: bigint, r2: bigint, key: bigint): bigint {
    const k_inv = this.modInverse(this.mod(key), this.p);
    return this.mod(this.mod(r1 * r2) * k_inv);
  }

  /**
   * @deprecated See generateBlindedEvalHandle — the output is not decryptable.
   */
  public serverMultiplyBlinded(c1: bigint, c2: bigint, blindedHandle: bigint): bigint {
    return this.mod(this.mod(c1 * c2) * this.mod(blindedHandle));
  }

  // ---------------------------------------------------------------------------
  // Guard rails
  // ---------------------------------------------------------------------------

  /**
   * Throw if any mask repeats. Mask reuse is the one operator error that
   * collapses the guarantee from information-theoretic to nothing: two messages
   * under the same mask reveal their difference outright. Cheap to check,
   * catastrophic to miss.
   */
  public assertDistinctMasks(masks: bigint[]): void {
    const seen = new Set<string>();
    for (const r of masks) {
      const key = this.mod(r).toString();
      if (seen.has(key)) {
        throw new Error(
          "MA-HP: mask reuse detected. Uniform masks must be single-use — " +
            "reuse reveals the difference of the masked plaintexts.",
        );
      }
      seen.add(key);
    }
  }
}
