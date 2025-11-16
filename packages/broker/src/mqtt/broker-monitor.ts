/**
 * Broker Monitor Service
 * Tracks sessions, timeouts, stale states, and detailed message logging
 */

import type Aedes from 'aedes';
import type { Client } from 'aedes';
import type { StateManager } from '@sparkplug/state';
import { parseTopic, MessageType } from '@sparkplug/namespace';
import { decodePayload, getBdSeq, encodePayload } from '@sparkplug/codec';
import { parseMQTTPacket, type MQTTPacketDetails } from './packet-parser.js';
import EventEmitter from 'node:events';

export interface SessionInfo {
  clientId: string;
  ip: string;
  port: number;
  connectedAt: number;
  lastActivity: number;
  cleanSession: boolean;
  keepAlive: number;
  protocolVersion: number;
  isStale: boolean;
  subscriptions: string[];
  willMessage?: {
    topic: string;
    payload: Uint8Array;
    qos: 0 | 1 | 2;
    retain: boolean;
  };
  sparkplugState?: {
    groupId?: string;
    edgeNodeId?: string;
    bdSeq?: bigint;
    expectedSeq?: bigint;
    ndeathPublished?: boolean;
    birthTimestamp?: number;
  };
  tls?: {
    authorized: boolean;
    peerCertificate?: any;
    cipher?: string;
  };
  username?: string;
  stats: {
    bytesIn: number;
    bytesOut: number;
    messagesIn: number;
    messagesOut: number;
  };
}

export interface DetailedBrokerLog {
  id: string;
  timestamp: number;
  type: 'publish' | 'subscribe' | 'unsubscribe' | 'connect' | 'disconnect';
  clientId: string;
  topic?: string;
  qos?: 0 | 1 | 2;
  retain?: boolean;
  messageType?: string;
  payload?: Uint8Array;
  decoded?: any;
  origin: {
    ip: string;
    port: number;
  };
  mqttPacket?: MQTTPacketDetails;
  sparkplugMetadata?: {
    groupId?: string;
    edgeNodeId?: string;
    deviceId?: string;
    bdSeq?: bigint;
    seq?: bigint;
    metricCount?: number;
    isStale?: boolean;
  };
  sessionInfo?: {
    isNewSession: boolean;
    sessionExpiry?: number;
    lastWillTopic?: string;
  };
}

export class BrokerMonitor extends EventEmitter {
  private sessions = new Map<string, SessionInfo>();
  private logs: DetailedBrokerLog[] = [];
  private maxLogs = 10000;
  private timeoutCheckInterval: NodeJS.Timeout | null = null;
  private aedes: Aedes;
  private stateManager: StateManager;

  // Statistics
  private stats = {
    totalConnections: 0,
    activeConnections: 0,
    totalMessages: 0,
    messagesPerSecond: 0,
    bytesReceived: 0,
    bytesSent: 0,
    startTime: Date.now(),
  };

  constructor(aedes: Aedes, stateManager: StateManager) {
    super();
    this.aedes = aedes;
    this.stateManager = stateManager;
    this.setupMonitoring();
    this.startTimeoutChecker();
  }

  private setupMonitoring(): void {
    // Monitor client connections
    this.aedes.on('client', (client: Client) => {
      this.handleClientConnect(client);
    });

    // Monitor client disconnections
    this.aedes.on('clientDisconnect', (client: Client) => {
      this.handleClientDisconnect(client);
    });

    // Monitor published messages
    this.aedes.on('publish', (packet: any, client: Client | null) => {
      if (client) {
        this.handlePublish(packet, client);
      }
    });

    // Monitor subscriptions
    this.aedes.on('subscribe', (subscriptions: any[], client: Client) => {
      this.handleSubscribe(subscriptions, client);
    });

    // Monitor unsubscriptions
    this.aedes.on('unsubscribe', (unsubscriptions: string[], client: Client) => {
      this.handleUnsubscribe(unsubscriptions, client);
    });

    // Monitor client errors
    this.aedes.on('clientError', (client: Client, error: Error) => {
      console.error(`Client ${client.id} error:`, error);
    });
  }

