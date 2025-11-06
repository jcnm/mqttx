/**
 * SCADA View Type Definitions
 * For real-time monitoring of EoN nodes and devices
 */

export interface MetricValue {
  name: string;
  value: number | string | boolean | bigint;
  datatype: number; // Sparkplug datatype
  timestamp: bigint;
  alias?: bigint;
  properties?: {
    engineeringUnits?: string;
    min?: number;
    max?: number;
  };
}

export interface Device {
  deviceId: string;
  online: boolean;
  metrics: Map<string, MetricValue>;
  tags: string[]; // "MQTT5", "SparkplugB", etc.
  lastUpdate?: bigint;
}

export interface EoNNode {
  groupId: string;
  edgeNodeId: string;
  online: boolean;
  bdSeq: bigint;
  seq: bigint;
  birthTimestamp: bigint;
  metrics: Map<string, MetricValue>;
  devices: Device[];
  lastUpdate?: bigint;
}

export type ViewMode = 'grid' | 'tree' | 'detail';

export interface SCADAFilter {
  groupId?: string;
  searchTerm?: string;
  showOffline?: boolean;
  tags?: string[];
}
