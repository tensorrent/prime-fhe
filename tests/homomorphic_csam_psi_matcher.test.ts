// homomorphic_csam_psi_matcher.test.ts
// =================================================================
// Verification Suite for Zero-Knowledge Homomorphic Content Matching (H-PSI)
// =================================================================

import { describe, it, expect } from "vitest";
import { HomomorphicCsamPsiMatcher } from "../src/homomorphic-csam-psi-matcher";

describe("Zero-Knowledge Homomorphic Content Matching (H-PSI) Engine", () => {
  const matcher = new HomomorphicCsamPsiMatcher();
  const secretKey = 0x987654321fedcban;

  it("detects homomorphic perceptual hash matches without exposing content", () => {
    // Synthetic PDQ / PhotoDNA 256-bit hashes
    const syntheticTargetHashHex = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const syntheticCleanHashHex  = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

    const targetFieldElem = matcher.hashToFieldElement(syntheticTargetHashHex);
    const cleanFieldElem = matcher.hashToFieldElement(syntheticCleanHashHex);

    // Authority encrypts database entry
    const dbEntry = matcher.encryptDatabaseEntry("TARGET_DB_001", targetFieldElem, secretKey, 0x1111n);

    // Case A: User uploads matching hash (Encrypted under fresh mask)
    const userMatchingToken = matcher.encryptUserHash(targetFieldElem, secretKey, 0x2222n);
    const resultMatch = matcher.evaluateHomomorphicMatch(userMatchingToken, [dbEntry], secretKey);

    expect(resultMatch.matched).toBe(true);
    expect(resultMatch.matchedEntryId).toBe("TARGET_DB_001");
    expect(resultMatch.encryptedAlertToken).toBeDefined();

    // Case B: User uploads non-matching clean hash
    const userCleanToken = matcher.encryptUserHash(cleanFieldElem, secretKey, 0x3333n);
    const resultClean = matcher.evaluateHomomorphicMatch(userCleanToken, [dbEntry], secretKey);

    expect(resultClean.matched).toBe(false);
  });
});
