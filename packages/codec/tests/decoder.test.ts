import { describe, it, expect } from 'vitest';
import {
  decodePayload,
  decodeStatePayload,
  getBdSeq,
  getMetricByName,
  getMetricByAlias,
} from '../src/decoder.js';
import { encodePayload, createNBirthPayload } from '../src/encoder.js';
import { DataType, type Payload } from '../src/types.js';

describe('Decoder', () => {
  describe('decodePayload', () => {
    it('should decode a simple payload', () => {
      const original: Payload = {
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

      const encoded = encodePayload(original);
      const decoded = decodePayload(encoded);

      expect(decoded.timestamp).toBe(original.timestamp);
      expect(decoded.seq).toBe(original.seq);
      expect(decoded.metrics).toHaveLength(1);
      expect(decoded.metrics?.[0].name).toBe('temperature');
      expect(decoded.metrics?.[0].value).toBe(25.5);
    });

    it('should auto-detect and decompress GZIP payloads', () => {
      const original: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          {
            name: 'temperature',
            datatype: DataType.Float,
            value: 25.5,
          },
        ],
      };

      const compressed = encodePayload(original, { compress: true });
      const decoded = decodePayload(compressed); // No decompress option needed

      expect(decoded.metrics?.[0].value).toBe(25.5);
    });

    it('should manually decompress with decompress option', () => {
      const original: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          {
            name: 'temperature',
            datatype: DataType.Float,
            value: 25.5,
          },
        ],
      };

      const compressed = encodePayload(original, { compress: true });
      const decoded = decodePayload(compressed, { decompress: true });

      expect(decoded.metrics?.[0].value).toBe(25.5);
    });

    it('should store raw buffer in _raw field', () => {
      const original: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [],
      };

      const encoded = encodePayload(original);
      const decoded = decodePayload(encoded);

      expect(decoded._raw).toBeDefined();
      expect(decoded._raw).toBeInstanceOf(Uint8Array);
      expect(decoded._raw).toEqual(encoded);
    });

    it('should convert string longs to BigInt', () => {
      const original: Payload = {
        timestamp: 1234567890123n,
        seq: 42n,
        metrics: [
          {
            name: 'bigValue',
            timestamp: 9876543210987n,
            alias: 100n,
            datatype: DataType.Int64,
            value: 123456789012345n,
          },
        ],
      };

      const encoded = encodePayload(original);
      const decoded = decodePayload(encoded);

      expect(typeof decoded.timestamp).toBe('bigint');
      expect(typeof decoded.seq).toBe('bigint');
      expect(typeof decoded.metrics?.[0].timestamp).toBe('bigint');
      expect(typeof decoded.metrics?.[0].alias).toBe('bigint');
      expect(typeof decoded.metrics?.[0].value).toBe('bigint');
    });

    it('should decode payload with multiple metrics', () => {
      const original: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 1n,
        metrics: [
          { name: 'temp', datatype: DataType.Float, value: 25.5 },
          { name: 'pressure', datatype: DataType.Int32, value: 1013 },
          { name: 'isRunning', datatype: DataType.Boolean, value: true },
          { name: 'status', datatype: DataType.String, value: 'OK' },
        ],
      };

      const encoded = encodePayload(original);
      const decoded = decodePayload(encoded);

      expect(decoded.metrics).toHaveLength(4);
      expect(decoded.metrics?.[0].value).toBe(25.5);
      expect(decoded.metrics?.[1].value).toBe(1013);
      expect(decoded.metrics?.[2].value).toBe(true);
      expect(decoded.metrics?.[3].value).toBe('OK');
    });

    it('should handle payload with aliases', () => {
      const original: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          {
            name: 'temperature',
            alias: 100n,
            datatype: DataType.Float,
            value: 25.5,
          },
          {
            alias: 101n,
            datatype: DataType.Int32,
            value: 42,
          },
        ],
      };

      const encoded = encodePayload(original);
      const decoded = decodePayload(encoded);

      expect(decoded.metrics?.[0].alias).toBe(100n);
      expect(decoded.metrics?.[1].alias).toBe(101n);
    });

    it('should handle empty metrics array', () => {
      const original: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [],
      };

      const encoded = encodePayload(original);
      const decoded = decodePayload(encoded);

      expect(decoded.metrics).toEqual([]);
    });
  });

  describe('decodeStatePayload', () => {
    it('should decode STATE payload from string', () => {
      const stateJson = JSON.stringify({ online: true, timestamp: Date.now() });
      const decoded = decodeStatePayload(stateJson);

      expect(decoded.online).toBe(true);
      expect(typeof decoded.timestamp).toBe('number');
    });

    it('should decode STATE payload from Buffer', () => {
      const stateJson = JSON.stringify({ online: false, timestamp: Date.now() });
      const buffer = Buffer.from(stateJson, 'utf8');
      const decoded = decodeStatePayload(buffer);

      expect(decoded.online).toBe(false);
      expect(typeof decoded.timestamp).toBe('number');
    });

    it('should handle online state', () => {
      const stateJson = JSON.stringify({ online: true, timestamp: 1234567890 });
      const decoded = decodeStatePayload(stateJson);

      expect(decoded.online).toBe(true);
      expect(decoded.timestamp).toBe(1234567890);
    });

    it('should handle offline state', () => {
      const stateJson = JSON.stringify({ online: false, timestamp: 9876543210 });
      const decoded = decodeStatePayload(stateJson);

      expect(decoded.online).toBe(false);
      expect(decoded.timestamp).toBe(9876543210);
    });
  });

  describe('getBdSeq', () => {
    it('should extract bdSeq from NBIRTH payload', () => {
      const nbirth = createNBirthPayload(BigInt(Date.now()), 42n);
      const encoded = encodePayload(nbirth);
      const decoded = decodePayload(encoded);

      const bdSeq = getBdSeq(decoded);
      expect(bdSeq).toBe(42n);
    });

    it('should return null if bdSeq not found', () => {
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          { name: 'temperature', datatype: DataType.Float, value: 25.5 },
        ],
      };

      const encoded = encodePayload(payload);
      const decoded = decodePayload(encoded);

      const bdSeq = getBdSeq(decoded);
      expect(bdSeq).toBeNull();
    });

    it('should return null if bdSeq value is not bigint', () => {
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          { name: 'bdSeq', datatype: DataType.String, value: 'not a bigint' },
        ],
      };

      const encoded = encodePayload(payload);
      const decoded = decodePayload(encoded);

      const bdSeq = getBdSeq(decoded);
      expect(bdSeq).toBeNull();
    });

    it('should extract bdSeq from different positions', () => {
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          { name: 'temperature', datatype: DataType.Float, value: 25.5 },
          { name: 'bdSeq', datatype: DataType.Int64, value: 99n },
          { name: 'pressure', datatype: DataType.Int32, value: 1013 },
        ],
      };

      const encoded = encodePayload(payload);
      const decoded = decodePayload(encoded);

      const bdSeq = getBdSeq(decoded);
      expect(bdSeq).toBe(99n);
    });
  });

  describe('getMetricByName', () => {
    it('should find metric by name', () => {
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          { name: 'temperature', datatype: DataType.Float, value: 25.5 },
          { name: 'pressure', datatype: DataType.Int32, value: 1013 },
        ],
      };

      const encoded = encodePayload(payload);
      const decoded = decodePayload(encoded);

      const metric = getMetricByName(decoded, 'temperature');
      expect(metric).toBeDefined();
      expect(metric?.name).toBe('temperature');
      expect(metric?.value).toBe(25.5);
    });

    it('should return undefined if metric not found', () => {
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          { name: 'temperature', datatype: DataType.Float, value: 25.5 },
        ],
      };

      const encoded = encodePayload(payload);
      const decoded = decodePayload(encoded);

      const metric = getMetricByName(decoded, 'nonexistent');
      expect(metric).toBeUndefined();
    });

    it('should find first metric if multiple with same name', () => {
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          { name: 'temperature', datatype: DataType.Float, value: 25.5 },
          { name: 'temperature', datatype: DataType.Float, value: 30.0 },
        ],
      };

      const encoded = encodePayload(payload);
      const decoded = decodePayload(encoded);

      const metric = getMetricByName(decoded, 'temperature');
      expect(metric?.value).toBe(25.5);
    });

    it('should handle case-sensitive names', () => {
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          { name: 'Temperature', datatype: DataType.Float, value: 25.5 },
        ],
      };

      const encoded = encodePayload(payload);
      const decoded = decodePayload(encoded);

      const upperCase = getMetricByName(decoded, 'Temperature');
      const lowerCase = getMetricByName(decoded, 'temperature');

      expect(upperCase).toBeDefined();
      expect(lowerCase).toBeUndefined();
    });
  });

  describe('getMetricByAlias', () => {
    it('should find metric by alias', () => {
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          { name: 'temperature', alias: 100n, datatype: DataType.Float, value: 25.5 },
          { name: 'pressure', alias: 101n, datatype: DataType.Int32, value: 1013 },
        ],
      };

      const encoded = encodePayload(payload);
      const decoded = decodePayload(encoded);

      const metric = getMetricByAlias(decoded, 100n);
      expect(metric).toBeDefined();
      expect(metric?.name).toBe('temperature');
      expect(metric?.alias).toBe(100n);
      expect(metric?.value).toBe(25.5);
    });

    it('should return undefined if alias not found', () => {
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          { name: 'temperature', alias: 100n, datatype: DataType.Float, value: 25.5 },
        ],
      };

      const encoded = encodePayload(payload);
      const decoded = decodePayload(encoded);

      const metric = getMetricByAlias(decoded, 999n);
      expect(metric).toBeUndefined();
    });

    it('should find metric with only alias (no name)', () => {
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          { alias: 100n, datatype: DataType.Float, value: 25.5 },
        ],
      };

      const encoded = encodePayload(payload);
      const decoded = decodePayload(encoded);

      const metric = getMetricByAlias(decoded, 100n);
      expect(metric).toBeDefined();
      expect(metric?.alias).toBe(100n);
      expect(metric?.value).toBe(25.5);
    });

    it('should handle multiple metrics with different aliases', () => {
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          { alias: 100n, datatype: DataType.Float, value: 25.5 },
          { alias: 101n, datatype: DataType.Int32, value: 1013 },
          { alias: 102n, datatype: DataType.Boolean, value: true },
        ],
      };

      const encoded = encodePayload(payload);
      const decoded = decodePayload(encoded);

      expect(getMetricByAlias(decoded, 100n)?.value).toBe(25.5);
      expect(getMetricByAlias(decoded, 101n)?.value).toBe(1013);
      expect(getMetricByAlias(decoded, 102n)?.value).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle payload with no timestamp', () => {
      const payload: Payload = {
        seq: 0n,
        metrics: [
          { name: 'temp', datatype: DataType.Float, value: 25.5 },
        ],
      };

      const encoded = encodePayload(payload);
      const decoded = decodePayload(encoded);

      expect(decoded.timestamp).toBeUndefined();
      expect(decoded.metrics?.[0].value).toBe(25.5);
    });

    it('should handle payload with no seq', () => {
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        metrics: [
          { name: 'temp', datatype: DataType.Float, value: 25.5 },
        ],
      };

      const encoded = encodePayload(payload);
      const decoded = decodePayload(encoded);

      expect(decoded.seq).toBeUndefined();
    });

    it('should handle metric with null value', () => {
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          { name: 'nullMetric', datatype: DataType.String, isNull: true },
        ],
      };

      const encoded = encodePayload(payload);
      const decoded = decodePayload(encoded);

      expect(decoded.metrics?.[0].isNull).toBe(true);
    });

    it('should handle very large Int64 values', () => {
      const largeValue = 9223372036854775807n; // Max Int64
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          { name: 'bigValue', datatype: DataType.Int64, value: largeValue },
        ],
      };

      const encoded = encodePayload(payload);
      const decoded = decodePayload(encoded);

      expect(decoded.metrics?.[0].value).toBe(largeValue);
    });

    it('should handle metric with properties', () => {
      const payload: Payload = {
        timestamp: BigInt(Date.now()),
        seq: 0n,
        metrics: [
          {
            name: 'temperature',
            datatype: DataType.Float,
            value: 25.5,
            properties: {
              keys: ['unit', 'min', 'max'],
              values: [
                { type: DataType.String, value: '°C' },
                { type: DataType.Float, value: -40 },
                { type: DataType.Float, value: 125 },
              ],
            },
          },
        ],
      };

      const encoded = encodePayload(payload);
      const decoded = decodePayload(encoded);

      expect(decoded.metrics?.[0].properties).toBeDefined();
      expect(decoded.metrics?.[0].properties?.keys).toContain('unit');
    });
  });
});
