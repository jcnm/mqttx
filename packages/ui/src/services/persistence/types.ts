/**
 * Shared types for simulation persistence
 */

import type { SimulatedEoN } from '../../types/simulator.types';

export interface SimulationSnapshot {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  lastModified: number;
  version: string;
  nodes: Array<{
    id: string;
    config: SimulatedEoN['config'];
    metrics: SimulatedEoN['metrics'];
    devices: SimulatedEoN['devices'];
    state: {
      bdSeq: string;
      seq: number;
      lastPublishTime: number;
      birthSent: boolean;
    };
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

export type StorageBackendType = 'localStorage' | 'redis' | 'file';
