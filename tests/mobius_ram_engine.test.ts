// mobius_ram_engine.test.ts
// =================================================================
// Verification Suite for Radiation-Hardened Möbius RAM Engine
// =================================================================

import { describe, it, expect } from "vitest";
import { MobiusRamEngine } from "../src/mobius-ram-engine";

describe("Radiation-Hardened Möbius RAM Engine", () => {
  it("initializes 136 topological memory cells along the single-edge Mobius ribbon", () => {
    const ram = new MobiusRamEngine();
    const cell0 = ram.read(0);
    const cell68 = ram.read(68);

    expect(cell0.address).toBe(0);
    expect(cell0.topological_twist).toBe(0);
    expect(cell68.address).toBe(68);
    expect(cell68.topological_twist).toBe(180);
  });

  it("recovers data from radiation bit flips via topological half-twist symmetry", () => {
    const ram = new MobiusRamEngine();
    ram.write(10, 42);

    const { corrupted, recovered } = ram.injectRadiationBitFlipAndRecover(10);
    expect(corrupted.is_valid).toBe(false);
    expect(recovered.is_valid).toBe(true);
    expect(recovered.data).toBe(42); // 100% Topological Error Recovery!
  });
});
