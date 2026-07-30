/**
 * vision-reasoning-engine.ts
 * =================================================================
 * Vision Reasoning Engine (VRE) — Layer 1 of Sovereign Stack AI v2.
 * Enables end-to-end encrypted visual reasoning:
 *   Encrypted Image Tensor → Homomorphic ViT Forward Pass → CAS Motif Grounding → AISO Code Gen
 *
 * All operations execute on 256-bit prime field F_P (P = 2^256 - 189)
 * with zero noise accumulation and Adv = 0 information-theoretic secrecy.
 * =================================================================
 */

import { InteractiveClientAssistedFheEngine } from "./interactive-client-assisted-fhe.js";
import { MultiRingShiftCipher } from "./multi-ring-shift-cipher.js";
import {
  UnifiedPrivateAIPlatformClient,
  SecureEnclaveAgent,
  generateMask,
  generateSecretKey,
  stringToFieldElements,
  fieldElementsToString,
  type EncryptedPrompt,
  type EncryptedResponse,
} from "./unified-private-ai-platform.js";

const P = (1n << 256n) - 189n;
const CHUNK_SIZE = 31; // 31 bytes per field element

/** Encrypted 2D/3D image tensor representation over F_P. */
export interface EncryptedImageTensor {
  /** Array of encrypted patch field elements */
  ciphertexts: bigint[];
  /** Ephemeral masks for each patch element */
  masks: bigint[];
  /** Dimensions [width, height, channels] */
  dimensions: [number, number, number];
  /** Total raw byte length */
  byte_length: number;
}

/** CAS Motif Grounding Result containing similarity score and motif ID */
export interface SceneGraphMotifMatch {
  motif_id: string;
  motif_label: string;
  similarity_score: bigint; // Homomorphic dot product over F_P
}

/**
 * An embedding travelling through the ViT, carrying the mask that must be
 * removed to read it.
 *
 * This pairing is the fix for a defect where the two halves of MA-HP were split
 * apart: `encryptImage` produced `c = k·m + r` with a fresh uniform r per patch,
 * but the forward pass and grounding received only the ciphertexts. The masks
 * were structurally unavailable, so they were never removed and every
 * similarity score was dominated by uniform noise — identical inputs produced
 * different scores and the motif ranking was a coin flip.
 *
 * A masked value and its mask are one object. Splitting them is what allowed
 * them to drift apart in the first place.
 */
export interface MaskedEmbedding {
  ciphertext: bigint;
  mask: bigint;
  /** Always 0 — exact field arithmetic, retained for shape compatibility. */
  noise_level: number;
}

// ---------------------------------------------------------------------------
// Client: Encrypts visual inputs & decrypts action/code plans
// ---------------------------------------------------------------------------

export class VisionReasoningEngineClient {
  private engine: InteractiveClientAssistedFheEngine;
  private secretKey: bigint;

  constructor(secretKey?: bigint) {
    this.engine = new InteractiveClientAssistedFheEngine(P);
    this.secretKey = secretKey ?? generateSecretKey();
  }

  get key(): bigint {
    return this.secretKey;
  }

  /**
   * Encrypt a raw image byte buffer (e.g. PNG/JPEG/RGBA pixels) into an EncryptedImageTensor.
   * Splits input into 31-byte field element chunks and applies MA-HP affine masking.
   */
  encryptImage(
    imageData: Uint8Array | number[],
    dimensions: [number, number, number] = [64, 64, 3]
  ): EncryptedImageTensor {
    const bytes = imageData instanceof Uint8Array ? imageData : new Uint8Array(imageData);
    const ciphertexts: bigint[] = [];
    const masks: bigint[] = [];

    for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
      const chunk = bytes.subarray(offset, offset + CHUNK_SIZE);
      let val = 0n;
      for (let i = 0; i < chunk.length; i++) {
        val += BigInt(chunk[i]) * (256n ** BigInt(i));
      }
      const p = val % P;
      const mask = generateMask();
      const { ciphertext } = this.engine.clientEncrypt(p, this.secretKey, mask);
      ciphertexts.push(ciphertext);
      masks.push(mask);
    }

