# Glossary — Prime FHE / Möbius engine

Coined and specialized vocabulary used in this repository: what each named object is,
its domain and codomain, what it composes with, where it is defined, and whether it is
built or specified.

**This is an extract.** The canonical cross-repo catalogue — covering every tensorrent
repository, with the full status ledger and the coverage/provenance notes — lives at
`dev/docs/GLOSSARY.md`. Section numbers below are that document's numbering, so
cross-references to sections not reproduced here resolve against the canonical copy.

Compiled 2026-07-30 from source and spec files. Every entry cites its defining location.

> Read §1 first. It catalogues the deliberate homonyms (three senses of "scroll", two of
> "well", two of "motif"), the standard terms this program redefines (CDCL, ζ, ring,
> rainbow table), and the genuine cross-repo collisions — including three incompatible
> F369 tables all carrying the EigenCharge name.

---

## 1. Read this first: homonyms, collisions, and contested definitions

The program reuses a small set of nouns at several scales deliberately, and in a few places accidentally. A reviewer who does not know which is which will mis-type objects. This section is the disambiguation table; the detailed entries follow in §3 onward.

### 1.1 Deliberate homonyms — the same word, genuinely different objects

These are intentional. Both senses are load-bearing and are **not** interchangeable.

| Word | Sense A | Sense B | Distinguish by |
|---|---|---|---|
| **well** | *concept well* — a named attractor in router concept space, `{id, keywords[]}` | *reasoning well* — one of 8 thinking archetypes (Deductive, Skeptical, Narrative, Systems, Ethical, Compression, Exploratory, Grounding) | A is data in `wells.json`; B is an enum in `orchestrator.ts` |
| **motif** | *memory motif* — a recurring event window promoted to a name | *color motif* — a 16-hex content address of a byte block | A is in `motif-memory.ts`; B is in `spectral_assembler.ts`. The repo flags the collision explicitly at `aiso/frontend/tools/well-port/PRD.md:198` |
| **scroll** | *reasoning scroll* — append-only decision ledger | *storage scroll* — CRDT event log with frontier root | *codec scroll* — hash-linked chunk chain | All three are append-only and hash-chained; the storage sense adds CRDT merge, the codec sense adds Merkle proofs over 216-byte blocks |
| **vixel** | *AISO routing sense* — signal carrier / Merkle path node | *sovereign_vixel sense* — a 32³ octree encoded as a single 32768-bit Tupper integer | A is active and typed; B is a 49-line aspirational prototype |
| **ring** | *access ring* — R0–R4 visibility level resolved from auth factors | **Not** an algebraic ring | Always the access sense in `rings.ts`; the algebraic sense appears only in the FHE work as `F_P` |
| **rainbow table** | *Vexel rainbow* — precomputed grid coordinates for one Vexel's keywords | **Not** the password-cracking structure | Always the Vexel sense in this codebase |
| **witness** | *independence witness* — a re-implementation used to check the primary one | *epistemic witness* — the distinct source that vouched for a learned well | *spectral witness* — a statistic in the ACS instrument suite | Three unrelated senses in three subsystems |
| **keystone** | *KSM entry* — a CLVM/Chialisp trap with Trap/Fix/Invariant fields | *masterclass keystone* — a source-tiered study artifact from external literature | A is in `.agents/keystone_map_guide.md`; B in `.agents/*_masterclass_keystone.md` |

### 1.2 Redefined standard terms — the word exists in the literature and means something else here

**These are the highest-risk items for an outside reader.**

| Term | Standard meaning | Meaning in this program |
|---|---|---|
| **CDCL** | Conflict-Driven Clause Learning (SAT solving) | **Constraint-Driven Consensus Layer** — a transparent-constraint engine where clauses carry dispositions and provenance. It borrows the backjump idea but is not a SAT solver |
| **EigenCharge** | — (coined) | Two *incompatible* definitions exist; see §1.3 |
| **ζ (zeta)** | The Riemann zeta function | In the RC Stack, ζ is a **Boolean predicate** — a five-gate conjunction certifying a system state. Not a scalar, not a hash, not Riemann's ζ. The prime/FHE arm *does* use Riemann's ζ, so both live in the corpus |
| **Σ-Engine** | — (coined) | A spectral instability estimator; the one component in ζ deliberately allowed to use floating point |
| **holography** | AdS/CFT bulk-boundary correspondence | Used in the strict sense of HR-1/HR-2/HR-3 (boundary encoding + external accessibility + faithfulness); the Ryu–Takayanagi analogy is stated as structural, not derived |
| **tensegrity** | Buckminster Fuller's tension-compression structures | Read as an ACS instance: cables = Form, struts = Function, with a proved lemma that rigidity-matrix zero modes align with gauge freedoms |

