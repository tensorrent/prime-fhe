/**
 * prime-field-137.ts
 * =================================================================
 * Pure Finite Field Mathematics Primitive over F_137.
 * Implements field arithmetic, modular inverse, and O(1) Anti-Map.
 * =================================================================
 */

export const MODULUS = 137;
export const INVERSE_TWO = 69; // 2 * 69 = 138 = 1 mod 137

export function mod(n: number, m = MODULUS): number {
  return ((n % m) + m) % m;
}

export function modPow(base: number, exp: number, m = MODULUS): number {
  let res = 1;
  let b = mod(base, m);
  let e = exp;
  while (e > 0) {
    if (e % 2 === 1) res = mod(res * b, m);
    b = mod(b * b, m);
    e = Math.floor(e / 2);
  }
  return res;
}

export function modInverse(a: number, m = MODULUS): number {
  return modPow(a, m - 2, m);
}

/**
 * Affine Map: f(x) = (2x + 1) mod 137
 */
export function affineMap(x: number): number {
  return mod(2 * x + 1);
}

/**
 * Anti-Map Inverse: f^-1(y) = (y - 1) * 69 mod 137
 */
export function antiMap(y: number): number {
  return mod((y - 1) * INVERSE_TWO);
}
