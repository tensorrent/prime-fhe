/**
 * prime-thread-137.ts
 * =================================================================
 * Implementation of the Prime Thread Scroll & Affine Anti-Map Engine (F_137).
 * =================================================================
 */

export const MODULUS = 137;
export const FIXED_POINT = 136; // -1 mod 137
export const INVERSE_TWO = 69; // 2^-1 mod 137

export interface StepRecord {
  step: number;
  u: number;
  x: number;
  gap: number;
  is_prime: boolean;
}

export function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

export function forwardStep(x: number): number {
  return (2 * x + 1) % MODULUS;
}

export function antiMapStep(y: number): number {
  return ((((y - 1) % MODULUS) + MODULUS) * INVERSE_TWO) % MODULUS;
}

/**
 * Generate full 68-step orbit starting from u0 (1 for C1, 3 for C2).
 */
export function generateOrbit137(u0: number): StepRecord[] {
  const orbit: StepRecord[] = [];
  let curr_u = u0 % MODULUS;

  for (let n = 0; n < 68; n++) {
    const x = (((curr_u - 1) % MODULUS) + MODULUS) % MODULUS;
    orbit.push({
      step: n,
      u: curr_u,
      x,
      gap: curr_u,
      is_prime: isPrime(x),
    });
    curr_u = (curr_u * 2) % MODULUS;
  }
  return orbit;
}

/**
 * Non-commutative Affine Accumulator over prime inputs.
 */
export function accumulateState(S0: number, primes: number[]): number[] {
  const history: number[] = [S0];
  let curr = S0;

  for (let i = 1; i < primes.length; i++) {
    curr = (2 * curr + primes[i]) % MODULUS;
    history.push(curr);
  }
  return history;
}

/**
 * Reverse non-commutative accumulator step-by-step using Anti-Map.
 */
export function reverseState(Sk: number, primes: number[]): number[] {
  const revHistory: number[] = [Sk];
  let curr = Sk;

  for (let i = primes.length - 1; i > 0; i--) {
    const p = primes[i];
    curr = (((curr - p) % MODULUS + MODULUS) * INVERSE_TWO) % MODULUS;
    revHistory.push(curr);
  }
  return revHistory;
}
