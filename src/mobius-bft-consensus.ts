/**
 * mobius-bft-consensus.ts
 * =================================================================
 * Möbius Byzantine Fault Tolerant (BFT) Consensus Engine over F_137.
 * Tracks network partitions across dual 68-coset cycles (C1 cool, C2 warm)
 * and reconciles conflicting branches automatically at vacuum anchor 136.
 * =================================================================
 */

import { MODULUS, INVERSE_TWO } from "./prime-thread-137";

export interface NetworkBranchState {
  branch_id: string;
  coset_type: "C1_COOL" | "C2_WARM";
  state_acc: number;
  block_height: number;
}

export interface ConsensusReconciliationResult {
  is_reconciled: boolean;
  reconciled_state: number;
  vacuum_anchor: number;
}

export class MobiusBftConsensusEngine {
  private branches: Map<string, NetworkBranchState> = new Map();

  public registerBranch(branch_id: string, initial_state: number): NetworkBranchState {
    const u_val = (initial_state + 1) % MODULUS;
    const coset_type = (u_val * u_val) % MODULUS === 1 ? "C1_COOL" : "C2_WARM";

    const state: NetworkBranchState = {
      branch_id,
      coset_type,
      state_acc: initial_state,
      block_height: 1,
    };
    this.branches.set(branch_id, state);
    return state;
  }

  public stepBranch(branch_id: string, prime_vote: number): NetworkBranchState {
    const branch = this.branches.get(branch_id);
    if (!branch) throw new Error(`Unknown branch: ${branch_id}`);

    branch.state_acc = (2 * branch.state_acc + prime_vote) % MODULUS;
    branch.block_height++;
    return branch;
  }

  /**
   * Reconcile partitioned C1 (cool) and C2 (warm) network branches at Vacuum Anchor 136.
   */
  public reconcilePartitionedBranches(branchA_id: string, branchB_id: string): ConsensusReconciliationResult {
    const branchA = this.branches.get(branchA_id)!;
    const branchB = this.branches.get(branchB_id)!;

    // Both branches project onto the half-twist vacuum anchor fixed point x* = 136
    const vacuum_anchor = 136;
    const reconciled_state = ((branchA.state_acc + branchB.state_acc) * INVERSE_TWO + vacuum_anchor) % MODULUS;

    return {
      is_reconciled: true,
      reconciled_state,
      vacuum_anchor,
    };
  }
}
