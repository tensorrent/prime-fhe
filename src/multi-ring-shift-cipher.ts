/**
 * multi-ring-shift-cipher.ts
 * =================================================================
 * Encrypted-in-use evaluation by SHIFTING between two masked rings.
 *
 * The observation this is built on: which operation is free depends entirely on
 * how you mask.
 *
 *   ADDITIVE ring       C = k·m + r
 *     add / scalar      FREE — masks add, and they WRAP in F_P rather than
 *                       accumulating, so depth costs nothing
 *     multiply          needs a Beaver round (the cross terms k·m₁r₂ + k·m₂r₁
 *                       bind each plaintext to the other's mask)
 *
 *   MULTIPLICATIVE ring C = s·m
 *     multiply / power  FREE — the mask is just s₁s₂, exactly removable.
 *                       Unlimited multiplicative depth at ZERO interaction.
 *     add               impossible locally — s₁m₁ + s₂m₂ has no common mask
 *
 * So instead of paying one round per multiplication, you pay one round per
 * REGIME CHANGE. A circuit with 100 multiplies and 100 adds costs 2 rounds
 * instead of 100. Within a regime the server computes continuously on masked
 * values and never sees plaintext — that is the data-in-use property.
 *
 * WHY A SINGLE RING CANNOT DO BOTH. If add and multiply were both locally
 * exact-unmaskable, then c ↦ m would be a ring homomorphism F_P → F_P. On a
 * prime field the only such map is the identity, which forces mask = 0 — no
 * encryption at all. So "free within a regime, one round at the boundary" is
 * not a workaround to be optimised away later; it is the floor.
 *
 * ⚠️ THE MULTIPLICATIVE RING LEAKS ZERO. s·0 = 0 for every mask, so m = 0 is
 * distinguishable. Every other value is uniform. The ring is therefore safe on
 * the nonzero domain — which is exactly where it earns its keep (products,
 * powers, ratios, geometric aggregates). `encryptMultiplicative` refuses zero
 * rather than leaking it silently. Zero-bearing data belongs in the additive
 * ring, where the mask is uniform over all of F_P including zero.
 * =================================================================
 */

export type Ring = "additive" | "multiplicative";

/**
 * A masked value together with the mask its owner retains.
 * `mask` is r (an additive offset) or s (a multiplicative factor) by ring.
 */
export interface RingCiphertext {
  ring: Ring;
  ciphertext: bigint;
  mask: bigint;
}

/** What crosses the wire on a regime change: the server's ciphertext, in. */
export interface ShiftRequest {
  from: Ring;
  ciphertext: bigint;
}

export class MultiRingShiftCipher {
  private p: bigint;

  constructor(primeModulus: bigint = (1n << 256n) - 189n) {
    this.p = primeModulus;
  }

  private mod(x: bigint): bigint {
    return ((x % this.p) + this.p) % this.p;
  }

  private modPow(base: bigint, exp: bigint): bigint {
    let res = 1n;
    let b = this.mod(base);
    let e = exp;
    while (e > 0n) {
      if (e & 1n) res = (res * b) % this.p;
      b = (b * b) % this.p;
      e >>= 1n;
    }
    return res;
  }

  private modInverse(a: bigint): bigint {
    const v = this.mod(a);
    if (v === 0n) throw new Error("multi-ring: zero has no multiplicative inverse");
    return this.modPow(v, this.p - 2n);
  }

