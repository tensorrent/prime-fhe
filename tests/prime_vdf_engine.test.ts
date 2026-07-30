import { describe, it, expect } from "vitest";
import {
  PrimeVdfProver,
  PrimeVdfVerifier,
  ChiaVdfSimulator,
  DEFAULT_VDF_PARAMS,
} from "../src/prime-vdf-engine.js";

describe("Prime-Thread Verifiable Delay Function (VDF) Engine", () => {
  const prover = new PrimeVdfProver(DEFAULT_VDF_PARAMS);

  it("verifies 10,000 sequential VDF steps zero-shot via O(log T) logarithmic math", () => {
    const seed = 123456789n;
    const steps = 10000n;

    const proof = prover.prove(seed, steps);
    expect(proof.prover_time_ms).toBeGreaterThanOrEqual(0);

    const verification = PrimeVdfVerifier.verify(proof);
    expect(verification.valid).toBe(true);
    expect(verification.verifier_time_us).toBeLessThan(50); // Under 50 microseconds!
  });

  it("verifies 100,000 sequential VDF steps zero-shot", () => {
    const seed = 987654321n;
    const steps = 100000n;

    const proof = prover.prove(seed, steps);
    const verification = PrimeVdfVerifier.verify(proof);

    expect(verification.valid).toBe(true);
    expect(verification.speedup_vs_prover).toBeGreaterThan(10);
  });

  it("detects output tampering immediately", () => {
    const seed = 42n;
    const steps = 5000n;
    const proof = prover.prove(seed, steps);

    // Tamper with final output state
    const tamperedProof = {
      ...proof,
      output: proof.output + 1n,
    };

    const verification = PrimeVdfVerifier.verify(tamperedProof);
    expect(verification.valid).toBe(false);
  });

  it("detects step count tampering immediately", () => {
    const seed = 42n;
    const steps = 5000n;
    const proof = prover.prove(seed, steps);

    // Tamper with step count
    const tamperedProof = {
      ...proof,
      steps: 4999n,
    };

    const verification = PrimeVdfVerifier.verify(tamperedProof);
    expect(verification.valid).toBe(false);
  });

  it("benchmarks Prime-Thread VDF vs Chia Wesolowski VDF simulation", () => {
    const seed = 1337n;
    const steps = 1000n;

    const primeProof = prover.prove(seed, steps);
    const primeVerification = PrimeVdfVerifier.verify(primeProof);

    const chiaProof = ChiaVdfSimulator.simulateChiaProver(seed, steps);
    const chiaVerification = ChiaVdfSimulator.simulateChiaVerifier(steps);

    expect(primeVerification.valid).toBe(true);
    expect(primeVerification.verifier_time_us).toBeGreaterThan(0);
    expect(chiaVerification.verifier_time_us).toBeGreaterThan(0);
  });
});
