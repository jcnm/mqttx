import { describe, it, expect } from 'vitest';
import {
  parseTopic,
  isNodeMessage,
  isDeviceMessage,
  isBirthMessage,
  isDeathMessage,
  isDataMessage,
  isCommandMessage,
} from '../src/parser.js';
import { MessageType } from '../src/types.js';

describe('Parser', () => {
  describe('parseTopic', () => {
    describe('Node Messages', () => {
      it('should parse NBIRTH topic correctly', () => {
        const result = parseTopic('spBv1.0/Group1/NBIRTH/EdgeNode1');

        expect(result.isValid).toBe(true);
        expect(result.namespace).toBe('spBv1.0');
        expect(result.groupId).toBe('Group1');
        expect(result.messageType).toBe(MessageType.NBIRTH);
        expect(result.edgeNodeId).toBe('EdgeNode1');
        expect(result.deviceId).toBeUndefined();
        expect(result.errors).toBeUndefined();
      });

      it('should parse NDEATH topic correctly', () => {
        const result = parseTopic('spBv1.0/Group1/NDEATH/EdgeNode1');

        expect(result.isValid).toBe(true);
        expect(result.messageType).toBe(MessageType.NDEATH);
      });

      it('should parse NDATA topic correctly', () => {
        const result = parseTopic('spBv1.0/Group1/NDATA/EdgeNode1');

        expect(result.isValid).toBe(true);
        expect(result.messageType).toBe(MessageType.NDATA);
      });

      it('should parse NCMD topic correctly', () => {
        const result = parseTopic('spBv1.0/Group1/NCMD/EdgeNode1');

        expect(result.isValid).toBe(true);
        expect(result.messageType).toBe(MessageType.NCMD);
      });

      it('should handle different namespace versions', () => {
        const result1 = parseTopic('spBv1.0/Group1/NBIRTH/Node1');
        const result2 = parseTopic('spBv2.0/Group1/NBIRTH/Node1');
        const result3 = parseTopic('spv1.0/Group1/NBIRTH/Node1');

        expect(result1.isValid).toBe(true);
        expect(result2.isValid).toBe(true);
        expect(result3.isValid).toBe(true);
      });
    });

    describe('Device Messages', () => {
      it('should parse DBIRTH topic correctly', () => {
        const result = parseTopic('spBv1.0/Group1/DBIRTH/EdgeNode1/Device1');

        expect(result.isValid).toBe(true);
        expect(result.namespace).toBe('spBv1.0');
        expect(result.groupId).toBe('Group1');
        expect(result.messageType).toBe(MessageType.DBIRTH);
        expect(result.edgeNodeId).toBe('EdgeNode1');
        expect(result.deviceId).toBe('Device1');
      });

      it('should parse DDEATH topic correctly', () => {
        const result = parseTopic('spBv1.0/Group1/DDEATH/EdgeNode1/Device1');

        expect(result.isValid).toBe(true);
        expect(result.messageType).toBe(MessageType.DDEATH);
      });

      it('should parse DDATA topic correctly', () => {
        const result = parseTopic('spBv1.0/Group1/DDATA/EdgeNode1/Device1');

        expect(result.isValid).toBe(true);
        expect(result.messageType).toBe(MessageType.DDATA);
      });

      it('should parse DCMD topic correctly', () => {
        const result = parseTopic('spBv1.0/Group1/DCMD/EdgeNode1/Device1');

        expect(result.isValid).toBe(true);
        expect(result.messageType).toBe(MessageType.DCMD);
      });
    });

    describe('STATE Messages', () => {
      it('should parse STATE topic correctly', () => {
        const result = parseTopic('spBv1.0/STATE/SCADA_HOST_01');

        expect(result.isValid).toBe(true);
        expect(result.namespace).toBe('spBv1.0');
        expect(result.messageType).toBe(MessageType.STATE);
        expect(result.edgeNodeId).toBe('SCADA_HOST_01'); // For STATE, this is host_id
        expect(result.groupId).toBeUndefined();
        expect(result.deviceId).toBeUndefined();
      });
    });

    describe('Certificate Topics', () => {
      it('should parse NBIRTH certificate topic', () => {
        const result = parseTopic('$sparkplug/certificates/spBv1.0/Group1/NBIRTH/EdgeNode1');

        expect(result.isValid).toBe(true);
        expect(result.namespace).toBe('spBv1.0');
        expect(result.groupId).toBe('Group1');
        expect(result.messageType).toBe(MessageType.NBIRTH);
        expect(result.edgeNodeId).toBe('EdgeNode1');
      });

      it('should parse DBIRTH certificate topic', () => {
        const result = parseTopic('$sparkplug/certificates/spBv1.0/Group1/DBIRTH/EdgeNode1/Device1');

        expect(result.isValid).toBe(true);
        expect(result.namespace).toBe('spBv1.0');
        expect(result.groupId).toBe('Group1');
        expect(result.messageType).toBe(MessageType.DBIRTH);
        expect(result.edgeNodeId).toBe('EdgeNode1');
        expect(result.deviceId).toBe('Device1');
      });
    });

    describe('Invalid Topics', () => {
      it('should reject topic with too few parts', () => {
        const result = parseTopic('spBv1.0/Group1');

        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors?.[0]).toContain('at least 3 parts');
      });

      it('should reject invalid message type', () => {
        const result = parseTopic('spBv1.0/Group1/INVALID/Node1');

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid message type: INVALID');
      });

      it('should reject invalid namespace format', () => {
        const result = parseTopic('invalid/Group1/NBIRTH/Node1');

        expect(result.isValid).toBe(false);
        expect(result.errors?.some((e) => e.includes('Namespace format'))).toBe(true);
      });

      it('should reject node message with wrong number of parts', () => {
        const result = parseTopic('spBv1.0/Group1/NBIRTH/Node1/Extra');

        expect(result.isValid).toBe(false);
        expect(result.errors?.some((e) => e.includes('exactly 4 parts'))).toBe(true);
      });

      it('should reject device message with wrong number of parts', () => {
        const result = parseTopic('spBv1.0/Group1/DBIRTH/Node1');

        expect(result.isValid).toBe(false);
        expect(result.errors?.some((e) => e.includes('exactly 5 parts'))).toBe(true);
      });

      it('should handle empty topic', () => {
        const result = parseTopic('');

        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
      });
    });

    describe('Edge Cases', () => {
      it('should handle topic with special characters in IDs', () => {
        const result = parseTopic('spBv1.0/Group-1/NBIRTH/Edge_Node_1');

        expect(result.isValid).toBe(true);
        expect(result.groupId).toBe('Group-1');
        expect(result.edgeNodeId).toBe('Edge_Node_1');
      });

      it('should preserve raw topic in result', () => {
        const topic = 'spBv1.0/Group1/NBIRTH/Node1';
        const result = parseTopic(topic);

        expect(result.raw).toBe(topic);
      });
    });
  });

  describe('Message Type Checkers', () => {
    it('should identify node messages', () => {
      expect(isNodeMessage(MessageType.NBIRTH)).toBe(true);
      expect(isNodeMessage(MessageType.NDEATH)).toBe(true);
      expect(isNodeMessage(MessageType.NDATA)).toBe(true);
      expect(isNodeMessage(MessageType.NCMD)).toBe(true);
      expect(isNodeMessage(MessageType.DBIRTH)).toBe(false);
      expect(isNodeMessage(MessageType.STATE)).toBe(false);
    });

    it('should identify device messages', () => {
      expect(isDeviceMessage(MessageType.DBIRTH)).toBe(true);
      expect(isDeviceMessage(MessageType.DDEATH)).toBe(true);
      expect(isDeviceMessage(MessageType.DDATA)).toBe(true);
      expect(isDeviceMessage(MessageType.DCMD)).toBe(true);
      expect(isDeviceMessage(MessageType.NBIRTH)).toBe(false);
      expect(isDeviceMessage(MessageType.STATE)).toBe(false);
    });

    it('should identify birth messages', () => {
      expect(isBirthMessage(MessageType.NBIRTH)).toBe(true);
      expect(isBirthMessage(MessageType.DBIRTH)).toBe(true);
      expect(isBirthMessage(MessageType.NDATA)).toBe(false);
      expect(isBirthMessage(MessageType.DDATA)).toBe(false);
    });

    it('should identify death messages', () => {
      expect(isDeathMessage(MessageType.NDEATH)).toBe(true);
      expect(isDeathMessage(MessageType.DDEATH)).toBe(true);
      expect(isDeathMessage(MessageType.NDATA)).toBe(false);
      expect(isDeathMessage(MessageType.DDATA)).toBe(false);
    });

    it('should identify data messages', () => {
      expect(isDataMessage(MessageType.NDATA)).toBe(true);
      expect(isDataMessage(MessageType.DDATA)).toBe(true);
      expect(isDataMessage(MessageType.NBIRTH)).toBe(false);
      expect(isDataMessage(MessageType.DBIRTH)).toBe(false);
    });

    it('should identify command messages', () => {
      expect(isCommandMessage(MessageType.NCMD)).toBe(true);
      expect(isCommandMessage(MessageType.DCMD)).toBe(true);
      expect(isCommandMessage(MessageType.NDATA)).toBe(false);
      expect(isCommandMessage(MessageType.DDATA)).toBe(false);
    });
  });

  describe('Real-world Examples', () => {
    it('should parse typical factory floor topic', () => {
      const result = parseTopic('spBv1.0/FactoryFloor1/NDATA/PLC_001');

      expect(result.isValid).toBe(true);
      expect(result.groupId).toBe('FactoryFloor1');
      expect(result.edgeNodeId).toBe('PLC_001');
    });

    it('should parse sensor device topic', () => {
      const result = parseTopic('spBv1.0/Building_A/DDATA/Gateway_1/TempSensor_42');

      expect(result.isValid).toBe(true);
      expect(result.groupId).toBe('Building_A');
      expect(result.edgeNodeId).toBe('Gateway_1');
      expect(result.deviceId).toBe('TempSensor_42');
    });

    it('should parse SCADA state topic', () => {
      const result = parseTopic('spBv1.0/STATE/Primary_SCADA_Host');

      expect(result.isValid).toBe(true);
      expect(result.messageType).toBe(MessageType.STATE);
      expect(result.edgeNodeId).toBe('Primary_SCADA_Host');
    });
  });
});
