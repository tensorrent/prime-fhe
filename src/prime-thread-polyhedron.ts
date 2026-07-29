/**
 * prime-thread-polyhedron.ts
 * =================================================================
 * Real-Time Polyhedral Stellation Visualizer & Geometry Engine (F_137).
 * Maps Prime Thread states p_n to polyhedral face geometries, 
 * rendering the 5-step Sophie Germain Avalanche (2 -> 5 -> 11 -> 23 -> 47).
 * =================================================================
 */

import { MODULUS, FIXED_POINT } from "./prime-thread-137";

export interface PolyhedronVertex {
  x: number;
  y: number;
  z: number;
}

export interface PolyhedronFace {
  indices: number[];
  normal: PolyhedronVertex;
}

export interface PolyhedralStellation {
  prime: number;
  u_val: number;
  face_count: number;
  vertices: PolyhedronVertex[];
  faces: PolyhedronFace[];
  stellation_scale: number;
}

/**
 * Generate 3D polyhedral stellation geometry for a prime node p_n.
 * Face count = u_n = p_n + 1.
 */
export function generatePolyhedronForPrime(p: number, step_index: number): PolyhedralStellation {
  const u_val = (p + 1) % MODULUS;
  const num_vertices = Math.max(4, Math.min(u_val, 68));
  const radius = 100 + (step_index * 15);
  const vertices: PolyhedronVertex[] = [];

  // Generate vertices on spherical / torus arrangement driven by u_val
  const phi_step = (2 * Math.PI) / num_vertices;
  for (let i = 0; i < num_vertices; i++) {
    const theta = i * phi_step;
    const phi = (i * Math.PI) / (num_vertices / 2);
    const r = radius * (1 + 0.2 * Math.sin(3 * theta));

    vertices.push({
      x: Number((r * Math.sin(phi) * Math.cos(theta)).toFixed(3)),
      y: Number((r * Math.sin(phi) * Math.sin(theta)).toFixed(3)),
      z: Number((r * Math.cos(phi)).toFixed(3)),
    });
  }

  // Generate triangular / polygonal faces
  const faces: PolyhedronFace[] = [];
  for (let i = 0; i < num_vertices - 2; i++) {
    faces.push({
      indices: [0, i + 1, i + 2],
      normal: { x: 0, y: 0, z: 1 },
    });
  }

  return {
    prime: p,
    u_val,
    face_count: u_val,
    vertices,
    faces,
    stellation_scale: Number((u_val / MODULUS).toFixed(4)),
  };
}

/**
 * Render the 5-Step Sophie Germain Prime Avalanche (2 -> 5 -> 11 -> 23 -> 47)
 * into a multi-layer polyhedral stellation sequence.
 */
export function renderAvalancheStellationSequence(): PolyhedralStellation[] {
  const avalanchePrimes = [2, 5, 11, 23, 47];
  return avalanchePrimes.map((p, idx) => generatePolyhedronForPrime(p, idx));
}

/**
 * Project 3D Polyhedral vertices into 2D SVG path strings for rendering.
 */
export function renderPolyhedronSvgPath(stellation: PolyhedralStellation, viewWidth = 400, viewHeight = 400): string {
  const cx = viewWidth / 2;
  const cy = viewHeight / 2;
  const scale = 0.8;

  const points2d = stellation.vertices.map((v) => {
    const x2d = cx + v.x * scale;
    const y2d = cy + v.y * scale;
    return `${x2d.toFixed(1)},${y2d.toFixed(1)}`;
  });

  return `M ${points2d.join(" L ")} Z`;
}
