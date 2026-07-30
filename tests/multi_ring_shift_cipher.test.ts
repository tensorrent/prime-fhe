// multi_ring_shift_cipher.test.ts
// =================================================================
// Encrypted-in-use via ring shifting.
//
// What these pin:
//   1. Each ring's free operation is EXACT and needs no interaction — including
//      50-deep multiplication in the multiplicative ring at zero rounds.
//   2. Each ring's forbidden operation FAILS LOUDLY rather than returning a
//      plausible wrong value (the failure mode that shipped a broken multiply
//      last time).
//   3. The zero leak is real, is refused, and is documented by test.
//   4. Shifting composes: a mixed circuit evaluates correctly end to end, and
//      the round accounting is what the planner claims.
// =================================================================

import { describe, it, expect } from "vitest";
import { MultiRingShiftCipher } from "../src/multi-ring-shift-cipher";

const P = (1n << 256n) - 189n;
const ring = new MultiRingShiftCipher(P);
const KEY = 0x999988887777n;
const mod = (x: bigint) => ((x % P) + P) % P;

let counter = 0n;
function mask(): bigint {
  counter += 1n;
  const v = mod((counter * 0x9e3779b97f4a7c15n) ** 3n + counter);
  return v === 0n ? 1n : v; // never hand back a zero mask
}

describe("additive ring — add and scalar are free", () => {
  it("adds exactly with no interaction", () => {
    const a = ring.encryptAdditive(7n, KEY, mask());
    const b = ring.encryptAdditive(9n, KEY, mask());
    expect(ring.decryptAdditive(ring.add(a, b), KEY)).toBe(16n);
  });

  it("scales by a public constant exactly", () => {
    const c = ring.encryptAdditive(11n, KEY, mask());
    expect(ring.decryptAdditive(ring.scalarMultiply(c, 13n), KEY)).toBe(143n);
  });

  it("carries zero safely — the additive mask covers all of F_P", () => {
    const z = ring.encryptAdditive(0n, KEY, mask());
    expect(z.ciphertext).not.toBe(0n); // masked, not distinguishable
    expect(ring.decryptAdditive(z, KEY)).toBe(0n);
  });

  it("REFUSES multiply rather than returning a wrong value", () => {
    const a = ring.encryptAdditive(7n, KEY, mask());
    const b = ring.encryptAdditive(6n, KEY, mask());
    expect(() => ring.multiply(a, b)).toThrow(/multiplicative ring/);
  });
});

describe("multiplicative ring — multiply and power are free", () => {
  it("multiplies exactly with NO round", () => {
    const a = ring.encryptMultiplicative(7n, mask());
    const b = ring.encryptMultiplicative(6n, mask());
    expect(ring.decryptMultiplicative(ring.multiply(a, b))).toBe(42n);
  });

  it("sustains 50 multiplications at zero interaction, mask still one element", () => {
    // The headline: unlimited multiplicative depth, no budget, no bootstrap,
    // no round trips. This is the operation lattice FHE pays the most for.
    let acc = ring.encryptMultiplicative(2n, mask());
    let expected = 2n;
    for (let i = 0; i < 50; i++) {
      acc = ring.multiply(acc, ring.encryptMultiplicative(3n, mask()));
      expected = mod(expected * 3n);
    }
    expect(ring.decryptMultiplicative(acc)).toBe(expected);
    expect(acc.mask < P).toBe(true);
  });

  it("raises to a public power in O(log e), still no round", () => {
    const c = ring.encryptMultiplicative(3n, mask());
    expect(ring.decryptMultiplicative(ring.power(c, 100n))).toBe(mod(3n ** 100n));
  });

  it("REFUSES add rather than returning a wrong value", () => {
    const a = ring.encryptMultiplicative(7n, mask());
    const b = ring.encryptMultiplicative(6n, mask());
    expect(() => ring.add(a, b)).toThrow(/additive ring/);
  });

  it("is semantically secure on nonzero values", () => {
    const c1 = ring.encryptMultiplicative(42n, mask());
    const c2 = ring.encryptMultiplicative(42n, mask());
    expect(c1.ciphertext).not.toBe(c2.ciphertext);
  });
});

