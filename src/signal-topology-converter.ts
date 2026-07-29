/**
 * signal-topology-converter.ts
 * =================================================================
 * Real-Time Signal-to-Topology Converter Engine (F_137).
 * Converts continuous analog/audio signals, SDR RF I/Q streams, and time-series
 * into 3D/4D Gaussian Splatting polyhedral stellation geometry via prime-residue quantization.
 * Includes 4D Hyper-Dimensional Projection, 4-Lane Layers, and STL Export.
 * =================================================================
 */

import { MODULUS, INVERSE_TWO, isPrime } from "./prime-thread-137";
import { generatePolyhedronForPrime, PolyhedralStellation } from "./prime-thread-polyhedron";

export interface Point4D {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Point3DProjected {
  x: number;
  y: number;
  z: number;
  scale: number;
}

export interface SignalTopologyFrame {
  timestamp: number;
  input_signal_val: number;
  frequency_hz: number;
  prime_token: number;
  accumulator_s: number;
  anti_map_verified: boolean;
  stellation: PolyhedralStellation;
  lane_layers: PolyhedralStellation[];
  gaussian_4d_cloud: Point4D[];
  hue_deg: number;
  step_count: number;
}

export class SignalToTopologyConverter {
  private last_s: number = 3;
  private step_count: number = 0;

  /**
   * Quantize continuous signal frequency (Hz) or SDR RF frequency into prime residue token mod 137.
   */
  public frequencyToPrimeToken(freqHz: number): number {
    const validPrimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131];
    const idx = Math.floor(Math.abs(freqHz / 20.0)) % validPrimes.length;
    return validPrimes[idx];
  }

  /**
   * Project 4D Point (X, Y, Z, W) to 3D Coordinates via 4D Hyper-Sphere Perspective Rotation.
   */
  public project4dGaussianTo3d(p4: Point4D, angle4d: number, distance4d = 2.5): Point3DProjected {
    // 4D Rotation in XW and ZW planes
    const cosA = Math.cos(angle4d);
    const sinA = Math.sin(angle4d);

    const x_rot = p4.x * cosA - p4.w * sinA;
    const w_rot = p4.x * sinA + p4.w * cosA;
    const z_rot = p4.z * cosA - w_rot * sinA;
    const w_final = p4.z * sinA + w_rot * cosA;

    // 4D Perspective Projection factor
    const factor = 1.0 / (distance4d - w_final / 100.0);

    return {
      x: x_rot * factor,
      y: p4.y * factor,
      z: z_rot * factor,
      scale: Math.max(0.2, factor),
    };
  }

  /**
   * Process a signal frame sample into 3D/4D Gaussian Splatting topology.
   */
  public processSignalFrame(signalVal: number, freqHz: number): SignalTopologyFrame {
    const primeToken = this.frequencyToPrimeToken(freqHz);
    
    // Accumulate state S_n = (2 * S_{n-1} + p_n) mod 137
    const next_s = (2 * this.last_s + primeToken) % MODULUS;
    
    // Anti-Map Reversal verification: S_{n-1} = (S_n - p_n) * 69 mod 137
    const restored_prev = ((next_s - primeToken + MODULUS) * INVERSE_TWO) % MODULUS;
    const anti_map_verified = restored_prev === this.last_s;

    // Generate 3D stellation geometry
    const stellation = generatePolyhedronForPrime(next_s, this.step_count);

    // Generate 4 Concentric Topological Lane Layers
    const lane_layers: PolyhedralStellation[] = [
      generatePolyhedronForPrime((next_s) % MODULUS, 0),
      generatePolyhedronForPrime((next_s * 2) % MODULUS, 1),
      generatePolyhedronForPrime((next_s * 4) % MODULUS, 2),
      generatePolyhedronForPrime(136, 3),
    ];

    // Generate 4D Gaussian Splatting Cloud (X, Y, Z, W)
    const gaussian_4d_cloud: Point4D[] = [];
    const num_points = 137;
    for (let i = 0; i < num_points; i++) {
      const theta = (i * 2 * Math.PI) / num_points;
      const phi = (i * Math.PI) / (num_points / 2);
      const w_val = ((next_s + i) % MODULUS) - 68.5;

      gaussian_4d_cloud.push({
        x: Number((100 * Math.sin(phi) * Math.cos(theta)).toFixed(2)),
        y: Number((100 * Math.sin(phi) * Math.sin(theta)).toFixed(2)),
        z: Number((100 * Math.cos(phi)).toFixed(2)),
        w: Number((w_val * 2.0).toFixed(2)),
      });
    }
    
    // Calculate solvatochromic color hue
    const hue_deg = Math.floor((next_s / MODULUS) * 360.0);

    this.last_s = next_s;
    this.step_count++;

    return {
      timestamp: Date.now(),
      input_signal_val: signalVal,
      frequency_hz: freqHz,
      prime_token: primeToken,
      accumulator_s: next_s,
      anti_map_verified,
      step_count: this.step_count,
      stellation,
      lane_layers,
      gaussian_4d_cloud,
      hue_deg,
    };
  }

  /**
   * Export Polyhedral Stellation Geometry into 3D Printable STL File Format string.
   */
  public exportStellationToStl(stellation: PolyhedralStellation): string {
    let stl = `solid PrimeThreadStellation_${stellation.prime}\n`;
    for (const face of stellation.faces) {
      const v1 = stellation.vertices[face.indices[0]] || stellation.vertices[0];
      const v2 = stellation.vertices[face.indices[1]] || stellation.vertices[1];
      const v3 = stellation.vertices[face.indices[2]] || stellation.vertices[2];

      stl += `  facet normal ${face.normal.x} ${face.normal.y} ${face.normal.z}\n`;
      stl += `    outer loop\n`;
      stl += `      vertex ${v1.x} ${v1.y} ${v1.z}\n`;
      stl += `      vertex ${v2.x} ${v2.y} ${v2.z}\n`;
      stl += `      vertex ${v3.x} ${v3.y} ${v3.z}\n`;
      stl += `    endloop\n`;
      stl += `  endfacet\n`;
    }
    stl += `endsolid PrimeThreadStellation_${stellation.prime}\n`;
    return stl;
  }
}
