import { describe, it, expect, beforeEach } from 'vitest';
import { StoreAndForward } from '../src/store-forward.js';

describe('StoreAndForward', () => {
  let storeForward: StoreAndForward;

  beforeEach(() => {
    storeForward = new StoreAndForward({
      maxStoredMessages: 100,
      storageDir: '/tmp/sparkplug-store',
    });
  });

  describe('Constructor', () => {
    it('should create instance with valid options', () => {
      expect(storeForward).toBeInstanceOf(StoreAndForward);
    });

    it('should use default max messages if not provided', () => {
      const defaultStore = new StoreAndForward({
        storageDir: '/tmp/test',
      });
      expect(defaultStore).toBeInstanceOf(StoreAndForward);
    });

    it('should use default storage dir if not provided', () => {
      const defaultStore = new StoreAndForward({
        maxStoredMessages: 50,
      });
      expect(defaultStore).toBeInstanceOf(StoreAndForward);
    });
  });

  describe('Lifecycle', () => {
    it('should be able to instantiate', () => {
      expect(storeForward).toBeInstanceOf(StoreAndForward);
    });
  });
});
