/**
 * Simulation Persistence Service
 * Sparkplug B Compliant - Manages bdSeq and seq state persistence
 *
 * Critical for Sparkplug B compliance:
 * - bdSeq MUST increment on every rebirth/reconnection
 * - seq MUST continue from last known value
 * - State MUST be persisted to survive page reloads
 */

import type { SimulatedEoN } from '../types/simulator.types';

export interface SimulationSnapshot {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  lastModified: number;
  version: string; // For future compatibility
  nodes: Array<{
    id: string;
    config: SimulatedEoN['config'];
    metrics: SimulatedEoN['metrics'];
    devices: SimulatedEoN['devices'];
    // Sparkplug B State - CRITICAL
    state: {
      bdSeq: string; // BigInt as string for JSON serialization
      seq: number;
      lastPublishTime: number;
      birthSent: boolean;
    };
    // Device states
    deviceStates: Record<string, {
      bdSeq: string;
      seq: number;
      lastPublishTime: number;
      birthSent: boolean;
    }>;
  }>;
}

export interface SimulationMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  lastModified: number;
  nodeCount: number;
  deviceCount: number;
}

const STORAGE_KEY_PREFIX = 'sparkplug_simulation_';
const METADATA_KEY = 'sparkplug_simulation_metadata';
const CURRENT_VERSION = '1.0.0';

export class SimulationPersistenceService {
  /**
   * Save a simulation snapshot
   */
  static saveSimulation(
    name: string,
    nodes: Map<string, SimulatedEoN>,
    nodeStates: Map<string, any>,
    deviceStates: Map<string, any>,
    description?: string
  ): string {
    const id = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const snapshot: SimulationSnapshot = {
      id,
      name,
      description,
      createdAt: Date.now(),
      lastModified: Date.now(),
      version: CURRENT_VERSION,
      nodes: Array.from(nodes.entries()).map(([nodeId, node]) => {
        const nodeState = nodeStates.get(nodeId);

        // Collect device states for this node
        const deviceStateMap: Record<string, any> = {};
        node.devices.forEach((device) => {
          const deviceState = deviceStates.get(device.id);
          if (deviceState) {
            deviceStateMap[device.id] = {
              bdSeq: deviceState.bdSeq.toString(),
              seq: deviceState.seq,
              lastPublishTime: deviceState.lastPublish,
              birthSent: deviceState.birthSent,
            };
          }
        });

        return {
          id: nodeId,
          config: node.config,
          metrics: node.metrics,
          devices: node.devices,
          state: {
            bdSeq: nodeState?.bdSeq?.toString() || '0',
            seq: nodeState?.seq || 0,
            lastPublishTime: nodeState?.lastPublish || Date.now(),
            birthSent: nodeState?.birthSent || false,
          },
          deviceStates: deviceStateMap,
        };
      }),
    };

    // Save to localStorage
    const key = STORAGE_KEY_PREFIX + id;
    localStorage.setItem(key, JSON.stringify(snapshot));

    // Update metadata index
    this.updateMetadataIndex(snapshot);

    console.log(`✅ Simulation "${name}" saved with ID: ${id}`);
    console.log(`   Nodes: ${snapshot.nodes.length}`);
    console.log(`   bdSeq states preserved for Sparkplug B compliance`);

    return id;
  }

