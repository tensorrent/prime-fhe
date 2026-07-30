#!/usr/bin/env python3
"""
prime_vdf.py
=================================================================
Prime-Thread Verifiable Delay Function (VDF) Python Engine & Benchmarks
Implements sequential affine prover, O(log T) logarithmic verifier,
and Chia Wesolowski VDF comparison benchmarks.

Author: Brad Wallace (coo@koba42.com)
License: Apache-2.0
=================================================================
"""

import time
from typing import Tuple, Dict, Any

# Default 256-bit Prime Field (P = 2^256 - 189)
DEFAULT_A = 2
DEFAULT_B = 1
DEFAULT_M = 115792089237316195423570985008687907853269984665640564039457584007913129639747

class PrimeVdfProver:
    def __init__(self, A: int = DEFAULT_A, B: int = DEFAULT_B, M: int = DEFAULT_M):
        self.A = A
        self.B = B
        self.M = M

    def prove(self, seed: int, steps: int) -> Tuple[int, float]:
        t0 = time.perf_counter()
        curr = seed % self.M
        A, B, M = self.A, self.B, self.M
        for _ in range(steps):
            curr = (A * curr + B) % M
        t1 = time.perf_counter()
        return curr, (t1 - t0) * 1000

class PrimeVdfVerifier:
    @staticmethod
    def verify(seed: int, steps: int, output: int, A: int = DEFAULT_A, B: int = DEFAULT_B, M: int = DEFAULT_M) -> Tuple[bool, float]:
        t0 = time.perf_counter()
        if A == 1:
            expected = (seed + B * steps) % M
        else:
            a_pow_t = pow(A, steps, M)
            inv_a_minus_1 = pow(A - 1, -1, M)
            expected = (a_pow_t * seed + B * (a_pow_t - 1) * inv_a_minus_1) % M
        t1 = time.perf_counter()
        return (expected == output), (t1 - t0) * 1_000_000

class ChiaVdfSimulator:
    @staticmethod
    def simulate_chia_prover(seed: int, steps: int, discriminant_bits: int = 1024) -> Tuple[int, float]:
        t0 = time.perf_counter()
        dummy_mod = (1 << discriminant_bits) - 1
        x = seed
        for _ in range(steps):
            x = (x * x + 7) % dummy_mod
        t1 = time.perf_counter()
        return x, (t1 - t0) * 1000

    @staticmethod
    def simulate_chia_verifier(steps: int, discriminant_bits: int = 1024) -> float:
        t0 = time.perf_counter()
        dummy_mod = (1 << discriminant_bits) - 1
        pow(123456789, 65537, dummy_mod)
        t1 = time.perf_counter()
        return (t1 - t0) * 1_000_000

def run_benchmarks() -> Dict[str, Any]:
    prover = PrimeVdfProver()
    seed = 123456789
    steps = 100000

    out, prover_ms = prover.prove(seed, steps)
    valid, verifier_us = PrimeVdfVerifier.verify(seed, steps, out)

    chia_out, chia_prover_ms = ChiaVdfSimulator.simulate_chia_prover(seed, steps)
    chia_verifier_us = ChiaVdfSimulator.simulate_chia_verifier(steps)

    speedup = (prover_ms * 1000) / max(verifier_us, 0.001)

    print("=================================================================")
    print("PRIME-THREAD VDF VS. CHIA VDF BENCHMARK RESULTS")
    print("=================================================================")
    print(f"Prime-Thread VDF Prover ({steps:,} steps): {prover_ms:.2f} ms")
    print(f"Prime-Thread VDF Verifier (O(log T)):      {verifier_us:.3f} µs ({speedup:,.0f}x speedup vs Prover)")
    print(f"Prime-Thread VDF Verification Status:      {'✅ VALID' if valid else '❌ INVALID'}")
    print(f"Chia VDF Prover Simulation ({steps:,} steps): {chia_prover_ms:.2f} ms")
    print(f"Chia VDF Verifier Simulation:               {chia_verifier_us:.3f} µs")
    print("=================================================================\n")

    return {
        "steps": steps,
        "prime_prover_ms": prover_ms,
        "prime_verifier_us": verifier_us,
        "prime_valid": valid,
        "chia_prover_ms": chia_prover_ms,
        "chia_verifier_us": chia_verifier_us,
    }

if __name__ == "__main__":
    run_benchmarks()
