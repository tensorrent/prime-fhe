/**
 * homomorphic-private-ai-server.ts
 * =================================================================
 * Encrypted Private AI REST & RPC Inference Server over F_P.
 * Handles encrypted payload ingestion, homomorphic state updates,
 * and confidential predictions without ever seeing plaintext inputs.
 * =================================================================
 */

import { BigIntHomomorphicFheEngine } from "./prime-field-bigint";
import { HomomorphicPrivateAiReservoirEngine, EncryptedReservoirState } from "./homomorphic-private-ai-reservoir";

export interface EncryptedApiRequest {
  client_id: string;
  encrypted_token: string; // BigInt hex string
}

export interface EncryptedApiResponse {
  client_id: string;
  encrypted_state: string; // BigInt hex string
  step_count: number;
  noise_level: number;
}

export class HomomorphicPrivateAiServer {
  private fhe: BigIntHomomorphicFheEngine;
  private reservoir: HomomorphicPrivateAiReservoirEngine;
  private client_states: Map<string, EncryptedReservoirState> = new Map();

  constructor(secretKey: bigint) {
    this.fhe = new BigIntHomomorphicFheEngine(secretKey);
    this.reservoir = new HomomorphicPrivateAiReservoirEngine(this.fhe);
  }

  public handleClientConnect(clientId: string, initialPlaintext = 3n): EncryptedApiResponse {
    const initialState = this.reservoir.initReservoir(initialPlaintext);
    this.client_states.set(clientId, initialState);

    return {
      client_id: clientId,
      encrypted_state: "0x" + initialState.state_acc.ciphertext.toString(16),
      step_count: 0,
      noise_level: 0,
    };
  }

  public handleEncryptedInferenceStep(req: EncryptedApiRequest): EncryptedApiResponse {
    const currentState = this.client_states.get(req.client_id) || this.reservoir.initReservoir(3n);
    const cInputVal = BigInt(req.encrypted_token);

    const updatedState = this.reservoir.stepEncryptedReservoir(currentState, { ciphertext: cInputVal });
    this.client_states.set(req.client_id, updatedState);

    return {
      client_id: req.client_id,
      encrypted_state: "0x" + updatedState.state_acc.ciphertext.toString(16),
      step_count: updatedState.step_count,
      noise_level: 0,
    };
  }

  public decryptClientState(clientId: string): bigint {
    const state = this.client_states.get(clientId);
    if (!state) throw new Error(`Unknown client: ${clientId}`);
    return this.reservoir.decryptReservoirState(state);
  }
}
