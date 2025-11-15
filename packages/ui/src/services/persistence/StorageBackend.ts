/**
 * Storage Backend Interface
 * Abstract interface for different storage backends
 */

import type { SimulationSnapshot, SimulationMetadata } from './types';

export interface StorageBackend {
  /**
   * Backend identifier
   */
  readonly name: string;

  /**
   * Check if backend is available/connected
   */
  isAvailable(): Promise<boolean>;

  /**
   * Save a simulation snapshot
   */
  save(snapshot: SimulationSnapshot): Promise<void>;

  /**
   * Load a simulation snapshot by ID
   */
  load(id: string): Promise<SimulationSnapshot | null>;

  /**
   * Get all simulation metadata
   */
  list(): Promise<SimulationMetadata[]>;

  /**
   * Delete a simulation
   */
  delete(id: string): Promise<boolean>;

  /**
   * Get storage statistics
   */
  getStats(): Promise<{
    totalSimulations: number;
    totalSize: number;
    sizeFormatted: string;
  }>;

  /**
   * Clear all simulations (use with caution)
   */
  clearAll(): Promise<void>;
}
