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

  // Validate the payload
  const errMsg = PayloadType.verify(payload);
  if (errMsg) {
    throw new Error(`Payload validation failed: ${errMsg}`);
  }

  // Create a message instance
  const message = PayloadType.create(payload);

  // Encode to protobuf binary
  let encoded = PayloadType.encode(message).finish();

  // Apply GZIP compression if requested
  if (options.compress) {
    const level = options.compressionLevel ?? 6;
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
