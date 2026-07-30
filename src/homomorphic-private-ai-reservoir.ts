/**
 * homomorphic-private-ai-reservoir.ts
 * =================================================================
 * Private AI Reservoir Computing Engine over Encrypted Ciphertexts.
 * Computes fading memory dynamical state updates directly on encrypted inputs
 * without ever decrypting the reservoir state or input stream.
 * =================================================================
 */

import { BigIntHomomorphicFheEngine } from "./prime-field-bigint";
import { ExtendedHomomorphicFheOperations } from "./prime-fhe-operations";

export interface EncryptedReservoirState {
  state_acc: { ciphertext: bigint; noise_level: number };
  step_count: number;
}

export class HomomorphicPrivateAiReservoirEngine {
  private fhe: BigIntHomomorphicFheEngine;
  private ops: ExtendedHomomorphicFheOperations;

  constructor(fheEngine: BigIntHomomorphicFheEngine) {
    this.fhe = fheEngine;
    this.ops = new ExtendedHomomorphicFheOperations(fheEngine);
  }

  public initReservoir(initialPlaintext = 3n): EncryptedReservoirState {
    const c0 = this.fhe.encrypt(initialPlaintext);
    return { state_acc: c0, step_count: 0 };
  }

  /**
   * Process incoming encrypted input token: S_n = (2 * S_{n-1} + p_n) mod P
   * Executed directly on encrypted ciphertexts!
   */
  public stepEncryptedReservoir(
    current: EncryptedReservoirState,
    c_input: { ciphertext: bigint }
  ): EncryptedReservoirState {
    // 2 * S_{n-1}
    const c_scaled = this.ops.scaleHomomorphic(current.state_acc, 2n);
    // 2 * S_{n-1} + p_n
    const c_next = this.fhe.addHomomorphic(c_scaled, c_input);

    return {
      state_acc: c_next,
      step_count: current.step_count + 1,
    };
  }

  public decryptReservoirState(state: EncryptedReservoirState): bigint {
    return this.fhe.decrypt(state.state_acc);
  }
}
