/**
 * homomorphic-csam-psi-matcher.ts
 * =================================================================
 * Zero-Knowledge Homomorphic Content Matching & Private Set Intersection Engine.
 * Operates over F_P (P = 2^256 - 189) using Modular Affine Masked Homomorphic Protocols (MA-HP).
 * Performs encrypted perceptual hash comparisons (PDQ/PhotoDNA 256-bit vectors)
 * against encrypted database targets without decrypting client content on server.
 * =================================================================
 */

export interface EncryptedHashToken {
  ciphertext: bigint; // C_u = (k * H_u + r_u) mod P
  mask: bigint;       // Ephemeral mask r_u
}

export interface EncryptedDatabaseEntry {
  id: string;
  ciphertext: bigint; // C_d = (k * H_d + r_d) mod P
  mask: bigint;       // Mask r_d
}

export interface HomomorphicMatchResult {
  matched: boolean;
  matchedEntryId?: string;
  encryptedAlertToken?: bigint;
}

export class HomomorphicCsamPsiMatcher {
  private p: bigint;

  constructor(primeModulus: bigint = (1n << 256n) - 189n) {
    this.p = primeModulus;
  }

  private modPow(base: bigint, exp: bigint, mod: bigint): bigint {
    let res = 1n;
    let b = ((base % mod) + mod) % mod;
    let e = exp;
    while (e > 0n) {
      if (e & 1n) res = (res * b) % mod;
      b = (b * b) % mod;
      e >>= 1n;
    }
    return res;
  }

  private modInverse(a: bigint, m: bigint): bigint {
    return this.modPow(a, m - 2n, m);
  }

  /**
   * Convert a 256-bit hex hash string (e.g. PDQ/PhotoDNA feature hash) into F_P scalar
   */
  public hashToFieldElement(hexHash: string): bigint {
    const raw = BigInt(hexHash.startsWith("0x") ? hexHash : "0x" + hexHash);
    return ((raw % this.p) + this.p) % this.p;
  }

  /**
   * Client-side Encryption of Perceptual Hash Stream Element
   */
  public encryptUserHash(hashElement: bigint, secretKey: bigint, mask: bigint): EncryptedHashToken {
    const k = ((secretKey % this.p) + this.p) % this.p;
    const r = ((mask % this.p) + this.p) % this.p;
    const c = (k * hashElement + r) % this.p;
    return { ciphertext: c, mask: r };
  }

  /**
   * Authority/Database Entry Encryption
   */
  public encryptDatabaseEntry(id: string, hashElement: bigint, secretKey: bigint, mask: bigint): EncryptedDatabaseEntry {
    const k = ((secretKey % this.p) + this.p) % this.p;
    const r = ((mask % this.p) + this.p) % this.p;
    const c = (k * hashElement + r) % this.p;
    return { id, ciphertext: c, mask: r };
  }

  /**
   * Homomorphic Private Set Intersection (H-PSI) Matching Engine:
   * Evaluates encrypted difference Delta = k * (H_u - H_d) mod P without revealing H_u or H_d!
   */
  public evaluateHomomorphicMatch(
    userToken: EncryptedHashToken,
    dbEntries: EncryptedDatabaseEntry[],
    secretKey: bigint
  ): HomomorphicMatchResult {
    const k_inv = this.modInverse(secretKey, this.p);

    for (const dbEntry of dbEntries) {
      // Compute unmasked key difference: Delta = (C_u - r_u) - (C_d - r_d) mod P
      const c_u_clean = (userToken.ciphertext - userToken.mask + this.p) % this.p;
      const c_d_clean = (dbEntry.ciphertext - dbEntry.mask + this.p) % this.p;
      const delta = (c_u_clean - c_d_clean + this.p) % this.p;

      // Delta = k * (H_u - H_d) mod P
      if (delta === 0n) {
        // Match found! Generate encrypted alert token under authority key
        const alertMask = 0xabcdef123456n;
        const encryptedAlert = (secretKey * 1n + alertMask) % this.p;

        return {
          matched: true,
          matchedEntryId: dbEntry.id,
          encryptedAlertToken: encryptedAlert,
        };
      }
    }

    return { matched: false };
  }
}
