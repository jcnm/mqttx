// Sparkplug State Management Types

export interface NodeState {
  groupId: string;
  edgeNodeId: string;
  bdSeq: bigint;
  seq: bigint;
  online: boolean;
  lastSeen: number;
  birthTimestamp?: bigint;
  metrics?: Map<string, MetricState>;
}

export interface DeviceState {
  groupId: string;
  edgeNodeId: string;
  deviceId: string;
  online: boolean;
  lastSeen: number;
  birthTimestamp?: bigint;
  metrics?: Map<string, MetricState>;
}

export interface MetricState {
  name: string;
  alias?: bigint;
  value: unknown;
  datatype: number;
  timestamp: bigint;
  quality?: number;
}

export interface SessionState {
  clientId: string;
  connected: boolean;
  connectTime: number;
  disconnectTime?: number;
  cleanSession: boolean;
  bdSeq?: bigint;
}

export enum NodeStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  STALE = 'STALE',
  UNKNOWN = 'UNKNOWN',
}
