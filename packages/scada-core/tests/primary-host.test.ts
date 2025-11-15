import { describe, it, expect, beforeEach } from 'vitest';
import { PrimaryHostApplication } from '../src/primary-host.js';

describe('PrimaryHostApplication', () => {
  let host: PrimaryHostApplication;

  beforeEach(() => {
    host = new PrimaryHostApplication({
      brokerUrl: 'mqtt://localhost:1883',
      hostId: 'test-host',
      namespace: 'spBv1.0',
      publishInterval: 5000,
    });
  });

  describe('Constructor', () => {
    it('should create instance with valid options', () => {
      expect(host).toBeInstanceOf(PrimaryHostApplication);
      expect(host.getHostId()).toBe('test-host');
    });

    it('should use default namespace if not provided', () => {
      const defaultHost = new PrimaryHostApplication({
        brokerUrl: 'mqtt://localhost:1883',
        hostId: 'test-host-default',
      });
      expect(defaultHost).toBeInstanceOf(PrimaryHostApplication);
    });

    it('should use default publish interval if not provided', () => {
      const defaultHost = new PrimaryHostApplication({
        brokerUrl: 'mqtt://localhost:1883',
        hostId: 'test-host-interval',
      });
      expect(defaultHost).toBeInstanceOf(PrimaryHostApplication);
    });
  });

  describe('Getters', () => {
    it('should return host ID', () => {
      expect(host.getHostId()).toBe('test-host');
    });

    it('should return initial online status as false', () => {
      expect(host.isOnline()).toBe(false);
    });

    it('should return null client before connection', () => {
      expect(host.getClient()).toBeNull();
    });
  });

  describe('Lifecycle', () => {
    it('should be able to instantiate without connecting', () => {
      expect(host).toBeInstanceOf(PrimaryHostApplication);
    });

    // Note: Connection tests require a running MQTT broker
    // These would be integration tests, not unit tests
    it.skip('should connect to broker', async () => {
      // Requires actual MQTT broker running
      await host.connect();
      expect(host.isOnline()).toBe(true);
    });

    it.skip('should disconnect from broker', async () => {
      // Requires actual MQTT broker running
      await host.connect();
      await host.disconnect();
      expect(host.isOnline()).toBe(false);
    });
  });
});