### 1.3 Genuine collisions — the same name, different mathematics, in the same program

These are defects rather than design, and a reviewer should treat cross-repo claims about them with care.

**EigenCharge / the F369 table.** At least three distinct constructions carry this name:

| Where | Table size | Trace definition | Hash |
|---|---|---|---|
| `aiso/frontend` (Trinity) | 12,000 entries | positional — byte index rotated by position | FNV-64 |
| `HashCloud-SPE/crates/consensus` | 369 entries, distinct primes | `Σ F369[byte % 369]` | FNV-64 (v1) / SipHash-2-4 keyed on `UBC_ID` (v2) |
| `omniforge-full/python` | 512 entries | closed-form recurrence `t[i] = (i(i−1)/2)·3 − ⌊i/3⌋·6 + ⌊i/9⌋·9` | FNV-1a |

The closed-form recurrence is shared, the table lengths and the reduction are not. **Charges from these three are not comparable**, and the "same word charges bit-identically across runtimes" contract holds only *within* the Trinity family (Rust / WASM / TypeScript), where it is enforced by an equivalence test.

**SPE.** Canonically **Symbolic Pointer Engine**. The expansion "Storage Proof Engine" appears once, in `koba42-prime-thread-scroll/docs/HASHCLOUD_PRIME_SCROLL_INTEGRATION.md`, and is a mis-expansion.

**Ephemeral mask discipline.** The papers assert masks drawn uniformly and used once. Three implementations use a **constant mask `r = 1`** instead — `prime-field-bigint.ts:41`, `homomorphic-prime-fhe.ts:26`, `multi-key-threshold-fhe.ts:42` — and the H-PSI alert token hard-codes `alertMask = 0xabcdef123456n`. These do not satisfy the information-theoretic secrecy argument the papers state. Only `interactive-client-assisted-fhe.ts`, `multi-ring-shift-cipher.ts`, `homomorphic-csam-psi-matcher.ts`, and `unified-private-ai-platform.ts` take a caller-supplied uniform mask.

**Blinded evaluation handle `H_mult`.** Asserted as Theorem 2 / Theorem 4 in the ePrint and PETS manuscripts and in the README; **refuted in the source**, where `generateBlindedEvalHandle` and `serverMultiplyBlinded` are marked `@deprecated` with a regression test pinning the impossibility. This is a live documentation/code divergence, not a resolved one.

### 1.4 Contested acronyms

Two central names have no single canonical expansion in the corpus.

**TENT** — dominant usage (roughly 15 of 25 occurrences) is *Tensor Entanglement Network Technology*. Also found: *Thermodynamic Engine for Natural Topology*, *Topology of Evolving Neural Terrain*, *The Entropy-Nullifying Transceiver*, *Truth Encoded in Nested Topology*, *TensorRent Intent-Topology*, *Tensor Engineering & Networking Toolkit*, *Test-first Enforcement Network Technology*. One file hedges openly: "Tentative Emergent Neural Topology? – based on the code context."

**SEGGCI** — the README's own subtitle gives *Self-Improving, Ethically Grounded, Geometrically Coherent Intelligence*. Also found: *Sovereign Epistemic Governance & Graph Constraint Integration* (one doc flags this as possibly unsourced), *Stability Emergence Geometric Coherent Intelligence*, *Self-Evolving Generalized Governance & Cognitive Intelligence*.

**AKPP** — appears in "AKPP Underdetermination Bound (Theorem 5)" and is **never expanded anywhere in either repo**; the theorem is a one-line assertion with `∎` and no proof body.

### 1.5 Non-injective vocabularies

The **mobioud** prime-triad lexicon reuses triples across versions with different meanings: `(101,103,107)` is *Resonance/Insight/Flow* in v2, *Systemic Acceptance* in v3, and *Master Symmetry* in v5; `(191,193,197)` is *Invariant Clarity* in v4 and *Total Recall* in v5. Later versions overwrite rather than extend, so the map `ℙ³ ⇀ ConceptLabel` is partial and version-dependent.

---


## 10. Number theory and cryptography

Canonical paths in this section are `prime-fhe-mobius-engine/` (see §2 on the `koba42-prime-thread-scroll` mirror).

### Ephemeral mask *(uniform mask, one-time field mask, `r`)*
**Kind** object/structure · **Status** active — **but see the constant-mask violations in §1.3**
The fresh, single-use randomizer `r` in the MA-HP encryption `C = (k·m + r) mod P`. It is drawn uniformly from the *entire* field `r ←$ U(𝔽_P) = {0,…,P−1}` — crucially **including 0**, which is what makes masking secrecy exact (`Pr[C = c] = 1/P`, zero support gaps) rather than approximate. It is retained privately by the client, never sent to the server, and removed by exact subtraction, not by rounding.

