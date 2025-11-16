/**
 * Message Trace Types
 * For detailed message inspection showing pre-encoding, post-encoding, and transmission stages
 */

import type { SparkplugPayload } from './simulator.types';

export interface MessageTrace {
  id: string;
  timestamp: number;
  messageNumber: number;

  // Message identification
  topic: string;
  messageType: 'NBIRTH' | 'NDEATH' | 'NDATA' | 'NCMD' | 'DBIRTH' | 'DDEATH' | 'DDATA' | 'DCMD';
  qos: 0 | 1 | 2;

  // Entity information
  groupId: string;
  edgeNodeId: string;
  deviceId?: string;

  // Stage 1: Pre-encoding (structured Sparkplug payload)
  preEncoding: {
    payload: SparkplugPayload;
    metricCount: number;
    seq: bigint;
    timestamp: bigint;
    bdSeq?: bigint; // For BIRTH/DEATH messages
  };

  // Stage 2: Post-encoding (binary protobuf)
  postEncoding: {
    encodedPayload: Uint8Array;
    sizeBytes: number;
    compressionRatio?: number; // If compression was applied
  };

  // Stage 3: Transmission details
  transmission: {
    publishedAt: number;
    status: 'pending' | 'success' | 'error';
    error?: string;
    mqttClientId?: string;
  };
}

export interface MessageTraceFilter {
  edgeNodeId?: string;
  deviceId?: string;
  messageType?: string;
  timeRange?: {
    start: number;
    end: number;
  };
}
