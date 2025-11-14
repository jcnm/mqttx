import { describe, it, expect } from 'vitest';
import {
  encodePayload,
  createNBirthPayload,
  createNDeathPayload,
  createNDataPayload,
  createStatePayload,
} from '../src/encoder.js';
import { decodePayload } from '../src/decoder.js';
import { DataType, type Payload } from '../src/types.js';

describe('Encoder', () => {
  describe('encodePayload', () => {
    it('should encode a simple payload', () => {
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          {
            name: 'temperature',
            timestamp: BigInt(Date.now()),
            datatype: DataType.Float,
            value: 25.5,
          },
        ],
      };

      const encoded = encodePayload(payload);
      expect(encoded).toBeInstanceOf(Uint8Array);
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('should encode with compression', () => {
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          {
            name: 'temperature',
            timestamp: BigInt(Date.now()),
            datatype: DataType.Float,
            value: 25.5,
          },
        ],
      };

      const uncompressed = encodePayload(payload, { compress: false });
      const compressed = encodePayload(payload, { compress: true });

      expect(compressed).toBeInstanceOf(Uint8Array);
      // GZIP header magic bytes
      expect(compressed[0]).toBe(0x1f);
      expect(compressed[1]).toBe(0x8b);
    });

    it('should encode payload with multiple metrics of different types', () => {
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 1n,
        metrics: [
          { name: 'temp', datatype: DataType.Float, value: 25.5 },
          { name: 'pressure', datatype: DataType.Int32, value: 1013 },
          { name: 'isRunning', datatype: DataType.Boolean, value: true },
          { name: 'status', datatype: DataType.String, value: 'OK' },
          { name: 'count', datatype: DataType.Int64, value: 12345n },
        ],
      };

      const encoded = encodePayload(payload);
      expect(encoded).toBeInstanceOf(Uint8Array);
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('should encode payload with metric alias', () => {
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          {
            name: 'temperature',
            alias: 100n,
            timestamp: BigInt(Date.now()),
            datatype: DataType.Float,
            value: 25.5,
          },
        ],
      };

      const encoded = encodePayload(payload);
      expect(encoded).toBeInstanceOf(Uint8Array);
    });

    it('should encode and decode round-trip successfully', () => {
      const original: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 5n,
        metrics: [
          { name: 'temp', datatype: DataType.Float, value: 25.5 },
          { name: 'humidity', datatype: DataType.Int32, value: 65 },
        ],
      };

      const encoded = encodePayload(original);
      const decoded = decodePayload(encoded);

      expect(decoded.timestamp).toBe(original.timestamp);
      expect(decoded.seq).toBe(original.seq);
      expect(decoded.metrics).toHaveLength(2);
      expect(decoded.metrics?.[0].name).toBe('temp');
      expect(decoded.metrics?.[0].value).toBe(25.5);
      expect(decoded.metrics?.[1].name).toBe('humidity');
      expect(decoded.metrics?.[1].value).toBe(65);
    });

    it('should handle empty metrics array', () => {
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [],
      };

      const encoded = encodePayload(payload);
      expect(encoded).toBeInstanceOf(Uint8Array);
    });

    it('should throw error for invalid payload', () => {
      const invalidPayload = {
        timestamp: 'not a bigint', // Invalid type
        seq: 0n,
      } as any;

      expect(() => encodePayload(invalidPayload)).toThrow();
    });
  });

  describe('createNBirthPayload', () => {
    it('should create NBIRTH payload with bdSeq', () => {
      const timestamp = BigInt(Date.now());
      const bdSeq = 42n;

      const payload = createNBirthPayload(timestamp, bdSeq);

      expect(payload.timestamp).toBe(timestamp);
      expect(payload.seq).toBe(0n);
      expect(payload.metrics).toHaveLength(1);
      expect(payload.metrics?.[0].name).toBe('bdSeq');
      expect(payload.metrics?.[0].value).toBe(bdSeq);
      expect(payload.metrics?.[0].datatype).toBe(DataType.Int64);
    });

    it('should create NBIRTH payload with additional metrics', () => {
      const timestamp = BigInt(Date.now());
      const bdSeq = 42n;
      const additionalMetrics = [
        { name: 'Node Control/Rebirth', datatype: DataType.Boolean, value: false },
        { name: 'temperature', datatype: DataType.Float, value: 25.5 },
      ];

      const payload = createNBirthPayload(timestamp, bdSeq, additionalMetrics);

      expect(payload.metrics).toHaveLength(3);
      expect(payload.metrics?.[0].name).toBe('bdSeq');
      expect(payload.metrics?.[1].name).toBe('Node Control/Rebirth');
      expect(payload.metrics?.[2].name).toBe('temperature');
    });

    it('should encode and decode NBIRTH payload', () => {
      const timestamp = BigInt(Date.now());
      const bdSeq = 100n;
      const payload = createNBirthPayload(timestamp, bdSeq);

      const encoded = encodePayload(payload);
      const decoded = decodePayload(encoded);

      expect(decoded.timestamp).toBe(timestamp);
      expect(decoded.seq).toBe(0n);
      const bdSeqMetric = decoded.metrics?.find((m) => m.name === 'bdSeq');
      expect(bdSeqMetric?.value).toBe(bdSeq);
    });
  });

  describe('createNDeathPayload', () => {
    it('should create NDEATH payload', () => {
      const bdSeq = 42n;
      const payload = createNDeathPayload(bdSeq);

      expect(payload.timestamp).toBeDefined();
      expect(payload.metrics).toHaveLength(1);
      expect(payload.metrics?.[0].name).toBe('bdSeq');
      expect(payload.metrics?.[0].value).toBe(bdSeq);
    });

    it('should encode and decode NDEATH payload', () => {
      const bdSeq = 50n;
      const payload = createNDeathPayload(bdSeq);

      const encoded = encodePayload(payload);
      const decoded = decodePayload(encoded);

      const bdSeqMetric = decoded.metrics?.find((m) => m.name === 'bdSeq');
      expect(bdSeqMetric?.value).toBe(bdSeq);
    });
  });

  describe('createNDataPayload', () => {
    it('should create NDATA payload', () => {
      const seq = 5n;
      const metrics = [
        { name: 'temperature', datatype: DataType.Float, value: 25.5 },
      ];

      const payload = createNDataPayload(seq, metrics);

      expect(payload.timestamp).toBeDefined();
      expect(payload.seq).toBe(seq);
      expect(payload.metrics).toHaveLength(1);
      expect(payload.metrics?.[0].name).toBe('temperature');
    });

    it('should create NDATA with empty metrics', () => {
      const seq = 10n;
      const payload = createNDataPayload(seq);

      expect(payload.seq).toBe(seq);
      expect(payload.metrics).toEqual([]);
    });

    it('should handle seq cycling (0-255)', () => {
      const seq = 255n;
      const payload = createNDataPayload(seq);

      expect(payload.seq).toBe(255n);
    });
  });

  describe('createStatePayload', () => {
    it('should create STATE payload for online', () => {
      const state = createStatePayload(true);
      const parsed = JSON.parse(state);

      expect(parsed.online).toBe(true);
      expect(parsed.timestamp).toBeDefined();
      expect(typeof parsed.timestamp).toBe('number');
    });

    it('should create STATE payload for offline', () => {
      const state = createStatePayload(false);
      const parsed = JSON.parse(state);

      expect(parsed.online).toBe(false);
      expect(parsed.timestamp).toBeDefined();
    });
  });

  describe('Data Type Coverage', () => {
    const testCases: Array<{
      name: string;
      datatype: DataType;
      value: any;
    }> = [
      { name: 'Int8', datatype: DataType.Int8, value: 127 },
      { name: 'Int16', datatype: DataType.Int16, value: 32767 },
      { name: 'Int32', datatype: DataType.Int32, value: 2147483647 },
      { name: 'Int64', datatype: DataType.Int64, value: 9223372036854775807n },
      { name: 'UInt8', datatype: DataType.UInt8, value: 255 },
      { name: 'UInt16', datatype: DataType.UInt16, value: 65535 },
      { name: 'UInt32', datatype: DataType.UInt32, value: 4294967295 },
      { name: 'UInt64', datatype: DataType.UInt64, value: 18446744073709551615n },
      { name: 'Float', datatype: DataType.Float, value: 3.14159 },
      { name: 'Double', datatype: DataType.Double, value: 3.141592653589793 },
      { name: 'Boolean', datatype: DataType.Boolean, value: true },
      { name: 'String', datatype: DataType.String, value: 'Hello, Sparkplug!' },
      { name: 'DateTime', datatype: DataType.DateTime, value: BigInt(Date.now()) },
      { name: 'Text', datatype: DataType.Text, value: 'Long text content' },
    ];

    testCases.forEach(({ name, datatype, value }) => {
      it(`should encode and decode ${name} type`, () => {
        const payload: Payload = {
          timestamp: BigInt(Date.now()),
          seq: 0n,
          metrics: [
            {
              name: `metric_${name}`,
              datatype,
              value,
            },
          ],
        };

        const encoded = encodePayload(payload);
        const decoded = decodePayload(encoded);

        expect(decoded.metrics?.[0].name).toBe(`metric_${name}`);
        expect(decoded.metrics?.[0].datatype).toBe(datatype);
        expect(decoded.metrics?.[0].value).toEqual(value);
      });
    });
  });

  describe('Compression Levels', () => {
    it('should support different compression levels', () => {
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          { name: 'temp', datatype: DataType.Float, value: 25.5 },
        ],
      };

      const level1 = encodePayload(payload, { compress: true, compressionLevel: 1 });
      const level9 = encodePayload(payload, { compress: true, compressionLevel: 9 });

      // Higher compression level should result in smaller size (usually)
      expect(level1).toBeInstanceOf(Uint8Array);
      expect(level9).toBeInstanceOf(Uint8Array);
      // Both should be GZIP
      expect(level1[0]).toBe(0x1f);
      expect(level9[0]).toBe(0x1f);
    });
  });

  describe('Large Payloads', () => {
    it('should handle payload with many metrics', () => {
      const metrics = Array.from({ length: 100 }, (_, i) => ({
        name: `metric_${i}`,
        datatype: DataType.Float,
        value: Math.random() * 100,
      }));

      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics,
      };

      const encoded = encodePayload(payload);
      const decoded = decodePayload(encoded);

      expect(decoded.metrics).toHaveLength(100);
    });

    it('should benefit from compression on large payloads', () => {
      const metrics = Array.from({ length: 100 }, (_, i) => ({
        name: `metric_${i}`,
        datatype: DataType.Float,
        value: Math.random() * 100,
      }));

      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics,
      };

      const uncompressed = encodePayload(payload, { compress: false });
      const compressed = encodePayload(payload, { compress: true });

      // Compression should reduce size significantly
      expect(compressed.length).toBeLessThan(uncompressed.length);
    });
  });
});
