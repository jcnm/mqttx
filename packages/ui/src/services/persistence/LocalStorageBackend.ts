/**
 * LocalStorage Backend
 * Stores simulations in browser localStorage
 * Fast, client-side only, ~5-10MB limit
 */

import type { StorageBackend } from './StorageBackend';
import type { SimulationSnapshot, SimulationMetadata } from './types';

const STORAGE_KEY_PREFIX = 'sparkplug_simulation_';
const METADATA_KEY = 'sparkplug_simulation_metadata';

export class LocalStorageBackend implements StorageBackend {
  readonly name = 'localStorage';

  async isAvailable(): Promise<boolean> {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  async save(snapshot: SimulationSnapshot): Promise<void> {
    const key = STORAGE_KEY_PREFIX + snapshot.id;
    localStorage.setItem(key, JSON.stringify(snapshot));
    await this.updateMetadataIndex(snapshot);
    console.log(`[LocalStorage] Saved simulation: ${snapshot.name} (${snapshot.id})`);
  }

  async load(id: string): Promise<SimulationSnapshot | null> {
    const key = STORAGE_KEY_PREFIX + id;
    const data = localStorage.getItem(key);

    if (!data) {
      console.warn(`[LocalStorage] Simulation ${id} not found`);
      return null;
    }

    try {
      const snapshot: SimulationSnapshot = JSON.parse(data);

      // Increment bdSeq for Sparkplug B compliance (new session)
      snapshot.nodes.forEach((node) => {
        const currentBdSeq = BigInt(node.state.bdSeq);
        const newBdSeq = currentBdSeq + BigInt(1);
        node.state.bdSeq = newBdSeq.toString();

        Object.keys(node.deviceStates).forEach((deviceId) => {
          const deviceState = node.deviceStates[deviceId];
          const currentDeviceBdSeq = BigInt(deviceState.bdSeq);
          const newDeviceBdSeq = currentDeviceBdSeq + BigInt(1);
          deviceState.bdSeq = newDeviceBdSeq.toString();
        });
      });

      console.log(`[LocalStorage] Loaded simulation: ${snapshot.name} (bdSeq incremented)`);
      return snapshot;
    } catch (error) {
      console.error('[LocalStorage] Failed to parse simulation:', error);
      return null;
    }
  }

  async list(): Promise<SimulationMetadata[]> {
    const metadataStr = localStorage.getItem(METADATA_KEY);
    if (!metadataStr) return [];

    try {
      return JSON.parse(metadataStr);
    } catch {
      return [];
    }
  }

  async delete(id: string): Promise<boolean> {
    const key = STORAGE_KEY_PREFIX + id;
    localStorage.removeItem(key);

    // Update metadata index
    const metadata = await this.list();
    const filtered = metadata.filter((m) => m.id !== id);
    localStorage.setItem(METADATA_KEY, JSON.stringify(filtered));

    console.log(`[LocalStorage] Deleted simulation: ${id}`);
    return true;
  }

  async getStats(): Promise<{
    totalSimulations: number;
    totalSize: number;
    sizeFormatted: string;
  }> {
    const metadata = await this.list();
    let totalSize = 0;

    metadata.forEach((m) => {
      const key = STORAGE_KEY_PREFIX + m.id;
      const data = localStorage.getItem(key);
      if (data) {
        totalSize += data.length;
      }
    });

    const sizeKB = (totalSize / 1024).toFixed(2);
    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
    const sizeFormatted = totalSize > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

    return {
      totalSimulations: metadata.length,
      totalSize,
      sizeFormatted,
    };
  }

  async clearAll(): Promise<void> {
    const metadata = await this.list();
    metadata.forEach((m) => {
      localStorage.removeItem(STORAGE_KEY_PREFIX + m.id);
    });
    localStorage.removeItem(METADATA_KEY);
    console.log('[LocalStorage] All simulations cleared');
  }

  private async updateMetadataIndex(snapshot: SimulationSnapshot): Promise<void> {
    const metadata = await this.list();
    const filtered = metadata.filter((m) => m.id !== snapshot.id);

    let deviceCount = 0;
    snapshot.nodes.forEach((node) => {
      deviceCount += node.devices.length;
    });

    filtered.push({
      id: snapshot.id,
      name: snapshot.name,
      description: snapshot.description,
      createdAt: snapshot.createdAt,
      lastModified: snapshot.lastModified,
      nodeCount: snapshot.nodes.length,
      deviceCount,
    });

    localStorage.setItem(METADATA_KEY, JSON.stringify(filtered));
  }
}
