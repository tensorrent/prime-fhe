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

  // The regression guard for a defect that used to make this whole pipeline
  // meaningless: encryptImage produced MA-HP ciphertexts (c = k·m + r, fresh
  // uniform r per patch) while the forward pass and grounding received only the
  // ciphertexts. The masks were never removed, so every "similarity score" was
  // dominated by uniform noise — identical inputs gave different scores and the
  // motif ranking was a coin flip. Masks are now carried with their ciphertexts
  // through both operations, which are linear in the mask.
  const KEY = 0x2f1a4b7c9d3e5f81n;
  const IMAGE = new Uint8Array(64).fill(100);
  const MOTIFS = (): Map<string, { label: string; motif_vector: bigint[] }> =>
    new Map([
      ["MOTIF_UI_EXCEPTION", { label: "UI Traceback Dialog", motif_vector: [5n, 12n, 3n] }],
      ["MOTIF_CAD_SCHEMATIC", { label: "CAD Wiring Diagram", motif_vector: [1n, 2n, 1n] }],
    ]);
  const ground = () => {
    const client = new UnifiedClient(KEY);
    const tensor = client.encryptImage(IMAGE, [8, 8, 1]);
    const vit = new HomomorphicViTEncoder(client.key);
    return vit.groundSceneGraph(vit.homomorphicForward(tensor), MOTIFS());
  };

  it("grounding is deterministic: the masks no longer leak into the score", () => {
    // The masks differ on every call — only their removal makes this stable.
    const scores = new Set(
      Array.from({ length: 8 }, () => ground().map((m) => `${m.motif_id}:${m.similarity_score}`).join("|")),
    );
    expect(scores.size).toBe(1);
  });

  it("scores are the TRUE dot product — verified against plaintext arithmetic", () => {
    const P = (1n << 256n) - 189n;
    const CHUNK = 31;
    const WEIGHTS = [3n, 7n, 11n];

    // Recompute what the pipeline should produce, entirely in the clear.
    const patches: bigint[] = [];
    for (let off = 0; off < IMAGE.length; off += CHUNK) {
      const chunk = IMAGE.subarray(off, off + CHUNK);
      let v = 0n;
      for (let i = 0; i < chunk.length; i++) v += BigInt(chunk[i]) * 256n ** BigInt(i);
      patches.push(v % P);
    }

    const expected = new Map<string, bigint>();
    for (const [id, data] of MOTIFS()) {
      let acc = 0n;
      for (let i = 0; i < patches.length; i++) {
        const w = WEIGHTS[i % WEIGHTS.length];
        const v = data.motif_vector[i % data.motif_vector.length];
        acc = (acc + v * w * patches[i]) % P;
      }
      expected.set(id, acc);
    }

    for (const match of ground()) {
      expect(match.similarity_score).toBe(expected.get(match.motif_id));
    }
  });

  it("a different image gives a different score — the output tracks the input", () => {
    const other = () => {
      const client = new UnifiedClient(KEY);
      const tensor = client.encryptImage(new Uint8Array(64).fill(37), [8, 8, 1]);
      const vit = new HomomorphicViTEncoder(client.key);
      return vit.groundSceneGraph(vit.homomorphicForward(tensor), MOTIFS());
    };
    expect(other()[0].similarity_score).not.toBe(ground()[0].similarity_score);
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
