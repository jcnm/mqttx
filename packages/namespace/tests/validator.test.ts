import { describe, it, expect } from 'vitest';
import {
  validateTopic,
  validateNamespace,
  validateGroupId,
  validateEdgeNodeId,
  validateDeviceId,
  validateMessageType,
  validateQoS,
  validateRetain,
} from '../src/validator.js';
import { MessageType } from '../src/types.js';

describe('Validator', () => {
  describe('validateTopic', () => {
    it('should validate valid topic', () => {
      const result = validateTopic('spBv1.0/Group1/NBIRTH/Node1');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty topic', () => {
      const result = validateTopic('');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('cannot be empty');
    });

    it('should reject topic with too few parts', () => {
      const result = validateTopic('spBv1.0/Group1');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('at least 3 parts'))).toBe(true);
    });

    it('should reject topic exceeding maximum length', () => {
      const longTopic = 'spBv1.0/Group1/NBIRTH/' + 'A'.repeat(65536);
      const result = validateTopic(longTopic);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('maximum length'))).toBe(true);
    });

    it('should accept topic with wildcards', () => {
      const result = validateTopic('spBv1.0/+/NBIRTH/#');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateNamespace', () => {
    it('should validate valid namespaces', () => {
      expect(validateNamespace('spBv1.0').valid).toBe(true);
      expect(validateNamespace('spBv2.0').valid).toBe(true);
      expect(validateNamespace('spBv1.1').valid).toBe(true);
      expect(validateNamespace('spv1.0').valid).toBe(true);
      expect(validateNamespace('spv2.0').valid).toBe(true);
    });

    it('should reject empty namespace', () => {
      const result = validateNamespace('');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('cannot be empty');
    });

    it('should reject invalid namespace format', () => {
      const result = validateNamespace('invalid');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid namespace format');
    });

    it('should reject namespace without version', () => {
      const result = validateNamespace('spB');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid namespace format');
    });

    it('should reject namespace with wrong separator', () => {
      const result = validateNamespace('spBv1-0');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateGroupId', () => {
    it('should validate valid group IDs', () => {
      expect(validateGroupId('Group1').valid).toBe(true);
      expect(validateGroupId('Group_1').valid).toBe(true);
      expect(validateGroupId('Group-1').valid).toBe(true);
      expect(validateGroupId('FactoryFloor123').valid).toBe(true);
    });

    it('should reject empty group ID', () => {
      const result = validateGroupId('');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('cannot be empty');
    });

    it('should reject group ID with forward slash', () => {
      const result = validateGroupId('Group/1');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('cannot contain forward slashes');
    });

    it('should reject group ID with wildcard', () => {
      expect(validateGroupId('Group+').valid).toBe(false);
      expect(validateGroupId('Group#').valid).toBe(false);
    });
  });

  describe('validateEdgeNodeId', () => {
    it('should validate valid edge node IDs', () => {
      expect(validateEdgeNodeId('Node1').valid).toBe(true);
      expect(validateEdgeNodeId('Edge_Node_1').valid).toBe(true);
      expect(validateEdgeNodeId('PLC-001').valid).toBe(true);
      expect(validateEdgeNodeId('Gateway123').valid).toBe(true);
    });

    it('should reject empty edge node ID', () => {
      const result = validateEdgeNodeId('');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('cannot be empty');
    });

    it('should reject edge node ID with forward slash', () => {
      const result = validateEdgeNodeId('Node/1');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('cannot contain forward slashes');
    });

    it('should reject edge node ID with wildcard', () => {
      expect(validateEdgeNodeId('Node+').valid).toBe(false);
      expect(validateEdgeNodeId('Node#').valid).toBe(false);
    });
  });

  describe('validateDeviceId', () => {
    it('should validate valid device IDs', () => {
      expect(validateDeviceId('Device1').valid).toBe(true);
      expect(validateDeviceId('Sensor_42').valid).toBe(true);
      expect(validateDeviceId('Temp-Sensor').valid).toBe(true);
      expect(validateDeviceId('Device123').valid).toBe(true);
    });

    it('should reject empty device ID', () => {
      const result = validateDeviceId('');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('cannot be empty');
    });

    it('should reject device ID with forward slash', () => {
      const result = validateDeviceId('Device/1');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('cannot contain forward slashes');
    });

    it('should reject device ID with wildcard', () => {
      expect(validateDeviceId('Device+').valid).toBe(false);
      expect(validateDeviceId('Device#').valid).toBe(false);
    });
  });

  describe('validateMessageType', () => {
    it('should validate all valid message types', () => {
      const validTypes = [
        'NBIRTH',
        'NDEATH',
        'NDATA',
        'NCMD',
        'DBIRTH',
        'DDEATH',
        'DDATA',
        'DCMD',
        'STATE',
      ];

      validTypes.forEach((type) => {
        const result = validateMessageType(type);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid message type', () => {
      const result = validateMessageType('INVALID');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid message type');
    });

    it('should reject lowercase message type', () => {
      const result = validateMessageType('nbirth');
      expect(result.valid).toBe(false);
    });

    it('should reject message type with typo', () => {
      expect(validateMessageType('NBITH').valid).toBe(false);
      expect(validateMessageType('NBRITH').valid).toBe(false);
      expect(validateMessageType('NDTA').valid).toBe(false);
    });
  });

  describe('validateQoS', () => {
    it('should validate QoS 0, 1, 2', () => {
      expect(validateQoS(0, MessageType.NDATA).valid).toBe(true);
      expect(validateQoS(1, MessageType.NDATA).valid).toBe(true);
      expect(validateQoS(2, MessageType.NDATA).valid).toBe(true);
    });

    it('should reject QoS outside 0-2 range', () => {
      expect(validateQoS(-1, MessageType.NDATA).valid).toBe(false);
      expect(validateQoS(3, MessageType.NDATA).valid).toBe(false);
      expect(validateQoS(10, MessageType.NDATA).valid).toBe(false);
    });

    it('should enforce QoS 0 for NDEATH', () => {
      const result = validateQoS(1, MessageType.NDEATH);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('must use QoS 0');
    });

    it('should enforce QoS 0 for DDEATH', () => {
      const result = validateQoS(1, MessageType.DDEATH);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('must use QoS 0');
    });

    it('should allow QoS 0 for NDEATH', () => {
      const result = validateQoS(0, MessageType.NDEATH);
      expect(result.valid).toBe(true);
    });

    it('should allow QoS 0 for DDEATH', () => {
      const result = validateQoS(0, MessageType.DDEATH);
      expect(result.valid).toBe(true);
    });

    it('should allow any QoS for data messages', () => {
      expect(validateQoS(0, MessageType.NDATA).valid).toBe(true);
      expect(validateQoS(1, MessageType.NDATA).valid).toBe(true);
      expect(validateQoS(2, MessageType.NDATA).valid).toBe(true);
    });
  });

  describe('validateRetain', () => {
    it('should allow retain for STATE messages', () => {
      const result = validateRetain(true, MessageType.STATE);
      expect(result.valid).toBe(true);
    });

    it('should reject retain for non-STATE messages', () => {
      const result = validateRetain(true, MessageType.NDATA);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Only STATE messages should be retained');
    });

    it('should reject retain for DEATH messages', () => {
      expect(validateRetain(true, MessageType.NDEATH).valid).toBe(false);
      expect(validateRetain(true, MessageType.DDEATH).valid).toBe(false);
    });

    it('should allow no retain for any message', () => {
      expect(validateRetain(false, MessageType.NDATA).valid).toBe(true);
      expect(validateRetain(false, MessageType.DDATA).valid).toBe(true);
      expect(validateRetain(false, MessageType.NBIRTH).valid).toBe(true);
      expect(validateRetain(false, MessageType.STATE).valid).toBe(true);
    });
  });

  describe('Sparkplug B Compliance', () => {
    it('should validate compliant BIRTH message configuration', () => {
      expect(validateQoS(0, MessageType.NBIRTH).valid).toBe(true);
      expect(validateRetain(false, MessageType.NBIRTH).valid).toBe(true);
    });

    it('should validate compliant DEATH message configuration', () => {
      expect(validateQoS(0, MessageType.NDEATH).valid).toBe(true);
      expect(validateRetain(false, MessageType.NDEATH).valid).toBe(true);
    });

    it('should validate compliant DATA message configuration', () => {
      expect(validateQoS(0, MessageType.NDATA).valid).toBe(true);
      expect(validateQoS(1, MessageType.NDATA).valid).toBe(true);
      expect(validateRetain(false, MessageType.NDATA).valid).toBe(true);
    });

    it('should validate compliant STATE message configuration', () => {
      expect(validateQoS(0, MessageType.STATE).valid).toBe(true);
      expect(validateQoS(1, MessageType.STATE).valid).toBe(true);
      expect(validateRetain(true, MessageType.STATE).valid).toBe(true);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should validate typical factory node ID', () => {
      expect(validateEdgeNodeId('PLC_Assembly_Line_1').valid).toBe(true);
    });

    it('should validate typical sensor device ID', () => {
      expect(validateDeviceId('TempSensor_Room_42').valid).toBe(true);
    });

    it('should validate typical group ID for production floor', () => {
      expect(validateGroupId('ProductionFloor_Building_A').valid).toBe(true);
    });

    it('should reject group ID with path separator (security)', () => {
      expect(validateGroupId('../etc/passwd').valid).toBe(false);
      // Note: backslashes are allowed in MQTT topics (not path separators in MQTT context)
      // Only forward slashes are forbidden as they are MQTT topic level separators
    });
  });
});