The contrast with LWE is the design's whole point: LWE error must be *small* so rounding can strip it, hence noise growth and bootstrapping; a uniform mask is *full-range* and exactly removable, so there is no noise budget, no growth, no bootstrap, and unbounded additive depth. Reuse of a single mask collapses the guarantee from information-theoretic to nothing — two messages under one mask reveal their difference.
- **Type**: `r ←$ U(𝔽_P)`; masked ciphertext pair `(C, r) ∈ 𝔽_P × 𝔽_P`; sampler `generateMask : () → 𝔽_P^×`
- **Composes**: 𝔽_P, φ_{k,r}, Transcript Equivalence Theorem, mask-reuse guard, Beaver triple, multi-ring shift cipher
- **At**: `prime-fhe-mobius-engine/docs/IACR_EPRINT_AFFINE_RING_FHE_PAPER.md:14,17,32,70`; `src/interactive-client-assisted-fhe.ts:6-18,36-40,104-114`; sampler `src/unified-private-ai-platform.ts:82-107`; reuse guard `assertDistinctMasks` at `interactive-client-assisted-fhe.ts:281-299`

### MA-HP — Modular Affine Masked Homomorphic Protocols
**Kind** protocol · **Status** active
A client-assisted homomorphic evaluation framework over 𝔽_P in which plaintexts are masked by an invertible affine map under a secret key `k ∈ 𝔽_P^×` and a fresh ephemeral mask. `KeyGen(1^λ) → sk = (k, k⁻¹)`; `Encrypt(m, sk) → (C = k·m + r mod P, r)`; `Decrypt(C, sk, r) = (C − r)·k⁻¹ mod P`. Addition and public-scalar multiplication are non-interactive and exact — the server adds ciphertexts, the client adds masks, and masks *wrap* in 𝔽_P rather than accumulating. Multiplication costs one interaction round. Positioned against OTP (non-homomorphic), additive secret sharing, SPDZ/garbled circuits, and lattice FHE; claimed 736 ns per field-op step vs ≈25–30 ms for an RLWE ciphertext multiply.
- **Type**: `Enc : 𝔽_P × 𝔽_P^× × 𝔽_P → 𝔽_P`; `Dec : 𝔽_P × 𝔽_P^× × 𝔽_P → 𝔽_P`; `serverAdd : 𝔽_P × 𝔽_P → 𝔽_P`
- **At**: `prime-fhe-mobius-engine/docs/IACR_EPRINT_AFFINE_RING_FHE_PAPER.md:14, 24-40`; `src/interactive-client-assisted-fhe.ts:73-148`

### φ_{k,r} — the affine masking map
**Kind** operator/map · **Status** active
`φ_{k,r}(m) = (k·m + r) mod P`. For fixed `k ∈ 𝔽_P^×` it is a bijection on 𝔽_P; composition with a constant shift is a bijective permutation, which is the mechanism behind both the uniform-ciphertext argument and the maximally-mixed density matrix. **Note**: the 𝔽₁₃₇ prime-thread map `f(x) = 2x+1` is literally φ_{k,r} with `k = 2, r = 1` — the 137 thread and the 𝔽_P FHE scheme are the same algebraic object at two scales.
- **Type**: `φ_{k,r} : 𝔽_P → 𝔽_P`, `m ↦ k·m + r`; inverse `φ⁻¹(C) = (C − r)·k⁻¹`
- **At**: `prime-fhe-mobius-engine/docs/IACR_EPRINT_AFFINE_RING_FHE_PAPER.md:14`

### 𝔽_P with P = 2²⁵⁶ − 189 *(`PRIME_256`)*
**Kind** object/structure · **Status** active
The 256-bit prime residue field carrying all MA-HP arithmetic. Chosen so plaintexts — including 256-bit perceptual hashes — and masks are single field scalars rather than polynomial ring elements; the stated payload contrast is 256 bits vs SEAL's ≈262 KB. Modular inverse by Fermat (`a^(P−2)`).
- **Type**: `|𝔽_P| = P`; multiplicative group 𝔽_P^× of order `P − 1`
- **At**: `prime-fhe-mobius-engine/src/prime-field-bigint.ts:10`

### Client-assisted evaluation
**Kind** method/principle · **Status** active
The server holds neither key nor masks and computes only on masked values; the client supplies exactly the interaction needed to cross an algebraic barrier. Multiplication is resolved by Beaver triples: the server forms `diffA = C₁ − Enc(a)`, `diffB = C₂ − Enc(b)`; the client opens `d = m₁ − a`, `e = m₂ − b` (safe to publish since `a, b` are uniform and single-use); the server completes `m₁m₂ = ab + d·b + e·a + d·e` in ciphertext space, with `Enc(1)` carrying the public `d·e` scalar. The result is exact, uniformly masked, noise-free, and itself re-multipliable.
- **Type**: `serverPrepareMultiply : MC × MC × BeaverTriple → MultiplyChallenge`; `clientOpenMultiply : MultiplyChallenge × 𝔽_P^× → {d, e}`; `serverMultiply : BeaverTriple × Opened → 𝔽_P`
- **At**: `prime-fhe-mobius-engine/src/interactive-client-assisted-fhe.ts:26-32, 150-244`

