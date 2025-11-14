/**
 * History Listener
 * Automatically stores Sparkplug B metrics in Redis history
 * Sparkplug B Compliant - captures all metric updates
 */

import type Aedes from 'aedes';
import type { Client, PublishPacket } from 'aedes';
import { decodePayload } from '@sparkplug/codec';
import type { SCADAHistoryService } from './scada-history.js';

export class HistoryListener {
  private historyService: SCADAHistoryService;

  constructor(historyService: SCADAHistoryService) {
    this.historyService = historyService;
  }

  /**
   * Attach to Aedes broker to listen for Sparkplug messages
   */
  attach(aedes: Aedes): void {
    aedes.on('publish', async (packet: PublishPacket, client: Client | null) => {
      try {
        await this.handlePublish(packet);
      } catch (error) {
        console.error('History listener error:', error);
      }
    });
  }

  /**
   * Handle published messages
   */
  private async handlePublish(packet: PublishPacket): Promise<void> {
    const topic = packet.topic;

    // Only process Sparkplug B topics
    if (!topic.startsWith('spBv1.0/')) {
      return;
    }

    // Parse topic: spBv1.0/GROUP_ID/MESSAGE_TYPE/EDGE_NODE_ID/[DEVICE_ID]
    const parts = topic.split('/');
    if (parts.length < 4) {
      return;
    }

    const [namespace, groupId, messageType, edgeNodeId, deviceId] = parts;

    // Skip STATE messages
    if (messageType === 'STATE') {
      return;
    }

    // Only process data and birth messages
    const validTypes = ['NBIRTH', 'NDATA', 'DBIRTH', 'DDATA'];
    if (!validTypes.includes(messageType)) {
      return;
    }

    // Decode payload
    try {
      const payload = decodePayload(new Uint8Array(packet.payload as Buffer));

      if (!payload.metrics || payload.metrics.length === 0) {
        return;
      }

      const timestamp = payload.timestamp || BigInt(Date.now());

      // Store metrics based on message type
      if (messageType === 'NBIRTH' || messageType === 'NDATA') {
        // Node metrics
        await this.historyService.storeDataMetrics(
          groupId,
          edgeNodeId,
          payload.metrics,
          timestamp
        );
      } else if (messageType === 'DBIRTH' || messageType === 'DDATA') {
        // Device metrics
        if (deviceId) {
          await this.historyService.storeDataMetrics(
            groupId,
            edgeNodeId,
            payload.metrics,
            timestamp,
            deviceId
          );
        }
      }
    } catch (error) {
      // Silently ignore decode errors for non-Sparkplug messages
    }
  }
}
