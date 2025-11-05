// Sparkplug B Protocol Buffers Decoder
// Decodes Sparkplug B protobuf binary to TypeScript objects

import * as protobuf from 'protobufjs';
import { ungzip } from 'pako';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { DecodedPayload, DecoderOptions, Metric } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let PayloadProto: protobuf.Type | null = null;

function loadProto(): protobuf.Type {
  if (PayloadProto) {
    return PayloadProto;
  }

  const protoPath = join(__dirname, '../proto/sparkplug_b.proto');
  const root = protobuf.loadSync(protoPath);
  PayloadProto = root.lookupType('org.eclipse.tahu.protobuf.Payload');
  return PayloadProto;
}

export function decodePayload(
  buffer: Uint8Array,
  options: DecoderOptions = {}
): DecodedPayload {
  const PayloadType = loadProto();

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
  const message = PayloadType.decode(data);

  // Convert to plain object
  const payload = PayloadType.toObject(message, {
    longs: String, // Convert longs to strings to avoid precision issues
    enums: Number,
    bytes: Buffer,
    defaults: false,
    arrays: true,
    objects: true,
    oneofs: true,
  }) as DecodedPayload;

  // Store raw buffer for debugging
  payload._raw = buffer;

  // Convert string longs back to BigInt
  if (payload.timestamp) {
    payload.timestamp = BigInt(payload.timestamp);
  }
  if (payload.seq !== undefined) {
    payload.seq = BigInt(payload.seq);
  }

  if (payload.metrics) {
    payload.metrics = payload.metrics.map((metric) => {
      if (metric.timestamp) {
        metric.timestamp = BigInt(metric.timestamp);
      }
      if (metric.alias !== undefined) {
        metric.alias = BigInt(metric.alias);
      }
      // Convert metric values if they're longs
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

export function decodeStatePayload(buffer: Buffer | string): {
  online: boolean;
  timestamp: number;
} {
  const str = Buffer.isBuffer(buffer) ? buffer.toString('utf8') : buffer;
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