  /**
   * Load a simulation snapshot
   * IMPORTANT: bdSeq will be incremented on load to comply with Sparkplug B
   */
  static loadSimulation(id: string): SimulationSnapshot | null {
    const key = STORAGE_KEY_PREFIX + id;
    const data = localStorage.getItem(key);

    if (!data) {
      console.error(`Simulation ${id} not found`);
      return null;
    }

    try {
      const snapshot: SimulationSnapshot = JSON.parse(data);

      // Increment bdSeq for all nodes (Sparkplug B requirement)
      // When reloading, it's like a new session, so bdSeq MUST increment
      snapshot.nodes.forEach((node) => {
        const currentBdSeq = BigInt(node.state.bdSeq);
        const newBdSeq = currentBdSeq + BigInt(1);
        node.state.bdSeq = newBdSeq.toString();

        console.log(`📊 Node ${node.config.edgeNodeId}: bdSeq ${currentBdSeq} → ${newBdSeq}`);

        // Increment bdSeq for devices too
        Object.keys(node.deviceStates).forEach((deviceId) => {
          const deviceState = node.deviceStates[deviceId];
          const currentDeviceBdSeq = BigInt(deviceState.bdSeq);
          const newDeviceBdSeq = currentDeviceBdSeq + BigInt(1);
          deviceState.bdSeq = newDeviceBdSeq.toString();
        });
      });

      console.log(`✅ Simulation "${snapshot.name}" loaded (bdSeq incremented for Sparkplug B compliance)`);

      return snapshot;
    } catch (error) {
      console.error('Failed to parse simulation snapshot:', error);
      return null;
    }
  }

  /**
   * Get all saved simulation metadata
   */
  static getAllSimulations(): SimulationMetadata[] {
    const metadataStr = localStorage.getItem(METADATA_KEY);
    if (!metadataStr) return [];

    try {
      return JSON.parse(metadataStr);
    } catch {
      return [];
    }
  }

  /**
   * Delete a simulation
   */
  static deleteSimulation(id: string): boolean {
    const key = STORAGE_KEY_PREFIX + id;

    // Remove from storage
    localStorage.removeItem(key);

    // Update metadata index
    const metadata = this.getAllSimulations();
    const filtered = metadata.filter((m) => m.id !== id);
    localStorage.setItem(METADATA_KEY, JSON.stringify(filtered));

    console.log(`🗑️  Simulation ${id} deleted`);
    return true;
  }

  /**
   * Update a simulation (rename, change description)
   */
  static updateSimulation(
    id: string,
    updates: { name?: string; description?: string }
  ): boolean {
    const snapshot = this.loadSimulation(id);
    if (!snapshot) return false;

    if (updates.name) snapshot.name = updates.name;
    if (updates.description !== undefined) snapshot.description = updates.description;
    snapshot.lastModified = Date.now();

    // Save back
    const key = STORAGE_KEY_PREFIX + id;
    localStorage.setItem(key, JSON.stringify(snapshot));

    // Update metadata
    this.updateMetadataIndex(snapshot);

    return true;
  }

  /**
   * Export simulation as JSON file
   */
  static exportSimulation(id: string): void {
    const snapshot = this.loadSimulation(id);
    if (!snapshot) return;

    // Don't increment bdSeq for export (user might want exact state)
    // Re-fetch without increment
    const key = STORAGE_KEY_PREFIX + id;
    const data = localStorage.getItem(key);
    if (!data) return;

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${snapshot.name.replace(/[^a-z0-9]/gi, '_')}_${id}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log(`📥 Simulation "${snapshot.name}" exported`);
  }

  /**
   * Import simulation from JSON file
   */
  static async importSimulation(file: File): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result as string;
          const snapshot: SimulationSnapshot = JSON.parse(data);

          // Generate new ID to avoid conflicts
          const newId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          snapshot.id = newId;
          snapshot.lastModified = Date.now();

          // Save
          const key = STORAGE_KEY_PREFIX + newId;
          localStorage.setItem(key, JSON.stringify(snapshot));

          // Update metadata
          this.updateMetadataIndex(snapshot);

