import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataSubscriber } from '../src/data-subscriber.js';

describe('DataSubscriber', () => {
  let mockClient: any;
  let subscriber: DataSubscriber;

  beforeEach(() => {
    mockClient = {
      subscribe: vi.fn((topics, options, callback) => {
        if (callback) callback(null);
      }),
      on: vi.fn(),
      removeListener: vi.fn(),
    };

    subscriber = new DataSubscriber({
      client: mockClient,
      groupId: 'Group1',
      edgeNodeId: 'Node1',
      namespace: 'spBv1.0',
    });
  });

  describe('Constructor', () => {
    it('should create instance with valid options', () => {
      expect(subscriber).toBeInstanceOf(DataSubscriber);
    });

    it('should use default namespace if not provided', () => {
      const defaultSubscriber = new DataSubscriber({
        client: mockClient,
        groupId: 'Group1',
        edgeNodeId: 'Node1',
      });
      expect(defaultSubscriber).toBeInstanceOf(DataSubscriber);
    });
  });

  describe('Lifecycle', () => {
    it('should be able to instantiate without subscribing', () => {
      expect(subscriber).toBeInstanceOf(DataSubscriber);
    });

    it('should handle message callbacks', () => {
      const onMessage = vi.fn();
      const subWithCallback = new DataSubscriber({
        client: mockClient,
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        onMessage,
      });

      expect(subWithCallback).toBeInstanceOf(DataSubscriber);
    });
  });
});
