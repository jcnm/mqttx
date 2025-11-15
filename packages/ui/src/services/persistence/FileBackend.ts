/**
 * File Backend
 * Stores simulations as JSON files on server disk
 * Permanent, versionable, Git-friendly
 */

import type { StorageBackend } from './StorageBackend';
import type { SimulationSnapshot, SimulationMetadata } from './types';

export class FileBackend implements StorageBackend {
  readonly name = 'file';
  private apiUrl: string;

  constructor(apiUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:3000') {
    this.apiUrl = apiUrl;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/simulations/file/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async save(snapshot: SimulationSnapshot): Promise<void> {
    const response = await fetch(`${this.apiUrl}/api/simulations/file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    });

    if (!response.ok) {
      throw new Error(`Failed to save simulation to file: ${response.statusText}`);
    }

    console.log(`[File] Saved simulation: ${snapshot.name} (${snapshot.id})`);
  }

  async load(id: string): Promise<SimulationSnapshot | null> {
    const response = await fetch(`${this.apiUrl}/api/simulations/file/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[File] Simulation ${id} not found`);
        return null;
      }
      throw new Error(`Failed to load simulation from file: ${response.statusText}`);
    }

    const snapshot: SimulationSnapshot = await response.json();

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

    console.log(`[File] Loaded simulation: ${snapshot.name} (bdSeq incremented)`);
    return snapshot;
  }

  async list(): Promise<SimulationMetadata[]> {
    const response = await fetch(`${this.apiUrl}/api/simulations/file`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to list simulations from files: ${response.statusText}`);
    }

    return response.json();
  }

  async delete(id: string): Promise<boolean> {
    const response = await fetch(`${this.apiUrl}/api/simulations/file/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete simulation file: ${response.statusText}`);
    }

    console.log(`[File] Deleted simulation: ${id}`);
    return true;
  }

  async getStats(): Promise<{
    totalSimulations: number;
    totalSize: number;
    sizeFormatted: string;
  }> {
    const response = await fetch(`${this.apiUrl}/api/simulations/file/stats`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to get stats from files: ${response.statusText}`);
    }

    return response.json();
  }

  async clearAll(): Promise<void> {
    const response = await fetch(`${this.apiUrl}/api/simulations/file`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to clear all simulation files: ${response.statusText}`);
    }

    console.log('[File] All simulations cleared');
  }
}
