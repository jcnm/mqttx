import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionManager } from '../src/session.js';
import { StateManager } from '../src/manager.js';

describe('SessionManager', () => {
  let stateManager: StateManager;
  let sessionManager: SessionManager;

  beforeEach(() => {
    stateManager = new StateManager();
    sessionManager = new SessionManager(stateManager);
  });

  describe('Session Creation', () => {
    it('should create session with clean session = true', () => {
      sessionManager.createSession({
        clientId: 'Client1',
        cleanSession: true,
      });

      const session = sessionManager.getSession('Client1');
      expect(session).not.toBeNull();
      expect(session?.clientId).toBe('Client1');
      expect(session?.cleanSession).toBe(true);
      expect(session?.connected).toBe(true);
    });

    it('should create session with bdSeq', () => {
      sessionManager.createSession({
        clientId: 'Client1',
        cleanSession: true,
        bdSeq: 42n,
      });

      const session = sessionManager.getSession('Client1');
      expect(session?.bdSeq).toBe(42n);
    });

    it('should warn when clean session = false', () => {
      const warnSpy = vi.spyOn(console, 'warn');

      sessionManager.createSession({
        clientId: 'Client1',
        cleanSession: false,
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sparkplug requires Clean Session = true')
      );

      warnSpy.mockRestore();
    });

    it('should create session even with clean session = false', () => {
      sessionManager.createSession({
        clientId: 'Client1',
        cleanSession: false,
      });

      const session = sessionManager.getSession('Client1');
      expect(session).not.toBeNull();
      expect(session?.cleanSession).toBe(false);
    });
  });

  describe('Session Disconnect', () => {
    it('should disconnect active session', () => {
      sessionManager.createSession({
        clientId: 'Client1',
        cleanSession: false, // Keep session after disconnect so we can check its state
      });

      sessionManager.disconnectSession('Client1');

      const session = sessionManager.getSession('Client1');
      expect(session?.connected).toBe(false);
      expect(session?.disconnectTime).toBeGreaterThan(0);
    });

    it('should remove session if clean session = true', () => {
      sessionManager.createSession({
        clientId: 'Client1',
        cleanSession: true,
      });

      sessionManager.disconnectSession('Client1');

      const session = sessionManager.getSession('Client1');
      expect(session).toBeNull();
    });

    it('should keep session if clean session = false', () => {
      sessionManager.createSession({
        clientId: 'Client1',
        cleanSession: false,
      });

      sessionManager.disconnectSession('Client1');

      const session = sessionManager.getSession('Client1');
      expect(session).not.toBeNull();
      expect(session?.connected).toBe(false);
    });

    it('should handle disconnect of non-existent session', () => {
      expect(() => sessionManager.disconnectSession('NonExistent')).not.toThrow();
    });
  });

  describe('Session Expiry Validation', () => {
    it('should accept session expiry = 0', () => {
      const result = sessionManager.validateSessionExpiry(0);
      expect(result).toBe(true);
    });

    it('should reject session expiry > 0', () => {
      const warnSpy = vi.spyOn(console, 'warn');

      const result = sessionManager.validateSessionExpiry(3600);

      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sparkplug requires 0')
      );

      warnSpy.mockRestore();
    });

    it('should reject negative session expiry', () => {
      const result = sessionManager.validateSessionExpiry(-1);
      expect(result).toBe(false);
    });
  });

  describe('Session Status Checks', () => {
    it('should return true for active session', () => {
      sessionManager.createSession({
        clientId: 'Client1',
        cleanSession: true,
      });

      expect(sessionManager.isSessionActive('Client1')).toBe(true);
    });

    it('should return false for disconnected session', () => {
      sessionManager.createSession({
        clientId: 'Client1',
        cleanSession: false, // Keep session after disconnect
      });

      sessionManager.disconnectSession('Client1');

      expect(sessionManager.isSessionActive('Client1')).toBe(false);
    });

    it('should return false for non-existent session', () => {
      expect(sessionManager.isSessionActive('NonExistent')).toBe(false);
    });
  });

  describe('Session Retrieval', () => {
    it('should get session info', () => {
      sessionManager.createSession({
        clientId: 'Client1',
        cleanSession: true,
        bdSeq: 42n,
      });

      const session = sessionManager.getSession('Client1');
      expect(session).toMatchObject({
        clientId: 'Client1',
        cleanSession: true,
        connected: true,
        bdSeq: 42n,
      });
    });

    it('should return null for non-existent session', () => {
      const session = sessionManager.getSession('NonExistent');
      expect(session).toBeNull();
    });
  });

  describe('Sparkplug Compliance', () => {
    it('should enforce clean session = true for Sparkplug', () => {
      const warnSpy = vi.spyOn(console, 'warn');

      sessionManager.createSession({
        clientId: 'EdgeNode1',
        cleanSession: false,
      });

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should enforce session expiry = 0 for Sparkplug', () => {
      expect(sessionManager.validateSessionExpiry(0)).toBe(true);
      expect(sessionManager.validateSessionExpiry(1)).toBe(false);
      expect(sessionManager.validateSessionExpiry(3600)).toBe(false);
    });

    it('should not throw on compliant session configuration', () => {
      expect(() =>
        sessionManager.createSession({
          clientId: 'EdgeNode1',
          cleanSession: true,
          bdSeq: 0n,
        })
      ).not.toThrow();

      expect(sessionManager.validateSessionExpiry(0)).toBe(true);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle edge node connection lifecycle', () => {
      // Edge node connects
      sessionManager.createSession({
        clientId: 'EdgeNode_PLC_001',
        cleanSession: true,
        bdSeq: 42n,
      });

      expect(sessionManager.isSessionActive('EdgeNode_PLC_001')).toBe(true);

      // Edge node disconnects
      sessionManager.disconnectSession('EdgeNode_PLC_001');

      // Session should be removed (clean session = true)
      expect(sessionManager.getSession('EdgeNode_PLC_001')).toBeNull();
    });

    it('should handle reconnection with different bdSeq', () => {
      // Initial connection
      sessionManager.createSession({
        clientId: 'EdgeNode1',
        cleanSession: true,
        bdSeq: 42n,
      });

      // Disconnect
      sessionManager.disconnectSession('EdgeNode1');

      // Reconnect with incremented bdSeq
      sessionManager.createSession({
        clientId: 'EdgeNode1',
        cleanSession: true,
        bdSeq: 43n,
      });

      const session = sessionManager.getSession('EdgeNode1');
      expect(session?.bdSeq).toBe(43n);
      expect(session?.connected).toBe(true);
    });

    it('should handle multiple concurrent sessions', () => {
      sessionManager.createSession({
        clientId: 'EdgeNode1',
        cleanSession: true,
      });

      sessionManager.createSession({
        clientId: 'EdgeNode2',
        cleanSession: true,
      });

      sessionManager.createSession({
        clientId: 'SCADA_Host',
        cleanSession: true,
      });

      expect(sessionManager.isSessionActive('EdgeNode1')).toBe(true);
      expect(sessionManager.isSessionActive('EdgeNode2')).toBe(true);
      expect(sessionManager.isSessionActive('SCADA_Host')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle session creation with same clientId', () => {
      sessionManager.createSession({
        clientId: 'Client1',
        cleanSession: true,
        bdSeq: 42n,
      });

      // Create again with same clientId
      sessionManager.createSession({
        clientId: 'Client1',
        cleanSession: true,
        bdSeq: 43n,
      });

      const session = sessionManager.getSession('Client1');
      expect(session?.bdSeq).toBe(43n);
    });

    it('should handle rapid connect/disconnect cycles', () => {
      for (let i = 0; i < 10; i++) {
        sessionManager.createSession({
          clientId: 'Client1',
          cleanSession: true,
        });

        sessionManager.disconnectSession('Client1');
      }

      // Session should be removed after last disconnect
      expect(sessionManager.getSession('Client1')).toBeNull();
    });

    it('should handle session without bdSeq', () => {
      sessionManager.createSession({
        clientId: 'Client1',
        cleanSession: true,
      });

      const session = sessionManager.getSession('Client1');
      expect(session?.bdSeq).toBeUndefined();
    });
  });
});
