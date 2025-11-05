/**
 * Sparkplug B Message Processor
 * Decodes MQTT messages and updates SCADA store with node/device data
 */

import { decodePayload, getBdSeq } from '@sparkplug/codec';
import type { DecodedPayload, Metric } from '@sparkplug/codec';
import type { EoNNode, Device, MetricValue } from '../types/scada.types';
import type { BrokerLog } from '../types/broker.types';

/**
 * Parse Sparkplug B topic structure
 * Format: spBv1.0/GROUP_ID/MESSAGE_TYPE/EDGE_NODE_ID/[DEVICE_ID]
 */
export function parseSparkplugTopic(topic: string): {
  namespace: string;
  groupId: string;
  messageType: string;
  edgeNodeId: string;
  deviceId?: string;
} | null {
  const parts = topic.split('/');

  // Minimum: namespace/groupId/messageType/edgeNodeId
  if (parts.length < 4) {
    return null;
  }

  const [namespace, groupId, messageType, edgeNodeId, deviceId] = parts;

  // Validate namespace
  if (namespace !== 'spBv1.0') {
    return null;
  }

  return {
    namespace,
    groupId,
    messageType,
    edgeNodeId,
    deviceId,
  };
}

/**
 * Convert Sparkplug Metric to MetricValue
 */
export function convertMetric(metric: Metric): MetricValue {
  // Convert value to basic types
  let value: number | string | boolean | bigint = 0;
  if (metric.value !== undefined && metric.value !== null) {
    if (typeof metric.value === 'number' || typeof metric.value === 'string' ||
        typeof metric.value === 'boolean' || typeof metric.value === 'bigint') {
      value = metric.value;
    } else {
      // For complex types, convert to string
      value = String(metric.value);
    }
  }

  return {
    name: metric.name || 'unknown',
    value,
    datatype: metric.datatype || 0,
    timestamp: metric.timestamp || BigInt(Date.now()),
    alias: metric.alias,
    properties: {
      engineeringUnits: metric.properties?.keys?.find(
        (k) => k === 'engineeringUnits'
      )
        ? String(metric.properties.values[metric.properties.keys.indexOf('engineeringUnits')].value)
        : undefined,
      min: metric.properties?.keys?.find((k) => k === 'min')
        ? Number(metric.properties.values[metric.properties.keys.indexOf('min')].value)
        : undefined,
      max: metric.properties?.keys?.find((k) => k === 'max')
        ? Number(metric.properties.values[metric.properties.keys.indexOf('max')].value)
        : undefined,
    },
  };
}

/**
 * Process incoming MQTT message and extract SCADA data
 */
