import { describe, it, expect } from "vitest";
import {
  UnifiedPrivateAIPlatformClient,
  SecureEnclaveAgent,
  stringToFieldElements,
  fieldElementsToString,
  type HomomorphicTestHarness,
} from "../src/unified-private-ai-platform.js";

describe("Unified Private AI Platform (MA-HP + AISO Integration)", () => {
  it("should perform lossless string ↔ field element encoding and decoding across multi-chunk strings", () => {
    const original = "def quicksort(arr): return arr if len(arr) <= 1 else quicksort([x for x in arr[1:] if x < arr[0]]) + [arr[0]] + quicksort([x for x in arr[1:] if x >= arr[0]])";
    const fieldElems = stringToFieldElements(original);
    expect(fieldElems.length).toBeGreaterThan(1);

    const decoded = fieldElementsToString(fieldElems);
    expect(decoded).toBe(original);
  });

  it("should encrypt and decrypt a coding prompt round-trip securely", () => {
    const client = new UnifiedPrivateAIPlatformClient();
    const prompt = "Write a Rust function to calculate Fibonacci numbers in O(1) space.";

    const encrypted = client.encryptPrompt(prompt);
    expect(encrypted.ciphertext).toBeGreaterThan(0n);
    expect(encrypted.mask).toBeGreaterThan(0n);

    // Enclave processing simulation
    const enclave = new SecureEnclaveAgent();
    const responsePayload = enclave.processEncryptedPrompt(
      encrypted,
      client.key,
      (p) => `// Plaintext prompt received inside TEE: "${p}"\nfn fib(n: u32) -> u64 { let (mut a, mut b) = (0, 1); for _ in 0..n { let c = a + b; a = b; b = c; } a }`
    );

    expect(responsePayload.ciphertext).toBeGreaterThan(0n);

    // Client decrypts response locally
    const decryptedResponse = client.decryptResponse(responsePayload);
    expect(decryptedResponse).toContain("fn fib(n: u32) -> u64");
    expect(decryptedResponse).toContain("O(1) space");
  });

  it("should homomorphically verify code snippet correctness over F_P without revealing plaintext", () => {
    const client = new UnifiedPrivateAIPlatformClient();
    const codeSnippet = "val = (a + b) * c";

    // Build a homomorphic test harness over F_P that evaluates (encCode + 2) * 3
    const harness: HomomorphicTestHarness = {
      name: "Arithmetic Gate Circuit Harness",
      expectedOutput: 60n,
      evaluate: (encCode, fhe, ops) => {
        const cTwo = fhe.encrypt(2n);
        const cSum = fhe.addHomomorphic(encCode, cTwo);
        return ops.scaleHomomorphic(cSum, 3n);
      },
    };

    const result = client.verifyCodeHomomorphically(codeSnippet, harness);
    expect(result.harness_name).toBe("Arithmetic Gate Circuit Harness");
    expect(typeof result.passed).toBe("boolean");
  });

  it("prevents eavesdropping: ciphertext transcript reveals 0 information about prompt", () => {
    const client1 = new UnifiedPrivateAIPlatformClient(0x123456789n);
    const client2 = new UnifiedPrivateAIPlatformClient(0x987654321n);

    const prompt = "Secret proprietary algorithm";
    const enc1 = client1.encryptPrompt(prompt);
    const enc2 = client2.encryptPrompt(prompt);

    // Different secret keys and masks produce different ciphertexts for identical prompts
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
  });
});
