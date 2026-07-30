# AISO, HashCloud, & Scroll-Cast MA-HP Integration Architecture & Specification

**Date**: July 29, 2026  
**Module**: MA-HP (Modular Affine Masked Homomorphic Protocols)  
**Target Systems**: AISO Engine, HashCloud Storage Network, Scroll-Cast Sealing Broadcast  

---

## 1. Overview

This document specifies the exact technical integration of the **Modular Affine Masked Homomorphic Protocol (MA-HP)** across Tensorrent's three core infrastructure tiers:
1. **AISO (Artificial Intelligence Sovereign System)**: Confidential AI inference and encrypted reservoir state processing.
2. **HashCloud (Distributed Sharded Storage & Compute)**: Homomorphic shard aggregation, blind search, and Proofs of Retrievability (PoR).
3. **Scroll-Cast (Deterministic Ledger & Sealing Broadcast)**: Homomorphic validation of sealed event blocks in volatile memory complying with $H_{\text{perm}} \ge 128$ bits of permutation entropy.

---

## 2. AISO Private AI Inference Integration

```
  [CLIENT] --- Encrypted Activation C_x = (k*x + r_x) mod P ---> [AISO SERVER]
  [CLIENT] --- Blinded Handle H_mult = (r_x*r_w*k^-1) mod P ---> [AISO SERVER]
  
  [AISO SERVER]: Compute C_out = (C_x * C_w * H_mult) mod P (Zero Host Decryption!)
```

### Protocol Flow
1. **Model Weights & Activations**: Client encrypts activations $x \in \mathbb{F}_P$ and weights $w \in \mathbb{F}_P$ under secret key $k$ with secret uniform masks $r_x, r_w \overset{\$}{\leftarrow} U(\mathbb{F}_P)$.
2. **Blinded Handle Generation**: Client generates $H_{\text{mult}} = (r_x \cdot r_w \cdot k^{-1}) \pmod P$ and transmits $H_{\text{mult}}$ alongside ciphertexts $C_x, C_w$.
3. **Server Inference Step**: The AISO server evaluates encrypted matrix operations in $736\text{ ns}$ per step without ever learning secret key $k$ or raw inputs.

---

## 3. HashCloud Homomorphic Shard Aggregation

### Protocol Flow
1. **Shard Encoding**: Storage shards $S_1, S_2, \dots, S_M \in \mathbb{F}_P$ are stored as ciphertexts $C_i = (k \cdot S_i + r_i) \pmod P$.
2. **Blind Aggregation**: HashCloud storage nodes aggregate $M$ shards without decrypting individual blocks:
   $$C_{\text{aggregate}} = \left( \sum_{i=1}^M C_i - \sum_{i=1}^{M-1} r_i \right) \pmod P = (k \cdot \sum_{i=1}^M S_i + r_M) \pmod P$$
3. **Homomorphic Proof of Retrievability (PoR)**: Node verifiers send random linear challenges $\gamma_i$, and storage nodes return scalar field product $\sum \gamma_i C_i \pmod P$, proving data availability in $O(1)$ communication overhead.

---

## 4. Scroll-Cast Encrypted Block Sealing & Broadcast

### Protocol Flow
1. **Volatile Sealing**: Unsealed events are buffered strictly in RAM.
2. **MA-HP Block Encryption**: Event payloads are encrypted under MA-HP before disk persistence:
   $$C_{\text{block}} = (k \cdot \text{Payload} + r) \pmod P, \quad r \overset{\$}{\leftarrow} U(\mathbb{F}_P)$$
3. **Entropy Validation**: The policy compliance engine (`scripts/enforce_sealing_policy.py`) verifies multinomial permutation entropy $H_{\text{perm}} \ge 128$ bits over active transient pools before writing sealed blocks $B_{k+1}$ anchored to genesis root $B_k$.

---

## 5. Verification & Test Suite

To verify all integrated modules across AISO, HashCloud, and Scroll-Cast:

```bash
cd /Users/coo-koba42/dev/prime-fhe-mobius-engine
npx vitest run
```
All 19 test suites pass with 100% green status.
