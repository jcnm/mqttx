import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BirthMonitor } from '../src/birth-monitor.js';

describe('BirthMonitor', () => {
  let mockClient: any;
  let monitor: BirthMonitor;

  beforeEach(() => {
    mockClient = {
      subscribe: vi.fn((topics, options, callback) => {
        if (callback) callback(null);
      }),
      on: vi.fn(),
      removeListener: vi.fn(),
    };

    monitor = new BirthMonitor({
      client: mockClient,
      namespace: 'spBv1.0',
    });
  });

  describe('Constructor', () => {
    it('should create instance with MQTT client', () => {
      expect(monitor).toBeInstanceOf(BirthMonitor);
    });

    it('should use default namespace if not provided', () => {
      const defaultMonitor = new BirthMonitor({
        client: mockClient,
      });
      expect(defaultMonitor).toBeInstanceOf(BirthMonitor);
    });

    it('should accept optional callbacks', () => {
      const onNodeBirth = vi.fn();
      const onDeviceBirth = vi.fn();

      const monitorWithCallbacks = new BirthMonitor({
        client: mockClient,
        namespace: 'spBv1.0',
        onNodeBirth,
        onDeviceBirth,
      });

      expect(monitorWithCallbacks).toBeInstanceOf(BirthMonitor);
    });
  });

  describe('Lifecycle', () => {
    it('should be able to instantiate without starting', () => {
      expect(monitor).toBeInstanceOf(BirthMonitor);
    });
  });
});
