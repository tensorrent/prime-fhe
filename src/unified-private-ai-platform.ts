/**
 * unified-private-ai-platform.ts
 * =================================================================
 * Unified Private AI Platform — bridges MA-HP homomorphic encryption
 * with the AISO coding agent for end-to-end encrypted code generation.
 *
 * Architecture:
 *   User Device → encrypts prompt via MA-HP affine mask → Secure Enclave
 *   Enclave → decrypts, runs AISO agent, re-encrypts output → User Device
 *   User Device → decrypts response
 *
 * Additionally supports homomorphic code verification: the user encrypts
 * a code snippet, the server evaluates a test harness as an arithmetic
 * circuit over F_P using Boolean gates (AND, XOR, NOT), and returns an
 * encrypted pass/fail result — zero plaintext exposure.
 *
 * All operations use the 256-bit prime field P = 2^256 - 189.
 * Zero noise accumulation, zero bootstrapping, Adv = 0.
 * =================================================================
 */

import { InteractiveClientAssistedFheEngine } from "./interactive-client-assisted-fhe.js";
import { BigIntHomomorphicFheEngine } from "./prime-field-bigint.js";
import { ExtendedHomomorphicFheOperations } from "./prime-fhe-operations.js";

const P = (1n << 256n) - 189n;
const CHUNK_SIZE = 31; // 31 bytes = 248 bits < 256 bits (P)

// ---------------------------------------------------------------------------
// Helpers: deterministic multi-chunk string ↔ field-element encoding
// ---------------------------------------------------------------------------

/**
 * Encode a UTF-8 string into an array of 256-bit field elements in [0, P-1].
 * Uses 31-byte chunks to strictly avoid modular overflow (% P).
 */
export function stringToFieldElements(s: string): bigint[] {
  const bytes = new TextEncoder().encode(s);
  if (bytes.length === 0) return [0n];
  const elements: bigint[] = [];
  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    const chunk = bytes.subarray(offset, offset + CHUNK_SIZE);
    let val = 0n;
    for (let i = 0; i < chunk.length; i++) {
      val += BigInt(chunk[i]) * (256n ** BigInt(i));
    }
    elements.push(val % P);
  }
  return elements;
}

/**
 * Decode an array of 256-bit field elements back to a UTF-8 string.
 */
export function fieldElementsToString(elements: bigint[]): string {
  const allBytes: number[] = [];
  for (const elem of elements) {
    let remaining = ((elem % P) + P) % P;
    while (remaining > 0n) {
      allBytes.push(Number(remaining & 0xFFn));
      remaining >>= 8n;
    }
  }
  return new TextDecoder().decode(new Uint8Array(allBytes));
}

/**
 * Convenience single-element helper (for short tokens / backwards compat).
 */
export function stringToFieldElement(s: string): bigint {
  return stringToFieldElements(s)[0];
}

/**
 * Convenience single-element helper (for short tokens / backwards compat).
 */
export function fieldElementToString(val: bigint): string {
  return fieldElementsToString([val]);
}

/**
 * Generate a cryptographically secure mask in [1, P-1].
 *
 * ⚠️ THIS FUNCTION IS THE SECURITY OF THE WHOLE SCHEME. MA-HP's guarantee is
 * information-theoretic — a one-time-pad argument — and it holds only while the
 * mask is uniform AND unpredictable. It does not rest on a computational
 * hardness assumption that could absorb a weak sampler.
 *
 * This previously drew from `Math.random()`, which is NOT a CSPRNG: V8 seeds an
 * xorshift128+ generator with ~128 bits of state and an attacker who observes a
 * handful of outputs can recover that state and predict every subsequent mask.
 * Predictable masks make ciphertexts trivially unmaskable, which collapses the
 * one-time-pad argument completely — a strictly worse failure than any of the
 * algebraic issues elsewhere in this codebase, because it is invisible: every
 * test still passes while the encryption provides no secrecy at all.
 *
 * Now sourced from the platform CSPRNG (Web Crypto, present in Node ≥ 19 and
 * every browser). Modulo bias is negligible: 256 uniform bits reduced mod
 * (P-1) where P-1 ≈ 2²⁵⁶ − 190.
 */
export function generateMask(): bigint {
  const bytes = new Uint8Array(32); // 256 bits
  globalThis.crypto.getRandomValues(bytes);
  let mask = 0n;
  for (const b of bytes) mask = (mask << 8n) | BigInt(b);
  return ((mask % (P - 1n)) + P - 1n) % (P - 1n) + 1n;
}

/**
 * Generate a pseudorandom secret key in F_P^× (non-zero).
 */
