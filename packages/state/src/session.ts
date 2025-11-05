// Session Lifecycle Management for Sparkplug
// Handles MQTT session state and clean session enforcement

import type { StateManager } from './manager.js';

export interface SessionOptions {
  clientId: string;
  cleanSession: boolean;
  bdSeq?: bigint;
}

export class SessionManager {
  constructor(private stateManager: StateManager) {}

  /**
   * Create or restore a session
   * Sparkplug requires Clean Session = true
   */
  createSession(options: SessionOptions): void {
    // Sparkplug specification: Clean Session must be true
    if (!options.cleanSession) {
      console.warn(
        `Client ${options.clientId} connected with Clean Session = false. Sparkplug requires Clean Session = true`
      );
    }

    this.stateManager.createSession(
      options.clientId,
      options.cleanSession,
      options.bdSeq
    );

    console.log(
      `Session created for ${options.clientId}, cleanSession=${options.cleanSession}`
    );
  }

  /**
   * Handle session disconnect
   */
  disconnectSession(clientId: string): void {
    const session = this.stateManager.getSession(clientId);

    if (session) {
      this.stateManager.disconnectSession(clientId);
      console.log(`Session disconnected for ${clientId}`);

      // If clean session, remove session data
      if (session.cleanSession) {
        this.stateManager.removeSession(clientId);
      }
    }
  }

  /**
   * Validate session expiry
   * Sparkplug requires Session Expiry Interval = 0
   */
  validateSessionExpiry(sessionExpiry: number): boolean {
    if (sessionExpiry !== 0) {
      console.warn(
        `Session Expiry Interval is ${sessionExpiry}, but Sparkplug requires 0`
      );
      return false;
    }
    return true;
  }

  /**
   * Get session info
   */
  getSession(clientId: string) {
    return this.stateManager.getSession(clientId);
  }

  /**
   * Check if session exists and is connected
   */
  isSessionActive(clientId: string): boolean {
    const session = this.stateManager.getSession(clientId);
    return session?.connected ?? false;
  }
}