### Beaver triple (MA-HP form)
**Kind** object/structure · **Status** active
A single-use offline artifact `{encA, encB, encAB, encOne}`: encryptions of `a`, `b`, `a·b` under four independent uniform masks, plus `Enc(1)` as the carrier for the public `d·e` term. Single-use is load-bearing — the opened `d`, `e` are public, so reusing `(a, b)` on a second pair exposes the difference of the two plaintexts.
- **Type**: `generateBeaverTriple : 𝔽_P^× × 𝔽_P × 𝔽_P × {rA,rB,rAB,rOne} → BeaverTriple`
- **At**: `prime-fhe-mobius-engine/src/interactive-client-assisted-fhe.ts:42-57, 154-174`

### Blinded evaluation handle `H_mult`
**Kind** operator/map · **Status** **legacy — a documented dead end, with a live doc/code divergence (§1.3)**
A client-computed scalar `H_mult = (r₁·r₂·k⁻¹) mod P`, intended to let the server multiply two additively-masked ciphertexts without a round trip. **Retracted in the source as structurally impossible**: `C₁·C₂ = k²m₁m₂ + k·m₁r₂ + k·m₂r₁ + r₁r₂`, and the cross terms bind each plaintext to the *other* message's mask, so no client-side constant strips them (checked against candidates `r₁r₂`, `H`, `0`, `r₁r₂k⁻¹`). The papers still present it as Theorem 2 / Theorem 4; the code marks both `generateBlindedEvalHandle` and `serverMultiplyBlinded` `@deprecated` and keeps them "so the dead end stays documented."
- **At**: paper `docs/IACR_EPRINT_AFFINE_RING_FHE_PAPER.md:35-38, 50-53, 77-79`; refutation `src/interactive-client-assisted-fhe.ts:246-275`; regression test `tests/interactive_client_assisted_fhe.test.ts:202`

### Multi-ring shift cipher
**Kind** protocol · **Status** active
An evaluation strategy keeping data in whichever masked ring makes the pending operation free, paying one interaction round *per regime change* rather than per multiplication. Additive ring `C = k·m + r`: add and scalar free, multiply needs a Beaver round. Multiplicative ring `C = s·m`: multiply and public-exponent free (`s₁s₂` is exactly removable), addition impossible locally. Includes an impossibility argument: if both were locally exact-unmaskable, `c ↦ m` would be a ring homomorphism 𝔽_P → 𝔽_P, and on a prime field the only such map is the identity, forcing mask = 0. So "free within a regime, one round at the boundary" is a **floor, not a workaround**. Crossover: two clustered multiplies.
- **Type**: `clientShift : ShiftRequest × Ring × 𝔽_P^× × 𝔽_P × 𝔽_P → RingCiphertext`; `planRounds : ("add"|"multiply")[] → {beaverOnly, twoRing, recommend}`
- **At**: `prime-fhe-mobius-engine/src/multi-ring-shift-cipher.ts:1-38, 100-192, 194-231, 233-268`

### Multiplicative-ring zero leak
**Kind** invariant/metric · **Status** active (named and deliberately unfixed)
`s·0 = 0` for every mask `s`, so the plaintext `m = 0` is distinguishable while every other value is uniform. The ring is therefore safe only on the nonzero domain (products, powers, ratios, geometric aggregates); zero-bearing data must live in the additive ring, whose mask is uniform over all of 𝔽_P including 0. `encryptMultiplicative` throws rather than leaking silently.
- **Type**: leakage predicate `C = 0 ⟺ m = 0`
- **At**: `prime-fhe-mobius-engine/src/multi-ring-shift-cipher.ts:31-36, 140-158`

### Transcript Equivalence Theorem (Theorem 3)
**Kind** theorem/result · **Status** active
For any observed transcript `(C₁,…,C_N) ∈ 𝔽_P^N` under key `k` and plaintexts `(m₁,…,m_N)`, and any candidate `k' ∈ 𝔽_P^×`, the mask vector `r'_i = (C_i − k'·m_i) mod P` uniquely explains the transcript, and `Pr[(C₁,…,C_N) | k'] = 1/P^N` independently of `k'`. Hence single-session key extraction and plaintext recovery are information-theoretically underdetermined. Proof rests on `r_i ~ U(𝔽_P)` i.i.d. and constant-shift bijectivity.
- **Type**: `Pr[· | k', (m_i)] : 𝔽_P^N → [0,1]`, constant `= P^{−N}`
- **At**: `docs/IACR_EPRINT_AFFINE_RING_FHE_PAPER.md:59-75`