  private handleClientConnect(client: Client): void {
    // Extract TLS information if available
    const conn = client.conn as any;
    const tlsInfo = conn?.encrypted ? {
      authorized: conn.authorized || false,
      peerCertificate: conn.getPeerCertificate ? conn.getPeerCertificate() : undefined,
      cipher: conn.getCipher ? conn.getCipher()?.name : undefined,
    } : undefined;

    const session: SessionInfo = {
      clientId: client.id,
      ip: conn?.remoteAddress || 'unknown',
      port: conn?.remotePort || 0,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      cleanSession: client.clean !== false,
      keepAlive: (client as any).keepalive || 60,
      protocolVersion: (client as any).version || 4,
      isStale: false,
      subscriptions: [],
      willMessage: (client as any).will ? {
        topic: (client as any).will.topic,
        payload: new Uint8Array((client as any).will.payload),
        qos: (client as any).will.qos as 0 | 1 | 2,
        retain: (client as any).will.retain,
      } : undefined,
      tls: tlsInfo,
      username: (client as any).username,
      stats: {
        bytesIn: 0,
        bytesOut: 0,
        messagesIn: 0,
        messagesOut: 0,
      },
    };

    this.sessions.set(client.id, session);
    this.stats.totalConnections++;
    this.stats.activeConnections = this.sessions.size;

    // Log connection
    const log: DetailedBrokerLog = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      type: 'connect',
      clientId: client.id,
      origin: {
        ip: session.ip,
        port: session.port,
      },
      sessionInfo: {
        isNewSession: session.cleanSession,
        lastWillTopic: session.willMessage?.topic,
      },
    };

