/**
 * Command Acknowledgement Tracker
 * Monitors incoming NDATA/DDATA messages for command acknowledgements
 * Sparkplug B Compliant - follows command/response pattern
 */

import { decodePayload } from '@sparkplug/codec';
import { useCommandStore } from '../stores/commandStore';
import { useMQTTStore } from '../stores/mqttStore';

export interface PendingCommand {
  id: string;
  type: 'NCMD' | 'DCMD';
  target: {
    groupId: string;
    edgeNodeId: string;
    deviceId?: string;
  };
  metrics: string[]; // Metric names sent
  sentAt: number;
  timeout: number; // ms
}

class CommandTracker {
  private pendingCommands: Map<string, PendingCommand> = new Map();
  private unsubscribe: (() => void) | null = null;

  /**
   * Start monitoring for command acknowledgements
   */
  start() {
    if (this.unsubscribe) return; // Already started

    // Subscribe to MQTT messages
    this.unsubscribe = useMQTTStore.subscribe((state) => {
      const latestMessages = state.messages.slice(-5);

      latestMessages.forEach((msg) => {
        // Only process NDATA/DDATA messages (responses)
        if (msg.topic.includes('/NDATA/') || msg.topic.includes('/DDATA/')) {
          this.processResponseMessage(msg.topic, msg.payload);
        }
      });
    });

    console.log('✅ Command tracker started');
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    console.log('🛑 Command tracker stopped');
  }

  /**
   * Register a command for tracking
   */
  registerCommand(commandId: string, command: PendingCommand) {
    this.pendingCommands.set(commandId, command);

    // Set timeout for command
    setTimeout(() => {
      this.handleCommandTimeout(commandId);
    }, command.timeout || 30000); // Default 30s timeout
  }

  /**
   * Process incoming NDATA/DDATA messages looking for ACKs
   */
  private processResponseMessage(topic: string, payload: Buffer | number[]) {
    try {
      // Parse topic: spBv1.0/GROUP_ID/NDATA|DDATA/EDGE_NODE_ID[/DEVICE_ID]
      const parts = topic.split('/');
      if (parts.length < 4) return;

      const messageType = parts[2]; // NDATA or DDATA
      const groupId = parts[1];
      const edgeNodeId = parts[3];
      const deviceId = parts[4]; // Optional

      // Decode Sparkplug payload
      const decoded = decodePayload(new Uint8Array(payload));
      if (!decoded.metrics) return;

      // Check if this message contains responses to our commands
      const matchingCommands = Array.from(this.pendingCommands.entries()).filter(
        ([_, cmd]) => {
          // Match by target
          const targetMatches =
            cmd.target.groupId === groupId &&
            cmd.target.edgeNodeId === edgeNodeId &&
            (messageType === 'NDATA' ? !cmd.target.deviceId : cmd.target.deviceId === deviceId);

          if (!targetMatches) return false;

          // Check if response contains any of our command metrics
          const responseMetricNames = decoded.metrics!.map((m) => m.name || '');
          return cmd.metrics.some((metricName) => responseMetricNames.includes(metricName));
        }
      );

      // Mark matching commands as acknowledged
      matchingCommands.forEach(([commandId]) => {
        this.handleCommandAcknowledged(commandId, decoded.timestamp || BigInt(Date.now()));
      });
    } catch (err) {
      console.error('Failed to process response message:', err);
    }
  }

  /**
   * Handle command acknowledgement
   */
  private handleCommandAcknowledged(commandId: string, timestamp: bigint) {
    const cmd = this.pendingCommands.get(commandId);
    if (!cmd) return;

    // Update command status in store
    const commandStore = useCommandStore.getState();
    commandStore.updateCommand(commandId, {
      status: 'acknowledged',
      acknowledgedAt: Number(timestamp),
    });

    // Update history stats
    const newHistory = {
      ...commandStore.history,
      totalAcknowledged: commandStore.history.totalAcknowledged + 1,
    };
    useCommandStore.setState({ history: newHistory });

    // Remove from pending
    this.pendingCommands.delete(commandId);

    console.log(`✅ Command ${commandId} acknowledged`);
  }

  /**
   * Handle command timeout
   */
  private handleCommandTimeout(commandId: string) {
    if (!this.pendingCommands.has(commandId)) return; // Already acknowledged

    // Update command status
    const commandStore = useCommandStore.getState();
    commandStore.updateCommand(commandId, {
      status: 'failed',
      error: 'Command timed out (no response within timeout period)',
    });

    // Update history stats
    const newHistory = {
      ...commandStore.history,
      totalFailed: commandStore.history.totalFailed + 1,
    };
    useCommandStore.setState({ history: newHistory });

    // Remove from pending
    this.pendingCommands.delete(commandId);

    console.warn(`⏱️ Command ${commandId} timed out`);
  }

  /**
   * Get pending commands count
   */
  getPendingCount(): number {
    return this.pendingCommands.size;
  }

  /**
   * Clear all pending commands
   */
  clearPending() {
    this.pendingCommands.clear();
  }
}

// Singleton instance
export const commandTracker = new CommandTracker();

// Auto-start tracker
if (typeof window !== 'undefined') {
  commandTracker.start();
}
