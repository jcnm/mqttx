import { describe, it, expect } from 'vitest';
import {
  buildNodeBirthTopic,
  buildNodeDeathTopic,
  buildNodeDataTopic,
  buildNodeCommandTopic,
  buildDeviceBirthTopic,
  buildDeviceDeathTopic,
  buildDeviceDataTopic,
  buildDeviceCommandTopic,
  buildStateTopic,
  buildCertificateTopicNBirth,
  buildCertificateTopicDBirth,
  buildTopic,
  buildWildcardSubscription,
  buildAllNodeBirthsSubscription,
  buildAllDeviceBirthsSubscription,
  buildAllDataSubscription,
  buildGroupSubscription,
} from '../src/builder.js';
import { MessageType } from '../src/types.js';

describe('Builder', () => {
  const baseOptions = {
    groupId: 'Group1',
    edgeNodeId: 'EdgeNode1',
  };

  const deviceOptions = {
    ...baseOptions,
    deviceId: 'Device1',
  };

  describe('Node Topic Builders', () => {
    it('should build NBIRTH topic with default namespace', () => {
      const topic = buildNodeBirthTopic(baseOptions);
      expect(topic).toBe('spBv1.0/Group1/NBIRTH/EdgeNode1');
    });

    it('should build NBIRTH topic with custom namespace', () => {
      const topic = buildNodeBirthTopic({ ...baseOptions, namespace: 'spBv2.0' });
      expect(topic).toBe('spBv2.0/Group1/NBIRTH/EdgeNode1');
    });

    it('should build NDEATH topic', () => {
      const topic = buildNodeDeathTopic(baseOptions);
      expect(topic).toBe('spBv1.0/Group1/NDEATH/EdgeNode1');
    });

    it('should build NDATA topic', () => {
      const topic = buildNodeDataTopic(baseOptions);
      expect(topic).toBe('spBv1.0/Group1/NDATA/EdgeNode1');
    });

    it('should build NCMD topic', () => {
      const topic = buildNodeCommandTopic(baseOptions);
      expect(topic).toBe('spBv1.0/Group1/NCMD/EdgeNode1');
    });
  });

  describe('Device Topic Builders', () => {
    it('should build DBIRTH topic', () => {
      const topic = buildDeviceBirthTopic(deviceOptions);
      expect(topic).toBe('spBv1.0/Group1/DBIRTH/EdgeNode1/Device1');
    });

    it('should build DDEATH topic', () => {
      const topic = buildDeviceDeathTopic(deviceOptions);
      expect(topic).toBe('spBv1.0/Group1/DDEATH/EdgeNode1/Device1');
    });

    it('should build DDATA topic', () => {
      const topic = buildDeviceDataTopic(deviceOptions);
      expect(topic).toBe('spBv1.0/Group1/DDATA/EdgeNode1/Device1');
    });

    it('should build DCMD topic', () => {
      const topic = buildDeviceCommandTopic(deviceOptions);
      expect(topic).toBe('spBv1.0/Group1/DCMD/EdgeNode1/Device1');
    });

    it('should throw error if deviceId is missing for device topics', () => {
      expect(() => buildDeviceBirthTopic(baseOptions)).toThrow('deviceId is required');
      expect(() => buildDeviceDeathTopic(baseOptions)).toThrow('deviceId is required');
      expect(() => buildDeviceDataTopic(baseOptions)).toThrow('deviceId is required');
      expect(() => buildDeviceCommandTopic(baseOptions)).toThrow('deviceId is required');
    });
  });

  describe('STATE Topic Builder', () => {
    it('should build STATE topic with default namespace', () => {
      const topic = buildStateTopic('SCADA_HOST_01');
      expect(topic).toBe('spBv1.0/STATE/SCADA_HOST_01');
    });

    it('should build STATE topic with custom namespace', () => {
      const topic = buildStateTopic('SCADA_HOST_01', 'spBv2.0');
      expect(topic).toBe('spBv2.0/STATE/SCADA_HOST_01');
    });
  });

  describe('Certificate Topic Builders', () => {
    it('should build NBIRTH certificate topic', () => {
      const topic = buildCertificateTopicNBirth(baseOptions);
      expect(topic).toBe('$sparkplug/certificates/spBv1.0/Group1/NBIRTH/EdgeNode1');
    });

    it('should build DBIRTH certificate topic', () => {
      const topic = buildCertificateTopicDBirth(deviceOptions);
      expect(topic).toBe('$sparkplug/certificates/spBv1.0/Group1/DBIRTH/EdgeNode1/Device1');
    });

    it('should throw error if deviceId missing for DBIRTH certificate', () => {
      expect(() => buildCertificateTopicDBirth(baseOptions)).toThrow('deviceId is required');
    });

    it('should use custom namespace for certificate topics', () => {
      const topic = buildCertificateTopicNBirth({ ...baseOptions, namespace: 'spBv2.0' });
      expect(topic).toBe('$sparkplug/certificates/spBv2.0/Group1/NBIRTH/EdgeNode1');
    });
  });

  describe('Generic buildTopic', () => {
    it('should build node birth topic', () => {
      const topic = buildTopic(MessageType.NBIRTH, baseOptions);
      expect(topic).toBe('spBv1.0/Group1/NBIRTH/EdgeNode1');
    });

    it('should build node death topic', () => {
      const topic = buildTopic(MessageType.NDEATH, baseOptions);
      expect(topic).toBe('spBv1.0/Group1/NDEATH/EdgeNode1');
    });

    it('should build node data topic', () => {
      const topic = buildTopic(MessageType.NDATA, baseOptions);
      expect(topic).toBe('spBv1.0/Group1/NDATA/EdgeNode1');
    });

    it('should build node command topic', () => {
      const topic = buildTopic(MessageType.NCMD, baseOptions);
      expect(topic).toBe('spBv1.0/Group1/NCMD/EdgeNode1');
    });

    it('should build device birth topic', () => {
      const topic = buildTopic(MessageType.DBIRTH, deviceOptions);
      expect(topic).toBe('spBv1.0/Group1/DBIRTH/EdgeNode1/Device1');
    });

    it('should build device death topic', () => {
      const topic = buildTopic(MessageType.DDEATH, deviceOptions);
      expect(topic).toBe('spBv1.0/Group1/DDEATH/EdgeNode1/Device1');
    });

    it('should build device data topic', () => {
      const topic = buildTopic(MessageType.DDATA, deviceOptions);
      expect(topic).toBe('spBv1.0/Group1/DDATA/EdgeNode1/Device1');
    });

    it('should build device command topic', () => {
      const topic = buildTopic(MessageType.DCMD, deviceOptions);
      expect(topic).toBe('spBv1.0/Group1/DCMD/EdgeNode1/Device1');
    });

    it('should build STATE topic', () => {
      const topic = buildTopic(MessageType.STATE, baseOptions);
      expect(topic).toBe('spBv1.0/STATE/EdgeNode1');
    });

    it('should throw error for unknown message type', () => {
      expect(() => buildTopic('INVALID' as MessageType, baseOptions)).toThrow('Unknown message type');
    });
  });

  describe('Wildcard Subscriptions', () => {
    it('should build wildcard subscription with defaults', () => {
      const topic = buildWildcardSubscription();
      expect(topic).toBe('spBv1.0/+/+/+');
    });

    it('should build wildcard subscription with custom namespace', () => {
      const topic = buildWildcardSubscription('spBv2.0');
      expect(topic).toBe('spBv2.0/+/+/+');
    });

    it('should build wildcard subscription with specific group', () => {
      const topic = buildWildcardSubscription('spBv1.0', 'Group1');
      expect(topic).toBe('spBv1.0/Group1/+/+');
    });

    it('should build wildcard subscription with specific message type', () => {
      const topic = buildWildcardSubscription('spBv1.0', 'Group1', 'NDATA');
      expect(topic).toBe('spBv1.0/Group1/NDATA/+');
    });

    it('should build wildcard subscription with specific edge node', () => {
      const topic = buildWildcardSubscription('spBv1.0', 'Group1', 'NDATA', 'Node1');
      expect(topic).toBe('spBv1.0/Group1/NDATA/Node1');
    });

    it('should build wildcard subscription with device ID', () => {
      const topic = buildWildcardSubscription('spBv1.0', 'Group1', 'DDATA', 'Node1', 'Device1');
      expect(topic).toBe('spBv1.0/Group1/DDATA/Node1/Device1');
    });
  });

  describe('Specialized Subscriptions', () => {
    it('should build subscription for all node births', () => {
      const topic = buildAllNodeBirthsSubscription();
      expect(topic).toBe('spBv1.0/+/NBIRTH/+');
    });

    it('should build subscription for all device births', () => {
      const topic = buildAllDeviceBirthsSubscription();
      expect(topic).toBe('spBv1.0/+/DBIRTH/+/+');
    });

    it('should build subscription for all data messages', () => {
      const topic = buildAllDataSubscription();
      expect(topic).toBe('spBv1.0/+/+DATA/+/#');
    });

    it('should build group subscription', () => {
      const topic = buildGroupSubscription('Group1');
      expect(topic).toBe('spBv1.0/Group1/#');
    });

    it('should build group subscription with custom namespace', () => {
      const topic = buildGroupSubscription('Group1', 'spBv2.0');
      expect(topic).toBe('spBv2.0/Group1/#');
    });
  });

  describe('Edge Cases and Special Characters', () => {
    it('should handle IDs with underscores', () => {
      const options = {
        groupId: 'Group_1',
        edgeNodeId: 'Edge_Node_1',
        deviceId: 'Device_1',
      };

      const topic = buildDeviceBirthTopic(options);
      expect(topic).toBe('spBv1.0/Group_1/DBIRTH/Edge_Node_1/Device_1');
    });

    it('should handle IDs with hyphens', () => {
      const options = {
        groupId: 'Group-1',
        edgeNodeId: 'Edge-Node-1',
        deviceId: 'Device-1',
      };

      const topic = buildDeviceBirthTopic(options);
      expect(topic).toBe('spBv1.0/Group-1/DBIRTH/Edge-Node-1/Device-1');
    });

    it('should handle IDs with numbers', () => {
      const options = {
        groupId: 'Group123',
        edgeNodeId: 'Node456',
        deviceId: 'Device789',
      };

      const topic = buildDeviceBirthTopic(options);
      expect(topic).toBe('spBv1.0/Group123/DBIRTH/Node456/Device789');
    });

    it('should handle long IDs', () => {
      const options = {
        groupId: 'VeryLongGroupIdWithManyCharacters',
        edgeNodeId: 'VeryLongEdgeNodeIdWithManyCharacters',
        deviceId: 'VeryLongDeviceIdWithManyCharacters',
      };

      const topic = buildDeviceBirthTopic(options);
      expect(topic).toContain('VeryLongGroupIdWithManyCharacters');
      expect(topic).toContain('VeryLongEdgeNodeIdWithManyCharacters');
      expect(topic).toContain('VeryLongDeviceIdWithManyCharacters');
    });
  });

  describe('Real-world Examples', () => {
    it('should build factory floor topic', () => {
      const topic = buildNodeDataTopic({
        groupId: 'FactoryFloor1',
        edgeNodeId: 'PLC_001',
        namespace: 'spBv1.0',
      });

      expect(topic).toBe('spBv1.0/FactoryFloor1/NDATA/PLC_001');
    });

    it('should build temperature sensor topic', () => {
      const topic = buildDeviceDataTopic({
        groupId: 'Building_A',
        edgeNodeId: 'Gateway_1',
        deviceId: 'TempSensor_42',
      });

      expect(topic).toBe('spBv1.0/Building_A/DDATA/Gateway_1/TempSensor_42');
    });

    it('should build SCADA subscription for specific group', () => {
      const topic = buildGroupSubscription('ProductionLine_1');
      expect(topic).toBe('spBv1.0/ProductionLine_1/#');
    });

    it('should build subscription for all births in a group', () => {
      const nodeBirths = buildWildcardSubscription('spBv1.0', 'Group1', 'NBIRTH');
      const deviceBirths = buildWildcardSubscription('spBv1.0', 'Group1', 'DBIRTH', '+', '+');

      expect(nodeBirths).toBe('spBv1.0/Group1/NBIRTH/+');
      expect(deviceBirths).toBe('spBv1.0/Group1/DBIRTH/+/+');
    });
  });
});