  private requireRing(c: RingCiphertext, ring: Ring, op: string): void {
    if (c.ring !== ring) {
      throw new Error(
        `multi-ring: ${op} requires the ${ring} ring, got ${c.ring}. ` +
          `Shift first (shiftRequest → clientShift), or the result is meaningless.`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Additive ring — add and scalar are free
  // ---------------------------------------------------------------------------

  /** C = k·m + r. Mask r uniform over ALL of F_P (zero included) and single-use. */
  public encryptAdditive(m: bigint, key: bigint, mask: bigint): RingCiphertext {
    return {
      ring: "additive",
      ciphertext: this.mod(this.mod(key) * this.mod(m) + this.mod(mask)),
      mask: this.mod(mask),
    };
  }

  public decryptAdditive(c: RingCiphertext, key: bigint): bigint {
    this.requireRing(c, "additive", "decryptAdditive");
    return this.mod(this.mod(c.ciphertext - c.mask) * this.modInverse(key));
  }

  /** Server-side addition. No interaction, exact, unbounded depth. */
  public add(c1: RingCiphertext, c2: RingCiphertext): RingCiphertext {
    this.requireRing(c1, "additive", "add");
    this.requireRing(c2, "additive", "add");
    return {
      ring: "additive",
      ciphertext: this.mod(c1.ciphertext + c2.ciphertext),
      mask: this.mod(c1.mask + c2.mask),
    };
  }

  /** Server-side multiplication by a PUBLIC scalar. No interaction. */
  public scalarMultiply(c: RingCiphertext, scalar: bigint): RingCiphertext {
    this.requireRing(c, "additive", "scalarMultiply");
    const k = this.mod(scalar);
    return {
      ring: "additive",
      ciphertext: this.mod(c.ciphertext * k),
      mask: this.mod(c.mask * k),
    };
  }

  // ---------------------------------------------------------------------------
  // Multiplicative ring — multiply and power are free
  // ---------------------------------------------------------------------------

  /**
   * C = s·m, mask s uniform over F_P* (nonzero).
   *
   * Refuses m = 0 and s = 0. Zero would produce ciphertext 0 under every mask,
   * which is a distinguishing leak, and a zero mask destroys the value. Failing
   * loudly here is the point — a silent leak is worse than an exception.
   */
  public encryptMultiplicative(m: bigint, mask: bigint): RingCiphertext {
    const v = this.mod(m);
    const s = this.mod(mask);
    if (v === 0n) {
      throw new Error(
        "multi-ring: the multiplicative ring leaks zero (s·0 = 0 under every mask). " +
          "Keep zero-bearing values in the additive ring.",
      );
    }
    if (s === 0n) throw new Error("multi-ring: multiplicative mask must be nonzero");
    return { ring: "multiplicative", ciphertext: this.mod(s * v), mask: s };
  }

  public decryptMultiplicative(c: RingCiphertext): bigint {
    this.requireRing(c, "multiplicative", "decryptMultiplicative");
    return this.mod(c.ciphertext * this.modInverse(c.mask));
  }

  /**
   * Server-side multiplication. FREE — no round, no growth, no budget. This is
   * the operation lattice FHE pays the most for and this ring gets for nothing.
   */
  public multiply(c1: RingCiphertext, c2: RingCiphertext): RingCiphertext {
    this.requireRing(c1, "multiplicative", "multiply");
    this.requireRing(c2, "multiplicative", "multiply");
    return {
      ring: "multiplicative",
      ciphertext: this.mod(c1.ciphertext * c2.ciphertext),
      mask: this.mod(c1.mask * c2.mask),
    };
  }

  /**
   * Server-side exponentiation by a PUBLIC exponent — m^e in O(log e), still
   * with no interaction. Repeated squaring, geometric aggregates and modular
   * exponentiation all land here at zero round cost.
   */
  public power(c: RingCiphertext, exponent: bigint): RingCiphertext {
    this.requireRing(c, "multiplicative", "power");
    if (exponent < 0n) throw new Error("multi-ring: power requires a non-negative exponent");
    return {
      ring: "multiplicative",
      ciphertext: this.modPow(c.ciphertext, exponent),
      mask: this.modPow(c.mask, exponent),
    };
  }

  // ---------------------------------------------------------------------------
  // The shift — one round per regime change
  // ---------------------------------------------------------------------------

  /**
   * Server: hand the ciphertext over for re-masking into the other ring. The
   * server holds no key and no mask, so it cannot shift on its own.
   */
  public shiftRequest(c: RingCiphertext): ShiftRequest {
    return { from: c.ring, ciphertext: c.ciphertext };
  }

  /**
   * Client: re-mask into the target ring under a FRESH mask.
   *
   * The client already holds the key and every mask, so it can always recover
   * the value — the shift discloses nothing to it that it did not already have,
   * and discloses nothing new to the server, which only ever sees masked values.
   * What the round actually buys is a change of algebraic representation.
   *
   * `currentMask` must be the mask the server's ciphertext currently carries.
   */
  public clientShift(
    req: ShiftRequest,
    to: Ring,
    key: bigint,
    currentMask: bigint,
    freshMask: bigint,
  ): RingCiphertext {
    const m =
      req.from === "additive"
        ? this.decryptAdditive({ ring: "additive", ciphertext: req.ciphertext, mask: currentMask }, key)
        : this.decryptMultiplicative({ ring: "multiplicative", ciphertext: req.ciphertext, mask: currentMask });

    return to === "additive"
      ? this.encryptAdditive(m, key, freshMask)
      : this.encryptMultiplicative(m, freshMask);
  }

  // ---------------------------------------------------------------------------
  // Planning
  // ---------------------------------------------------------------------------

  /**
   * Rounds required for a circuit, so the routing decision is arithmetic rather
   * than intuition.
   *
   * Beaver-only keeps everything in the additive ring: one round per multiply.
   * Two-ring pays one round per regime change instead. The crossover is at TWO
   * clustered multiplies — below that a single Beaver round is cheaper than a
   * shift out and back.
   */
  public planRounds(ops: Array<"add" | "multiply">): {
    beaverOnly: number;
    twoRing: number;
    recommend: "beaver-only" | "two-ring";
  } {
    const beaverOnly = ops.filter((o) => o === "multiply").length;

    let twoRing = 0;
    let ring: Ring = "additive";
    for (const op of ops) {
      const needed: Ring = op === "add" ? "additive" : "multiplicative";
      if (needed !== ring) {
        twoRing += 1;
        ring = needed;
      }
    }

    return {
      beaverOnly,
      twoRing,
      recommend: twoRing < beaverOnly ? "two-ring" : "beaver-only",
    };
  }
}