    if (ciphertexts.length === 0) {
      const mask = generateMask();
      const { ciphertext } = this.engine.clientEncrypt(0n, this.secretKey, mask);
      ciphertexts.push(ciphertext);
      masks.push(mask);
    }

    return {
      ciphertexts,
      masks,
      dimensions,
      byte_length: bytes.length,
    };
  }

  /**
   * Decrypt the encrypted scene graph or action code plan returned by the server.
   */
  decryptActionPlan(enc: EncryptedResponse): string {
    const ciphertexts = enc.ciphertexts ?? [enc.ciphertext];
    const masks = enc.masks ?? [enc.mask];
    const plainElems: bigint[] = [];
    for (let i = 0; i < ciphertexts.length; i++) {
      const elem = this.engine.clientDecrypt(ciphertexts[i], this.secretKey, masks[i]);
      plainElems.push(elem);
    }
    return fieldElementsToString(plainElems);
  }
}

// ---------------------------------------------------------------------------
// Server / Enclave: Homomorphic ViT Forward Pass & CAS Motif Grounder
// ---------------------------------------------------------------------------

export class HomomorphicViTEncoder {
  private ring: MultiRingShiftCipher;
  private secretKey: bigint;

  constructor(secretKey: bigint) {
    // MA-HP additive-ring algebra, matching what encryptImage actually produces
    // (c = k·m + r). The previous implementation used BigIntHomomorphicFheEngine,
    // whose ciphertexts carry a CONSTANT offset of 1 (c = k·m + 1) and whose
    // scale/add correct for that offset — a different, incompatible format.
    // Feeding MA-HP ciphertexts through those ops left a residue of
    // (r − 1)·w·k⁻¹ in every result, which is the full-range noise that made the
    // grounding scores meaningless. One algebra now, reusing the primitive that
    // is already tested (src/multi-ring-shift-cipher.ts) rather than a third
    // parallel implementation.
    this.ring = new MultiRingShiftCipher(P);
    this.secretKey = secretKey;
  }

  /**
   * Perform homomorphic Vision Transformer (ViT) forward pass over encrypted patches:
   * 1. Linear Patch Projection (Homomorphic Scalar Matrix Multiplication)
   * 2. Aggregated Patch Embedding Generation
   *
   * Scaling is linear, so the mask scales with the ciphertext: a patch masked by
   * r, projected by weight w, comes out masked by w·r. Carrying that forward is
   * what makes the embedding decryptable downstream.
   */
  homomorphicForward(
    encTensor: EncryptedImageTensor,
    projectionWeights: bigint[] = [3n, 7n, 11n]
  ): MaskedEmbedding[] {
    const outputs: MaskedEmbedding[] = [];

    for (let i = 0; i < encTensor.ciphertexts.length; i++) {
      const weight = projectionWeights[i % projectionWeights.length];
      const patch = {
        ring: "additive" as const,
        ciphertext: encTensor.ciphertexts[i],
        mask: encTensor.masks[i],
      };

      // Linear patch projection (W · x) — ciphertext and mask scale together.
      const projected = this.ring.scalarMultiply(patch, weight);
      outputs.push({ ciphertext: projected.ciphertext, mask: projected.mask, noise_level: 0 });
    }

    return outputs;
  }

