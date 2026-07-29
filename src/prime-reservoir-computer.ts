/**
 * prime-reservoir-computer.ts
 * =================================================================
 * Prime-Thread Reservoir Computing Engine over F_137.
 * Maps input character tokens to prime numbers and accumulates state S_n.
 * Dual coset orbits (C1, C2) serve as two distinct dynamical memory channels.
 * =================================================================
 */

import { MODULUS } from "./prime-thread-137";

// First 26 primes mapped to letters A-Z (or a-z)
export const ALPHABET_PRIMES: number[] = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29,
  31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
  73, 79, 83, 89, 97, 101
];

export interface ReservoirState {
  sequence: string;
  final_state: number;
  trajectory: number[];
  c1_energy: number;
  c2_energy: number;
}

/**
 * Map character 'a'-'z' or 'A'-'Z' to prime token.
 */
export function charToPrime(char: string): number {
  const code = char.toLowerCase().charCodeAt(0);
  if (code >= 97 && code <= 122) {
    return ALPHABET_PRIMES[code - 97];
  }
  return 103; // Fallback prime for space/punctuation
}

/**
 * Run input text string through Prime Thread Reservoir.
 */
export function runPrimeReservoir(text: string, initial_s = 3): ReservoirState {
  const trajectory: number[] = [initial_s];
  let curr = initial_s;
  let c1_count = 0;
  let c2_count = 0;

  for (let i = 0; i < text.length; i++) {
    const p = charToPrime(text[i]);
    curr = (2 * curr + p) % MODULUS;
    trajectory.push(curr);

    // Compute energy contribution to Coset C1 vs C2
    const u_val = (curr + 1) % MODULUS;
    if (u_val > 0) {
      if ((u_val * u_val) % MODULUS === 1) c1_count++;
      else c2_count++;
    }
  }

  return {
    sequence: text,
    final_state: curr,
    trajectory,
    c1_energy: c1_count,
    c2_energy: c2_count,
  };
}

/**
 * Classify language or category based on Reservoir final state feature vector.
 */
export function classifyTextReservoirFeature(text: string): number {
  const state = runPrimeReservoir(text);
  return (state.final_state * 31 + state.c1_energy * 7 + state.c2_energy) % MODULUS;
}
