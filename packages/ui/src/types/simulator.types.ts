/**
 * Plant Simulator Type Definitions
 * For graphical node designer with ReactFlow
 */

import type { Node, Edge } from '@xyflow/react';

export type Protocol = 'SparkplugB' | 'RawMQTTv5';
export type SimulationState = 'stopped' | 'running' | 'paused' | 'error';
export type BdSeqStrategy = 'sequential' | 'random' | 'timestamp';
export type DataGenerationType = 'static' | 'random' | 'sine' | 'linear' | 'formula';

export interface SparkplugConfig {
  bdSeqStrategy: BdSeqStrategy;
  rebirthTimeout: number;
  willMessage?: {
    topic: string;
    payload: Uint8Array;
    qos: 0 | 1 | 2;
    retain: boolean;
  };
}

export interface LifecycleConfig {
  birthSchedule?: string; // cron expression
  deathSchedule?: string; // cron expression
  autoReconnect: boolean;
  reconnectDelay?: number; // ms
}

export interface NetworkConfig {
  qos: 0 | 1 | 2;
  cleanSession: boolean;
  mqttv5Properties?: Record<string, any>;
  keepAlive?: number;
  connectTimeout?: number;
}

export interface PersistenceConfig {
  enabled: boolean;
  stateStorage?: boolean;
  metricHistory?: boolean;
  historySize?: number;
}

export interface DataGenerationLogic {
  type: DataGenerationType;
  params: {
    value?: number;
    min?: number;
    max?: number;
    amplitude?: number;
    frequency?: number;
    phase?: number;
    slope?: number;
    intercept?: number;
    formula?: string; // e.g., "Math.sin(t) * 100"
    seed?: number;
  };
}

export interface MetricDefinition {
  name: string;
  alias?: bigint;
  datatype: number; // Sparkplug datatype
  value: number | string | boolean | bigint;
  properties?: {
    engineeringUnits?: string;
    min?: number;
    max?: number;
    description?: string;
  };
  logic?: DataGenerationLogic;
}

export interface DataProductionConfig {
  frequency: number; // ms
  logic: DataGenerationLogic;
  enabled: boolean;
}

export interface SimulatedDevice {
  id: string;
  deviceId: string;
  protocol: Protocol;
  metrics: MetricDefinition[];
  dataProduction: DataProductionConfig;
  state: SimulationState;
}

export interface SimulatedEoNConfig {
  groupId: string;
  edgeNodeId: string;
  protocol: Protocol;
  sparkplugConfig: SparkplugConfig;
  lifecycle: LifecycleConfig;
  network: NetworkConfig;
  persistence: PersistenceConfig;
}

export interface SimulatedEoN {
  id: string;
  position: { x: number; y: number };
  config: SimulatedEoNConfig;
  devices: SimulatedDevice[];
  state: SimulationState;
  metrics: MetricDefinition[];
}

export interface NodeTemplate {
  id: string;
  name: string;
  description: string;
  type: 'eon' | 'device' | 'plant'; // 'plant' for multi-node templates
  category?: string; // e.g., 'Manufacturing', 'Oil & Gas', 'Water Treatment'
  config: Array<Partial<SimulatedEoN>> | Partial<SimulatedEoNConfig> | Partial<SimulatedDevice>; // Array for plant templates
  icon?: string;
}

// ReactFlow types
export type EoNNodeData = {
  label: string;
  config: SimulatedEoNConfig;
  state: SimulationState;
  deviceCount: number;
};

export type DeviceNodeData = {
  label: string;
  deviceId: string;
  protocol: Protocol;
  state: SimulationState;
  metricCount: number;
};

export type SimulatorNode = Node<EoNNodeData | DeviceNodeData>;
export type SimulatorEdge = Edge;

export interface SimulatorStats {
  totalNodes: number;
  runningNodes: number;
  totalDevices: number;
  messagesPublished: number;
  messagesPerSecond: number;
  uptime: number;
}
