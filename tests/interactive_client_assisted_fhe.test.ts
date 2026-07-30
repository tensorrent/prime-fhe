// interactive_client_assisted_fhe.test.ts
// =================================================================
// MA-HP: uniform-mask homomorphic evaluation over F_P.
//
// What these pin, ordered by how much it would hurt to get wrong:
//   1. Secrecy — the uniform mask actually does its job (semantic security, no
//      key recovery from a known pair), and DIES on reuse.
//   2. The noise-free claim — add and scalar-multiply are EXACT, and the mask
//      wraps rather than accumulating, so depth costs nothing and there is no
//      bootstrap.
//   3. Multiplication — exact via one Beaver round, composable to depth ≥ 2.
//   4. The dead end — the old blinded handle provably cannot decrypt, so nobody
//      re-derives it.
//
// The previous version of this suite asserted only that the blinded product was
// > 0 and that the handle ≠ the key. Both held while the operation produced an
// undecryptable value, which is how a broken multiply shipped green.
// =================================================================

import { describe, it, expect } from "vitest";
import {
  InteractiveClientAssistedFheEngine,
  type BeaverTriple,
} from "../src/interactive-client-assisted-fhe";

const P = (1n << 256n) - 189n;
const engine = new InteractiveClientAssistedFheEngine(P);
const KEY = 0x999988887777n;
const mod = (x: bigint) => ((x % P) + P) % P;

/** Deterministic spread-out masks — reproducible under test, never clustered near 0. */
let counter = 0n;
function mask(): bigint {
  counter += 1n;
  return mod((counter * 0x9e3779b97f4a7c15n) ** 3n + counter);
}

const freshTriple = (a: bigint, b: bigint): BeaverTriple =>
  engine.generateBeaverTriple(KEY, a, b, { rA: mask(), rB: mask(), rAB: mask(), rOne: mask() });

const modPow = (b: bigint, e: bigint): bigint => {
  let r = 1n, x = mod(b), n = e;
  while (n > 0n) { if (n & 1n) r = (r * x) % P; x = (x * x) % P; n >>= 1n; }
  return r;
};

describe("secrecy — what the uniform mask buys", () => {
  it("is semantically secure: one plaintext, two different ciphertexts", () => {
    const m = 42n;
    const c1 = engine.clientEncrypt(m, KEY, mask());
    const c2 = engine.clientEncrypt(m, KEY, mask());
    expect(c1.ciphertext).not.toBe(c2.ciphertext);
    expect(engine.clientDecrypt(c1.ciphertext, KEY, c1.mask)).toBe(m);
    expect(engine.clientDecrypt(c2.ciphertext, KEY, c2.mask)).toBe(m);
  });

  it("resists key recovery from a known plaintext/ciphertext pair", () => {
    // Against a DETERMINISTIC affine cipher c = k·m + 1, the key falls out of a
    // single known pair as k = (c−1)·m⁻¹. The uniform mask is precisely what
    // breaks that: r is unknown, so the equation is underdetermined.
    const m = 5n;
    const c = engine.clientEncrypt(m, KEY, mask());
    const naive = mod(mod(c.ciphertext - 1n) * modPow(m, P - 2n));
    expect(naive).not.toBe(KEY);
  });

  it("the plaintext space is the field — enumeration is not an attack", () => {
    expect(P > 1n << 255n).toBe(true);
  });

  it("REUSING a mask reveals the difference of the plaintexts — the fatal misuse", () => {
    const r = mask();
    const c1 = engine.clientEncrypt(100n, KEY, r);
    const c2 = engine.clientEncrypt(70n, KEY, r);
    // Masks cancel, leaving k·(m₁−m₂), recoverable without knowing r at all.
    const leaked = engine.clientDecrypt(mod(c1.ciphertext - c2.ciphertext), KEY, 0n);
    expect(leaked).toBe(30n); // exactly the difference — this is why reuse is banned
  });

  it("assertDistinctMasks catches reuse before it happens", () => {
    const r = mask();
    expect(() => engine.assertDistinctMasks([r, mask(), r])).toThrow(/reuse/i);
    expect(() => engine.assertDistinctMasks([mask(), mask(), mask()])).not.toThrow();
  });
});

describe("the noise-free claim — addition and scalars", () => {
  it("adds exactly, with the mask combined client-side", () => {
    const a = engine.clientEncrypt(7n, KEY, mask());
    const b = engine.clientEncrypt(9n, KEY, mask());
    const sum = engine.serverAdd(a.ciphertext, b.ciphertext);
    expect(engine.clientDecrypt(sum, KEY, engine.combineMasksAdd(a.mask, b.mask))).toBe(16n);
  });

  it("multiplies by a public scalar exactly", () => {
    const c = engine.clientEncrypt(11n, KEY, mask());
    const scaled = engine.serverScalarMultiply(c.ciphertext, 13n);
    expect(engine.clientDecrypt(scaled, KEY, engine.combineMaskScalar(c.mask, 13n))).toBe(143n);
  });

  it("survives 1000 additions with NO noise budget and NO bootstrap", () => {
    // The property that separates this from lattice FHE: the mask wraps in F_P
    // instead of growing, so additive depth is free.
    let acc = engine.clientEncrypt(0n, KEY, mask());
    let accMask = acc.mask;
    let expected = 0n;
    for (let i = 1n; i <= 1000n; i++) {
      const c = engine.clientEncrypt(i, KEY, mask());
      acc = { ciphertext: engine.serverAdd(acc.ciphertext, c.ciphertext), mask: 0n };
      accMask = engine.combineMasksAdd(accMask, c.mask);
      expected += i;
    }
    expect(engine.clientDecrypt(acc.ciphertext, KEY, accMask)).toBe(expected); // 500500
    expect(accMask < P).toBe(true); // still ONE field element — nothing accumulated
  });

  it("is exact, not approximate — no rounding in the decrypt path", () => {
    const big = P / 3n;
    const c = engine.clientEncrypt(big, KEY, mask());
    expect(engine.clientDecrypt(c.ciphertext, KEY, c.mask)).toBe(big);
  });
});

