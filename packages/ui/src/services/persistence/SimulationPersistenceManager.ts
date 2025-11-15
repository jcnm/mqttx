/**
 * Simulation Persistence Manager
 * Orchestrates multiple storage backends (LocalStorage, Redis, File)
 * Allows switching between backends at runtime
 */

import type { StorageBackend } from './StorageBackend';
import type { SimulationSnapshot, SimulationMetadata, StorageBackendType } from './types';
import { LocalStorageBackend } from './LocalStorageBackend';
import { RedisBackend } from './RedisBackend';
import { FileBackend } from './FileBackend';
import type { SimulatedEoN } from '../../types/simulator.types';

const CURRENT_VERSION = '1.0.0';
const BACKEND_PREFERENCE_KEY = 'sparkplug_storage_backend_preference';

export class SimulationPersistenceManager {
  private backends: Map<StorageBackendType, StorageBackend> = new Map();
  private currentBackend: StorageBackend;

  constructor(defaultBackend: StorageBackendType = 'localStorage') {
    // Initialize all backends
    this.backends.set('localStorage', new LocalStorageBackend());
    this.backends.set('redis', new RedisBackend());
    this.backends.set('file', new FileBackend());

    // Load preferred backend from localStorage
    const savedPreference = localStorage.getItem(BACKEND_PREFERENCE_KEY) as StorageBackendType;
    const backendType = savedPreference || defaultBackend;

    this.currentBackend = this.backends.get(backendType) || this.backends.get('localStorage')!;
    console.log(`📦 Using storage backend: ${this.currentBackend.name}`);
  }

  /**
   * Get current backend
   */
  getCurrentBackend(): StorageBackend {
    return this.currentBackend;
  }

  /**
   * Get current backend type
   */
  getCurrentBackendType(): StorageBackendType {
    return this.currentBackend.name as StorageBackendType;
  }

  /**
   * Switch to a different storage backend
   */
  async switchBackend(type: StorageBackendType): Promise<boolean> {
    const backend = this.backends.get(type);
    if (!backend) {
      console.error(`Backend ${type} not found`);
      return false;
    }

    // Check if backend is available
    const available = await backend.isAvailable();
    if (!available) {
      console.error(`Backend ${type} is not available`);
      return false;
    }

    this.currentBackend = backend;
    localStorage.setItem(BACKEND_PREFERENCE_KEY, type);
    console.log(`✅ Switched to backend: ${type}`);
    return true;
  }

  /**
   * Check if a specific backend is available
   */
  async isBackendAvailable(type: StorageBackendType): Promise<boolean> {
    const backend = this.backends.get(type);
    if (!backend) return false;
    return backend.isAvailable();
  }

  /**
   * Get all available backends with their status
   */
  async getAvailableBackends(): Promise<Array<{
    type: StorageBackendType;
    name: string;
    available: boolean;
    current: boolean;
  }>> {
    const results = await Promise.all(
      Array.from(this.backends.entries()).map(async ([type, backend]) => ({
        type,
        name: backend.name,
        available: await backend.isAvailable(),
        current: backend === this.currentBackend,
      }))
    );

    return results;
  }

  /**
   * Save a simulation
   */
  async saveSimulation(
    name: string,
    nodes: Map<string, SimulatedEoN>,
    nodeStates: Map<string, any>,
    deviceStates: Map<string, any>,
    description?: string
  ): Promise<string> {
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

    await this.currentBackend.save(snapshot);

    console.log(`✅ Simulation "${name}" saved with ID: ${id}`);
    console.log(`   Backend: ${this.currentBackend.name}`);
    console.log(`   Nodes: ${snapshot.nodes.length}`);

    return id;
  }

  /**
   * Load a simulation (bdSeq auto-incremented by backend)
   */
  async loadSimulation(id: string): Promise<SimulationSnapshot | null> {
    return this.currentBackend.load(id);
  }