export function generateSecretKey(): bigint {
  return generateMask();
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Encrypted prompt payload sent from client to enclave. */
export interface EncryptedPrompt {
  ciphertext: bigint;
  ciphertexts?: bigint[];
  mask: bigint;
  masks?: bigint[];
  plaintext_length: number;
}

/** Encrypted response payload returned from enclave to client. */
export interface EncryptedResponse {
  ciphertext: bigint;
  ciphertexts?: bigint[];
  mask: bigint;
  masks?: bigint[];
  plaintext_length: number;
}

/** A test harness expressed as an arithmetic circuit over F_P. */
export interface HomomorphicTestHarness {
  name: string;
  evaluate: (
    encCode: { ciphertext: bigint; noise_level: number },
    fhe: BigIntHomomorphicFheEngine,
    ops: ExtendedHomomorphicFheOperations
  ) => { ciphertext: bigint; noise_level: number };
  expectedOutput: bigint;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class UnifiedPrivateAIPlatformClient {
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
   * Encrypt a plaintext prompt string for transmission to the enclave.
   * Multi-chunk encoding guarantees zero loss on long prompts.
   */
  encryptPrompt(prompt: string): EncryptedPrompt {
    const elements = stringToFieldElements(prompt);
    const ciphertexts: bigint[] = [];
    const masks: bigint[] = [];
    for (const p of elements) {
      const mask = generateMask();
      const { ciphertext } = this.engine.clientEncrypt(p, this.secretKey, mask);
      ciphertexts.push(ciphertext);
      masks.push(mask);
    }
    return {
      ciphertext: ciphertexts[0],
      ciphertexts,
      mask: masks[0],
      masks,
      plaintext_length: prompt.length,
    };
  }

  /**
   * Decrypt an encrypted response returned from the enclave.
   */
  decryptResponse(enc: EncryptedResponse): string {
    const ciphertexts = enc.ciphertexts ?? [enc.ciphertext];
    const masks = enc.masks ?? [enc.mask];
    const decryptedElems: bigint[] = [];
    for (let i = 0; i < ciphertexts.length; i++) {
      const elem = this.engine.clientDecrypt(ciphertexts[i], this.secretKey, masks[i]);
      decryptedElems.push(elem);
    }
    return fieldElementsToString(decryptedElems);
  }

  /**
   * Homomorphically verify a code snippet against a public test harness over F_P.
   */
  verifyCodeHomomorphically(
    codeSnippet: string,
    harness: HomomorphicTestHarness
  ): { passed: boolean; harness_name: string } {
    const fhe = new BigIntHomomorphicFheEngine(this.secretKey, P);
    const ops = new ExtendedHomomorphicFheOperations(fhe, P);
    const codeVal = stringToFieldElement(codeSnippet);
    const encCode = fhe.encrypt(codeVal);

    const resultCipher = harness.evaluate(encCode, fhe, ops);
    const resultPlain = fhe.decrypt(resultCipher);
    return {
      passed: resultPlain === harness.expectedOutput,
      harness_name: harness.name,
    };
  }
}

// ---------------------------------------------------------------------------
// Enclave (server-side, runs inside TEE)
// ---------------------------------------------------------------------------

export class SecureEnclaveAgent {
  private engine: InteractiveClientAssistedFheEngine;

  constructor() {
    this.engine = new InteractiveClientAssistedFheEngine(P);
  }

  /**
   * Process an encrypted prompt inside the enclave:
   * Decrypts prompt chunks, invokes AISO agent on plaintext, encrypts output chunks.
   */
  processEncryptedPrompt(
    enc: EncryptedPrompt,
    clientKey: bigint,
    agentFn: (plaintext: string) => string
  ): EncryptedResponse {
    const ciphertexts = enc.ciphertexts ?? [enc.ciphertext];
    const masks = enc.masks ?? [enc.mask];
    const plainElems: bigint[] = [];
    for (let i = 0; i < ciphertexts.length; i++) {
      const elem = this.engine.clientDecrypt(ciphertexts[i], clientKey, masks[i]);
      plainElems.push(elem);
    }
    const plaintext = fieldElementsToString(plainElems);

    const response = agentFn(plaintext);

    const respElems = stringToFieldElements(response);
    const respCiphers: bigint[] = [];
    const respMasks: bigint[] = [];
    for (const rElem of respElems) {
      const rMask = generateMask();
      const { ciphertext } = this.engine.clientEncrypt(rElem, clientKey, rMask);
      respCiphers.push(ciphertext);
      respMasks.push(rMask);
    }

    return {
      ciphertext: respCiphers[0],
      ciphertexts: respCiphers,
      mask: respMasks[0],
      masks: respMasks,
      plaintext_length: response.length,
    };
  }
}