### AKPP Underdetermination Bound (Theorem 5)
**Kind** theorem/result · **Status** **aspirational** — unexpanded acronym, proof-free stub
Asserts that the MA-HP transcript equations alone are information-theoretically underdetermined absent additional constraints on mask generation. Appears as a one-line theorem with `∎` and no proof body; **the acronym AKPP is never expanded anywhere in either repo** (§1.4).
- **At**: `docs/IACR_EPRINT_AFFINE_RING_FHE_PAPER.md:81-82`

### Maximally-mixed ciphertext density matrix
**Kind** theorem/result · **Status** active
Quantum restatement of masking secrecy: summing the encrypted state over `r ←$ U(𝔽_P)` gives `ρ_C = (1/P)Σ_r |k·m + r⟩⟨k·m + r| = (1/P)I_P`, because `r ↦ k·m + r` is a bijective permutation of 𝔽_P. Claimed consequences: von Neumann entropy `S(ρ_C) = log₂ P = 256` bits, quantum mutual information `I(m; ρ_C) = 0`, Shor/QFT immunity (no periodic structure to find), and a `2^128` Grover bound.
- **At**: `prime-fhe-mobius-engine/docs/QUANTUM_CRYPTANALYSIS_MAHP_FULL_EXPLORATION.md:20-37, 58-83`

### H-PSI — Homomorphic Private Set Intersection
**Kind** protocol · **Status** active
MA-HP applied to encrypted perceptual-hash matching (PDQ/PhotoDNA 256-bit vectors mapped to 𝔽_P scalars). Client sends `C_u = k·H_u + r_u`; database entries are `C_d = k·H_d + r_d`; the matching operator is `Δ = (C_u − r_u) − (C_d − r_d) ≡ k(H_u − H_d) mod P`, so `Δ = 0` iff the hashes agree, without either hash being revealed. Claimed throughput 1.36 MHz (736 ns per comparison).
- **Type**: `hashToFieldElement : hex → 𝔽_P`; `evaluateHomomorphicMatch : Token × Entry[] × 𝔽_P^× → {matched, matchedEntryId?, encryptedAlertToken?}`
- **At**: `docs/PETS_2026_HPSI_ZERO_KNOWLEDGE_MATCHING_PAPER.md:12, 26-44`; `src/homomorphic-csam-psi-matcher.ts:28-111`

### Encrypted alert token
**Kind** artifact/format · **Status** active — **implementation is a placeholder inconsistent with the mask discipline**
The only output H-PSI emits on a match: a ciphertext decryptable solely by a designated public-safety recipient. Governance framing is explicit (non-surveillance, open-source auditability). The reference implementation hard-codes `alertMask = 0xabcdef123456n` — a fixed, non-ephemeral mask.
- **At**: `src/homomorphic-csam-psi-matcher.ts:98-106`

### Mask-reuse guard / mask discipline
**Kind** method/principle · **Status** active
The operational rule carrying the whole security argument: masks must be uniform, unpredictable, and used exactly once. `assertDistinctMasks` throws on any repeat. `generateMask` was migrated off `Math.random()` — V8's xorshift128+ is recoverable from a handful of outputs, and predictable masks make ciphertexts trivially unmaskable **while every test still passes** — to the platform CSPRNG (256 uniform bits reduced mod `P−1`). Flagged in-source as strictly worse than any algebraic bug, because the failure is invisible.
- **Type**: `assertDistinctMasks : 𝔽_P[] → void | throw`; `generateMask : () → [1, P−1]`
- **At**: `src/interactive-client-assisted-fhe.ts:277-299`; `src/unified-private-ai-platform.ts:82-107`

### Noisy affine extension — the instrumented negative control
**Kind** subsystem · **Status** active as a negative control; **aspirational as a security claim**
A deliberately-scoped foil to the masked protocol: `C = k·(Δ·m + e) mod P` with `Δ = 2²⁰⁰`, `|e| < 1000`, decrypted by `m = round((C·k⁻¹ mod P)/Δ)`. The scaling factor is what lets rounding separate plaintext (high bits) from noise (low bits) — without it `C·k⁻¹ = m + e·k⁻¹` and `e·k⁻¹` is a full-range field element however small `e` is; a prior implementation returned exactly that, and a regression test pins it. The inequality `|e| < Δ/2` **is** the noise budget, exposed via `noiseBudgetRemaining` so "the bootstrapping cliff is measurable rather than theoretical." Carries an explicit disclaimer: at lattice dimension 1 there is no LWE hardness to appeal to.
- **At**: `src/affine-ring-fhe-security.ts:33-90`

