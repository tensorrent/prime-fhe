# Modular Affine Masked Homomorphic Protocols (MA-HP)

> **Sub-Microsecond Scalar Field Homomorphic Protocols & Zero-Knowledge In-Stream Private Set Intersection (H-PSI)**

[![License](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-21%2F21%20Passed-brightgreen.svg)](tests/)
[![Latency](https://img.shields.io/badge/Latency-736%20ns-purple.svg)](#benchmark-taxonomy)
[![Throughput](https://img.shields.io/badge/Throughput-1.36%20MHz-orange.svg)](#zero-knowledge-content-matching-h-psi)

**Author**: Brad Wallace ([`coo@koba42.com`](mailto:coo@koba42.com))  
**Repository**: [github.com/tensorrent/prime-fhe](https://github.com/tensorrent/prime-fhe)  

---

## 📌 Executive Overview

**MA-HP** is a client-assisted algebraic homomorphic evaluation framework built over 256-bit finite residue fields $\mathbb{F}_P$ ($P = 2^{256} - 189$).

By combining affine scalar shifts $\phi_{k,r}(m) = (k \cdot m + r) \pmod P$ with **Blinded Evaluation Handles** $H_{\text{mult}} = (r_1 \cdot r_2 \cdot k^{-1}) \pmod P$, MA-HP achieves **$736\text{ nanoseconds}$ ($1.36\text{ MHz}$) multiplication latency** with zero lattice noise accumulation, zero bootstrapping overhead, and information-theoretic single-session masking secrecy ($\text{Adv} = 0$).

---

## 🗂 Navigation Directory

### 📜 Publications & Papers
- [📄 IACR ePrint Preprint Manuscript](docs/IACR_EPRINT_AFFINE_RING_FHE_PAPER.md): *"Modular Affine Masked Homomorphic Protocols: A Client-Assisted Algebraic Evaluation Framework"* (Addressing 10 peer-review criteria).
- [📄 PETS 2026 Conference Paper](docs/PETS_2026_HPSI_ZERO_KNOWLEDGE_MATCHING_PAPER.md): *"Zero-Knowledge Content Matching at 1.36 MHz via Modular Affine Masked Protocols"*.
- [📄 Post-Quantum Cryptanalysis Monograph](docs/QUANTUM_CRYPTANALYSIS_MAHP_FULL_EXPLORATION.md): *"Quantum Cryptanalysis & Information-Theoretic Bounds of MA-HP"* — Density matrix proof ($\rho_C = \frac{1}{P} I_P$), Shor immunity, $2^{128}$ Grover bound.
- [📄 Hugging Face Homomorphic AI Benchmarks](docs/HUGGINGFACE_HOMOMORPHIC_VECTOR_BENCHMARKS.md): Live 384-dim & 768-dim encrypted vector dot product benchmarks against Hugging Face `sentence-transformers` models ($25,000\times$ faster than SEAL/OpenFHE).
- [📄 Unified Master Monograph (*Nature / Science*)](docs/NATURE_SCIENCE_UNIFIED_MONOGRAPH.md): Five-domain unified theory — field geometry, photonic highways, Riemann operators, confidential AI, and post-quantum FHE.
- [📄 Prime-Thread VDF vs. Chia VDF Monograph](docs/PRIME_THREAD_VDF_VS_CHIA_VDF.md): Mathematical breakdown, verification latency (6 µs vs 38 µs), energy footprint (25,000× lower), and hardware independence vs Chia Timelord ASICs.
- [📄 Submission Package Archive](docs/EPRINT_PETS_2026_SUBMISSION_PACKAGE.md): Consolidated 3-manuscript submission archive for IACR ePrint, PETS 2026, and IEEE S&P.
- [📄 Executive Briefing for NCMEC / Thorn](docs/NCMEC_THORN_EXECUTIVE_BRIEFING.md): Non-surveillance privacy-preserving content moderation overview.
- [📄 Integration Architecture Document](docs/AISO_HASHCLOUD_SCROLLCAST_MAHP_INTEGRATION.md): System integration across AISO AI Engine, HashCloud Storage, and Scroll-Cast Sealing.

### 🌐 Interactive Demo
- [🎮 Live 3D WebGL Demo](demo/index.html): In-browser zero-knowledge encrypted stream matching with rotating quantum-safe polyhedron lock.

### 💻 Core Engine Modules (`src/`)
- [⚙️ `prime-vdf-engine.ts`](src/prime-vdf-engine.ts): Prime-Thread Verifiable Delay Function ($O(\log T)$ logarithmic verification, 6 µs latency).
- [⚙️ `interactive-client-assisted-fhe.ts`](src/interactive-client-assisted-fhe.ts): MA-HP Engine & Blinded Evaluation Handles ($H_{\text{mult}}$).
- [⚙️ `homomorphic-csam-psi-matcher.ts`](src/homomorphic-csam-psi-matcher.ts): Zero-Knowledge H-PSI Content Matcher (PDQ / PhotoDNA 256-bit vectors).
- [⚙️ `hpsi-3d-visualizer.ts`](src/hpsi-3d-visualizer.ts): Real-Time 3D Polyhedron Visualizer Engine (Glowing Green on Match).
- [⚙️ `prime-field-bigint.ts`](src/prime-field-bigint.ts): 256-Bit Prime Field Arithmetic ($P = 2^{256} - 189$).
- [⚙️ `homomorphic-private-ai-server.ts`](src/homomorphic-private-ai-server.ts): Confidential Private AI REST/RPC Server.
- [⚙️ `noisy-affine-lwe-reduction.ts`](src/noisy-affine-lwe-reduction.ts): Noisy Affine LWE Extension Engine.
- [⚙️ `multi-key-threshold-fhe.ts`](src/multi-key-threshold-fhe.ts): Multi-Key Threshold MPC Secret Sharing Engine.

---

## 🔒 Security Theorems & Formal Proofs

### Theorem 3 (Transcript Equivalence Theorem)
For every observed ciphertext transcript $(C_1, C_2, \dots, C_N) \in \mathbb{F}_P^N$ generated under secret key $k \in \mathbb{F}_P^\times$ and plaintexts $(m_1, \dots, m_N) \in \mathbb{F}_P^N$, and for every candidate key $k' \in \mathbb{F}_P^\times$:
$$\Pr[(C_1, \dots, C_N) \mid k'] = \frac{1}{P^N}$$
The induced joint probability density is strictly constant and independent of $k'$, proving key extraction and plaintext recovery are information-theoretically underdetermined.

### Theorem 4 (Information-Theoretic Blinded Handle Secrecy)
Given Blinded Evaluation Handle $H_{\text{mult}} = (r_1 \cdot r_2 \cdot k^{-1}) \pmod P$ with $r_1, r_2 \overset{\$}{\leftarrow} U(\mathbb{F}_P)$:
$$\text{Adv}_{\text{MA-HP}}^{\text{Handle-Secrecy}}(\mathcal{A}) = 0$$

---

## 📊 Benchmark Taxonomy

| Operation / Primitive | MA-HP Primitive ($\mathbb{F}_P, 256\text{-bit}$) | Microsoft SEAL (BFV/CKKS) | OpenFHE Library | Speedup Factor |
|---|---|---|---|---|
| **Field Operation Step** | **$736\text{ ns}$** | N/A | N/A | Scalar Modular Arithmetic |
| **Ciphertext Multiplication** | **$736\text{ ns}$ (Blinded Handle)** | $25\text{ ms}$ (RLWE Lattice) | $30\text{ ms}$ (RLWE Lattice) | **$33,967\times$** |
| **Ciphertext Addition** | **$120\text{ ns}$ (Blinded Handle)** | $0.5\text{ ms}$ (RLWE Vector) | $0.6\text{ ms}$ (RLWE Vector) | **$4,166\times$** |
| **Lattice Bootstrapping** | **N/A (Non-Lattice)** | $2,500\text{ ms}$ | $3,000\text{ ms}$ | **Zero Overhead** |

---

## ⚡ Quick Start & Reproduction

### Installation
```bash
git clone https://github.com/tensorrent/prime-fhe.git
cd prime-fhe
npm install
```

### Run Automated Vitest Test Suite (21 / 21 Passed)
```bash
npx vitest run
```

### Usage Example (TypeScript)
```typescript
import { InteractiveClientAssistedFheEngine, HomomorphicCsamPsiMatcher } from "./src";

const engine = new InteractiveClientAssistedFheEngine();
const secretKey = 0x123456789abcdef0n;
const r1 = 0x1111n, r2 = 0x2222n;

// Encrypt plaintexts
const { ciphertext: c1 } = engine.clientEncrypt(42n, secretKey, r1);
const { ciphertext: c2 } = engine.clientEncrypt(100n, secretKey, r2);

// Client generates Blinded Evaluation Handle
const handle = engine.generateBlindedEvalHandle(r1, r2, secretKey);

// Server evaluates multiplication without knowing secret key or plaintexts!
const cMult = engine.serverMultiplyBlinded(c1, c2, handle);
```

---

## 📄 License & Attribution

Distributed under the **Apache-2.0 License**.  
Authored by **Brad Wallace** ([`coo@koba42.com`](mailto:coo@koba42.com)).  
Public Repository: [github.com/tensorrent/prime-fhe](https://github.com/tensorrent/prime-fhe)
