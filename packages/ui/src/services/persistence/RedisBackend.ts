/**
 * Redis Backend
 * Stores simulations in Redis via broker API
 * Shared between users, persistent, unlimited size
 */

import type { StorageBackend } from './StorageBackend';
import type { SimulationSnapshot, SimulationMetadata } from './types';

export class RedisBackend implements StorageBackend {
  readonly name = 'redis';
  private apiUrl: string;

  constructor(apiUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:3000') {
    this.apiUrl = apiUrl;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async save(snapshot: SimulationSnapshot): Promise<void> {
    const response = await fetch(`${this.apiUrl}/api/simulations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    });

    if (!response.ok) {
      throw new Error(`Failed to save simulation to Redis: ${response.statusText}`);
    }

    console.log(`[Redis] Saved simulation: ${snapshot.name} (${snapshot.id})`);
  }

  async load(id: string): Promise<SimulationSnapshot | null> {
    const response = await fetch(`${this.apiUrl}/api/simulations/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[Redis] Simulation ${id} not found`);
        return null;
      }
      throw new Error(`Failed to load simulation from Redis: ${response.statusText}`);
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

    console.log(`[Redis] Loaded simulation: ${snapshot.name} (bdSeq incremented)`);
    return snapshot;
  }

  async list(): Promise<SimulationMetadata[]> {
    const response = await fetch(`${this.apiUrl}/api/simulations`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to list simulations from Redis: ${response.statusText}`);
    }

    return response.json();
  }

  async delete(id: string): Promise<boolean> {
    const response = await fetch(`${this.apiUrl}/api/simulations/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete simulation from Redis: ${response.statusText}`);
    }

    console.log(`[Redis] Deleted simulation: ${id}`);
    return true;
  }

  async getStats(): Promise<{
    totalSimulations: number;
    totalSize: number;
    sizeFormatted: string;
  }> {
    const response = await fetch(`${this.apiUrl}/api/simulations/stats`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to get stats from Redis: ${response.statusText}`);
    }

    return response.json();
  }

  async clearAll(): Promise<void> {
    const response = await fetch(`${this.apiUrl}/api/simulations`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to clear all simulations from Redis: ${response.statusText}`);
    }

    console.log('[Redis] All simulations cleared');
  }
}