### Prime Thread Scroll (𝔽₁₃₇) — the affine anti-map
**Kind** object/structure + operator/map · **Status** active (the 𝔽₁₃₇ family is tested; several derived engines are research artifacts with no production consumer)
An affine structure over 𝔽₁₃₇ with forward map `f(x) = (2x + 1) mod 137` and **exact inverse — the Anti-Map** — `f⁻¹(y) = (y − 1)·69 mod 137`, where `69 ≡ 2⁻¹` since `2·69 = 138 ≡ 1`. Under the shift `u = x + 1` it linearizes to pure doubling; since 2 has multiplicative order `68 = (137−1)/2`, the field partitions as `𝔽₁₃₇ = C₁ ⊔ C₂ ⊔ {136}`. The exact anti-map is what makes state-channel reversibility tamper-evident: any tampered input prevents exact restoration to genesis. Claimed on-chain effect: constant O(1) CLVM gas (8,500) regardless of trajectory depth — up to 99.3% saving at 1,000 steps — at the honestly-recorded cost of ≈33% lower off-chain throughput (25.1M → 16.9M ops/s).
- **Type**: `f : 𝔽₁₃₇ → 𝔽₁₃₇`, `x ↦ 2x+1`; `f⁻¹(y) = (y−1)·69`; accumulator `S_{n+1} = (2S_n + p_n) mod 137`
- **At**: `aiso/frontend/src/prime-thread-137.ts:1-60, 32, 39`; spec `aiso/docs/architecture/PRIME_THREAD_SCROLL_137.md`

### Vacuum anchor `x* = 136 ≡ −1`
**Kind** invariant/metric · **Status** active
The unique fixed point of `f(x) = 2x+1` over 𝔽₁₃₇ (`u = 0` in shifted coordinates). Under the spectral coordinate map `x = 137(s − 1/2) mod 137` it is identified with the critical line `Re(s) = 1/2`; topologically it is the singular fold axis of the Möbius helitorus; operationally it is the reconciliation point for Möbius BFT branch merges.
- **At**: `aiso/frontend/src/prime-thread-137.ts:9`; `koba42-prime-thread-scroll/docs/HILBERT_POLYA_WEIL_137_SPECTRAL_ROSETTA_STONE.md:35-45`

### Dual 68-coset partition — C₁ cool / C₂ warm
**Kind** invariant/metric · **Status** active
`𝔽₁₃₇ \ {136} = C₁ ⊔ C₂` into two disjoint 68-element orbits of the doubling map: C₁ the quadratic residues (`u₀ = 1`, containing 14 primes) and C₂ the non-residues (`u₀ = 3`, containing 18 primes). Read as the two orthogonal eigenspaces of the doubling operator, mirroring Hasse–Weil conjugate pairing; used as two independent dynamical memory channels in the prime reservoir computer, and as the partition axis for Möbius BFT.
- **At**: `aiso/docs/architecture/PRIME_THREAD_SCROLL_137.md:33-43`

### Sophie Germain prime avalanche
**Kind** theorem/result (observational) · **Status** active
Within orbit C₂, steps `n = 0…4` form an unbroken run of consecutive primes at step-distance 1: `2 → 5 → 11 → 23 → 47`, each realizing the Sophie-Germain stellation `p ↦ 2p+1`, with gap doubling `Δ_n = u_n = 3·2^n mod 137`.
- **At**: `aiso/docs/architecture/PRIME_THREAD_SCROLL_137.md:47-53`

### Möbius Helitorus
**Kind** object/structure · **Status** active
The topological reading of the 𝔽₁₃₇ thread as a single-surface, single-edge non-orientable toroidal manifold: the two 68-step orbits are glued by a half-twist of angle π across period `k = 68` into one continuous boundary loop of period 136, with the vacuum anchor as the singular fold axis where inside becomes outside and anti-map time-reversal symmetry is topologically protected. Claimed invariants `χ(M) = 0`, `∂M ≅ S¹`. Derived engines: **Möbius RAM** (136 addresses along the ribbon; soft bit flips become topological phase twists, 0°/180° by half-orbit) and **Möbius BFT** (partition tracking across the dual cosets, reconciling branches at the vacuum anchor).
- **At**: `koba42-prime-thread-scroll/docs/THE_MOBIUS_HELITORUS_TOROIDAL_FOLD.md:1-60`; `aiso/frontend/src/mobius-ram-engine.ts`, `mobius-bft-consensus.ts`

