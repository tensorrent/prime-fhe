// signal_topology_converter.test.ts
// =================================================================
// Verification Suite for Signal-to-Topology & 4D Gaussian Engine
// =================================================================

import { describe, it, expect } from "vitest";
import { SignalToTopologyConverter } from "../src/signal-topology-converter";

describe("Signal-to-Topology & 4D Gaussian Projection Engine", () => {
  it("projects 4D hyper-dimensional points (X, Y, Z, W) to 3D canvas coordinates", () => {
    const converter = new SignalToTopologyConverter();
    const p4 = { x: 100, y: 50, z: 20, w: -30 };
    const p3 = converter.project4dGaussianTo3d(p4, Math.PI / 4.0);

    expect(p3.x).toBeDefined();
    expect(p3.y).toBeDefined();
    expect(p3.z).toBeDefined();
    expect(p3.scale).toBeGreaterThan(0);
  });

  it("generates 4D Gaussian splatting cloud points in signal frames", () => {
    const converter = new SignalToTopologyConverter();
    const frame = converter.processSignalFrame(0.8, 440);

    expect(frame.gaussian_4d_cloud.length).toBe(137); // 137 points in F_137 prime field!
    expect(frame.gaussian_4d_cloud[0].w).toBeDefined();
  });
});
