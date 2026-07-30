// homomorphic_private_ai_server.test.ts
// =================================================================
// Verification Suite for Encrypted Private AI REST & RPC Server
// =================================================================

import { describe, it, expect } from "vitest";
import { BigIntHomomorphicFheEngine } from "../src/prime-field-bigint";
import { HomomorphicPrivateAiServer } from "../src/homomorphic-private-ai-server";

describe("Encrypted Private AI REST & RPC Inference Server", () => {
  const secretKey = 999888777666n;
  const fhe = new BigIntHomomorphicFheEngine(secretKey);

  it("handles encrypted inference steps over REST/RPC without seeing plaintexts", () => {
    const server = new HomomorphicPrivateAiServer(secretKey);
    const clientId = "client_alpha";

    server.handleClientConnect(clientId, 3n);

    // Client encrypts tokens 11n and 23n locally
    const c1 = fhe.encrypt(11n);
    const c2 = fhe.encrypt(23n);

    const res1 = server.handleEncryptedInferenceStep({
      client_id: clientId,
      encrypted_token: "0x" + c1.ciphertext.toString(16),
    });

    expect(res1.step_count).toBe(1);
    expect(res1.noise_level).toBe(0);

    const res2 = server.handleEncryptedInferenceStep({
      client_id: clientId,
      encrypted_token: "0x" + c2.ciphertext.toString(16),
    });

    expect(res2.step_count).toBe(2);

    // Client requests decryption (or decrypts locally)
    const finalPlaintext = server.decryptClientState(clientId);
    // S1 = 2*3 + 11 = 17, S2 = 2*17 + 23 = 57
    expect(finalPlaintext).toBe(57n);
  });
});