export function processSparkplugMessage(log: BrokerLog): {
  type: 'node' | 'device';
  action: 'birth' | 'death' | 'data';
  node?: Partial<EoNNode>;
  device?: Partial<Device>;
  nodeKey?: string;
} | null {
  // Only process Sparkplug messages
  if (!log.topic || !log.topic.startsWith('spBv1.0/')) {
    return null;
  }

  // Parse topic
  const parsed = parseSparkplugTopic(log.topic);
  if (!parsed) {
    return null;
  }

  const { groupId, messageType, edgeNodeId, deviceId } = parsed;
  const nodeKey = `${groupId}/${edgeNodeId}`;

  // Handle STATE messages separately
  if (messageType === 'STATE') {
    return null; // State messages are handled by broker
  }

  // Decode Sparkplug payload
  let payload: DecodedPayload | null = null;
  if (log.payload) {
    try {
      payload = decodePayload(log.payload);
    } catch (err) {
      console.error('Failed to decode Sparkplug payload:', err);
      return null;
    }
  }

  // Handle NBIRTH - Node Birth Certificate
  if (messageType === 'NBIRTH' && payload) {
    const bdSeq = getBdSeq(payload) || BigInt(0);
    const metrics = new Map<string, MetricValue>();

    payload.metrics?.forEach((metric) => {
      if (metric.name && metric.name !== 'bdSeq') {
        metrics.set(metric.name, convertMetric(metric));
      }
    });

    return {
      type: 'node',
      action: 'birth',
      nodeKey,
      node: {
        groupId,
        edgeNodeId,
        online: true,
        bdSeq,
        seq: payload.seq || BigInt(0),
        birthTimestamp: payload.timestamp || BigInt(Date.now()),
        metrics,
        devices: [],
        lastUpdate: BigInt(Date.now()),
      },
    };
  }

  // Handle NDEATH - Node Death Certificate
  if (messageType === 'NDEATH') {
    return {
      type: 'node',
      action: 'death',
      nodeKey,
      node: {
        online: false,
        lastUpdate: BigInt(Date.now()),
      },
    };
  }

  // Handle NDATA - Node Data
  if (messageType === 'NDATA' && payload) {
    const metrics = new Map<string, MetricValue>();

    payload.metrics?.forEach((metric) => {
      if (metric.name) {
        metrics.set(metric.name, convertMetric(metric));
      }
    });

    return {
      type: 'node',
      action: 'data',
      nodeKey,
      node: {
        seq: payload.seq || BigInt(0),
        metrics,
        lastUpdate: BigInt(Date.now()),
      },
    };
  }

  // Handle DBIRTH - Device Birth Certificate
  if (messageType === 'DBIRTH' && deviceId && payload) {
    const metrics = new Map<string, MetricValue>();

    payload.metrics?.forEach((metric) => {
      if (metric.name) {
        metrics.set(metric.name, convertMetric(metric));
      }
    });

    return {
      type: 'device',
      action: 'birth',
      nodeKey,
      device: {
        deviceId,
        online: true,
        metrics,
        tags: ['SparkplugB'],
        lastUpdate: BigInt(Date.now()),
      },
    };
  }

  // Handle DDEATH - Device Death Certificate
  if (messageType === 'DDEATH' && deviceId) {
    return {
      type: 'device',
      action: 'death',
      nodeKey,
      device: {
        deviceId,
        online: false,
        lastUpdate: BigInt(Date.now()),
      },
    };
  }

  // Handle DDATA - Device Data
  if (messageType === 'DDATA' && deviceId && payload) {
    const metrics = new Map<string, MetricValue>();

    payload.metrics?.forEach((metric) => {
      if (metric.name) {
        metrics.set(metric.name, convertMetric(metric));
      }
    });

    return {
      type: 'device',
      action: 'data',
      nodeKey,
      device: {
        deviceId,
        metrics,
        lastUpdate: BigInt(Date.now()),
      },
    };
  }

  return null;
}

/**
 * Calculate messages per second from recent message history
 */
export function calculateMessagesPerSecond(
  messages: Array<{ timestamp: number }>,
  windowMs: number = 5000
): number {
  const now = Date.now();
  const recentMessages = messages.filter((m) => now - m.timestamp < windowMs);
  return Math.round((recentMessages.length / windowMs) * 1000);
}

/**
 * Get datatype name from Sparkplug datatype enum
 */
export function getDatatypeName(datatype: number): string {
  const datatypes: Record<number, string> = {
    1: 'Int8',
    2: 'Int16',
    3: 'Int32',
    4: 'Int64',
    5: 'UInt8',
    6: 'UInt16',
    7: 'UInt32',
    8: 'UInt64',
    9: 'Float',
    10: 'Double',
    11: 'Boolean',
    12: 'String',
    13: 'DateTime',
    14: 'Text',
  };
  return datatypes[datatype] || 'Unknown';
}

/**
 * Get color for datatype visualization
 */
export function getDatatypeColor(datatype: number): string {
  // Int types - blue
  if (datatype >= 1 && datatype <= 8) return 'bg-blue-500';
  // Float/Double - green
  if (datatype === 9 || datatype === 10) return 'bg-emerald-500';
  // Boolean - purple
  if (datatype === 11) return 'bg-purple-500';
  // String/Text - yellow
  if (datatype === 12 || datatype === 14) return 'bg-amber-500';
  // DateTime - cyan
  if (datatype === 13) return 'bg-cyan-500';
  return 'bg-slate-500';
}

/**
 * Format metric value for display
 */
export function formatMetricValue(
  value: number | string | boolean | bigint,
  datatype: number
): string {
  // Boolean
  if (datatype === 11) {
    return value ? 'true' : 'false';
  }

  // Float/Double - format with decimals
  if (datatype === 9 || datatype === 10) {
    return typeof value === 'number' ? value.toFixed(2) : String(value);
  }

  // BigInt
  if (typeof value === 'bigint') {
    return value.toString();
  }

  // Default
  return String(value);
}
