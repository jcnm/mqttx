/**
 * Broker WebSocket Service
 * Connects to the broker backend WebSocket and synchronizes data with the broker store
 */

import { useBrokerStore } from '../stores/brokerStore';
import type { BrokerLog, Session } from '../types/broker.types';

export class BrokerWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 2000;
  private isIntentionallyClosed = false;

  constructor(private brokerUrl: string) {}

  /**
   * Connect to broker WebSocket
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('📡 Broker WebSocket already connected or connecting');
      return;
    }

    this.isIntentionallyClosed = false;

    try {
      console.log(`📡 Connecting to broker WebSocket: ${this.brokerUrl}`);
      this.ws = new WebSocket(this.brokerUrl);

      this.ws.onopen = () => {
        console.log('✅ Broker WebSocket connected');
        this.reconnectAttempts = 0;
        if (this.reconnectInterval) {
          clearTimeout(this.reconnectInterval);
          this.reconnectInterval = null;
        }

        // Send ping to keep connection alive
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('❌ Error parsing broker WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Broker WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('📡 Broker WebSocket closed');
        this.stopPingInterval();

        if (!this.isIntentionallyClosed) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('❌ Failed to create broker WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: any): void {
    const store = useBrokerStore.getState();

    switch (message.type) {
      case 'initial':
        // Initial data dump
        console.log('📥 Received initial broker data');

        // Clear existing data
        store.clearLogs();

        // Load stats
        if (message.data.stats) {
          store.updateStats(message.data.stats);
        }

        // Load sessions
        if (message.data.sessions && Array.isArray(message.data.sessions)) {
          message.data.sessions.forEach((session: Session) => {
            store.addSession(this.convertSession(session));
          });
        }

        // Load logs
        if (message.data.logs && Array.isArray(message.data.logs)) {
          message.data.logs.forEach((log: any) => {
            store.addLog(this.convertLog(log));
          });
        }
        break;

      case 'log':
        // New log entry
        store.addLog(this.convertLog(message.data));
        break;

      case 'clientConnect':
        // New client connected
        store.addSession(this.convertSession(message.data));

        // Add subscription for each topic
        if (message.data.subscriptions && Array.isArray(message.data.subscriptions)) {
          message.data.subscriptions.forEach((topic: string) => {
            store.addSubscription({
              clientId: message.data.clientId,
              topic,
              qos: 0,
              subscribedAt: Date.now(),
            });
          });
        }
        break;

      case 'clientDisconnect':
        // Client disconnected
        store.removeSession(message.data.clientId);
        break;

      case 'sessionStale':
        // Session became stale
        store.updateSession(message.data.clientId, { isStale: true });
        break;

      case 'stats':
        // Periodic stats update
        store.updateStats(message.data);
        break;

      case 'pong':
        // Pong response (keep-alive)
        break;

      default:
        console.warn('⚠️ Unknown broker WebSocket message type:', message.type);
    }
  }

  /**
   * Convert backend log to frontend format
   */
  private convertLog(backendLog: any): BrokerLog {
    return {
      id: backendLog.id,
      timestamp: backendLog.timestamp,
      type: backendLog.type,
      clientId: backendLog.clientId,
      topic: backendLog.topic,
      qos: backendLog.qos,
      retain: backendLog.retain,
      messageType: backendLog.messageType,
      payload: backendLog.payload,
      decoded: backendLog.decoded,
      origin: backendLog.origin || { ip: 'unknown', port: 0 },
      mqttPacket: backendLog.mqttPacket,
      sparkplugMetadata: backendLog.sparkplugMetadata,
      sessionInfo: backendLog.sessionInfo,
    };
  }

  /**
   * Convert backend session to frontend format
   */
  private convertSession(backendSession: any): Session {
    return {
      clientId: backendSession.clientId,
      ip: backendSession.ip,
      port: backendSession.port,
      connectedAt: backendSession.connectedAt,
      lastActivity: backendSession.lastActivity,
      cleanSession: backendSession.cleanSession,
      keepAlive: backendSession.keepAlive,
      protocolVersion: backendSession.protocolVersion,
      isStale: backendSession.isStale,
      subscriptions: backendSession.subscriptions || [],
      willTopic: backendSession.willMessage?.topic,
      willMessage: backendSession.willMessage,
      tls: backendSession.tls,
      username: backendSession.username,
      sparkplugState: backendSession.sparkplugState,
      stats: backendSession.stats,
    };
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached for broker WebSocket');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5);

    console.log(`🔄 Attempting to reconnect to broker WebSocket in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectInterval = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private pingInterval: NodeJS.Timeout | null = null;

  /**
   * Start sending periodic ping messages
   */
  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopPingInterval();

    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    console.log('📡 Broker WebSocket disconnected');
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let brokerWebSocketInstance: BrokerWebSocketService | null = null;

/**
 * Get or create broker WebSocket service instance
 */
export function getBrokerWebSocket(): BrokerWebSocketService {
  if (!brokerWebSocketInstance) {
    // Get broker URL from environment or use default
    const brokerWsUrl = import.meta.env.VITE_BROKER_WS_URL || 'ws://localhost:3000/ws';
    brokerWebSocketInstance = new BrokerWebSocketService(brokerWsUrl);
  }
  return brokerWebSocketInstance;
}

/**
 * Initialize broker WebSocket connection
 * Call this when the app starts
 */
export function initBrokerWebSocket(): void {
  const service = getBrokerWebSocket();
  service.connect();
}

/**
 * Cleanup broker WebSocket connection
 * Call this when the app unmounts
 */
export function cleanupBrokerWebSocket(): void {
  if (brokerWebSocketInstance) {
    brokerWebSocketInstance.disconnect();
    brokerWebSocketInstance = null;
  }
}
