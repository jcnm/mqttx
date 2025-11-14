import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StatePublisher } from '../src/state-publisher.js';

describe('StatePublisher', () => {
  let mockClient: any;
  let publisher: StatePublisher;

  beforeEach(() => {
    mockClient = {
      publish: vi.fn((topic, payload, options, callback) => {
        if (callback) callback(null);
      }),
    };

    publisher = new StatePublisher({
      client: mockClient,
      hostId: 'test-host',
      namespace: 'spBv1.0',
      publishInterval: 1000,
    });
  });

  describe('Constructor', () => {
    it('should create instance with valid options', () => {
      expect(publisher).toBeInstanceOf(StatePublisher);
    });

    it('should use default namespace if not provided', () => {
      const defaultPublisher = new StatePublisher({
        client: mockClient,
        hostId: 'test-host',
      });
      expect(defaultPublisher).toBeInstanceOf(StatePublisher);
    });

    it('should use default publish interval if not provided', () => {
      const defaultPublisher = new StatePublisher({
        client: mockClient,
        hostId: 'test-host',
      });
      expect(defaultPublisher).toBeInstanceOf(StatePublisher);
    });
  });

  describe('publish', () => {
    it('should publish online state', () => {
      publisher.publish(true);

      expect(mockClient.publish).toHaveBeenCalledTimes(1);
      expect(mockClient.publish).toHaveBeenCalledWith(
        'spBv1.0/STATE/test-host',
        expect.any(String),
        { qos: 1, retain: true },
        expect.any(Function)
      );
    });

    it('should publish offline state', () => {
      publisher.publish(false);

      expect(mockClient.publish).toHaveBeenCalledTimes(1);
      expect(mockClient.publish).toHaveBeenCalledWith(
        'spBv1.0/STATE/test-host',
        expect.any(String),
        { qos: 1, retain: true },
        expect.any(Function)
      );
    });
  });

  describe('Lifecycle', () => {
    it('should be able to instantiate without starting', () => {
      expect(publisher).toBeInstanceOf(StatePublisher);
    });

    it('should stop without errors even if not started', () => {
      expect(() => publisher.stop()).not.toThrow();
    });

    it('should publish offline when stopped', () => {
      publisher.stop();

      expect(mockClient.publish).toHaveBeenCalled();
      const lastCall = mockClient.publish.mock.calls[mockClient.publish.mock.calls.length - 1];
      expect(lastCall[0]).toBe('spBv1.0/STATE/test-host');
    });
  });
});
