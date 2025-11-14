// Sparkplug B Protocol Buffers Decoder (Browser-compatible)
// Decodes Sparkplug B protobuf binary to TypeScript objects

import { ungzip } from 'pako';
import { org } from './proto-compiled.js';
import type { DecodedPayload, DecoderOptions, Metric } from './types.js';

const PayloadProto = org.eclipse.tahu.protobuf.Payload;

export function decodePayload(
  buffer: Uint8Array,
  options: DecoderOptions = {}
): DecodedPayload {
  let data = buffer;

  // Try to decompress if requested or auto-detect GZIP header
  if (options.decompress || (buffer[0] === 0x1f && buffer[1] === 0x8b)) {
    try {
      data = ungzip(buffer);
    } catch (err) {
      // If decompression fails, assume it's not compressed
      console.warn('Decompression failed, using raw data:', err);
    }
  }

  // Decode the protobuf message
  const message = PayloadProto.decode(data);

  // Convert to plain object
  const payload = PayloadProto.toObject(message, {
    longs: String, // Convert longs to strings to avoid precision issues
    enums: Number,
    bytes: Array, // Use Array instead of Buffer for browser compatibility
    defaults: false, // Don't include default values - only actual fields
    arrays: true,
    objects: true,
    oneofs: false, // Don't group oneofs - return individual fields
  }) as any;

  // Store raw buffer for debugging
  payload._raw = buffer;

  // Convert string longs back to BigInt
  // Note: Keep 0 values as they are valid in Sparkplug (e.g., seq starts at 0)
  if (payload.timestamp !== undefined && payload.timestamp !== null) {
    payload.timestamp = BigInt(payload.timestamp);
  }
  if (payload.seq !== undefined && payload.seq !== null) {
    payload.seq = BigInt(payload.seq);
  }

  if (payload.metrics) {
    payload.metrics = payload.metrics.map((metric: any) => {
      // Convert timestamps and aliases
      if (metric.timestamp !== undefined && metric.timestamp !== null) {
        metric.timestamp = BigInt(metric.timestamp);
      }
      if (metric.alias !== undefined && metric.alias !== null) {
        metric.alias = BigInt(metric.alias);
      }

      // Normalize value field - extract from the appropriate protobuf field
      // based on the oneof field that was set
      // With oneofs:true, protobufjs returns 'value' as an object with a single key
      // With oneofs:false, it returns individual fields like intValue, floatValue, etc.
      if (metric.value === undefined || typeof metric.value === 'object') {
        // Check for oneof value object (when oneofs:true)
        if (metric.value && typeof metric.value === 'object') {
          // Extract the actual value from the oneof object
          const oneofValue = metric.value;
          const key = Object.keys(oneofValue)[0];
          if (key) {
            metric.value = oneofValue[key];
            if (typeof metric.value === 'string' && (metric.datatype === 4 || metric.datatype === 8 || metric.datatype === 13)) {
              metric.value = BigInt(metric.value);
            }
          }
        }
        // Check for individual fields (when oneofs:false) - using camelCase
        else if (metric.intValue !== undefined) {
          metric.value = metric.intValue;
          delete metric.intValue;
        } else if (metric.longValue !== undefined) {
          metric.value = typeof metric.longValue === 'string'
            ? BigInt(metric.longValue)
            : metric.longValue;
          delete metric.longValue;
        } else if (metric.floatValue !== undefined) {
          metric.value = metric.floatValue;
          delete metric.floatValue;
        } else if (metric.doubleValue !== undefined) {
          metric.value = metric.doubleValue;
          delete metric.doubleValue;
        } else if (metric.booleanValue !== undefined) {
          metric.value = metric.booleanValue;
          delete metric.booleanValue;
        } else if (metric.stringValue !== undefined) {
          metric.value = metric.stringValue;
          delete metric.stringValue;
        } else if (metric.bytesValue !== undefined) {
          metric.value = metric.bytesValue;
          delete metric.bytesValue;
        } else if (metric.datasetValue !== undefined) {
          metric.value = metric.datasetValue;
          delete metric.datasetValue;
        } else if (metric.templateValue !== undefined) {
          metric.value = metric.templateValue;
          delete metric.templateValue;
        } else if (metric.extensionValue !== undefined) {
          metric.value = metric.extensionValue;
          delete metric.extensionValue;
        }
      }

      // Convert metric values if they're longs (string representation)
      if (
        typeof metric.value === 'string' &&
        (metric.datatype === 4 || metric.datatype === 8)
      ) {
        metric.value = BigInt(metric.value);
      }

      return metric;
    });
  }

  return payload;
}

export function decodeStatePayload(buffer: Uint8Array | string): {
  online: boolean;
  timestamp: number;
} {
  const str = typeof buffer === 'string'
    ? buffer
    : new TextDecoder().decode(buffer);
  return JSON.parse(str);
}

export function getBdSeq(payload: DecodedPayload): bigint | null {
  const bdSeqMetric = payload.metrics?.find((m) => m.name === 'bdSeq');
  if (bdSeqMetric && typeof bdSeqMetric.value === 'bigint') {
    return bdSeqMetric.value;
  }
  return null;
}

export function getMetricByName(
  payload: DecodedPayload,
  name: string
): Metric | undefined {
  return payload.metrics?.find((m) => m.name === name);
}

export function getMetricByAlias(
  payload: DecodedPayload,
  alias: bigint
): Metric | undefined {
  return payload.metrics?.find((m) => m.alias === alias);
}