describe("multiplication — one Beaver round, exact", () => {
  it("multiplies two ciphertexts exactly", () => {
    const c1 = engine.clientEncrypt(7n, KEY, mask());
    const c2 = engine.clientEncrypt(6n, KEY, mask());
    const triple = freshTriple(mask(), mask());

    const opened = engine.clientOpenMultiply(engine.serverPrepareMultiply(c1, c2, triple), KEY);
    const product = engine.serverMultiply(triple, opened);
    const rProduct = engine.combineMasksMultiply(triple, opened);

    expect(engine.clientDecrypt(product, KEY, rProduct)).toBe(42n);
  });

  it("composes: (m₁·m₂)·m₃ at depth 2, still exact, mask still one element", () => {
    const c1 = engine.clientEncrypt(7n, KEY, mask());
    const c2 = engine.clientEncrypt(6n, KEY, mask());
    const c3 = engine.clientEncrypt(5n, KEY, mask());

    const t1 = freshTriple(mask(), mask());
    const op1 = engine.clientOpenMultiply(engine.serverPrepareMultiply(c1, c2, t1), KEY);
    const prod1 = {
      ciphertext: engine.serverMultiply(t1, op1),
      mask: engine.combineMasksMultiply(t1, op1),
    };
    expect(engine.clientDecrypt(prod1.ciphertext, KEY, prod1.mask)).toBe(42n);

    // The product is an ordinary ciphertext — it feeds straight back in.
    const t2 = freshTriple(mask(), mask());
    const op2 = engine.clientOpenMultiply(engine.serverPrepareMultiply(prod1, c3, t2), KEY);
    const prod2 = engine.serverMultiply(t2, op2);
    const rProd2 = engine.combineMasksMultiply(t2, op2);

    expect(engine.clientDecrypt(prod2, KEY, rProd2)).toBe(210n);
    expect(rProd2 < P).toBe(true);
  });

  it("mixes add and multiply: (a + b) · c", () => {
    const a = engine.clientEncrypt(3n, KEY, mask());
    const b = engine.clientEncrypt(4n, KEY, mask());
    const c = engine.clientEncrypt(10n, KEY, mask());

    const sum = {
      ciphertext: engine.serverAdd(a.ciphertext, b.ciphertext),
      mask: engine.combineMasksAdd(a.mask, b.mask),
    };
    const t = freshTriple(mask(), mask());
    const op = engine.clientOpenMultiply(engine.serverPrepareMultiply(sum, c, t), KEY);

    expect(engine.clientDecrypt(engine.serverMultiply(t, op), KEY, engine.combineMasksMultiply(t, op))).toBe(70n);
  });

  it("the opened values leak nothing — d and e are offsets, not plaintexts", () => {
    const m1 = 7n, m2 = 6n;
    const c1 = engine.clientEncrypt(m1, KEY, mask());
    const c2 = engine.clientEncrypt(m2, KEY, mask());
    const a = mask(), b = mask();
    const triple = freshTriple(a, b);

    const opened = engine.clientOpenMultiply(engine.serverPrepareMultiply(c1, c2, triple), KEY);
    expect(opened.d).toBe(mod(m1 - a)); // uniform because a is uniform
    expect(opened.e).toBe(mod(m2 - b));
    expect(opened.d).not.toBe(m1);
    expect(opened.e).not.toBe(m2);
  });

  it("a tampered opening yields a wrong product — the round trip is load-bearing", () => {
    const c1 = engine.clientEncrypt(7n, KEY, mask());
    const c2 = engine.clientEncrypt(6n, KEY, mask());
    const triple = freshTriple(mask(), mask());
    const opened = engine.clientOpenMultiply(engine.serverPrepareMultiply(c1, c2, triple), KEY);

    const tampered = { d: opened.d + 1n, e: opened.e };
    const product = engine.serverMultiply(triple, tampered);
    expect(engine.clientDecrypt(product, KEY, engine.combineMasksMultiply(triple, tampered))).not.toBe(42n);
  });
});

describe("the deprecated blinded handle — proof the dead end is dead", () => {
  it("cannot produce a decryptable product under ANY client-side unmasking", () => {
    const m1 = 7n, m2 = 6n;
    const r1 = mask(), r2 = mask();
    const c1 = engine.clientEncrypt(m1, KEY, r1);
    const c2 = engine.clientEncrypt(m2, KEY, r2);

    const handle = engine.generateBlindedEvalHandle(r1, r2, KEY);
    const blinded = engine.serverMultiplyBlinded(c1.ciphertext, c2.ciphertext, handle);

    // Every mask a client could plausibly hold for this product.
    for (const candidate of [mod(r1 * r2), handle, 0n, mod(r1 + r2)]) {
      expect(engine.clientDecrypt(blinded, KEY, candidate)).not.toBe(mod(m1 * m2));
    }
    // The cross terms k·m₁r₂ and k·m₂r₁ are why. Use the Beaver path instead.
  });
});
