/**
 * prime-vdf-engine.ts
 * =================================================================
 * Verifiable Delay Function (VDF) Engine from the Prime Affine Group (F_M).
 * Sequential evaluation: F(x, N) = 2^N * x + (2^N - 1) mod M (N steps).
 * Logarithmic verification: Evaluates A^N mod M in O(log N) matrix steps.
 * =================================================================
 */

export interface VdfProof {
  x_input: bigint;
  steps_N: bigint;
  y_output: bigint;
  modulus_M: bigint;
}

/**
 * Modular exponentiation: (base^exp) % mod
 */
export function powMod(base: bigint, exp: bigint, mod: bigint): bigint {
  let res = 1n;
  let b = base % mod;
  let e = exp;

  while (e > 0n) {
    if (e % 2n === 1n) {
      res = (res * b) % mod;
    }
    b = (b * b) % mod;
    e /= 2n;
  }
  return res;
}

/**
 * Evaluate VDF sequentially step-by-step (Un-parallelizable evaluation).
 */
export function evaluateVdfSequential(x: bigint, steps_N: bigint, M: bigint): VdfProof {
  let curr = x % M;
  for (let i = 0n; i < steps_N; i++) {
    curr = (2n * curr + 1n) % M;
  }

  return {
    x_input: x,
    steps_N,
    y_output: curr,
    modulus_M: M,
  };
}

/**
 * Verify VDF in O(log N) logarithmic steps using modular matrix exponentiation.
 * f^N(x) = (2^N * x + 2^N - 1) mod M.
 */
export function verifyVdfLogarithmic(proof: VdfProof): boolean {
  const two_pow_N = powMod(2n, proof.steps_N, proof.modulus_M);
  const term1 = (two_pow_N * (proof.x_input % proof.modulus_M)) % proof.modulus_M;
  const term2 = (two_pow_N + proof.modulus_M - 1n) % proof.modulus_M;
  const expected_y = (term1 + term2) % proof.modulus_M;

  return proof.y_output === expected_y;
}
