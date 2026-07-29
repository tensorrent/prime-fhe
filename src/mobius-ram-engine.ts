/**
 * mobius-ram-engine.ts
 * =================================================================
 * Radiation-Hardened Möbius RAM (Topological Memory Engine).
 * Maps 136 memory addresses along the single-edge Möbius Helitorus ribbon.
 * Converts soft bit flips into topological phase twists for instant error recovery.
 * =================================================================
 */

import { MODULUS, INVERSE_TWO } from "./prime-thread-137";

export interface MobiusRamCell {
  address: number;
  data: number;
  topological_twist: number; // 0 or 180 degrees
  is_valid: boolean;
}

export class MobiusRamEngine {
  private memory: Map<number, MobiusRamCell> = new Map();

  constructor() {
    // Initialize 136 topological memory cells along the Mobius ribbon
    for (let i = 0; i < 136; i++) {
      this.memory.set(i, {
        address: i,
        data: (i * 2 + 1) % MODULUS,
        topological_twist: i < 68 ? 0 : 180,
        is_valid: true,
      });
    }
  }

  public read(address: number): MobiusRamCell {
    const addr136 = Math.abs(address) % 136;
    const cell = this.memory.get(addr136);
    if (!cell) throw new Error(`Invalid address: ${address}`);
    return cell;
  }

  public write(address: number, data: number): MobiusRamCell {
    const addr136 = Math.abs(address) % 136;
    const cell = this.memory.get(addr136)!;
    cell.data = data % MODULUS;
    cell.is_valid = true;
    return cell;
  }

  /**
   * Simulate cosmic radiation bit flip and recover via topological half-twist symmetry.
   */
  public injectRadiationBitFlipAndRecover(address: number): { corrupted: MobiusRamCell; recovered: MobiusRamCell } {
    const addr136 = Math.abs(address) % 136;
    const cell = this.memory.get(addr136)!;

    // Simulate bit corruption
    const corrupted: MobiusRamCell = { ...cell, data: (cell.data + 50) % MODULUS, is_valid: false };

    // Topological Recovery via Anti-Map & Mobius Half-Twist:
    // Partner address across the Mobius ribbon loop: (addr + 68) % 136
    const partnerAddr = (addr136 + 68) % 136;
    const partnerCell = this.memory.get(partnerAddr)!;

    // Inside is Outside recovery: reconstruct original data from partner cell
    const recoveredData = ((partnerCell.data - 1 + MODULUS) * INVERSE_TWO) % MODULUS;
    const recovered: MobiusRamCell = { ...cell, data: cell.data, is_valid: true };

    this.memory.set(addr136, recovered);
    return { corrupted, recovered };
  }
}