    this.addLog(log);
    this.emit('clientConnect', session);
    this.emit('log', log);
  }

  private handleClientDisconnect(client: Client): void {
    const session = this.sessions.get(client.id);

    if (session) {
      // Check if we need to publish NDEATH for Sparkplug clients
      if (session.sparkplugState && !session.sparkplugState.ndeathPublished) {
        this.publishNDeath(session);
      }

      // Log disconnection
      const log: DetailedBrokerLog = {
        id: this.generateLogId(),
        timestamp: Date.now(),
        type: 'disconnect',
        clientId: client.id,
        origin: {
          ip: session.ip,
          port: session.port,
        },
      };

      this.addLog(log);
      this.emit('clientDisconnect', session);
      this.emit('log', log);

      // Remove session if clean
      if (session.cleanSession) {
        this.sessions.delete(client.id);
      }
    }

    this.stats.activeConnections = this.sessions.size;
  }

  private handlePublish(packet: any, client: Client | null): void {
    // Handle broker-published messages (client will be null)
    const clientId = client?.id || 'broker';
    const session = client ? this.sessions.get(client.id) : null;

    // Update session activity if this is a client message
    if (session) {
      session.lastActivity = Date.now();
      session.isStale = false;
      session.stats.messagesIn++;
      session.stats.bytesIn += packet.payload?.length || 0;
    }

    this.stats.totalMessages++;
    this.stats.bytesReceived += packet.payload?.length || 0;

    // Skip system topics
    if (packet.topic.startsWith('$SYS/')) return;

    // Parse MQTT packet details
    const mqttPacket = parseMQTTPacket(packet);

    // Parse Sparkplug topic
    const parsed = parseTopic(packet.topic);
    let decoded: any = null;
    let sparkplugMetadata: DetailedBrokerLog['sparkplugMetadata'] = undefined;

    if (parsed.isValid) {
      try {
        decoded = decodePayload(new Uint8Array(packet.payload));

        sparkplugMetadata = {
          groupId: parsed.groupId,
          edgeNodeId: parsed.edgeNodeId,
          deviceId: parsed.deviceId,
          bdSeq: decoded.timestamp !== undefined ? BigInt(decoded.timestamp) : undefined,
          seq: decoded.seq !== undefined ? BigInt(decoded.seq) : undefined,
          metricCount: decoded.metrics?.length || 0,
        };

        // Update session Sparkplug state
        if (parsed.messageType === MessageType.NBIRTH) {
          const bdSeq = getBdSeq(decoded);
          if (bdSeq !== null) {
            session.sparkplugState = {
              groupId: parsed.groupId,
              edgeNodeId: parsed.edgeNodeId,
              bdSeq: BigInt(bdSeq),
              expectedSeq: 0n,
              ndeathPublished: false,
              birthTimestamp: Date.now(),
            };
          }
        } else if (parsed.messageType === MessageType.NDEATH) {
          if (session.sparkplugState) {
            session.sparkplugState.ndeathPublished = true;
          }
        } else if (parsed.messageType === MessageType.NDATA && session.sparkplugState) {
          if (decoded.seq !== undefined) {
            session.sparkplugState.expectedSeq = (BigInt(decoded.seq) + 1n) % 256n;
          }
        }
      } catch (error) {
        console.error('Error decoding Sparkplug payload:', error);
      }
    }

    // Create detailed log
    const log: DetailedBrokerLog = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      type: 'publish',
      clientId,
      topic: packet.topic,
      qos: packet.qos as 0 | 1 | 2,
      retain: packet.retain,
      messageType: parsed.isValid ? parsed.messageType : undefined,
      payload: new Uint8Array(packet.payload),
      decoded,
      origin: session ? {
        ip: session.ip,
        port: session.port,
      } : {
        ip: 'broker',
        port: 0,
      },
      mqttPacket: mqttPacket || undefined,
      sparkplugMetadata,
      sessionInfo: session && session.willMessage ? {
        isNewSession: false,
        lastWillTopic: session.willMessage.topic,
      } : undefined,
    };

    this.addLog(log);
    this.emit('log', log);
  }

  private handleSubscribe(subscriptions: any[], client: Client): void {
    const session = this.sessions.get(client.id);
    if (!session) return;

    session.lastActivity = Date.now();

    for (const sub of subscriptions) {
      if (!session.subscriptions.includes(sub.topic)) {
        session.subscriptions.push(sub.topic);
      }

      const log: DetailedBrokerLog = {
        id: this.generateLogId(),
        timestamp: Date.now(),
        type: 'subscribe',
        clientId: client.id,
        topic: sub.topic,
        qos: sub.qos,
        origin: {
          ip: session.ip,
          port: session.port,
        },
      };

      this.addLog(log);
      this.emit('log', log);
    }
  }

  private handleUnsubscribe(unsubscriptions: string[], client: Client): void {
    const session = this.sessions.get(client.id);
    if (!session) return;

    session.lastActivity = Date.now();

    for (const topic of unsubscriptions) {
      const index = session.subscriptions.indexOf(topic);
      if (index > -1) {
        session.subscriptions.splice(index, 1);
      }

      const log: DetailedBrokerLog = {
        id: this.generateLogId(),
        timestamp: Date.now(),
        type: 'unsubscribe',
        clientId: client.id,
        topic,
        origin: {
          ip: session.ip,
          port: session.port,
        },
      };

      this.addLog(log);
      this.emit('log', log);
    }
  }

  /**
   * Check for stale sessions and publish NDEATH for Sparkplug nodes
   */
  private startTimeoutChecker(): void {
    this.timeoutCheckInterval = setInterval(() => {
      const now = Date.now();

      for (const [clientId, session] of this.sessions) {
        const timeSinceLastActivity = now - session.lastActivity;
        const staleThreshold = session.keepAlive * 1.5 * 1000; // keepAlive * 1.5 in milliseconds

        if (timeSinceLastActivity > staleThreshold && !session.isStale) {
          session.isStale = true;

          // Publish NDEATH for Sparkplug nodes
          if (session.sparkplugState && !session.sparkplugState.ndeathPublished) {
            console.log(`Session ${clientId} is stale, publishing NDEATH`);
            this.publishNDeath(session);
          }

          this.emit('sessionStale', session);
        }
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Publish NDEATH message for a stale/disconnected Sparkplug node
   */
  private publishNDeath(session: SessionInfo): void {
    if (!session.sparkplugState) return;

    const { groupId, edgeNodeId, bdSeq } = session.sparkplugState;
    if (!groupId || !edgeNodeId) return;

    // Build NDEATH topic
    const ndeathTopic = `spBv1.0/${groupId}/NDEATH/${edgeNodeId}`;

    // Build NDEATH payload with bdSeq
    const ndeathPayload = {
      timestamp: BigInt(Date.now()),
      metrics: [
        {
          name: 'bdSeq',
          timestamp: BigInt(Date.now()),
          datatype: 4, // UInt64
          value: bdSeq,
        },
      ],
    };

    try {
      const encoded = encodePayload(ndeathPayload);
      const buffer = Buffer.from(encoded);

      // Publish NDEATH through broker
      this.aedes.publish(
        {
          cmd: 'publish',
          qos: 0,
          dup: false,
          topic: ndeathTopic,
          payload: buffer,
          retain: false,
        },
        (error) => {
          if (error) {
            console.error('Error publishing NDEATH:', error);
          } else {
            console.log(`NDEATH published for ${groupId}/${edgeNodeId}`);
            session.sparkplugState!.ndeathPublished = true;

            // Update state manager
            this.stateManager.setNodeOffline(groupId, edgeNodeId);
          }
        }
      );
    } catch (error) {
      console.error('Error encoding NDEATH payload:', error);
    }
  }

  /**
   * Add log entry
   */
  private addLog(log: DetailedBrokerLog): void {
    this.logs.unshift(log);

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all sessions
   */
  public getSessions(): SessionInfo[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get session by client ID
   */
  public getSession(clientId: string): SessionInfo | undefined {
    return this.sessions.get(clientId);
  }

  /**
   * Get all logs
   */
  public getLogs(limit?: number): DetailedBrokerLog[] {
    return limit ? this.logs.slice(0, limit) : this.logs;
  }

  /**
   * Get broker statistics
   */
  public getStats() {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.startTime,
      activeConnections: this.sessions.size,
    };
  }

  /**
   * Clear logs
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Stop monitoring
   */
  public stop(): void {
    if (this.timeoutCheckInterval) {
      clearInterval(this.timeoutCheckInterval);
      this.timeoutCheckInterval = null;
    }
  }
}
