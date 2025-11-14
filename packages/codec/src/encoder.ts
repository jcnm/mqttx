// Sparkplug B Protocol Buffers Encoder
// Encodes TypeScript objects to Sparkplug B protobuf format

import protobuf from 'protobufjs';
import { gzip } from 'pako';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Payload, EncoderOptions } from './types.js';

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

export function encodePayload(
  payload: Payload,
  options: EncoderOptions = {}
): Uint8Array {
  const PayloadType = loadProto();

  // Helper to convert BigInt to a format protobufjs understands
  const convertBigInt = (value: any) => {
    if (typeof value === 'bigint') {
      // Use fromBigInt if available, otherwise fromString
      const Long = protobuf.util.Long as any;
      return Long.fromBigInt ? Long.fromBigInt(value) : Long.fromString(value.toString());
    }
    return value;
  };

  // Transform metrics to map 'value' to the appropriate protobuf field
  const transformedPayload = {
    ...payload,
    timestamp: convertBigInt(payload.timestamp),
    seq: convertBigInt(payload.seq),
    metrics: payload.metrics?.map((metric: any) => {
      const transformed: any = {
        name: metric.name,
        alias: convertBigInt(metric.alias),
        timestamp: convertBigInt(metric.timestamp),
        datatype: metric.datatype,
        isHistorical: metric.isHistorical,
        isTransient: metric.isTransient,
        isNull: metric.isNull,
        metadata: metric.metadata,
        properties: metric.properties,
      };

      // Map unified 'value' field to appropriate protobuf oneof field
      // Use camelCase as protobufjs expects JavaScript naming conventions
      if (metric.value !== undefined && metric.value !== null) {
        const datatype = metric.datatype;
        // Int types (Int8, Int16, Int32)
        if (datatype === 1 || datatype === 2 || datatype === 3) {
          transformed.intValue = metric.value;
        }
        // Int64, DateTime
        else if (datatype === 4 || datatype === 13) {
          transformed.longValue = convertBigInt(metric.value);
        }
        // UInt8, UInt16, UInt32
        else if (datatype === 5 || datatype === 6 || datatype === 7) {
          transformed.intValue = metric.value;
        }
        // UInt64
        else if (datatype === 8) {
          transformed.longValue = convertBigInt(metric.value);
        }
        // Float
        else if (datatype === 9) {
          transformed.floatValue = metric.value;
        }
        // Double
        else if (datatype === 10) {
          transformed.doubleValue = metric.value;
        }
        // Boolean
        else if (datatype === 11) {
          transformed.booleanValue = metric.value;
        }
        // String, Text
        else if (datatype === 12 || datatype === 14) {
          transformed.stringValue = metric.value;
        }
        // Bytes
        else if (datatype === 17) {
          transformed.bytesValue = metric.value;
        }
        // DataSet
        else if (datatype === 16) {
          transformed.datasetValue = metric.value;
        }
        // Template
        else if (datatype === 19) {
          transformed.templateValue = metric.value;
        }
        // PropertySet
        else if (datatype === 20) {
          transformed.extensionValue = metric.value;
        }
      }

      return transformed;
    }),
  };

  // Create a message instance
  const message = PayloadType.create(transformedPayload);

  // Encode to protobuf binary
  let encoded = PayloadType.encode(message).finish();

  // Apply GZIP compression if requested
  if (options.compress) {
    const level = (options.compressionLevel ?? 6) as any;
    encoded = gzip(encoded, { level });
  }

  return encoded;
}

export function createNBirthPayload(
  timestamp: bigint,
  bdSeq: bigint,
  metrics: Payload['metrics'] = []
): Payload {
  return {
    timestamp,
    seq: 0n,
    metrics: [
      {
        name: 'bdSeq',
        timestamp,
        datatype: 4, // Int64
        value: bdSeq,
      },
      ...metrics,
    ],
  };
}

export function createNDeathPayload(bdSeq: bigint): Payload {
  const timestamp = BigInt(Date.now());
  return {
    timestamp,
    metrics: [
      {
        name: 'bdSeq',
        timestamp,
        datatype: 4, // Int64
        value: bdSeq,
      },
    ],
  };
}

export function createNDataPayload(
  seq: bigint,
  metrics: Payload['metrics'] = []
): Payload {
  return {
    timestamp: BigInt(Date.now()),
    seq,
    metrics,
  };
}

export function createStatePayload(online: boolean): string {
  return JSON.stringify({
    online,
    timestamp: Date.now(),
  });
}
