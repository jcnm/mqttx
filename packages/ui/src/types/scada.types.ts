/**
 * SCADA View Type Definitions
 * For real-time monitoring of EoN nodes and devices
 */

export interface MetricValue {
  name: string;
  value: number | string | boolean | bigint | Uint8Array | any;
  datatype: number; // Sparkplug datatype
  timestamp: bigint;
  alias?: bigint;
  properties?: {
    engineeringUnits?: string;
    min?: number;
    max?: number;
    quality?: number; // Sparkplug B quality code (0-255)
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

export type ViewMode = 'grid' | 'tree' | 'detail' | 'alarms';

export interface SCADAFilter {
  groupId?: string;
  edgeNodeId?: string; // Separate field for Edge Node ID filter
  searchTerm?: string;
  showOffline?: boolean;
  tags?: string[];
}
