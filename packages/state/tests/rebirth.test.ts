import { describe, it, expect, beforeEach } from 'vitest';
import { RebirthManager } from '../src/rebirth.js';
import { StateManager } from '../src/manager.js';

describe('RebirthManager', () => {
  let stateManager: StateManager;
  let rebirthManager: RebirthManager;

  beforeEach(() => {
    stateManager = new StateManager();
    rebirthManager = new RebirthManager(stateManager);
  });

  describe('Rebirth Request', () => {
    it('should request rebirth for existing node', () => {
      stateManager.createOrUpdateNode('Group1', 'Node1', 42n);

      expect(() =>
        rebirthManager.requestRebirth({
          groupId: 'Group1',
          edgeNodeId: 'Node1',
        })
      ).not.toThrow();
    });

    it('should throw error for non-existent node', () => {
      expect(() =>
        rebirthManager.requestRebirth({
          groupId: 'NonExistent',
          edgeNodeId: 'Node',
        })
      ).toThrow('Node NonExistent/Node not found');
    });

    it('should request rebirth with reason', () => {
      stateManager.createOrUpdateNode('Group1', 'Node1', 42n);

      expect(() =>
        rebirthManager.requestRebirth({
          groupId: 'Group1',
          edgeNodeId: 'Node1',
          reason: 'Sequence number mismatch',
        })
      ).not.toThrow();
    });
  });

  describe('Rebirth Handling', () => {
    it('should increment bdSeq on rebirth', () => {
      stateManager.createOrUpdateNode('Group1', 'Node1', 42n);

      const newBdSeq = rebirthManager.handleRebirth('Group1', 'Node1', 42n);

      expect(newBdSeq).toBe(43n);
    });

    it('should wrap bdSeq at 256', () => {
      stateManager.createOrUpdateNode('Group1', 'Node1', 255n);

      const newBdSeq = rebirthManager.handleRebirth('Group1', 'Node1', 255n);

      expect(newBdSeq).toBe(0n);
    });

    it('should set node online after rebirth', () => {
      stateManager.createOrUpdateNode('Group1', 'Node1', 42n, false);

      rebirthManager.handleRebirth('Group1', 'Node1', 42n);

      const node = stateManager.getNode('Group1', 'Node1');
      expect(node?.online).toBe(true);
    });

    it('should update bdSeq in state', () => {
      stateManager.createOrUpdateNode('Group1', 'Node1', 42n);

      rebirthManager.handleRebirth('Group1', 'Node1', 42n);

      const node = stateManager.getNode('Group1', 'Node1');
      expect(node?.bdSeq).toBe(43n);
    });

    it('should reset sequence number on rebirth', () => {
      const node = stateManager.createOrUpdateNode('Group1', 'Node1', 42n);
      node.seq = 100n;

      rebirthManager.handleRebirth('Group1', 'Node1', 42n);

      const updatedNode = stateManager.getNode('Group1', 'Node1');
      expect(updatedNode?.seq).toBe(0n);
    });
  });

  describe('bdSeq Generation', () => {
    it('should return 0 for first birth', () => {
      const bdSeq = rebirthManager.getNextBdSeq('Group1', 'Node1');
      expect(bdSeq).toBe(0n);
    });

    it('should return incremented bdSeq for existing node', () => {
      stateManager.createOrUpdateNode('Group1', 'Node1', 42n);

      const bdSeq = rebirthManager.getNextBdSeq('Group1', 'Node1');
      expect(bdSeq).toBe(43n);
    });

    it('should wrap bdSeq at 256', () => {
      stateManager.createOrUpdateNode('Group1', 'Node1', 255n);

      const bdSeq = rebirthManager.getNextBdSeq('Group1', 'Node1');
      expect(bdSeq).toBe(0n);
    });

    it('should return correct bdSeq for multiple nodes', () => {
      stateManager.createOrUpdateNode('Group1', 'Node1', 10n);
      stateManager.createOrUpdateNode('Group1', 'Node2', 20n);

      expect(rebirthManager.getNextBdSeq('Group1', 'Node1')).toBe(11n);
      expect(rebirthManager.getNextBdSeq('Group1', 'Node2')).toBe(21n);
    });
  });

  describe('Rebirth Sequence Validation', () => {
    it('should validate matching bdSeq', () => {
      const result = rebirthManager.validateRebirthSequence(
        'Group1',
        'Node1',
        42n,
        42n
      );

      expect(result).toBe(true);
    });

    it('should reject mismatched bdSeq', () => {
      const result = rebirthManager.validateRebirthSequence(
        'Group1',
        'Node1',
        42n,
        43n
      );

      expect(result).toBe(false);
    });

    it('should validate bdSeq = 0', () => {
      const result = rebirthManager.validateRebirthSequence(
        'Group1',
        'Node1',
        0n,
        0n
      );

      expect(result).toBe(true);
    });

    it('should validate high bdSeq values', () => {
      const result = rebirthManager.validateRebirthSequence(
        'Group1',
        'Node1',
        255n,
        255n
      );

      expect(result).toBe(true);
    });
  });

  describe('Sparkplug Compliance', () => {
    it('should enforce 0-255 bdSeq range (8-bit unsigned)', () => {
      stateManager.createOrUpdateNode('Group1', 'Node1', 254n);

      const bdSeq1 = rebirthManager.getNextBdSeq('Group1', 'Node1');
      expect(bdSeq1).toBe(255n);

      stateManager.setNodeOnline('Group1', 'Node1', 255n);

      const bdSeq2 = rebirthManager.getNextBdSeq('Group1', 'Node1');
      expect(bdSeq2).toBe(0n); // Wraps around
    });

    it('should handle complete bdSeq cycle (0-255)', () => {
      stateManager.createOrUpdateNode('Group1', 'Node1', 0n);

      for (let i = 1n; i <= 256n; i++) {
        const expected = i % 256n;
        const actual = rebirthManager.getNextBdSeq('Group1', 'Node1');
        expect(actual).toBe(expected);
        stateManager.setNodeOnline('Group1', 'Node1', expected);
      }

      // Should be back to 0
      const final = rebirthManager.getNextBdSeq('Group1', 'Node1');
      expect(final).toBe(1n);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle edge node connection loss and rebirth', () => {
      // Initial birth
      stateManager.createOrUpdateNode('FactoryFloor', 'PLC_001', 0n);

      // Simulate NDEATH (connection lost)
      stateManager.setNodeOffline('FactoryFloor', 'PLC_001');

      // Node reconnects - rebirth
      const newBdSeq = rebirthManager.handleRebirth('FactoryFloor', 'PLC_001', 0n);

      expect(newBdSeq).toBe(1n);

      const node = stateManager.getNode('FactoryFloor', 'PLC_001');
      expect(node?.online).toBe(true);
      expect(node?.bdSeq).toBe(1n);
      expect(node?.seq).toBe(0n);
    });

    it('should handle SCADA-initiated rebirth request', () => {
      // Node is online
      stateManager.createOrUpdateNode('Group1', 'Node1', 42n);

      // SCADA detects sequence mismatch, requests rebirth
      rebirthManager.requestRebirth({
        groupId: 'Group1',
        edgeNodeId: 'Node1',
        reason: 'Sequence number mismatch detected',
      });

      // Node will receive NCMD with Rebirth metric
      // Node will publish NDEATH then NBIRTH
      const newBdSeq = rebirthManager.handleRebirth('Group1', 'Node1', 42n);

      expect(newBdSeq).toBe(43n);
    });

    it('should handle multiple nodes rebirting independently', () => {
      stateManager.createOrUpdateNode('Group1', 'Node1', 10n);
      stateManager.createOrUpdateNode('Group1', 'Node2', 20n);
      stateManager.createOrUpdateNode('Group2', 'Node1', 30n);

      const bdSeq1 = rebirthManager.handleRebirth('Group1', 'Node1', 10n);
      const bdSeq2 = rebirthManager.handleRebirth('Group1', 'Node2', 20n);
      const bdSeq3 = rebirthManager.handleRebirth('Group2', 'Node1', 30n);

      expect(bdSeq1).toBe(11n);
      expect(bdSeq2).toBe(21n);
      expect(bdSeq3).toBe(31n);
    });

    it('should validate NBIRTH bdSeq matches LWT bdSeq', () => {
      // LWT (Last Will Testament) is set with bdSeq 42
      const lwtBdSeq = 42n;

      // Node publishes NBIRTH with same bdSeq
      const nbirthBdSeq = 42n;

      const valid = rebirthManager.validateRebirthSequence(
        'Group1',
        'Node1',
        nbirthBdSeq,
        lwtBdSeq
      );

      expect(valid).toBe(true);
    });

    it('should detect bdSeq mismatch between NBIRTH and LWT', () => {
      const lwtBdSeq = 42n;
      const nbirthBdSeq = 43n; // Wrong!

      const valid = rebirthManager.validateRebirthSequence(
        'Group1',
        'Node1',
        nbirthBdSeq,
        lwtBdSeq
      );

      expect(valid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rebirth immediately after first birth', () => {
      stateManager.createOrUpdateNode('Group1', 'Node1', 0n);

      const newBdSeq = rebirthManager.handleRebirth('Group1', 'Node1', 0n);
      expect(newBdSeq).toBe(1n);
    });

    it('should handle rapid rebirth cycles', () => {
      stateManager.createOrUpdateNode('Group1', 'Node1', 0n);

      let bdSeq = 0n;
      for (let i = 0; i < 10; i++) {
        bdSeq = rebirthManager.handleRebirth('Group1', 'Node1', bdSeq);
      }

      expect(bdSeq).toBe(10n);
    });

    it('should handle rebirth with maximum bdSeq', () => {
      stateManager.createOrUpdateNode('Group1', 'Node1', 255n);

      const newBdSeq = rebirthManager.handleRebirth('Group1', 'Node1', 255n);
      expect(newBdSeq).toBe(0n); // Wrap around
    });

    it('should handle getNextBdSeq for non-existent node', () => {
      const bdSeq = rebirthManager.getNextBdSeq('NonExistent', 'Node');
      expect(bdSeq).toBe(0n); // First birth
    });
  });

  describe('bdSeq Lifecycle', () => {
    it('should track complete node lifecycle', () => {
      // First connection - bdSeq = 0
      expect(rebirthManager.getNextBdSeq('Group1', 'Node1')).toBe(0n);
      stateManager.createOrUpdateNode('Group1', 'Node1', 0n);

      // First rebirth - bdSeq = 1
      expect(rebirthManager.getNextBdSeq('Group1', 'Node1')).toBe(1n);
      rebirthManager.handleRebirth('Group1', 'Node1', 0n);

      // Second rebirth - bdSeq = 2
      expect(rebirthManager.getNextBdSeq('Group1', 'Node1')).toBe(2n);
      rebirthManager.handleRebirth('Group1', 'Node1', 1n);

      // Third rebirth - bdSeq = 3
      expect(rebirthManager.getNextBdSeq('Group1', 'Node1')).toBe(3n);
    });
  });
});