  /**
   * Get all simulations
   */
  async getAllSimulations(): Promise<SimulationMetadata[]> {
    return this.currentBackend.list();
  }

  /**
   * Delete a simulation
   */
  async deleteSimulation(id: string): Promise<boolean> {
    return this.currentBackend.delete(id);
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalSimulations: number;
    totalSize: number;
    sizeFormatted: string;
  }> {
    return this.currentBackend.getStats();
  }

  /**
   * Export simulation as JSON file
   */
  async exportSimulation(id: string): Promise<void> {
    // Load snapshot without incrementing bdSeq
    const key = `sparkplug_simulation_${id}`;
    const data = localStorage.getItem(key);

    if (!data) {
      console.error(`Simulation ${id} not found`);
      return;
    }

    const snapshot: SimulationSnapshot = JSON.parse(data);
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${snapshot.name.replace(/[^a-z0-9]/gi, '_')}_${snapshot.id}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log(`📥 Simulation "${snapshot.name}" exported`);
  }

  /**
   * Import simulation from JSON file
   */
  async importSimulation(file: File): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = e.target?.result as string;
          const snapshot: SimulationSnapshot = JSON.parse(data);

          // Generate new ID to avoid conflicts
          const newId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          snapshot.id = newId;
          snapshot.lastModified = Date.now();

          // Save to current backend
          await this.currentBackend.save(snapshot);

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
   * Copy simulation from one backend to another
   */
  async copyToBackend(id: string, targetBackend: StorageBackendType): Promise<string | null> {
    // Load from current backend
    const snapshot = await this.loadSimulation(id);
    if (!snapshot) {
      console.error(`Simulation ${id} not found`);
      return null;
    }

    // Get target backend
    const backend = this.backends.get(targetBackend);
    if (!backend) {
      console.error(`Backend ${targetBackend} not found`);
      return null;
    }

    // Check if target is available
    const available = await backend.isAvailable();
    if (!available) {
      console.error(`Backend ${targetBackend} is not available`);
      return null;
    }

    // Generate new ID for copy
    const newId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    snapshot.id = newId;
    snapshot.lastModified = Date.now();

    // Save to target backend
    await backend.save(snapshot);

    console.log(`✅ Copied simulation to ${targetBackend}: ${newId}`);
    return newId;
  }

  /**
   * Sync all simulations from current backend to another
   */
  async syncToBackend(targetBackend: StorageBackendType): Promise<number> {
    const simulations = await this.getAllSimulations();
    const backend = this.backends.get(targetBackend);

    if (!backend) {
      throw new Error(`Backend ${targetBackend} not found`);
    }

    const available = await backend.isAvailable();
    if (!available) {
      throw new Error(`Backend ${targetBackend} is not available`);
    }

    let synced = 0;
    for (const meta of simulations) {
      const snapshot = await this.loadSimulation(meta.id);
      if (snapshot) {
        await backend.save(snapshot);
        synced++;
      }
    }

    console.log(`✅ Synced ${synced} simulations to ${targetBackend}`);
    return synced;
  }

  /**
   * Clear all simulations from current backend
   */
  async clearAll(): Promise<void> {
    await this.currentBackend.clearAll();
  }

  /**
   * Auto-save to current backend
   */
  async autoSave(
    nodes: Map<string, SimulatedEoN>,
    nodeStates: Map<string, any>,
    deviceStates: Map<string, any>
  ): Promise<void> {
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

    await this.currentBackend.save(snapshot);
  }

  /**
   * Check if auto-save exists
   */
  async hasAutoSave(): Promise<boolean> {
    const autosave = await this.loadSimulation('autosave');
    return autosave !== null;
  }

  /**
   * Load auto-save
   */
  async loadAutoSave(): Promise<SimulationSnapshot | null> {
    return this.loadSimulation('autosave');
  }
}

// Singleton instance
export const persistenceManager = new SimulationPersistenceManager();
