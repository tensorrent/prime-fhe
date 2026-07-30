/**
 * index.ts
 * =================================================================
 * Main entry point for @tensorrent/prime-fhe-mobius-engine.
 * Exports MA-HP engines, H-PSI matchers, 3D visualizers, 256-bit BigInt field arithmetic, and Private AI servers.
 * =================================================================
 */

export { InteractiveClientAssistedFheEngine } from "./interactive-client-assisted-fhe";
export { NoisyAffineLweReductionEngine } from "./noisy-affine-lwe-reduction";
export { PrimeField256BigInt } from "./prime-field-bigint";
export { PrimeField137 } from "./prime-field-137";
export { HomomorphicPrimeFhe } from "./homomorphic-prime-fhe";
export { PrimeFheOperations } from "./prime-fhe-operations";
export { HomomorphicPrivateAiReservoir } from "./homomorphic-private-ai-reservoir";
export { HomomorphicPrivateAiServer } from "./homomorphic-private-ai-server";
export { MultiKeyThresholdFheEngine } from "./multi-key-threshold-fhe";
export { AffineRingFheSecurityEngine } from "./affine-ring-fhe-security";
export { HomomorphicCsamPsiMatcher } from "./homomorphic-csam-psi-matcher";
export { Hpsi3dVisualizerEngine } from "./hpsi-3d-visualizer";
export {
  PrimeVdfProver,
  PrimeVdfVerifier,
  ChiaVdfSimulator,
  DEFAULT_VDF_PARAMS,
  type PrimeVdfParams,
  type PrimeVdfProof,
  type PrimeVdfVerificationResult,
} from "./prime-vdf-engine";
export {
  PrimeVdfNovaCircuit,
  type R1csStepInstance,
  type ZkScrollCastCommitment,
} from "./prime-vdf-nova-circuit";
export {
  UnifiedPrivateAIPlatformClient,
  SecureEnclaveAgent,
  stringToFieldElement,
  fieldElementToString,
  type EncryptedPrompt,
  type EncryptedResponse,
  type HomomorphicTestHarness,
} from "./unified-private-ai-platform";
export {
  VisionReasoningEngineClient,
  HomomorphicViTEncoder,
  VisionReasoningEngine,
  type EncryptedImageTensor,
  type SceneGraphMotifMatch,
} from "./vision-reasoning-engine";
