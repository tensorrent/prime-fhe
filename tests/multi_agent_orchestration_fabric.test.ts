import { describe, it, expect } from "vitest";
import {
  EncryptedInterAgentChannel,
  CdclTaskManager,
  HomomorphicVotingEngine,
  MultiAgentOrchestrationFabric,
} from "../src/multi-agent-orchestration-fabric.js";
import { generateSecretKey } from "../src/unified-private-ai-platform.js";

describe("Multi-Agent Orchestration Fabric (MAOF) — Layer 3 of Sovereign Stack AI v2", () => {
  it("should encrypt and decrypt inter-agent channel messages securely using pairwise session keys", () => {
    const channel = new EncryptedInterAgentChannel();
    channel.establishSessionKey("agent-alpha", "agent-beta");

    const messageText = "TASK_DISPATCH: Run security audit on module prime-vdf-engine.ts";
    const encMessage = channel.encryptMessage("agent-alpha", "agent-beta", messageText);

    expect(encMessage.sender_agent_id).toBe("agent-alpha");
    expect(encMessage.recipient_agent_id).toBe("agent-beta");
    expect(encMessage.ciphertexts.length).toBeGreaterThan(0);

    const decryptedText = channel.decryptMessage(encMessage);
    expect(decryptedText).toBe(messageText);
  });

  it("should handle CDCL task decomposition, conflict reporting, and fallback reassignment", () => {
    const manager = new CdclTaskManager();
    const subtasks = manager.decomposeGoal("GOAL_REFACTOR", [
      { id: "sub-1", description: "Optimize memory layout", agentId: "agent-1" },
      { id: "sub-2", description: "Add formal invariant checks", agentId: "agent-2" },
    ]);

    expect(subtasks.length).toBe(2);
    expect(subtasks[0].status).toBe("Assigned");

    // Report success on sub-1
    const t1Result = manager.reportTaskResult(subtasks[0].task_id, true);
    expect(t1Result.status).toBe("Completed");

    // Report conflict on sub-2 with fallback reassignment to agent-3
    const t2Result = manager.reportTaskResult(subtasks[1].task_id, false, "agent-3");
    expect(t2Result.status).toBe("Reassigned");
    expect(t2Result.assigned_agent_id).toBe("agent-3");
  });

  it("should compute homomorphic majority voting over encrypted ballots without exposing individual votes", () => {
    const sharedKey = generateSecretKey();
    const votingEngine = new HomomorphicVotingEngine(sharedKey);

    const ballots = [
      votingEngine.castEncryptedVote("agent-1", 1),
      votingEngine.castEncryptedVote("agent-2", 1),
      votingEngine.castEncryptedVote("agent-3", 0),
    ];

    const tally = votingEngine.tallyEncryptedBallots(ballots);
    expect(tally.total_yes_votes).toBe(2);
    expect(tally.majority_passed).toBe(true);
  });

  it("should execute end-to-end multi-agent collaborative workflow (MAOF Orchestration)", () => {
    const fabric = new MultiAgentOrchestrationFabric();

    const agentIds = ["agent-arch", "agent-coder", "agent-tester"];
    const subtaskSpecs = [
      { id: "t1", description: "Design zero-knowledge circuit", agentId: "agent-arch" },
      { id: "t2", description: "Implement Rust cryptographic crate", agentId: "agent-coder" },
      { id: "t3", description: "Run empirical benchmark suite", agentId: "agent-tester" },
    ];

    const executors = new Map<string, (desc: string) => boolean>();
    executors.set("agent-arch", () => true);
    executors.set("agent-coder", () => true);
    executors.set("agent-tester", () => true);

    const result = fabric.runEncryptedWorkflow(agentIds, subtaskSpecs, executors);
    expect(result.completed).toBe(true);
    expect(result.subtasks.length).toBe(3);
    expect(result.tallyResult?.majority_passed).toBe(true);
  });
});
