import { describe, it, expect } from 'vitest';
import {
  parseMQTTPacket,
  formatHexDump,
  decodeRemainingLength,
  parseRawMQTTPacket,
  type MQTTPacketDetails,
} from '../../src/mqtt/packet-parser.js';

describe('Packet Parser', () => {
  describe('parseMQTTPacket', () => {
    it('should parse PUBLISH packet', () => {
      const aedesPacket = {
        cmd: 'publish',
        topic: 'spBv1.0/Group1/NDATA/Node1',
        payload: Buffer.from('test'),
        qos: 1,
        dup: false,
        retain: false,
        messageId: 123,
      };

      const result = parseMQTTPacket(aedesPacket);

      expect(result).not.toBeNull();
      expect(result?.fixedHeader.messageTypeName).toBe('PUBLISH');
      expect(result?.fixedHeader.messageType).toBe(3);
      expect(result?.fixedHeader.qos).toBe(1);
      expect(result?.fixedHeader.retain).toBe(false);
      expect(result?.variableHeader.topicName).toBe('spBv1.0/Group1/NDATA/Node1');
      expect(result?.variableHeader.packetIdentifier).toBe(123);
      expect(result?.payloadLength).toBe(4);
    });

    it('should parse PUBLISH packet with QoS 0 (no message ID)', () => {
      const aedesPacket = {
        cmd: 'publish',
        topic: 'test/topic',
        payload: Buffer.from('data'),
        qos: 0,
      };

      const result = parseMQTTPacket(aedesPacket);

      expect(result).not.toBeNull();
      expect(result?.variableHeader.packetIdentifier).toBeUndefined();
    });

    it('should parse PUBLISH packet with MQTT 5.0 properties', () => {
      const aedesPacket = {
        cmd: 'publish',
        topic: 'test/topic',
        payload: Buffer.from('data'),
        qos: 1,
        messageId: 42,
        properties: {
          contentType: 'application/json',
          userProperties: { key: 'value' },
        },
      };

      const result = parseMQTTPacket(aedesPacket);

      expect(result).not.toBeNull();
      expect(result?.variableHeader.properties).toBeDefined();
      expect(result?.variableHeader.properties?.contentType).toBe('application/json');
    });

    it('should parse CONNECT packet', () => {
      const aedesPacket = {
        cmd: 'connect',
        protocolId: 'MQTT',
        protocolVersion: 4,
        clean: true,
        keepalive: 60,
        clientId: 'testClient',
        username: 'user',
        password: Buffer.from('pass'),
        will: {
          topic: 'lwt/topic',
          payload: Buffer.from('offline'),
          qos: 0,
          retain: false,
        },
      };

      const result = parseMQTTPacket(aedesPacket);

      expect(result).not.toBeNull();
      expect(result?.fixedHeader.messageTypeName).toBe('CONNECT');
      expect(result?.variableHeader.protocolName).toBe('MQTT');
      expect(result?.variableHeader.protocolLevel).toBe(4);
      expect(result?.variableHeader.keepAlive).toBe(60);
      expect(result?.variableHeader.connectFlags?.cleanSession).toBe(true);
      expect(result?.variableHeader.connectFlags?.willFlag).toBe(true);
      expect(result?.variableHeader.connectFlags?.usernameFlag).toBe(true);
      expect(result?.variableHeader.connectFlags?.passwordFlag).toBe(true);
    });

    it('should parse CONNECT packet with clean session = false', () => {
      const aedesPacket = {
        cmd: 'connect',
        clean: false,
      };

      const result = parseMQTTPacket(aedesPacket);

      expect(result?.variableHeader.connectFlags?.cleanSession).toBe(false);
    });

    it('should handle packet with no payload', () => {
      const aedesPacket = {
        cmd: 'pingreq',
      };

      const result = parseMQTTPacket(aedesPacket);

      expect(result).not.toBeNull();
      expect(result?.payloadLength).toBe(0);
    });

    it('should handle packet parsing error gracefully', () => {
      const aedesPacket = null;

      const result = parseMQTTPacket(aedesPacket);

      expect(result).toBeNull();
    });

    it('should parse retained PUBLISH message', () => {
      const aedesPacket = {
        cmd: 'publish',
        topic: 'spBv1.0/STATE/SCADA1',
        payload: Buffer.from('ONLINE'),
        qos: 0,
        retain: true,
      };

      const result = parseMQTTPacket(aedesPacket);

      expect(result).not.toBeNull();
      expect(result?.fixedHeader.retain).toBe(true);
    });

    it('should parse duplicate PUBLISH message', () => {
      const aedesPacket = {
        cmd: 'publish',
        topic: 'test/topic',
        payload: Buffer.from('data'),
        qos: 1,
        dup: true,
        messageId: 999,
      };

      const result = parseMQTTPacket(aedesPacket);

      expect(result).not.toBeNull();
      expect(result?.fixedHeader.dup).toBe(true);
    });

    it('should parse SUBSCRIBE packet', () => {
      const aedesPacket = {
        cmd: 'subscribe',
        subscriptions: [
          { topic: 'spBv1.0/+/NBIRTH/+', qos: 0 },
        ],
      };

      const result = parseMQTTPacket(aedesPacket);

      expect(result).not.toBeNull();
      expect(result?.fixedHeader.messageTypeName).toBe('SUBSCRIBE');
    });

    it('should parse DISCONNECT packet', () => {
      const aedesPacket = {
        cmd: 'disconnect',
      };

      const result = parseMQTTPacket(aedesPacket);

      expect(result).not.toBeNull();
      expect(result?.fixedHeader.messageTypeName).toBe('DISCONNECT');
    });
  });

  describe('formatHexDump', () => {
    it('should format empty buffer', () => {
      const bytes = new Uint8Array([]);
      const result = formatHexDump(bytes);
      expect(result).toBe('');
    });

    it('should format single byte', () => {
      const bytes = new Uint8Array([0x41]);
      const result = formatHexDump(bytes);
      expect(result).toContain('41');
      expect(result).toContain('|A|');
    });

    it('should format multiple bytes with ASCII', () => {
      const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
      const result = formatHexDump(bytes);
      expect(result).toContain('48 65 6c 6c 6f');
      expect(result).toContain('|Hello|');
    });

    it('should format non-printable characters as dots', () => {
      const bytes = new Uint8Array([0x00, 0x01, 0x1f, 0x7f]);
      const result = formatHexDump(bytes);
      expect(result).toContain('|....|');
    });

    it('should split long data into multiple lines', () => {
      const bytes = new Uint8Array(32).fill(0x41);
      const result = formatHexDump(bytes);
      const lines = result.split('\n');
      expect(lines.length).toBe(2);
    });

    it('should use custom bytes per line', () => {
      const bytes = new Uint8Array(16).fill(0x42);
      const result = formatHexDump(bytes, 8);
      const lines = result.split('\n');
      expect(lines.length).toBe(2);
    });

    it('should format hex offset correctly', () => {
      const bytes = new Uint8Array([0xff]);
      const result = formatHexDump(bytes);
      expect(result).toMatch(/^00000000/);
    });
  });

  describe('decodeRemainingLength', () => {
    it('should decode single byte length (< 128)', () => {
      const buffer = new Uint8Array([0x00, 0x7f]); // Length: 127
      const result = decodeRemainingLength(buffer, 1);
      expect(result.value).toBe(127);
      expect(result.bytes).toBe(1);
    });

    it('should decode two byte length', () => {
      const buffer = new Uint8Array([0x00, 0x80, 0x01]); // Length: 128
      const result = decodeRemainingLength(buffer, 1);
      expect(result.value).toBe(128);
      expect(result.bytes).toBe(2);
    });

    it('should decode three byte length', () => {
      const buffer = new Uint8Array([0x00, 0x80, 0x80, 0x01]); // Length: 16384
      const result = decodeRemainingLength(buffer, 1);
      expect(result.value).toBe(16384);
      expect(result.bytes).toBe(3);
    });

    it('should decode four byte length', () => {
      const buffer = new Uint8Array([0x00, 0xff, 0xff, 0xff, 0x7f]); // Max length
      const result = decodeRemainingLength(buffer, 1);
      expect(result.value).toBe(268435455); // Maximum MQTT remaining length
      expect(result.bytes).toBe(4);
    });

    it('should throw on malformed remaining length (buffer too short)', () => {
      const buffer = new Uint8Array([0x00, 0x80]); // Incomplete
      expect(() => decodeRemainingLength(buffer, 1)).toThrow('Malformed remaining length');
    });

    it('should throw on remaining length exceeding 4 bytes', () => {
      const buffer = new Uint8Array([0x00, 0xff, 0xff, 0xff, 0xff, 0x7f]);
      expect(() => decodeRemainingLength(buffer, 1)).toThrow('Remaining length exceeds 4 bytes');
    });
  });

  describe('parseRawMQTTPacket', () => {
    it('should parse raw PUBLISH packet', () => {
      // PUBLISH packet: topic="test", QoS 0, no retain, payload="hi"
      const buffer = new Uint8Array([
        0x30, // Fixed header: PUBLISH, QoS 0
        0x08, // Remaining length: 8 bytes
        0x00, 0x04, // Topic length: 4
        0x74, 0x65, 0x73, 0x74, // Topic: "test"
        0x68, 0x69, // Payload: "hi"
      ]);

      const result = parseRawMQTTPacket(buffer);

      expect(result).not.toBeNull();
      expect(result?.fixedHeader.messageTypeName).toBe('PUBLISH');
      expect(result?.fixedHeader.qos).toBe(0);
      expect(result?.fixedHeader.retain).toBe(false);
      expect(result?.variableHeader.topicName).toBe('test');
      expect(result?.payloadLength).toBe(2);
    });

    it('should parse PUBLISH with QoS 1 (includes packet ID)', () => {
      // PUBLISH packet: topic="t", QoS 1, packet ID=42
      const buffer = new Uint8Array([
        0x32, // Fixed header: PUBLISH, QoS 1
        0x06, // Remaining length: 6 bytes
        0x00, 0x01, // Topic length: 1
        0x74, // Topic: "t"
        0x00, 0x2a, // Packet ID: 42
        0x78, // Payload: "x"
      ]);

      const result = parseRawMQTTPacket(buffer);

      expect(result).not.toBeNull();
      expect(result?.fixedHeader.qos).toBe(1);
      expect(result?.variableHeader.packetIdentifier).toBe(42);
    });

    it('should parse retained message', () => {
      const buffer = new Uint8Array([
        0x31, // Fixed header: PUBLISH, QoS 0, retain=true
        0x06,
        0x00, 0x01,
        0x74,
        0x68, 0x69,
      ]);

      const result = parseRawMQTTPacket(buffer);

      expect(result).not.toBeNull();
      expect(result?.fixedHeader.retain).toBe(true);
    });

    it('should parse duplicate message', () => {
      const buffer = new Uint8Array([
        0x3a, // Fixed header: PUBLISH, QoS 1, dup=true
        0x06,
        0x00, 0x01,
        0x74,
        0x00, 0x01,
        0x78,
      ]);

      const result = parseRawMQTTPacket(buffer);

      expect(result).not.toBeNull();
      expect(result?.fixedHeader.dup).toBe(true);
    });

    it('should return null for buffer too small', () => {
      const buffer = new Uint8Array([0x30]);
      const result = parseRawMQTTPacket(buffer);
      expect(result).toBeNull();
    });

    it('should handle parse errors gracefully', () => {
      const buffer = new Uint8Array([0xff, 0xff]);
      const result = parseRawMQTTPacket(buffer);
      // Should not throw, may return null or partial data
      expect(result).toBeDefined();
    });

    it('should parse long topic name', () => {
      const topic = 'spBv1.0/Group1/NDATA/EdgeNode1';
      const topicBytes = new TextEncoder().encode(topic);
      const buffer = new Uint8Array([
        0x30,
        topicBytes.length + 2,
        (topicBytes.length >> 8) & 0xff,
        topicBytes.length & 0xff,
        ...topicBytes,
      ]);

      const result = parseRawMQTTPacket(buffer);

      expect(result).not.toBeNull();
      expect(result?.variableHeader.topicName).toBe(topic);
    });
  });

  describe('Message Type Parsing', () => {
    it('should recognize all MQTT message types', () => {
      const types = [
        { cmd: 'connect', expected: 'CONNECT' },
        { cmd: 'connack', expected: 'CONNACK' },
        { cmd: 'publish', expected: 'PUBLISH' },
        { cmd: 'puback', expected: 'PUBACK' },
        { cmd: 'pubrec', expected: 'PUBREC' },
        { cmd: 'pubrel', expected: 'PUBREL' },
        { cmd: 'pubcomp', expected: 'PUBCOMP' },
        { cmd: 'subscribe', expected: 'SUBSCRIBE' },
        { cmd: 'suback', expected: 'SUBACK' },
        { cmd: 'unsubscribe', expected: 'UNSUBSCRIBE' },
        { cmd: 'unsuback', expected: 'UNSUBACK' },
        { cmd: 'pingreq', expected: 'PINGREQ' },
        { cmd: 'pingresp', expected: 'PINGRESP' },
        { cmd: 'disconnect', expected: 'DISCONNECT' },
        { cmd: 'auth', expected: 'AUTH' },
      ];

      types.forEach(({ cmd, expected }) => {
        const result = parseMQTTPacket({ cmd });
        expect(result?.fixedHeader.messageTypeName).toBe(expected);
      });
    });
  });

  describe('Sparkplug Specific Tests', () => {
    it('should parse NBIRTH message', () => {
      const aedesPacket = {
        cmd: 'publish',
        topic: 'spBv1.0/Group1/NBIRTH/Node1',
        payload: Buffer.from([0x08, 0x00]), // Minimal protobuf
        qos: 0,
        retain: false,
      };

      const result = parseMQTTPacket(aedesPacket);

      expect(result).not.toBeNull();
      expect(result?.variableHeader.topicName).toContain('NBIRTH');
    });

    it('should parse STATE message (retained)', () => {
      const aedesPacket = {
        cmd: 'publish',
        topic: 'spBv1.0/STATE/SCADA_HOST_01',
        payload: Buffer.from('ONLINE'),
        qos: 1,
        retain: true,
      };

      const result = parseMQTTPacket(aedesPacket);

      expect(result).not.toBeNull();
      expect(result?.fixedHeader.retain).toBe(true);
      expect(result?.variableHeader.topicName).toContain('STATE');
    });

    it('should parse NDEATH Last Will', () => {
      const aedesPacket = {
        cmd: 'connect',
        will: {
          topic: 'spBv1.0/Group1/NDEATH/Node1',
          payload: Buffer.from([0x08, 0x2a]), // bdSeq = 42
          qos: 0,
          retain: false,
        },
      };

      const result = parseMQTTPacket(aedesPacket);

      expect(result).not.toBeNull();
      expect(result?.variableHeader.connectFlags?.willFlag).toBe(true);
      expect(result?.variableHeader.connectFlags?.willQoS).toBe(0);
    });
  });
});
