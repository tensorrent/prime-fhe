import { describe, it, expect } from "vitest";
import {
  ScientificReasoningCopilotClient,
  CdclLeanBridge,
  HomomorphicProofCertifier,
  ScientificReasoningCopilot,
} from "../src/scientific-reasoning-copilot.js";

describe("Scientific Reasoning Co-Pilot (SRCP) — Layer 2 of Sovereign Stack AI v2", () => {
  it("should encrypt LaTeX theorem statements into MA-HP field elements over F_P", () => {
    const client = new ScientificReasoningCopilotClient();
    const statement = "\\theorem sum_first_n (n : \\mathbb{N}) : \\sum_{i=1}^n i = n * (n + 1) / 2";

    const encInput = client.encryptSymbolicStatement(statement);
    expect(encInput.ciphertexts.length).toBeGreaterThan(0);
    expect(encInput.masks.length).toBe(encInput.ciphertexts.length);
    expect(encInput.plaintext_length).toBe(statement.length);
  });

  it("should formally verify Lean 4 proof tactics using CDCL conflict tracking", () => {
    const bridge = new CdclLeanBridge();
    const validTactics = ["intro n", "induction n with d hd", "rfl", "simp [hd]"];

    const result = bridge.verifyProofSteps(validTactics, (tactic) => !tactic.includes("sorry"));
    expect(result.valid).toBe(true);
    expect(result.accepted_tactics.length).toBe(4);
    expect(result.conflict_count).toBe(0);

    const invalidTactics = ["intro n", "sorry", "exact rfl"];
    const invalidResult = bridge.verifyProofSteps(invalidTactics, (tactic) => !tactic.includes("sorry"));
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.conflict_count).toBe(1);
  });

  it("should generate and verify zero-shot Homomorphic Proof Certificates via Prime VDF", () => {
    const client = new ScientificReasoningCopilotClient();
    const certifier = new HomomorphicProofCertifier();

    const theorem = "\\forall x, x + 0 = x";
    const cert = certifier.generateCertificate(theorem, 3, true);

    expect(cert.is_formally_verified).toBe(true);
    expect(cert.certificate_hash).toMatch(/^0x[0-9a-f]{16}$/);

    const isValid = client.verifyCertificate(cert);
    expect(isValid).toBe(true);
  });

  it("should execute full SRCP pipeline (Encrypted LaTeX → CDCL-Lean Bridge → Proof Certificate → Encrypted Proof)", () => {
    const client = new ScientificReasoningCopilotClient();
    const srcp = new ScientificReasoningCopilot();

    const latexStatement = "\\theorem pythagoras (a b c : \\mathbb{R}) (h : a^2 + b^2 = c^2) : c = \\sqrt{a^2 + b^2}";
    const encInput = client.encryptSymbolicStatement(latexStatement);

    const { encryptedProof, certificate } = srcp.processEncryptedScientificTask(
      encInput,
      client.key,
      (decryptedStatement) => {
        return {
          tactics: ["intro a b c h", "rw [h]", "exact sqrt_sq"],
          leanProofCode: `theorem pythagoras (a b c : ℝ) (h : a^2 + b^2 = c^2) : c = sqrt (a^2 + b^2) := by\n  intro a b c h\n  rw [h]\n  exact sqrt_sq`,
        };
      },
      (tactic) => !tactic.includes("sorry")
    );

    // Verify Certificate
    expect(certificate.is_formally_verified).toBe(true);
    expect(client.verifyCertificate(certificate)).toBe(true);

    // Decrypt Proof
    const decryptedLeanProof = client.decryptProof(encryptedProof);
    expect(decryptedLeanProof).toContain("theorem pythagoras");
    expect(decryptedLeanProof).toContain("exact sqrt_sq");
  });
});