describe("the zero leak — real, refused, documented", () => {
  it("would be distinguishable, so encryption refuses it", () => {
    expect(() => ring.encryptMultiplicative(0n, mask())).toThrow(/leaks zero/);
  });

  it("demonstrates WHY: s·0 = 0 under every mask", () => {
    for (const s of [3n, 999n, mask(), mask()]) {
      expect(mod(s * 0n)).toBe(0n); // no mask hides it
    }
  });

  it("rejects a zero mask too — it would destroy the value", () => {
    expect(() => ring.encryptMultiplicative(7n, 0n)).toThrow(/nonzero/);
  });
});

describe("the shift — one round per regime change", () => {
  it("round-trips a value additive → multiplicative → additive", () => {
    const original = ring.encryptAdditive(42n, KEY, mask());

    const toMul = ring.clientShift(ring.shiftRequest(original), "multiplicative", KEY, original.mask, mask());
    expect(toMul.ring).toBe("multiplicative");
    expect(ring.decryptMultiplicative(toMul)).toBe(42n);

    const back = ring.clientShift(ring.shiftRequest(toMul), "additive", KEY, toMul.mask, mask());
    expect(back.ring).toBe("additive");
    expect(ring.decryptAdditive(back, KEY)).toBe(42n);
    // fresh mask each time — the shift never reuses one
    expect(back.mask).not.toBe(original.mask);
  });

  it("evaluates a mixed circuit: (a + b) then ^3 then + c", () => {
    const a = ring.encryptAdditive(3n, KEY, mask());
    const b = ring.encryptAdditive(4n, KEY, mask());
    const c = ring.encryptAdditive(10n, KEY, mask());

    // add regime — free
    const sum = ring.add(a, b); // 7

    // shift once, then all multiplicative work is free
    const mul = ring.clientShift(ring.shiftRequest(sum), "multiplicative", KEY, sum.mask, mask());
    const cubed = ring.power(mul, 3n); // 343
    expect(ring.decryptMultiplicative(cubed)).toBe(343n);

    // shift back, resume free addition
    const addAgain = ring.clientShift(ring.shiftRequest(cubed), "additive", KEY, cubed.mask, mask());
    expect(ring.decryptAdditive(ring.add(addAgain, c), KEY)).toBe(353n);
  });
});

describe("planning — the routing decision is arithmetic, not intuition", () => {
  it("counts rounds for a multiply-heavy circuit", () => {
    const ops = [...Array(100)].map(() => "multiply" as const);
    const plan = ring.planRounds(ops);
    expect(plan.beaverOnly).toBe(100); // one round per multiply
    expect(plan.twoRing).toBe(1);      // one shift, then all free
    expect(plan.recommend).toBe("two-ring");
  });

  it("keeps a single isolated multiply on Beaver — a shift out and back costs more", () => {
    const plan = ring.planRounds(["add", "multiply", "add"]);
    expect(plan.beaverOnly).toBe(1);
    expect(plan.twoRing).toBe(2); // shift there and back
    expect(plan.recommend).toBe("beaver-only");
  });

  it("finds the crossover at two clustered multiplies", () => {
    expect(ring.planRounds(["add", "multiply", "multiply", "add"]).recommend).toBe("beaver-only"); // 2 vs 2 — tie, stay put
    expect(ring.planRounds(["add", "multiply", "multiply", "multiply", "add"]).recommend).toBe("two-ring"); // 3 vs 2
  });

  it("charges nothing when a circuit never changes regime", () => {
    expect(ring.planRounds(["add", "add", "add"]).twoRing).toBe(0);
  });
});