  /**
   * Homomorphically ground image embeddings against a CAS Scene Graph Motif Database.
   * Computes encrypted dot-product similarity over F_P.
   *
   * The dot product is a sum of scalings, and BOTH operations are linear in the
   * mask, so the accumulated mask is exactly Σ vᵢ·maskᵢ. Subtracting it before
   * decryption yields the true similarity — a quantity that depends only on the
   * image and the motif, never on which random masks happened to be drawn.
   *
   * NOTE ON TRUST: this decrypts inside the encoder, which therefore holds the
   * key. That is the pre-existing enclave shape of this class (see
   * SecureEnclaveAgent). A deployment that does not trust the evaluator should
   * return the masked accumulator and let the client decrypt — the algebra here
   * is unchanged either way, since the mask is tracked explicitly.
   */
  groundSceneGraph(
    encEmbeddings: MaskedEmbedding[],
    motifDatabase: Map<string, { label: string; motif_vector: bigint[] }>
  ): SceneGraphMotifMatch[] {
    const results: SceneGraphMotifMatch[] = [];

    for (const [motifId, motifData] of motifDatabase.entries()) {
      // Accumulator starts at an encryption of zero under a zero mask, so it is
      // the additive identity in both the ciphertext and the mask.
      let acc = { ring: "additive" as const, ciphertext: 0n, mask: 0n };

      for (let i = 0; i < encEmbeddings.length; i++) {
        const weight = motifData.motif_vector[i % motifData.motif_vector.length];
        const scaled = this.ring.scalarMultiply(
          { ring: "additive", ciphertext: encEmbeddings[i].ciphertext, mask: encEmbeddings[i].mask },
          weight,
        );
        acc = this.ring.add(acc, scaled);
      }

      results.push({
        motif_id: motifId,
        motif_label: motifData.label,
        similarity_score: this.ring.decryptAdditive(acc, this.secretKey),
      });
    }

    return results.sort((a, b) => {
      if (b.similarity_score > a.similarity_score) return 1;
      if (b.similarity_score < a.similarity_score) return -1;
      // Deterministic tie-break by motif id. `return 0` left tied motifs to
      // iteration order, so the top match could change without the inputs
      // changing — a ranking no downstream test can verify. Ties are rarer now
      // that scores are true dot products over F_P rather than mask noise, but
      // a stable key costs nothing and removes the whole class of ambiguity.
      return a.motif_id < b.motif_id ? -1 : a.motif_id > b.motif_id ? 1 : 0;
    });
  }
}

// ---------------------------------------------------------------------------
// Vision Reasoning Engine Orchestrator
// ---------------------------------------------------------------------------

export class VisionReasoningEngine {
  private enclaveAgent: SecureEnclaveAgent;

  constructor() {
    this.enclaveAgent = new SecureEnclaveAgent();
  }

  /**
   * Full VRE Pipeline:
   * Encrypted Image Tensor → Homomorphic ViT → CAS Motif Grounding → AISO Action Code Gen
   */
  processEncryptedVisionTask(
    encTensor: EncryptedImageTensor,
    clientKey: bigint,
    clientMasks: bigint[],
    motifDatabase: Map<string, { label: string; motif_vector: bigint[] }>,
    actionGenerator: (sceneMotifLabel: string) => string
  ): EncryptedResponse {
    // Step 1: Homomorphic ViT Forward Pass inside TEE
    const vitEncoder = new HomomorphicViTEncoder(clientKey);
    const encEmbeddings = vitEncoder.homomorphicForward(encTensor);

    // Step 2: Ground against CAS Motifs
    const motifMatches = vitEncoder.groundSceneGraph(encEmbeddings, motifDatabase);
    const topMatch = motifMatches[0] ?? { motif_label: "Unknown Visual Context", motif_id: "none" };

    // Step 3: Package grounded motif as encrypted prompt for AISO Agent
    const promptText = `Visual Context Identified: [${topMatch.motif_label}]. Generate remediation code.`;
    const promptElems = stringToFieldElements(promptText);

    // Encrypt prompt payload using client engine simulation
    const engine = new InteractiveClientAssistedFheEngine(P);
    const ciphers: bigint[] = [];
    const masks: bigint[] = [];
    for (const p of promptElems) {
      const mask = generateMask();
      const { ciphertext } = engine.clientEncrypt(p, clientKey, mask);
      ciphers.push(ciphertext);
      masks.push(mask);
    }

    const encPrompt: EncryptedPrompt = {
      ciphertext: ciphers[0],
      ciphertexts: ciphers,
      mask: masks[0],
      masks: masks,
      plaintext_length: promptText.length,
    };

    // Step 4: Run Secure Enclave AISO Agent and re-encrypt action plan
    return this.enclaveAgent.processEncryptedPrompt(
      encPrompt,
      clientKey,
      (decryptedPrompt) => {
        return actionGenerator(topMatch.motif_label);
      }
    );
  }
}
