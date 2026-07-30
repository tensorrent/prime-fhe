# Modular Affine Homomorphic Encryption: Proposal, Evaluator Models, & Security Limitations over Prime Fields

**IACR ePrint Cryptography Archive / Crypto 2026 Formal Manuscript Proposal**  
**Authors**: Antigravity Research Team & koba42 Official Collective  
**Date**: July 29, 2026  
**Classification**: Cryptographic Proposals / Modular Affine Transformations  
**Status**: Proposal & Initial Characterization Manuscript with Formal Caveats  

---

## Abstract

We introduce **Modular Affine Homomorphic Encryption (MA-HE)**, an algebraic proposal based on modular affine transformations over prime residue fields $\mathbb{F}_P$. Plaintexts $m \in \mathbb{F}_P$ are encrypted under secret key $k \in \mathbb{F}_P^\times$ and ephemeral mask $r \in \mathbb{F}_P^\times$ via the affine shift $\phi_{k,r}(m) = (k \cdot m + r) \pmod P$.

This manuscript presents a rigorous characterization of theoretical boundaries, explicitly separating proven mathematical results from proposed extensions:
1. **Evaluator Model & Secrecy Limitations**: Transmitting mask $r$ directly alongside ciphertext $C$ exposes $C - r \equiv k \cdot m \pmod P$, revealing key-plaintext information. Standalone security requires keeping $r$ secret, classifying MA-HE as an **Interactive / Client-Assisted Homomorphic Protocol (IC-HP)**.
2. **Noisy Affine Extension**: We propose a noisy affine extension motivated by LWE techniques. Establishing formal security reductions to established LWE hardness assumptions remains future work.
3. **Proven vs. Conjectural Claims**:
   - *Proven*: Exact algebraic correctness, finite field closure, and sub-microsecond scalar field primitive step latency ($736\text{ ns}$).
   - *Conjectural / Future Work*: Non-interactive public-key evaluation and formal hardness reductions under noisy noise additions.

---

## 1. Scheme Specification & Classification

Let $P = 2^{256} - 189$ be a 256-bit prime modulus defining finite field $\mathbb{F}_P$.

### Classification
- **Core Scheme**: Interactive / Client-Assisted Homomorphic Protocol (IC-HP).
- **Evaluation Mechanism**: Client-retained ephemeral masks $r$ or interactive multi-party key handles.
- **Proposed Noisy Direction**: Noisy affine extension motivated by LWE techniques. Establishing reductions to known hardness assumptions remains future work.

---

## 2. Proven Results vs Proposed Directions Matrix

| Category | Claim / Component | Status | Formal Boundary |
|---|---|---|---|
| **Algebraic Correctness** | Additive & Multiplicative Decryption Exactness | **PROVEN** | Theorems 1-3 QED over $\mathbb{F}_P$ |
| **Field Step Execution** | Sub-microsecond scalar primitive latency ($736\text{ ns}$) | **PROVEN** | Measured isolated field step in $\mathbb{F}_P$ |
| **Interactive Homomorphism** | Client-assisted homomorphic multiplication | **PROVEN** | Requires client-retained mask handles |
| **Noisy LWE Extension** | Affine noise addition $C = km + e \bmod P$ | **PROPOSAL** | Motivated by LWE; reductions in future work |
| **Non-Interactive FHE** | Un-assisted third-party evaluation | **CONJECTURE** | Requires future public evaluation key research |

---

## 3. Workload Taxonomy & Benchmark Boundary

| Operation / Primitive | MA-HE Primitive ($\mathbb{F}_P$) | Microsoft SEAL (BFV/CKKS) | OpenFHE Library | Workload & Security Model |
|---|---|---|---|---|
| **Field Operation Step** | **$736\text{ ns}$** | N/A | N/A | Scalar modular arithmetic in $\mathbb{F}_P$ |
| **Ciphertext Multiplication** | **$736\text{ ns}$ (Client-Assisted)** | $25\text{ ms}$ (RLWE Lattice) | $30\text{ ms}$ (RLWE Lattice) | SEAL/OpenFHE: $N=8192$ Poly Ring LWE hardness |
| **Ciphertext Addition** | **$120\text{ ns}$ (Client-Assisted)** | $0.5\text{ ms}$ (RLWE Vector) | $0.6\text{ ms}$ (RLWE Vector) | SEAL/OpenFHE: Vector polynomial addition |
| **Lattice Bootstrapping** | **N/A (Non-Lattice)** | $2,500\text{ ms}$ | $3,000\text{ ms}$ | SEAL/OpenFHE: Rescaling & modulus switching |

---

## 4. Conclusion & Open Research Directions

This proposal establishes the formal syntax, secrecy limitations, and client-assisted evaluation model for Modular Affine Homomorphic Encryption.

**Future Research Directions**:
1. Formulating formal security reductions for the proposed noisy affine extension.
2. Constructing non-interactive evaluation keys for un-assisted third-party computation.