### Scroll-cipher sealing boundary
**Kind** protocol · **Status** **aspirational** (specification only)
A proposed rule that unsealed events stay in RAM while permutation entropy `H_perm < 128 bits`; at step N = 68 (because `2^68 ≡ 1 mod 137`) the transient pool is sealed into a persistent VixelTree root anchored to genesis `S₀`. Used identically in the HashCloud, Scroll-Cast, and Sovereign-Stack manifests as the boundary between volatile and durable state.
- **Type**: `seal : (pool, n) → Root` fired when `n ≡ 0 mod 68 ∧ H_perm(pool) ≥ 128 bits`
- **At**: `koba42-prime-thread-scroll/docs/HASHCLOUD_PRIME_SCROLL_INTEGRATION.md §2.2`

### Multi-moduli proof network (𝔽₂₅₇, 𝔽₆₅₅₃₇ → 𝔽₁₃₇ anchor)
**Kind** protocol · **Status** active
Recursive accumulator scheme exploiting Fermat-prime micro-cycles: `F₃ = 257` (order of 2 = 16) and `F₄ = 65537` (order of 2 = 32) give short sub-tree orbits whose root commitments anchor into the 137 macro-cycle, producing lightweight sub-tree proofs with a single 137-anchored root.
- **Type**: `MultiModuliAnchorProof = {f3_proof, f4_proof, main_anchor_s0 ∈ 𝔽₁₃₇, is_valid}`
- **At**: `aiso/frontend/src/multi-moduli-proof.ts:1-27`

### Prime-Thread VDF
**Kind** protocol · **Status** active
A verifiable delay function on sequential affine iteration `S_k = (A·S_{k−1} + B) mod M` (defaults `A = 2, B = 1, M = 2²⁵⁶ − 189`), verified in O(log T) by the closed form `S_T = A^T·S₀ + B·(A^T − 1)·(A − 1)⁻¹`. Benchmarked against a Wesolowski class-group simulator: claimed 6 µs vs 38 µs verification and ≈25,000× lower energy with no Timelord ASIC dependence. A Nova folding circuit expresses each step as 3 R1CS constraints (25–45 constraints/step).
- **Type**: `prove : 𝔽_M × ℕ → PrimeVdfProof`; `verify : PrimeVdfProof → {valid, verifier_time_us, speedup_vs_prover}`
- **At**: `prime-fhe-mobius-engine/src/prime-vdf-engine.ts:1-137`; `src/prime-vdf-nova-circuit.ts:1-60`

### Hex clock sieve
**Kind** subsystem · **Status** active
A Rust segmented-sieve instrument (primes ≥ 5, so every prime is `1` or `5 mod 6` — the "hexagonal clock") measuring three named anomalies in prime-gap structure to N = 10⁹: **spring-back** (mean next gap conditioned on previous quotient `q = gap/6`), **directional asymmetry** (mean gap across the four residue transitions), and the **variance floor** (empirical vs binomial-expected variance of the cross-class indicator over windows).
- **Type**: `analyze : &[u64] → {spring_back, asymmetry, variance_r2, variance_cross, c_n}`
- **At**: `hex_clock_sieve/src/sieve.rs:1-70`, `src/analysis.rs:1-140`

### LO-S null
**Kind** method/principle · **Status** active
The falsification baseline for the hex clock sieve: a synthetic prime-like sequence generated by a *first-order Markov chain on residue classes {1,5} mod 6* using the empirically measured transition matrix, with gaps from a constrained geometric distribution. It has **no memory of previous gap sizes**, so it isolates whether spring-back / asymmetry / variance-floor are mere consequences of known residue-class bias or structure beyond it. Golden regression: real primes match Riemann zeros at 96.64% of spectral peaks (747/773) vs LO-S at 57.33% (313/546).
- **At**: `hex_clock_sieve/src/los_null.rs:4-45, 47-69, 71-140`

### Normalized fluctuation Δ(u) and log-periodogram peak alignment
**Kind** invariant/metric · **Status** active
The spectral-transport observable: `Δ(u) = (θ(e^u) − e^u)/e^{u/2}` with `θ` the Chebyshev function. Its Hann-windowed log-periodogram is peak-matched against the Odlyzko table of Riemann zero ordinates, with theoretical peak power `4/γ²` as the amplitude-decay check.
- **At**: `hex_clock_sieve/src/log_periodogram.rs:14-22, 41-90`

### p-adic strip-mine / Fan–Wan technique transfer — the T9-A firewall
**Kind** method/principle · **Status** active
A disciplined borrowing protocol applied to Fan–Wan (arXiv:2304.09806v2): four techniques are each converted into a **falsifiable precondition-test**, under the **T9-A firewall** — "techniques transfer only if operational preconditions transfer; structural resemblance ≠ operational equivalence… same nouns, different objects." The methodological coinage is the **vacuous pass**: a precondition-test too weak to fail is itself a finding and is downgraded (e.g. "is the Landau amplitude a sum of squares?" passes for any positive quantity). Outcome: 1 survivor of 4; three demoted to T4.
- **At**: `p-adic-extracted/FINDINGS_stripmine_fanwan_20260707.md:1-27, 88-120`

