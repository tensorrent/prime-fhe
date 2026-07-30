// hpsi_3d_visualizer.test.ts
// =================================================================
// Verification Suite for Real-Time 3D Encrypted Visualizer State Generator
// =================================================================

import { describe, it, expect } from "vitest";
import { Hpsi3dVisualizerEngine } from "../src/hpsi-3d-visualizer";
import { HomomorphicCsamPsiMatcher } from "../src/homomorphic-csam-psi-matcher";

describe("Real-Time 3D Encrypted H-PSI Visualizer Engine", () => {
  const vizEngine = new Hpsi3dVisualizerEngine();
  const matcher = new HomomorphicCsamPsiMatcher();
  const secretKey = 0xabcdef123456789n;

  it("generates 3D polyhedron vertex states flashing green on match", () => {
    const targetHashHex = "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff";
    const targetElem = matcher.hashToFieldElement(targetHashHex);

    const dbEntry = matcher.encryptDatabaseEntry("TARGET_01", targetElem, secretKey, 0x999n);

    const streamHashes = [
      "0x0000000000000000000000000000000000000000000000000000000000000001",
      targetHashHex, // Matching element!
      "0x0000000000000000000000000000000000000000000000000000000000000002",
    ];

    const frame = vizEngine.generateVisualizerFrame(streamHashes, [dbEntry], secretKey);

    expect(frame.vertices.length).toBe(3);
    expect(frame.activeMatchCount).toBe(1);

    // Matching vertex flashes green (#00ff66)
    expect(frame.vertices[1].colorHex).toBe("#00ff66");
    expect(frame.vertices[1].status).toBe("MATCH_FOUND");

    // Non-matching vertices remain streaming cyan (#00f3ff)
    expect(frame.vertices[0].colorHex).toBe("#00f3ff");
    expect(frame.vertices[0].status).toBe("STREAMING");
  });
});
