import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandSender } from '../src/command-sender.js';
import { DataType } from '@sparkplug/codec';

describe('CommandSender', () => {
  let mockClient: any;
  let sender: CommandSender;

  beforeEach(() => {
    mockClient = {
      publish: vi.fn((topic, payload, options, callback) => {
        if (callback) callback(null);
      }),
    };

    sender = new CommandSender(mockClient, 'spBv1.0');
  });

  describe('Constructor', () => {
    it('should create instance with MQTT client', () => {
      expect(sender).toBeInstanceOf(CommandSender);
    });

    it('should use default namespace if not provided', () => {
      const defaultSender = new CommandSender(mockClient);
      expect(defaultSender).toBeInstanceOf(CommandSender);
    });
  });

  describe('sendNodeCommand', () => {
    it('should send NCMD to node', async () => {
      const metrics = [
        {
          name: 'test-metric',
          datatype: DataType.Int32,
          value: 42,
        },
      ];

      await sender.sendNodeCommand({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        metrics,
      });

      expect(mockClient.publish).toHaveBeenCalledTimes(1);
      expect(mockClient.publish).toHaveBeenCalledWith(
        'spBv1.0/Group1/NCMD/Node1',
        expect.any(Buffer),
        { qos: 0 },
        expect.any(Function)
      );
    });

    it('should handle custom namespace', async () => {
      await sender.sendNodeCommand({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        metrics: [],
        namespace: 'custom',
      });

      expect(mockClient.publish).toHaveBeenCalledWith(
        'custom/Group1/NCMD/Node1',
        expect.any(Buffer),
        { qos: 0 },
        expect.any(Function)
      );
    });

    it('should handle publish errors', async () => {
      mockClient.publish = vi.fn((topic, payload, options, callback) => {
        if (callback) callback(new Error('Publish failed'));
      });

      await expect(
        sender.sendNodeCommand({
          groupId: 'Group1',
          edgeNodeId: 'Node1',
          metrics: [],
        })
      ).rejects.toThrow('Publish failed');
    });
  });

  describe('sendDeviceCommand', () => {
    it('should send DCMD to device', async () => {
      const metrics = [
        {
          name: 'test-metric',
          datatype: DataType.Boolean,
          value: true,
        },
      ];

      await sender.sendDeviceCommand({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        deviceId: 'Device1',
        metrics,
      });

      expect(mockClient.publish).toHaveBeenCalledTimes(1);
      expect(mockClient.publish).toHaveBeenCalledWith(
        'spBv1.0/Group1/DCMD/Node1/Device1',
        expect.any(Buffer),
        { qos: 0 },
        expect.any(Function)
      );
    });
  });

  describe('requestRebirth', () => {
    it('should send rebirth request to node', async () => {
      await sender.requestRebirth('Group1', 'Node1');

      expect(mockClient.publish).toHaveBeenCalledTimes(1);
      expect(mockClient.publish).toHaveBeenCalledWith(
        'spBv1.0/Group1/NCMD/Node1',
        expect.any(Buffer),
        { qos: 0 },
        expect.any(Function)
      );
    });
  });
});