          console.log(`📤 Simulation "${snapshot.name}" imported with ID: ${newId}`);
          resolve(newId);
        } catch (error) {
          console.error('Failed to import simulation:', error);
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /**
   * Auto-save current simulation state (called periodically)
   */
  static autoSave(
    nodes: Map<string, SimulatedEoN>,
    nodeStates: Map<string, any>,
    deviceStates: Map<string, any>
  ): void {
    const autoSaveId = 'autosave';
    const name = 'Auto-saved Simulation';

    const snapshot: SimulationSnapshot = {
      id: autoSaveId,
      name,
      description: 'Automatically saved simulation state',
      createdAt: Date.now(),
      lastModified: Date.now(),
      version: CURRENT_VERSION,
      nodes: Array.from(nodes.entries()).map(([nodeId, node]) => {
        const nodeState = nodeStates.get(nodeId);

        const deviceStateMap: Record<string, any> = {};
        node.devices.forEach((device) => {
          const deviceState = deviceStates.get(device.id);
          if (deviceState) {
            deviceStateMap[device.id] = {
              bdSeq: deviceState.bdSeq.toString(),
              seq: deviceState.seq,
              lastPublishTime: deviceState.lastPublish,
              birthSent: deviceState.birthSent,
            };
          }
        });

        return {
          id: nodeId,
          config: node.config,
          metrics: node.metrics,
          devices: node.devices,
          state: {
            bdSeq: nodeState?.bdSeq?.toString() || '0',
            seq: nodeState?.seq || 0,
            lastPublishTime: nodeState?.lastPublish || Date.now(),
            birthSent: nodeState?.birthSent || false,
          },
          deviceStates: deviceStateMap,
        };
      }),
    };

    // Save to localStorage with special autosave key
    localStorage.setItem(STORAGE_KEY_PREFIX + autoSaveId, JSON.stringify(snapshot));
  }

  /**
   * Load auto-saved simulation
   */
  static loadAutoSave(): SimulationSnapshot | null {
    return this.loadSimulation('autosave');
  }

  /**
   * Check if auto-save exists
   */
  static hasAutoSave(): boolean {
    return localStorage.getItem(STORAGE_KEY_PREFIX + 'autosave') !== null;
  }

  /**
   * Clear all simulations (for debugging)
   */
  static clearAll(): void {
    const metadata = this.getAllSimulations();
    metadata.forEach((m) => {
      localStorage.removeItem(STORAGE_KEY_PREFIX + m.id);
    });
    localStorage.removeItem(METADATA_KEY);
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'autosave');
    console.log('🗑️  All simulations cleared');
  }

  /**
   * Update metadata index
   */
  private static updateMetadataIndex(snapshot: SimulationSnapshot): void {
    const metadata = this.getAllSimulations();

    // Remove old entry if exists
    const filtered = metadata.filter((m) => m.id !== snapshot.id);

    // Calculate counts
    let deviceCount = 0;
    snapshot.nodes.forEach((node) => {
      deviceCount += node.devices.length;
    });

    // Add new entry
    filtered.push({
      id: snapshot.id,
      name: snapshot.name,
      description: snapshot.description,
      createdAt: snapshot.createdAt,
      lastModified: snapshot.lastModified,
      nodeCount: snapshot.nodes.length,
      deviceCount,
    });

    // Save
    localStorage.setItem(METADATA_KEY, JSON.stringify(filtered));
  }

  /**
   * Get storage usage statistics
   */
  static getStorageStats(): {
    totalSimulations: number;
    totalSize: number;
    sizeFormatted: string;
  } {
    const metadata = this.getAllSimulations();
    let totalSize = 0;

    metadata.forEach((m) => {
      const key = STORAGE_KEY_PREFIX + m.id;
      const data = localStorage.getItem(key);
      if (data) {
        totalSize += data.length;
      }
    });

    // Add autosave size
    const autoSave = localStorage.getItem(STORAGE_KEY_PREFIX + 'autosave');
    if (autoSave) {
      totalSize += autoSave.length;
    }

    const sizeKB = (totalSize / 1024).toFixed(2);
    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
    const sizeFormatted = totalSize > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

    return {
      totalSimulations: metadata.length,
      totalSize,
      sizeFormatted,
    };
  }
}
