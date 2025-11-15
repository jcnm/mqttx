import { describe, it, expect } from 'vitest';
import {
  PrimaryHostApplication,
  StatePublisher,
  CommandSender,
  BirthMonitor,
  DataSubscriber,
  StoreAndForward,
} from '../src/index.js';

describe('SCADA Core Package', () => {
  describe('Exports', () => {
    it('should export PrimaryHostApplication class', () => {
      expect(PrimaryHostApplication).toBeDefined();
      expect(typeof PrimaryHostApplication).toBe('function');
    });

    it('should export StatePublisher class', () => {
      expect(StatePublisher).toBeDefined();
      expect(typeof StatePublisher).toBe('function');
    });

    it('should export CommandSender class', () => {
      expect(CommandSender).toBeDefined();
      expect(typeof CommandSender).toBe('function');
    });

    it('should export BirthMonitor class', () => {
      expect(BirthMonitor).toBeDefined();
      expect(typeof BirthMonitor).toBe('function');
    });

    it('should export DataSubscriber class', () => {
      expect(DataSubscriber).toBeDefined();
      expect(typeof DataSubscriber).toBe('function');
    });

    it('should export StoreAndForward class', () => {
      expect(StoreAndForward).toBeDefined();
      expect(typeof StoreAndForward).toBe('function');
    });
  });
});
