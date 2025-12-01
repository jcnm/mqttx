import { describe, it, expect, beforeEach } from 'vitest';
import { SequenceManager } from '../src/sequence.js';

describe('SequenceManager', () => {
  let seqManager: SequenceManager;

  beforeEach(() => {
    seqManager = new SequenceManager();
  });

  describe('resetAtBirth', () => {
    it('should reset seq to 0 at NBIRTH', () => {
      const seq = seqManager.resetAtBirth('group1', 'node1', 0n);
      expect(seq).toBe(0n);
    });

    it('should store bdSeq value', () => {
      seqManager.resetAtBirth('group1', 'node1', 42n);
      expect(seqManager.getBdSeq('group1', 'node1')).toBe(42n);
    });

    it('should overwrite existing state on rebirth', () => {
      seqManager.resetAtBirth('group1', 'node1', 1n);
      seqManager.getNextSeq('group1', 'node1'); // seq = 1
      seqManager.getNextSeq('group1', 'node1'); // seq = 2

      // Rebirth should reset seq to 0
      const seq = seqManager.resetAtBirth('group1', 'node1', 2n);
      expect(seq).toBe(0n);
      expect(seqManager.getCurrentSeq('group1', 'node1')).toBe(0n);
      expect(seqManager.getBdSeq('group1', 'node1')).toBe(2n);
    });
  });

  describe('getNextSeq', () => {
    it('should increment seq for each call', () => {
      seqManager.resetAtBirth('group1', 'node1', 0n);

      expect(seqManager.getNextSeq('group1', 'node1')).toBe(1n);
      expect(seqManager.getNextSeq('group1', 'node1')).toBe(2n);
      expect(seqManager.getNextSeq('group1', 'node1')).toBe(3n);
    });

    it('should wrap from 255 to 0', () => {
      seqManager.resetAtBirth('group1', 'node1', 0n);

      // Manually set seq to 254 by incrementing
      for (let i = 0; i < 255; i++) {
        seqManager.getNextSeq('group1', 'node1');
      }

      // Next should be 255
      expect(seqManager.getCurrentSeq('group1', 'node1')).toBe(255n);

      // Next increment should wrap to 0
      expect(seqManager.getNextSeq('group1', 'node1')).toBe(0n);
    });

    it('should initialize with seq=0 if no state exists', () => {
      // Without resetAtBirth, should initialize with 0
      const seq = seqManager.getNextSeq('unknown', 'node');
      expect(seq).toBe(0n);
    });
  });

  describe('getCurrentSeq', () => {
    it('should return current seq without incrementing', () => {
      seqManager.resetAtBirth('group1', 'node1', 0n);
      seqManager.getNextSeq('group1', 'node1'); // seq = 1

      expect(seqManager.getCurrentSeq('group1', 'node1')).toBe(1n);
      expect(seqManager.getCurrentSeq('group1', 'node1')).toBe(1n); // Still 1
    });

    it('should return null for unknown node', () => {
      expect(seqManager.getCurrentSeq('unknown', 'node')).toBeNull();
    });
  });

  describe('validateSeq', () => {
    it('should validate correct sequence', () => {
      seqManager.resetAtBirth('group1', 'node1', 0n);

      const result = seqManager.validateSeq('group1', 'node1', 1n);
      expect(result.valid).toBe(true);
      expect(result.expected).toBe(1n);
      expect(result.received).toBe(1n);
    });

    it('should reject incorrect sequence', () => {
      seqManager.resetAtBirth('group1', 'node1', 0n);

      const result = seqManager.validateSeq('group1', 'node1', 5n);
      expect(result.valid).toBe(false);
      expect(result.expected).toBe(1n);
      expect(result.received).toBe(5n);
    });

    it('should accept any sequence for unknown node', () => {
      const result = seqManager.validateSeq('unknown', 'node', 42n);
      expect(result.valid).toBe(true);
      expect(result.expected).toBeNull();
    });

    it('should update stored seq on valid sequence', () => {
      seqManager.resetAtBirth('group1', 'node1', 0n);

      seqManager.validateSeq('group1', 'node1', 1n);
      expect(seqManager.getCurrentSeq('group1', 'node1')).toBe(1n);

      seqManager.validateSeq('group1', 'node1', 2n);
      expect(seqManager.getCurrentSeq('group1', 'node1')).toBe(2n);
    });
  });

  describe('getState', () => {
    it('should return full state for node', () => {
      seqManager.resetAtBirth('group1', 'node1', 42n);
      seqManager.getNextSeq('group1', 'node1');

      const state = seqManager.getState('group1', 'node1');
      expect(state).toBeDefined();
      expect(state?.seq).toBe(1n);
      expect(state?.bdSeq).toBe(42n);
      expect(state?.lastPublishTime).toBeDefined();
    });

    it('should return null for unknown node', () => {
      expect(seqManager.getState('unknown', 'node')).toBeNull();
    });
  });

  describe('removeState', () => {
    it('should remove state for node', () => {
      seqManager.resetAtBirth('group1', 'node1', 0n);
      expect(seqManager.getState('group1', 'node1')).toBeDefined();

      seqManager.removeState('group1', 'node1');
      expect(seqManager.getState('group1', 'node1')).toBeNull();
    });
  });

  describe('getAllStates', () => {
    it('should return all node states', () => {
      seqManager.resetAtBirth('group1', 'node1', 0n);
      seqManager.resetAtBirth('group1', 'node2', 1n);
      seqManager.resetAtBirth('group2', 'node1', 2n);

      const allStates = seqManager.getAllStates();
      expect(allStates.size).toBe(3);
      expect(allStates.has('group1/node1')).toBe(true);
      expect(allStates.has('group1/node2')).toBe(true);
      expect(allStates.has('group2/node1')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all state', () => {
      seqManager.resetAtBirth('group1', 'node1', 0n);
      seqManager.resetAtBirth('group1', 'node2', 1n);

      seqManager.clear();

      expect(seqManager.getAllStates().size).toBe(0);
    });
  });

  describe('multiple nodes', () => {
    it('should maintain independent sequences for different nodes', () => {
      seqManager.resetAtBirth('group1', 'node1', 0n);
      seqManager.resetAtBirth('group1', 'node2', 0n);

      // Increment node1 3 times
      seqManager.getNextSeq('group1', 'node1');
      seqManager.getNextSeq('group1', 'node1');
      seqManager.getNextSeq('group1', 'node1');

      // Increment node2 once
      seqManager.getNextSeq('group1', 'node2');

      expect(seqManager.getCurrentSeq('group1', 'node1')).toBe(3n);
      expect(seqManager.getCurrentSeq('group1', 'node2')).toBe(1n);
    });

    it('should maintain independent bdSeq for different nodes', () => {
      seqManager.resetAtBirth('group1', 'node1', 10n);
      seqManager.resetAtBirth('group1', 'node2', 20n);

      expect(seqManager.getBdSeq('group1', 'node1')).toBe(10n);
      expect(seqManager.getBdSeq('group1', 'node2')).toBe(20n);
    });
  });

  describe('Sparkplug B sequence flow simulation', () => {
    it('should simulate correct message sequence for NBIRTH -> DBIRTH -> NDATA -> DDATA', () => {
      // Simulate: NBIRTH (seq=0), DBIRTH (seq=1), DBIRTH (seq=2), NDATA (seq=3), DDATA (seq=4)

      // NBIRTH - reset seq to 0
      const nbirthSeq = seqManager.resetAtBirth('group1', 'node1', 0n);
      expect(nbirthSeq).toBe(0n);

      // DBIRTH for device1 - use node's seq
      const dbirth1Seq = seqManager.getNextSeq('group1', 'node1');
      expect(dbirth1Seq).toBe(1n);

      // DBIRTH for device2 - use node's seq
      const dbirth2Seq = seqManager.getNextSeq('group1', 'node1');
      expect(dbirth2Seq).toBe(2n);

      // NDATA - use node's seq
      const ndataSeq = seqManager.getNextSeq('group1', 'node1');
      expect(ndataSeq).toBe(3n);

      // DDATA - use node's seq
      const ddataSeq = seqManager.getNextSeq('group1', 'node1');
      expect(ddataSeq).toBe(4n);
    });

    it('should reset seq to 0 on rebirth', () => {
      // Initial birth
      seqManager.resetAtBirth('group1', 'node1', 0n);

      // Simulate some messages
      seqManager.getNextSeq('group1', 'node1'); // seq = 1
      seqManager.getNextSeq('group1', 'node1'); // seq = 2
      seqManager.getNextSeq('group1', 'node1'); // seq = 3

      // Rebirth request - bdSeq should increment
      const rebirthSeq = seqManager.resetAtBirth('group1', 'node1', 1n);
      expect(rebirthSeq).toBe(0n);
      expect(seqManager.getBdSeq('group1', 'node1')).toBe(1n);
    });
  });
});
