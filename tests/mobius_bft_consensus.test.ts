// mobius_bft_consensus.test.ts
// =================================================================
// Verification Suite for Möbius BFT Consensus Engine
// =================================================================

import { describe, it, expect } from "vitest";
import { MobiusBftConsensusEngine } from "../src/mobius-bft-consensus";

describe("Möbius BFT Consensus Engine", () => {
  it("tracks partitioned network branches across dual coset cycles", () => {
    const engine = new MobiusBftConsensusEngine();
    const b1 = engine.registerBranch("alpha", 2);
    const b2 = engine.registerBranch("beta", 3);

    expect(b1.branch_id).toBe("alpha");
    expect(b2.branch_id).toBe("beta");
  });

  it("reconciles conflicting network branches automatically at Vacuum Anchor 136", () => {
    const engine = new MobiusBftConsensusEngine();
    engine.registerBranch("alpha", 2);
    engine.registerBranch("beta", 3);

    engine.stepBranch("alpha", 11);
    engine.stepBranch("beta", 23);

    const res = engine.reconcilePartitionedBranches("alpha", "beta");
    expect(res.is_reconciled).toBe(true);
    expect(res.vacuum_anchor).toBe(136); // Vacuum Anchor Reconciliation!
    expect(res.reconciled_state).toBeGreaterThanOrEqual(0);
    expect(res.reconciled_state).toBeLessThan(137);
  });
});
