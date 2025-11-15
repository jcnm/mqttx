import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from '../src/manager.js';

describe('StateManager', () => {
  let manager: StateManager;

  beforeEach(() => {
    manager = new StateManager();
  });

  describe('Node State Management', () => {
    it('should create a new node with initial state', () => {
      const node = manager.createOrUpdateNode('Group1', 'Node1', 42n);

      expect(node.groupId).toBe('Group1');
      expect(node.edgeNodeId).toBe('Node1');
      expect(node.bdSeq).toBe(42n);
      expect(node.seq).toBe(0n);
      expect(node.online).toBe(true);
      expect(node.lastSeen).toBeGreaterThan(0);
      expect(node.birthTimestamp).toBeGreaterThan(0n);
      expect(node.metrics).toBeInstanceOf(Map);
    });

    it('should update existing node', () => {
      manager.createOrUpdateNode('Group1', 'Node1', 42n);
      const updated = manager.createOrUpdateNode('Group1', 'Node1', 43n);

      expect(updated.bdSeq).toBe(43n);
      expect(updated.seq).toBe(0n); // Preserved from original
    });

    it('should get node by groupId and edgeNodeId', () => {
      manager.createOrUpdateNode('Group1', 'Node1', 42n);
      const node = manager.getNode('Group1', 'Node1');

      expect(node).not.toBeNull();
      expect(node?.groupId).toBe('Group1');
      expect(node?.edgeNodeId).toBe('Node1');
    });

    it('should return null for non-existent node', () => {
      const node = manager.getNode('NonExistent', 'Node');
      expect(node).toBeNull();
    });

    it('should set node online', () => {
      manager.createOrUpdateNode('Group1', 'Node1', 42n, false);
      manager.setNodeOnline('Group1', 'Node1', 43n);

      const node = manager.getNode('Group1', 'Node1');
      expect(node?.online).toBe(true);
      expect(node?.bdSeq).toBe(43n);
      expect(node?.seq).toBe(0n); // Reset on rebirth
    });

    it('should set node offline', () => {
      manager.createOrUpdateNode('Group1', 'Node1', 42n, true);
      manager.setNodeOffline('Group1', 'Node1');

      const node = manager.getNode('Group1', 'Node1');
      expect(node?.online).toBe(false);
    });

    it('should update node sequence correctly', () => {
      manager.createOrUpdateNode('Group1', 'Node1', 42n);
      const result = manager.updateNodeSeq('Group1', 'Node1', 1n);

      expect(result).toBe(true);
      const node = manager.getNode('Group1', 'Node1');
      expect(node?.seq).toBe(1n);
    });

    it('should reject invalid sequence number', () => {
      manager.createOrUpdateNode('Group1', 'Node1', 42n);
      const result = manager.updateNodeSeq('Group1', 'Node1', 5n); // Expected 1, got 5

      expect(result).toBe(false);
    });

    it('should wrap sequence number at 256', () => {
      const node = manager.createOrUpdateNode('Group1', 'Node1', 42n);
      node.seq = 255n;

      const result = manager.updateNodeSeq('Group1', 'Node1', 0n); // Wrap around
      expect(result).toBe(true);
    });

    it('should validate bdSeq correctly', () => {
      manager.createOrUpdateNode('Group1', 'Node1', 42n);

      expect(manager.validateBdSeq('Group1', 'Node1', 42n)).toBe(true);
      expect(manager.validateBdSeq('Group1', 'Node1', 43n)).toBe(false);
    });

    it('should accept any bdSeq for non-existent node', () => {
      expect(manager.validateBdSeq('NonExistent', 'Node', 99n)).toBe(true);
    });

    it('should get all nodes', () => {
      manager.createOrUpdateNode('Group1', 'Node1', 42n);
      manager.createOrUpdateNode('Group2', 'Node2', 43n);

      const nodes = manager.getAllNodes();
      expect(nodes).toHaveLength(2);
    });

    it('should get only online nodes', () => {
      manager.createOrUpdateNode('Group1', 'Node1', 42n, true);
      manager.createOrUpdateNode('Group2', 'Node2', 43n, false);

      const online = manager.getOnlineNodes();
      expect(online).toHaveLength(1);
      expect(online[0].edgeNodeId).toBe('Node1');
    });
  });

  describe('Device State Management', () => {
    it('should create a new device with initial state', () => {
      const device = manager.createOrUpdateDevice('Group1', 'Node1', 'Device1');

      expect(device.groupId).toBe('Group1');
      expect(device.edgeNodeId).toBe('Node1');
      expect(device.deviceId).toBe('Device1');
      expect(device.online).toBe(true);
      expect(device.lastSeen).toBeGreaterThan(0);
      expect(device.birthTimestamp).toBeGreaterThan(0n);
      expect(device.metrics).toBeInstanceOf(Map);
    });

    it('should update existing device', () => {
      manager.createOrUpdateDevice('Group1', 'Node1', 'Device1', true);
      const updated = manager.createOrUpdateDevice('Group1', 'Node1', 'Device1', false);

      expect(updated.online).toBe(false);
    });

    it('should get device by groupId, edgeNodeId, and deviceId', () => {
      manager.createOrUpdateDevice('Group1', 'Node1', 'Device1');
      const device = manager.getDevice('Group1', 'Node1', 'Device1');

      expect(device).not.toBeNull();
      expect(device?.deviceId).toBe('Device1');
    });

    it('should return null for non-existent device', () => {
      const device = manager.getDevice('NonExistent', 'Node', 'Device');
      expect(device).toBeNull();
    });

    it('should set device online', () => {
      manager.createOrUpdateDevice('Group1', 'Node1', 'Device1', false);
      manager.setDeviceOnline('Group1', 'Node1', 'Device1');

      const device = manager.getDevice('Group1', 'Node1', 'Device1');
      expect(device?.online).toBe(true);
    });

    it('should set device offline', () => {
      manager.createOrUpdateDevice('Group1', 'Node1', 'Device1', true);
      manager.setDeviceOffline('Group1', 'Node1', 'Device1');

      const device = manager.getDevice('Group1', 'Node1', 'Device1');
      expect(device?.online).toBe(false);
    });

    it('should get all devices', () => {
      manager.createOrUpdateDevice('Group1', 'Node1', 'Device1');
      manager.createOrUpdateDevice('Group1', 'Node1', 'Device2');

      const devices = manager.getAllDevices();
      expect(devices).toHaveLength(2);
    });

    it('should get only online devices', () => {
      manager.createOrUpdateDevice('Group1', 'Node1', 'Device1', true);
      manager.createOrUpdateDevice('Group1', 'Node1', 'Device2', false);

      const online = manager.getOnlineDevices();
      expect(online).toHaveLength(1);
      expect(online[0].deviceId).toBe('Device1');
    });

    it('should get devices for specific node', () => {
      manager.createOrUpdateDevice('Group1', 'Node1', 'Device1');
      manager.createOrUpdateDevice('Group1', 'Node1', 'Device2');
      manager.createOrUpdateDevice('Group1', 'Node2', 'Device3');

      const devices = manager.getDevicesForNode('Group1', 'Node1');
      expect(devices).toHaveLength(2);
      expect(devices.every(d => d.edgeNodeId === 'Node1')).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should create a new session', () => {
      const session = manager.createSession('Client1', true, 42n);

      expect(session.clientId).toBe('Client1');
      expect(session.connected).toBe(true);
      expect(session.cleanSession).toBe(true);
      expect(session.bdSeq).toBe(42n);
      expect(session.connectTime).toBeGreaterThan(0);
    });

    it('should create session without bdSeq', () => {
      const session = manager.createSession('Client1', false);

      expect(session.bdSeq).toBeUndefined();
    });

    it('should get session by clientId', () => {
      manager.createSession('Client1', true);
      const session = manager.getSession('Client1');

      expect(session).not.toBeNull();
      expect(session?.clientId).toBe('Client1');
    });

    it('should return null for non-existent session', () => {
      const session = manager.getSession('NonExistent');
      expect(session).toBeNull();
    });

    it('should disconnect session', () => {
      manager.createSession('Client1', true);
      manager.disconnectSession('Client1');

      const session = manager.getSession('Client1');
      expect(session?.connected).toBe(false);
      expect(session?.disconnectTime).toBeGreaterThan(0);
    });

    it('should remove session', () => {
      manager.createSession('Client1', true);
      manager.removeSession('Client1');

      const session = manager.getSession('Client1');
      expect(session).toBeNull();
    });

    it('should handle disconnect of non-existent session gracefully', () => {
      expect(() => manager.disconnectSession('NonExistent')).not.toThrow();
    });
  });

  describe('Metric Management', () => {
    it('should update node metric', () => {
      manager.createOrUpdateNode('Group1', 'Node1', 42n);

      manager.updateNodeMetric('Group1', 'Node1', {
        name: 'Temperature',
        value: 25.5,
        datatype: 9,
        timestamp: 12345n,
      });

      const node = manager.getNode('Group1', 'Node1');
      expect(node?.metrics?.get('Temperature')?.value).toBe(25.5);
    });

    it('should update device metric', () => {
      manager.createOrUpdateDevice('Group1', 'Node1', 'Device1');

      manager.updateDeviceMetric('Group1', 'Node1', 'Device1', {
        name: 'Humidity',
        value: 60,
        datatype: 8,
        timestamp: 12345n,
      });

      const device = manager.getDevice('Group1', 'Node1', 'Device1');
      expect(device?.metrics?.get('Humidity')?.value).toBe(60);
    });

    it('should update metric with alias', () => {
      manager.createOrUpdateNode('Group1', 'Node1', 42n);

      manager.updateNodeMetric('Group1', 'Node1', {
        name: 'Temperature',
        alias: 100n,
        value: 25.5,
        datatype: 9,
        timestamp: 12345n,
      });

      const node = manager.getNode('Group1', 'Node1');
      const metric = node?.metrics?.get('Temperature');
      expect(metric?.alias).toBe(100n);
    });

    it('should update metric with quality', () => {
      manager.createOrUpdateNode('Group1', 'Node1', 42n);

      manager.updateNodeMetric('Group1', 'Node1', {
        name: 'Temperature',
        value: 25.5,
        datatype: 9,
        timestamp: 12345n,
        quality: 192, // Good quality
      });

      const node = manager.getNode('Group1', 'Node1');
      expect(node?.metrics?.get('Temperature')?.quality).toBe(192);
    });

    it('should overwrite existing metric', () => {
      manager.createOrUpdateNode('Group1', 'Node1', 42n);

      manager.updateNodeMetric('Group1', 'Node1', {
        name: 'Temperature',
        value: 25.5,
        datatype: 9,
        timestamp: 12345n,
      });

      manager.updateNodeMetric('Group1', 'Node1', {
        name: 'Temperature',
        value: 30.0,
        datatype: 9,
        timestamp: 12346n,
      });

      const node = manager.getNode('Group1', 'Node1');
      expect(node?.metrics?.get('Temperature')?.value).toBe(30.0);
    });

    it('should not update metric for non-existent node', () => {
      expect(() =>
        manager.updateNodeMetric('NonExistent', 'Node', {
          name: 'Temperature',
          value: 25.5,
          datatype: 9,
          timestamp: 12345n,
        })
      ).not.toThrow();
    });
  });

  describe('Statistics', () => {
    it('should return statistics for empty state', () => {
      const stats = manager.getStatistics();

      expect(stats.totalNodes).toBe(0);
      expect(stats.onlineNodes).toBe(0);
      expect(stats.totalDevices).toBe(0);
      expect(stats.onlineDevices).toBe(0);
      expect(stats.activeSessions).toBe(0);
    });

    it('should return correct statistics', () => {
      manager.createOrUpdateNode('Group1', 'Node1', 42n, true);
      manager.createOrUpdateNode('Group1', 'Node2', 43n, false);
      manager.createOrUpdateDevice('Group1', 'Node1', 'Device1', true);
      manager.createOrUpdateDevice('Group1', 'Node1', 'Device2', false);
      manager.createSession('Client1', true);
      const session2 = manager.createSession('Client2', true);
      session2.connected = false;

      const stats = manager.getStatistics();

      expect(stats.totalNodes).toBe(2);
      expect(stats.onlineNodes).toBe(1);
      expect(stats.totalDevices).toBe(2);
      expect(stats.onlineDevices).toBe(1);
      expect(stats.activeSessions).toBe(1);
    });
  });

  describe('Cleanup', () => {
    it('should clear all state', () => {
      manager.createOrUpdateNode('Group1', 'Node1', 42n);
      manager.createOrUpdateDevice('Group1', 'Node1', 'Device1');
      manager.createSession('Client1', true);

      manager.clear();

      const stats = manager.getStatistics();
      expect(stats.totalNodes).toBe(0);
      expect(stats.totalDevices).toBe(0);
      expect(stats.activeSessions).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple groups and nodes', () => {
      manager.createOrUpdateNode('Group1', 'Node1', 42n);
      manager.createOrUpdateNode('Group1', 'Node2', 43n);
      manager.createOrUpdateNode('Group2', 'Node1', 44n);

      expect(manager.getAllNodes()).toHaveLength(3);
      expect(manager.getNode('Group1', 'Node1')?.bdSeq).toBe(42n);
      expect(manager.getNode('Group2', 'Node1')?.bdSeq).toBe(44n);
    });

    it('should handle sequence wrap-around', () => {
      const node = manager.createOrUpdateNode('Group1', 'Node1', 42n);

      // Increment to 255
      for (let i = 0n; i < 255n; i++) {
        node.seq = i;
        manager.updateNodeSeq('Group1', 'Node1', i + 1n);
      }

      // Next should wrap to 0
      node.seq = 255n;
      expect(manager.updateNodeSeq('Group1', 'Node1', 0n)).toBe(true);
    });

    it('should preserve metrics when updating node state', () => {
      manager.createOrUpdateNode('Group1', 'Node1', 42n);
      manager.updateNodeMetric('Group1', 'Node1', {
        name: 'Temperature',
        value: 25.5,
        datatype: 9,
        timestamp: 12345n,
      });

      manager.createOrUpdateNode('Group1', 'Node1', 43n);

      const node = manager.getNode('Group1', 'Node1');
      expect(node?.metrics?.get('Temperature')?.value).toBe(25.5);
    });
  });
});