### Converse machine
**Kind** theorem/result · **Status** active, **with an in-document retraction (2026-07-09)**
The surviving strip-mine finding: the prime-frequency signal lives in the *order* of the ζ zero-spacings, not their distribution. Shuffling spacings (preserving distribution) collapses prime-frequency power 51.99 → 2.52 (4.85% of baseline); a Gaussian surrogate with the *exact* empirical spacing autocovariance — preserving all 2-point structure, killing all connected correlations of order ≥ 3 — recovers only 3.65 (7.02%). The composed claim "no 2-point observable carries the primes" is **retracted**: the value-space pair correlation of the zero *positions* recovers 100% (Montgomery + explicit formula). The correct, narrower statement is that primes are absent from the 2-point of the *spacings* and of index space.
- **At**: `p-adic-extracted/FANWAN_STRIPMINE_SUMMARY.md:3-9, 35-50, 70-77`

### Calibration-bar gate
**Kind** method/principle · **Status** active
Admissibility rule for statistical witnesses: *a witness must recover its own known baseline before it reports on the unknown.* Used to exclude the number-variance witness `Σ²(L)` with cause — two unfoldings bracket the known GUE slope `1/π² ≈ 0.101` (0.35 flat vs +0.258) but neither hits it, so the instrument is untrustworthy regardless of what it reports.
- **At**: `p-adic-extracted/FANWAN_STRIPMINE_SUMMARY.md:52-61`

### Prime banding
**Kind** invariant/metric · **Status** **legacy — the banked artifacts are degenerate**
A classification of prime-gap predictions into four deviation bands around an ideal φ-scaling reference, using the Wallace Transform as scalar factor. Bands: tight (≤ 0.2), normal (≤ 0.5), loose (≤ 1.0), outlier (> 1.0). The banked run in `prime_banding_final` is degenerate: 9,591 of 9,592 analyzed primes land in `outlier`; tight/normal/loose are all 0; `avg = max = min difference = 15.851…`; `pearson_r` and `pearson_p` are `NaN`.
- **At**: generator `scripts/wqrf_massive_analysis.py:34-58, 189-247`; artifacts `prime_banding_final/statistics.json`

### Prime Poker
**Kind** subsystem · **Status** active
A card game whose "prime"-ness is arithmetic, not thematic: the deck is the integer band 2..20 (primes get 2 copies, composites 1), the target is 21, and the rule surface is factorization. `SPLIT` decomposes a composite into its factor multiset, with `split_saves(n) = n − Σ factors`. Showdown tiers rank by arithmetic structure: `goldbach_natural` (2 cards, both prime, total 21) > `prime_21` > `factored_21` > `ordinary_21` > `none`. Shuffle is commit–reveal with the deck cut index `min(winner_factor_multiset) mod deck_len`. The Python engine is canonical; a CLVM rule library is held at T1 parity (≈108k showdown cases).
- **Type**: `factor_multiset : ℤ≥1 → ℤ^*`; `tier_name : ℤ^* × ℤ × bool → TierName`
- **At**: `prime_poker/engine/prime_poker/{constants,arithmetic,showdown,shuffle}.py`

### Prime Lattice
**Kind** subsystem · **Status** active (Python/CLVM engine canonical; the JS prototype is explicitly non-canonical)
A deterministic full-information two-player game on an 8×7 staggered axial hex board where integer-valued pieces move by *arithmetic operators bound to geometric axes*: LATERAL → ADD, PARALLEL → SUB, DIAGONAL → MUL at a forward apex. Two further ops are number-theoretic: **CLEAVE** (an enemy *even composite* flanked by two parallel friendlies is removed and each flanker gains `target/2`; primes and 2 are immune) and **FISSION** (a friendly composite scatters backward as its factor multiset). Opening rank is the prime basis 2,3,5,7,11,13,17,19; King = 19. Losing conditions include **overflow debt** (an over-strong SUB records surplus as negative debt that must be partitioned *exactly* across own positive pieces next turn) and **bankruptcy**.
- **Type**: `AXIS_BY_DIRECTION : Coord → AxisKind`; `MoveKind ∈ {ADD, SUB, MUL, CLEAVE, FISSION, DEBT_ALLOC}`; `can_cleave : ℤ → bool` (even ∧ composite)
- **At**: `prime_lattice/engine/prime_lattice/{constants,geometry,arithmetic}.py`; `CANONICAL_RULESET.md`

---

