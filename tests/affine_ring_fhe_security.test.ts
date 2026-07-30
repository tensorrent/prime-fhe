// affine_ring_fhe_security.test.ts
// =================================================================
// The NOISY path — kept honest about what it is.
//
// Its role in this codebase is comparative: it makes the noise/depth trade-off
// MEASURABLE next to the uniform-mask protocol, which has no budget to exhaust.
// It is explicitly NOT the security story (dimension 1, tiny error relative to
// P — no lattice hardness to appeal to), and these tests assert that rather
// than only asserting it in prose.
//
// The previous suite checked only `c > 0n`, which stayed green while
// decryptNoisy returned a value that was not the plaintext at all.
// =================================================================

import { describe, it, expect } from "vitest";
import { NoisyAffineLweEngine } from "../src/affine-ring-fhe-security";

const P = (1n << 256n) - 189n;
const engine = new NoisyAffineLweEngine(P);
const KEY = 0x987654321fedcba0987654321fedcba0n;

describe("noisy affine — decryption actually recovers the plaintext", () => {
  it("round-trips through the noise (regression: it used to return a full-range value)", () => {
    for (const m of [0n, 1n, 42n, 1000n, 424242n]) {
      expect(engine.decryptNoisy(engine.encryptNoisy(m, KEY, 777n), KEY)).toBe(m);
    }
  });

  it("tolerates every error inside the budget", () => {
    for (const e of [0n, 1n, 17n, 499n, 999n]) {
      expect(engine.decryptNoisy(engine.encryptNoisy(42n, KEY, e), KEY)).toBe(42n);
    }
  });

  it("SCALING is what makes it work — without Δ the plaintext is unrecoverable", () => {
    // Reproduce the old behaviour exactly: no scaling, return C·k⁻¹ directly.
    const modPow = (b: bigint, x: bigint): bigint => {
      let r = 1n, base = ((b % P) + P) % P, e = x;
      while (e > 0n) { if (e & 1n) r = (r * base) % P; base = (base * base) % P; e >>= 1n; }
      return r;
    };
    const m = 42n, e = 777n;
    const unscaled = (KEY * m + e) % P;                 // old encryptNoisy
    const raw = (unscaled * modPow(KEY, P - 2n)) % P;   // old decryptNoisy
    expect(raw).not.toBe(m);                            // ← the bug, pinned
    // e·k⁻¹ is a full-range field element however small e is. That is why Δ
    // (plaintext in the high bits, noise in the low ones) is not optional.
    expect(raw > 1n << 200n).toBe(true);
  });
});

describe("the noise budget — the cost this path pays and the mask path does not", () => {
  it("reports a budget that shrinks as error grows", () => {
    expect(engine.noiseBudgetRemaining(0n)).toBeCloseTo(1, 3);
    expect(engine.noiseBudgetRemaining(engine.scale / 4n)).toBeCloseTo(0.5, 3);
    expect(engine.noiseBudgetRemaining(engine.scale)).toBe(0); // exhausted
  });

  it("decryption FAILS once error exceeds Δ/2 — the bootstrapping cliff, made concrete", () => {
    // Hand-build a ciphertext whose error has grown past the budget, as repeated
    // homomorphic evaluation would do in a real lattice scheme.
    const m = 42n;
    const overBudget = engine.scale; // > Δ/2
    const c = (KEY * ((engine.scale * m + overBudget) % P)) % P;
    expect(engine.decryptNoisy(c, KEY)).not.toBe(m);
    // This is the point where a lattice scheme must bootstrap. The uniform-mask
    // protocol never reaches it, because there is no budget to spend.
  });
});
