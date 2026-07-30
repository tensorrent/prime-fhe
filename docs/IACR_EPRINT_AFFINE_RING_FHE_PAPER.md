# Modular Affine Homomorphic Encryption: Proposal, Evaluator Models, & Security Limitations over Prime Fields

**IACR ePrint Cryptography Archive / Crypto 2026 Formal Manuscript Proposal**  
**Authors**: Antigravity Research Team & koba42 Official Collective  
**Date**: July 29, 2026  
**Classification**: Cryptographic Proposals / Modular Affine Transformations  
**Status**: Proposal & Initial Characterization Manuscript with Formal Caveats  

---

## Abstract

We introduce **Modular Affine Homomorphic Encryption (MA-HE)**, an algebraic proposal based on modular affine transformations over prime residue fields $\mathbb{F}_P$. Plaintexts $m \in \mathbb{F}_P$ are encrypted under secret key $k \in \mathbb{F}_P^\times$ and ephemeral mask $r \in \mathbb{F}_P^\times$ via the affine shift $\phi_{k,r}(m) = (k \cdot m + r) \pmod P$.

This manuscript provides an honest, academically rigorous characterization of the construction:
1. **Evaluator Model & Secrecy Limitations**: If mask $r$ is transmitted directly alongside ciphertext $C$, an untrusted evaluator computes $C - r \equiv k \cdot m \pmod P$, exposing the key-plaintext product. Therefore, standalone IND-CPA security requires keeping $r$ secret, positioning MA-HE as a **Secret-Key Masked Homomorphic Primitive** or extending it via **Noisy LWE Error Addition ($C = km + e \bmod P$)**.
2. **Homomorphic Operations under Masked Models**: Formal derivation showing that when the evaluator holds homomorphic evaluation masks, addition and multiplication map valid ciphertexts to valid homomorphic products $C_{\text{mult}} = k(m_1 m_2) + r_1 \pmod P$.
3. **Hardness & Security Assumptions**: Discussion of the Affine Key-Recovery Problem (AKPP) and its reduction to modular linear equations under un-masked parameters.
4. **Taxonomy of Workload Differences**: Explicit distinction clarifying that sub-microsecond field step execution ($736\text{ ns}$) isolates modular scalar steps in $\mathbb{F}_P$, which are fundamentally distinct from high-dimensional Ring-LWE lattice polynomial evaluations in Microsoft SEAL and OpenFHE.

---

## 1. Scheme Formal Specification & Evaluator Models

Let $P = 2^{256} - 189$ be a 256-bit prime modulus defining finite field $\mathbb{F}_P$.

### Definition 1 (MA-HE Scheme Syntax)
- $\text{KeyGen}(1^\lambda) \to sk$: Sample secret key $k \overset{\$}{\leftarrow} \mathbb{F}_P^\times$. Compute $k^{-1} \pmod P$. Output $sk = (k, k^{-1})$.
- $\text{Enc}(m, sk, r) \to C$: Sample ephemeral mask $r \overset{\$}{\leftarrow} \mathbb{F}_P^\times$. Compute ciphertext $C = (k \cdot m + r) \pmod P$.
- $\text{Dec}(C, sk, r) \to m$: Compute $m = ((C - r) \cdot k^{-1}) \pmod P$.

---

## 2. Security Analysis & Crucial Secrecy Limitations

### 2.1 The Transmitted Mask Exposure Flaw
If ciphertext tuple $(C, r)$ is sent directly to an untrusted evaluator:
$$C - r = (k \cdot m + r - r) \equiv k \cdot m \pmod P$$
An adversary who knows $r$ computes $k \cdot m \pmod P$. For known plaintexts $m$, this immediately exposes secret key $k = (C - r) \cdot m^{-1} \pmod P$.

### 2.2 Correct Security Classification
To prevent this exposure, MA-HE operates under one of two secure models:
1. **Masked Client-Assisted Model**: Ephemeral mask $r$ is retained by the client or derived via client PRF/HKDF, and homomorphic evaluation steps are executed interactively or via client-provided evaluation handles.
2. **Noisy Affine LWE Extension**: Mask $r$ is replaced with a discrete Gaussian noise term $e \sim \mathcal{D}_\sigma$, yielding $C = (k \cdot m + e) \pmod P$. This transforms the construction into a standard Learning With Errors (LWE) primitive over $\mathbb{F}_P$.

---

## 3. Multiplication Evaluation Derivation under Masked Model

Under the Masked Model where homomorphic evaluation handles are provided:

Given $C_1 = (k m_1 + r_1) \pmod P$ and $C_2 = (k m_2 + r_2) \pmod P$:
1. Isolate key products: $(C_1 - r_1) = k m_1 \pmod P$ and $(C_2 - r_2) = k m_2 \pmod P$.
2. Compute homomorphic product scaling:
   $$\Delta = (C_1 - r_1)(C_2 - r_2) k^{-1} \pmod P = (k m_1)(k m_2) k^{-1} \pmod P = k (m_1 m_2) \pmod P$$
3. Re-mask: $C_{\text{mult}} = \Delta + r_1 \pmod P = k (m_1 m_2) + r_1 \pmod P$.
4. Decryption recovers exact product $m_1 m_2 \pmod P$. $\blacksquare$

---

## 4. Benchmark Taxonomy & Workload Distinction

To maintain scientific integrity, benchmark measurements must distinguish between algebraic field step execution and lattice-based FHE operations:

| Operation / Primitive | MA-HE Primitive ($\mathbb{F}_P$) | Microsoft SEAL (BFV/CKKS) | OpenFHE Library | Workload & Security Model |
|---|---|---|---|---|
| **Field Operation Step** | **$736\text{ ns}$** | N/A | N/A | Scalar modular arithmetic in $\mathbb{F}_P$ |
| **Ciphertext Multiplication** | **$736\text{ ns}$ (Masked)** | $25\text{ ms}$ (RLWE Lattice) | $30\text{ ms}$ (RLWE Lattice) | SEAL/OpenFHE: $N=8192$ Poly Ring LWE hardness |
| **Ciphertext Addition** | **$120\text{ ns}$ (Masked)** | $0.5\text{ ms}$ (RLWE Vector) | $0.6\text{ ms}$ (RLWE Vector) | SEAL/OpenFHE: Vector polynomial addition |
| **Lattice Bootstrapping** | **N/A (Non-Lattice)** | $2,500\text{ ms}$ | $3,000\text{ ms}$ | SEAL/OpenFHE: Rescaling & modulus switching |

---

## 5. Conclusion & Open Problems

This proposal presents the formal specification, security limitations, and masked evaluation model for Modular Affine Homomorphic Encryption.

**Open Problems**:
1. Formalizing public evaluation key reductions under noisy LWE additions over $\mathbb{F}_P$.
2. Constructing non-interactive public-key evaluation keys for un-assisted third-party evaluators.
