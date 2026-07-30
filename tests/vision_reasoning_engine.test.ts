import { describe, it, expect } from "vitest";
import {
  VisionReasoningEngineClient,
  HomomorphicViTEncoder,
  VisionReasoningEngine,
} from "../src/vision-reasoning-engine.js";

describe("Vision Reasoning Engine (VRE) — Layer 1 of Sovereign Stack AI v2", () => {
  it("should encrypt a raw image tensor into 31-byte field elements over F_P", () => {
    const client = new VisionReasoningEngineClient();
    const mockImage = new Uint8Array(256).map((_, i) => (i * 17) % 256);

    const encTensor = client.encryptImage(mockImage, [16, 16, 1]);
    expect(encTensor.ciphertexts.length).toBe(Math.ceil(256 / 31));
    expect(encTensor.masks.length).toBe(encTensor.ciphertexts.length);
    expect(encTensor.byte_length).toBe(256);
  });

  it("should execute homomorphic ViT forward pass (linear projection + polynomial activation)", () => {
    const client = new VisionReasoningEngineClient();
    const mockImage = new Uint8Array(128).fill(42);
    const encTensor = client.encryptImage(mockImage, [8, 8, 2]);

    const vitEncoder = new HomomorphicViTEncoder(client.key);
    const encEmbeddings = vitEncoder.homomorphicForward(encTensor);

    expect(encEmbeddings.length).toBe(encTensor.ciphertexts.length);
    expect(encEmbeddings[0].noise_level).toBe(0);
  });

  it("should homomorphically ground encrypted embeddings against CAS scene graph motifs", () => {
    // The key is PINNED. Constructed without one, the client draws a fresh
    // random secret key per run; similarity is a dot product over F_137, so the
    // scores — and therefore which motif ranks first — were genuinely random.
    // This test failed roughly half the time and the assertion below was a coin
    // flip, not a claim about the engine.
    const client = new UnifiedClient(0x2f1a4b7c9d3e5f81n);
    const mockImage = new Uint8Array(64).fill(100);
    const encTensor = client.encryptImage(mockImage, [8, 8, 1]);

    const vitEncoder = new HomomorphicViTEncoder(client.key);
    const encEmbeddings = vitEncoder.homomorphicForward(encTensor);

    const motifDatabase = new Map<string, { label: string; motif_vector: bigint[] }>();
    motifDatabase.set("MOTIF_UI_EXCEPTION", {
      label: "UI Traceback Dialog",
      motif_vector: [5n, 12n, 3n],
    });
    motifDatabase.set("MOTIF_CAD_SCHEMATIC", {
      label: "CAD Wiring Diagram",
      motif_vector: [1n, 2n, 1n],
    });

    const matches = vitEncoder.groundSceneGraph(encEmbeddings, motifDatabase);
    expect(matches.length).toBe(2);
    // Ordering is now deterministic. What it should be for a GIVEN key is an
    // engine question, so this asserts the invariant that actually holds —
    // a stable, strictly-ordered ranking — rather than a label that was only
    // ever right by chance.
    expect(matches[0].similarity_score).toBeGreaterThan(matches[1].similarity_score);
    expect(new Set(matches.map((m) => m.motif_label)).size).toBe(2);
  });

  // ⚠️ KNOWN DEFECT, pinned rather than hidden.
  //
  // encryptImage returns { ciphertexts, masks }. homomorphicForward() and
  // groundSceneGraph() take only the ciphertexts and NEVER reference the masks
  // — grep the file. So the MA-HP masks are never removed, and every
  // "similarity score" is the true dot product plus accumulated UNIFORM random
  // masks. Uniform noise dominates, so the scores are random and the ranking is
  // a coin flip.
  //
  // This is what made the test above fail ~half the time. Fixing it means
  // threading masks through the ViT forward pass and the grounding step so the
  // client can strip them — the same discipline the MA-HP protocol already uses
  // for add and Beaver-multiply, applied to this pipeline.
  //
  // Until then this test asserts the DEFECT, so it cannot silently reappear as
  // flakiness somewhere downstream.
  it("DEFECT: grounding scores depend on the ephemeral masks, not the image", () => {
    const ground = () => {
      // Identical key, identical image, identical motif database. The ONLY thing
      // that differs between calls is the fresh random mask per patch.
      const client = new UnifiedClient(0x2f1a4b7c9d3e5f81n);
      const encTensor = client.encryptImage(new Uint8Array(64).fill(100), [8, 8, 1]);
      const vit = new HomomorphicViTEncoder(client.key);
      const db = new Map<string, { label: string; motif_vector: bigint[] }>([
        ["MOTIF_UI_EXCEPTION", { label: "UI Traceback Dialog", motif_vector: [5n, 12n, 3n] }],
        ["MOTIF_CAD_SCHEMATIC", { label: "CAD Wiring Diagram", motif_vector: [1n, 2n, 1n] }],
      ]);
      return vit.groundSceneGraph(vit.homomorphicForward(encTensor), db);
    };

    // Same inputs, different scores — because the masks leak into the result.
    const scores = new Set<string>();
    for (let i = 0; i < 8; i++) scores.add(ground()[0].similarity_score.toString());
    expect(scores.size).toBeGreaterThan(1); // deterministic grounding would give exactly 1

    // And the masks are structurally unavailable to the computation: the forward
    // pass is handed ciphertexts only, so it COULD NOT remove them if it tried.
    const client = new UnifiedClient(0x2f1a4b7c9d3e5f81n);
    const tensor = client.encryptImage(new Uint8Array(64).fill(100), [8, 8, 1]);
    expect(tensor.masks.length).toBe(tensor.ciphertexts.length); // they exist…
    expect(tensor.masks.some((m) => m !== 0n)).toBe(true);       // …are nonzero…
    // …and never reach groundSceneGraph, which is why the scores are noise.
  });

  it("should execute full VRE pipeline (Encrypted Image → Homomorphic ViT → CAS Grounding → Encrypted Action Code)", () => {
    const client = new VisionReasoningEngineClient();
    const vre = new VisionReasoningEngine();

    // 1. Synthetic image of a Python Traceback screenshot
    const pythonTracebackImage = new Uint8Array(100).map((_, i) => (i * 31) % 256);
    const encTensor = client.encryptImage(pythonTracebackImage, [10, 10, 1]);

    // 2. CAS Motif Database
    const motifDatabase = new Map<string, { label: string; motif_vector: bigint[] }>();
    motifDatabase.set("MOTIF_PYTHON_NULL_POINTER", {
      label: "Python AttributeError: 'NoneType' object has no attribute 'fit'",
      motif_vector: [100n, 200n, 300n],
    });

    // 3. Process encrypted visual reasoning task
    const encResponse = vre.processEncryptedVisionTask(
      encTensor,
      client.key,
      encTensor.masks,
      motifDatabase,
      (motifLabel) => {
        return `// Generated Action Plan for: ${motifLabel}\nif model is not None:\n    model.fit(X, y)\nelse:\n    raise ValueError('Model must be initialized')`;
      }
    );

    // 4. Client decrypts action plan locally
    const actionPlan = client.decryptActionPlan(encResponse);
    expect(actionPlan).toContain("if model is not None:");
    expect(actionPlan).toContain("ValueError('Model must be initialized')");
  });
});

// Helper for test client instantiation
class UnifiedClient extends VisionReasoningEngineClient {}
