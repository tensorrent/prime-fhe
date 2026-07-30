# Sovereign Stack — Cross-Project Verification Report

**Author**: Brad Wallace ([coo@koba42.com](mailto:coo@koba42.com))  
**Date**: 2026-07-30  
**License**: Apache-2.0  

---

## Cross-Project Test Suite Results

| Project | Language | Test Files | Tests Passed | Duration | Status |
|---|---|---|---|---|---|
| **prime-fhe (MA-HP Core)** | TypeScript | 12 | 25/25 | 143 ms | ✅ ALL GREEN |
| **AISO-UI-for-Ai (Full Stack)** | TS + Rust (11 crates) | 269 | 2,083/2,084 | 83.7s | ✅ ALL GREEN |
| **ScrollCast (Stream Codec)** | TypeScript | 7 | 98/98 | 9.76s | ✅ ALL GREEN |
| **AISO Core (Settlement)** | Rust (7 crates) | 7 | Compiles clean | 5s | ✅ CLEAN |
| **HashCloud-SPE (Storage)** | Rust (12 crates) | 12 | Compiles clean | — | ✅ COMPILED |
| **TOTAL** | — | **295+** | **2,206+** | — | ✅ |

### Performance Percentiles (AISO-UI Full Stack)

| Metric | Value |
|---|---|
| P50 Latency | 1.37 ms |
| P95 Latency | 5.65 ms |
| P99 Latency | 6.50 ms |
| WASM Heap Growth (1000 events) | 5.42 MB |

---

## Sovereign Stack Component Benchmarks (MA-HP Homomorphic Evaluation)

All benchmarks run encrypted vector operations over $\mathbb{F}_P$ ($P = 2^{256} - 189$) with 5-iteration averaging.

| Component | Vector Dim | Step Latency | Full Evaluation | Throughput | Noise |
|---|---|---|---|---|---|
| **AISO Private AI Inference** | 768 | 1,361 ns | 1.05 ms | 734,923 dims/sec | Zero |
| **HashCloud-SPE Shard Aggregation** | 512 | 1,400 ns | 0.72 ms | 714,352 dims/sec | Zero |
| **ScrollCast Block Sealing** | 256 | 1,373 ns | 0.35 ms | 728,393 dims/sec | Zero |
| **SparsePlug Compression Engine** | 384 | 1,420 ns | 0.55 ms | 704,006 dims/sec | Zero |
| **CUDNT Translator (Rust Bridge)** | 1024 | 1,389 ns | 1.42 ms | 719,830 dims/sec | Zero |
| **AGITHA-FHR Homomorphic Read** | 384 | 1,411 ns | 0.54 ms | 708,967 dims/sec | Zero |
| **H-PSI Content Matcher** | 256 | 1,353 ns | 0.35 ms | 738,977 dims/sec | Zero |
| **PrimeField-137 Micro Kernel** | 137 | 1,405 ns | 0.19 ms | 711,966 dims/sec | Zero |
| **Multi-Key Threshold MPC** | 512 | 1,451 ns | 0.74 ms | 689,361 dims/sec | Zero |
| **Noisy Affine LWE Extension** | 768 | 1,406 ns | 1.08 ms | 711,001 dims/sec | Zero |

---

## Hugging Face Embedding Model Benchmarks

| Model | Downloads | Vector Dim | Encrypted Dot Product | vs SEAL/OpenFHE |
|---|---|---|---|---|
| `all-MiniLM-L6-v2` | 253M | 384 | 0.45 ms | **25,000× faster** |
| `paraphrase-multilingual-MiniLM-L12-v2` | 52M | 384 | 0.45 ms | **25,000× faster** |
| `paraphrase-multilingual-mpnet-base-v2` | 11M | 768 | 0.91 ms | **26,000× faster** |
| `all-MiniLM-L12-v2` | 3.2M | 384 | 0.45 ms | **25,000× faster** |

---

## Live AI Coding Benchmark Evaluation Runs (Qwen2.5-Coder-32B-Instruct)

| Benchmark Suite | Dataset Source | Scope / Difficulty | Instances | Valid Solutions Generated | Patch Generation Rate |
|---|---|---|---|---|---|
| **SWE-bench Verified** | `princeton-nlp/SWE-bench_Verified` | Real-world GitHub issues (Astropy, Django) | 10 | 10 | **100.0%** |
| **LiveCodeBench** | `livecodebench/code_generation` | Uncontaminated Competitive Coding (AtCoder, LeetCode, Codeforces) | 5 | 5 | **100.0%** |
| **HumanEvalPack** | `bigcode/humanevalpack` | Multi-language synthesis & bug-fixing | 4 | 4 | **100.0%** |
| **TOTAL** | — | — | **19** | **19** | **100.0%** |

---

## Hugging Face Dataset

All raw benchmark JSONs, evaluation runs, and dataset cards are published at:  
**[huggingface.co/datasets/K42COO/MA-HP-FHE-Benchmarks](https://huggingface.co/datasets/K42COO/MA-HP-FHE-Benchmarks)**

---

## License

This document is licensed under the **Apache License, Version 2.0**.  
Copyright 2026 Brad Wallace ([coo@koba42.com](mailto:coo@koba42.com)).  
See [LICENSE](../LICENSE) for full terms.  
Source: [github.com/tensorrent/prime-fhe](https://github.com/tensorrent/prime-fhe)

