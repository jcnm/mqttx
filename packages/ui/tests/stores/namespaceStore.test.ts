import { describe, it, expect, beforeEach } from 'vitest';
import { useNamespaceStore } from '../../src/stores/namespaceStore';

describe('NamespaceStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useNamespaceStore.setState({ nodes: [], devices: [] });
  });

  describe('Node Management', () => {
    it('should add a new node', () => {
      const { addNode, nodes } = useNamespaceStore.getState();

      addNode({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        online: true,
        bdSeq: '42',
        lastSeen: Date.now(),
      });

      const state = useNamespaceStore.getState();
      expect(state.nodes).toHaveLength(1);
      expect(state.nodes[0].groupId).toBe('Group1');
      expect(state.nodes[0].edgeNodeId).toBe('Node1');
      expect(state.nodes[0].online).toBe(true);
    });

    it('should update existing node when adding duplicate', () => {
      const { addNode } = useNamespaceStore.getState();
      const timestamp1 = Date.now();
      const timestamp2 = Date.now() + 1000;

      addNode({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        online: true,
        bdSeq: '42',
        lastSeen: timestamp1,
      });

      addNode({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        online: false,
        bdSeq: '43',
        lastSeen: timestamp2,
      });

      const state = useNamespaceStore.getState();
      expect(state.nodes).toHaveLength(1);
      expect(state.nodes[0].online).toBe(false);
      expect(state.nodes[0].bdSeq).toBe('43');
      expect(state.nodes[0].lastSeen).toBe(timestamp2);
    });

    it('should add multiple different nodes', () => {
      const { addNode } = useNamespaceStore.getState();

      addNode({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        online: true,
        bdSeq: '0',
        lastSeen: Date.now(),
      });

      addNode({
        groupId: 'Group1',
        edgeNodeId: 'Node2',
        online: true,
        bdSeq: '0',
        lastSeen: Date.now(),
      });

      addNode({
        groupId: 'Group2',
        edgeNodeId: 'Node1',
        online: true,
        bdSeq: '0',
        lastSeen: Date.now(),
      });

      const state = useNamespaceStore.getState();
      expect(state.nodes).toHaveLength(3);
    });

    it('should update node properties', () => {
      const { addNode, updateNode } = useNamespaceStore.getState();

      addNode({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        online: true,
        bdSeq: '42',
        lastSeen: Date.now(),
      });

      const newTimestamp = Date.now() + 5000;
      updateNode('Group1', 'Node1', {
        online: false,
        bdSeq: '43',
        lastSeen: newTimestamp,
      });

      const state = useNamespaceStore.getState();
      expect(state.nodes[0].online).toBe(false);
      expect(state.nodes[0].bdSeq).toBe('43');
      expect(state.nodes[0].lastSeen).toBe(newTimestamp);
    });

    it('should not affect other nodes when updating', () => {
      const { addNode, updateNode } = useNamespaceStore.getState();

      addNode({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        online: true,
        bdSeq: '10',
        lastSeen: 1000,
      });

      addNode({
        groupId: 'Group1',
        edgeNodeId: 'Node2',
        online: true,
        bdSeq: '20',
        lastSeen: 2000,
      });

      updateNode('Group1', 'Node1', { online: false });

      const state = useNamespaceStore.getState();
      expect(state.nodes[0].online).toBe(false);
      expect(state.nodes[1].online).toBe(true);
    });

    it('should handle update for non-existent node gracefully', () => {
      const { updateNode } = useNamespaceStore.getState();

      updateNode('NonExistent', 'Node', { online: false });

      const state = useNamespaceStore.getState();
      expect(state.nodes).toHaveLength(0);
    });
  });

  describe('Device Management', () => {
    it('should add a new device', () => {
      const { addDevice } = useNamespaceStore.getState();

      addDevice({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        deviceId: 'Device1',
        online: true,
        lastSeen: Date.now(),
      });

      const state = useNamespaceStore.getState();
      expect(state.devices).toHaveLength(1);
      expect(state.devices[0].deviceId).toBe('Device1');
    });

    it('should update existing device when adding duplicate', () => {
      const { addDevice } = useNamespaceStore.getState();
      const timestamp1 = Date.now();
      const timestamp2 = Date.now() + 1000;

      addDevice({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        deviceId: 'Device1',
        online: true,
        lastSeen: timestamp1,
      });

      addDevice({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        deviceId: 'Device1',
        online: false,
        lastSeen: timestamp2,
      });

      const state = useNamespaceStore.getState();
      expect(state.devices).toHaveLength(1);
      expect(state.devices[0].online).toBe(false);
      expect(state.devices[0].lastSeen).toBe(timestamp2);
    });

    it('should add multiple different devices', () => {
      const { addDevice } = useNamespaceStore.getState();

      addDevice({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        deviceId: 'Device1',
        online: true,
        lastSeen: Date.now(),
      });

      addDevice({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        deviceId: 'Device2',
        online: true,
        lastSeen: Date.now(),
      });

      addDevice({
        groupId: 'Group1',
        edgeNodeId: 'Node2',
        deviceId: 'Device1',
        online: true,
        lastSeen: Date.now(),
      });

      const state = useNamespaceStore.getState();
      expect(state.devices).toHaveLength(3);
    });

    it('should update device properties', () => {
      const { addDevice, updateDevice } = useNamespaceStore.getState();

      addDevice({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        deviceId: 'Device1',
        online: true,
        lastSeen: 1000,
      });

      const newTimestamp = Date.now();
      updateDevice('Group1', 'Node1', 'Device1', {
        online: false,
        lastSeen: newTimestamp,
      });

      const state = useNamespaceStore.getState();
      expect(state.devices[0].online).toBe(false);
      expect(state.devices[0].lastSeen).toBe(newTimestamp);
    });

    it('should not affect other devices when updating', () => {
      const { addDevice, updateDevice } = useNamespaceStore.getState();

      addDevice({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        deviceId: 'Device1',
        online: true,
        lastSeen: 1000,
      });

      addDevice({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        deviceId: 'Device2',
        online: true,
        lastSeen: 2000,
      });

      updateDevice('Group1', 'Node1', 'Device1', { online: false });

      const state = useNamespaceStore.getState();
      expect(state.devices[0].online).toBe(false);
      expect(state.devices[1].online).toBe(true);
    });

    it('should handle update for non-existent device gracefully', () => {
      const { updateDevice } = useNamespaceStore.getState();

      updateDevice('NonExistent', 'Node', 'Device', { online: false });

      const state = useNamespaceStore.getState();
      expect(state.devices).toHaveLength(0);
    });
  });

  describe('Combined Node and Device Operations', () => {
    it('should manage nodes and devices independently', () => {
      const { addNode, addDevice } = useNamespaceStore.getState();

      addNode({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        online: true,
        bdSeq: '0',
        lastSeen: Date.now(),
      });

      addDevice({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        deviceId: 'Device1',
        online: true,
        lastSeen: Date.now(),
      });

      const state = useNamespaceStore.getState();
      expect(state.nodes).toHaveLength(1);
      expect(state.devices).toHaveLength(1);
    });

    it('should handle devices without corresponding nodes', () => {
      const { addDevice } = useNamespaceStore.getState();

      addDevice({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        deviceId: 'Device1',
        online: true,
        lastSeen: Date.now(),
      });

      const state = useNamespaceStore.getState();
      expect(state.nodes).toHaveLength(0);
      expect(state.devices).toHaveLength(1);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle NBIRTH - node comes online', () => {
      const { addNode } = useNamespaceStore.getState();
      const timestamp = Date.now();

      addNode({
        groupId: 'FactoryFloor',
        edgeNodeId: 'PLC_001',
        online: true,
        bdSeq: '0',
        lastSeen: timestamp,
      });

      const state = useNamespaceStore.getState();
      expect(state.nodes[0].online).toBe(true);
      expect(state.nodes[0].bdSeq).toBe('0');
    });

    it('should handle NDEATH - node goes offline', () => {
      const { addNode, updateNode } = useNamespaceStore.getState();

      addNode({
        groupId: 'FactoryFloor',
        edgeNodeId: 'PLC_001',
        online: true,
        bdSeq: '0',
        lastSeen: Date.now(),
      });

      updateNode('FactoryFloor', 'PLC_001', {
        online: false,
        lastSeen: Date.now() + 1000,
      });

      const state = useNamespaceStore.getState();
      expect(state.nodes[0].online).toBe(false);
    });

    it('should handle node rebirth with incremented bdSeq', () => {
      const { addNode } = useNamespaceStore.getState();

      // Initial birth
      addNode({
        groupId: 'FactoryFloor',
        edgeNodeId: 'PLC_001',
        online: true,
        bdSeq: '0',
        lastSeen: Date.now(),
      });

      // Node dies
      addNode({
        groupId: 'FactoryFloor',
        edgeNodeId: 'PLC_001',
        online: false,
        bdSeq: '0',
        lastSeen: Date.now() + 1000,
      });

      // Node rebounds with incremented bdSeq
      addNode({
        groupId: 'FactoryFloor',
        edgeNodeId: 'PLC_001',
        online: true,
        bdSeq: '1',
        lastSeen: Date.now() + 2000,
      });

      const state = useNamespaceStore.getState();
      expect(state.nodes).toHaveLength(1);
      expect(state.nodes[0].bdSeq).toBe('1');
      expect(state.nodes[0].online).toBe(true);
    });

    it('should track multiple factory nodes', () => {
      const { addNode } = useNamespaceStore.getState();

      addNode({
        groupId: 'FactoryFloor_A',
        edgeNodeId: 'PLC_Assembly_1',
        online: true,
        bdSeq: '0',
        lastSeen: Date.now(),
      });

      addNode({
        groupId: 'FactoryFloor_A',
        edgeNodeId: 'PLC_Assembly_2',
        online: true,
        bdSeq: '0',
        lastSeen: Date.now(),
      });

      addNode({
        groupId: 'FactoryFloor_B',
        edgeNodeId: 'PLC_Packaging_1',
        online: true,
        bdSeq: '0',
        lastSeen: Date.now(),
      });

      const state = useNamespaceStore.getState();
      expect(state.nodes).toHaveLength(3);
    });

    it('should track devices under nodes', () => {
      const { addNode, addDevice } = useNamespaceStore.getState();

      // Add node
      addNode({
        groupId: 'Building_A',
        edgeNodeId: 'Gateway_1',
        online: true,
        bdSeq: '0',
        lastSeen: Date.now(),
      });

      // Add devices under node
      addDevice({
        groupId: 'Building_A',
        edgeNodeId: 'Gateway_1',
        deviceId: 'TempSensor_01',
        online: true,
        lastSeen: Date.now(),
      });

      addDevice({
        groupId: 'Building_A',
        edgeNodeId: 'Gateway_1',
        deviceId: 'TempSensor_02',
        online: true,
        lastSeen: Date.now(),
      });

      const state = useNamespaceStore.getState();
      expect(state.nodes).toHaveLength(1);
      expect(state.devices).toHaveLength(2);
      expect(
        state.devices.every(d => d.groupId === 'Building_A' && d.edgeNodeId === 'Gateway_1')
      ).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty state', () => {
      const state = useNamespaceStore.getState();
      expect(state.nodes).toHaveLength(0);
      expect(state.devices).toHaveLength(0);
    });

    it('should handle rapid updates', () => {
      const { addNode, updateNode } = useNamespaceStore.getState();

      addNode({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        online: true,
        bdSeq: '0',
        lastSeen: 1000,
      });

      for (let i = 1; i <= 10; i++) {
        updateNode('Group1', 'Node1', {
          lastSeen: 1000 + i * 100,
        });
      }

      const state = useNamespaceStore.getState();
      expect(state.nodes[0].lastSeen).toBe(2000);
    });

    it('should handle nodes with same edgeNodeId but different groupId', () => {
      const { addNode } = useNamespaceStore.getState();

      addNode({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        online: true,
        bdSeq: '10',
        lastSeen: Date.now(),
      });

      addNode({
        groupId: 'Group2',
        edgeNodeId: 'Node1',
        online: true,
        bdSeq: '20',
        lastSeen: Date.now(),
      });

      const state = useNamespaceStore.getState();
      expect(state.nodes).toHaveLength(2);
      expect(state.nodes[0].bdSeq).toBe('10');
      expect(state.nodes[1].bdSeq).toBe('20');
    });
  });
});
