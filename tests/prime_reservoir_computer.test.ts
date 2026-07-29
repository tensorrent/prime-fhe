// prime_reservoir_computer.test.ts
// =================================================================
// Verification Suite for Prime-Thread Reservoir Computing Engine
// =================================================================

import { describe, it, expect } from "vitest";
import {
  charToPrime,
  runPrimeReservoir,
  classifyTextReservoirFeature,
} from "../src/prime-reservoir-computer";

describe("Prime Thread Reservoir Computing Engine", () => {
  it("maps alphabet characters to unique prime numbers", () => {
    expect(charToPrime("a")).toBe(2);
    expect(charToPrime("z")).toBe(101);
    expect(charToPrime("e")).toBe(11);
  });

  it("processes text sequences through F_137 reservoir trajectory", () => {
    const res = runPrimeReservoir("hello");
    expect(res.sequence).toBe("hello");
    expect(res.trajectory.length).toBe(6); // 1 initial + 5 chars
    expect(res.final_state).toBeGreaterThanOrEqual(0);
    expect(res.final_state).toBeLessThan(137);
  });

  it("produces distinct feature classification codes for different words", () => {
    const code1 = classifyTextReservoirFeature("quantum");
    const code2 = classifyTextReservoirFeature("photonic");
    expect(code1).not.toBe(code2);
  });
});
