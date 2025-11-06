// Sparkplug Compliant MQTT Broker
// Core Aedes broker with Sparkplug compliance features

import Aedes from 'aedes';
import { createServer } from 'node:net';
import { createServer as createHttpServer } from 'node:http';
import { WebSocketServer } from 'ws';
import websocketStream from 'websocket-stream';
import type { ConfigLoader } from '../config/loader.js';
import type { StateManager } from '@sparkplug/state';
import { MessageType, parseTopic } from '@sparkplug/namespace';
import { decodePayload, getBdSeq } from '@sparkplug/codec';

export interface BrokerOptions {
  config: ConfigLoader;
  stateManager: StateManager;
}

export class SparkplugBroker {
  private aedes: Aedes;
  private config: ConfigLoader;
  private stateManager: StateManager;
  private tcpServer: ReturnType<typeof createServer> | null = null;
  private wsServer: ReturnType<typeof createHttpServer> | null = null;

  constructor(options: BrokerOptions) {
    this.config = options.config;
    this.stateManager = options.stateManager;

    // Initialize Aedes broker
    this.aedes = new Aedes({
      id: 'sparkplug-broker',
      persistence: undefined, // Will add Redis persistence later
    });

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Client connection handler
    this.aedes.on('client', (client) => {
      console.log(`Client connected: ${client.id}`);
    });

    // Client disconnection handler
    this.aedes.on('clientDisconnect', (client) => {
      console.log(`Client disconnected: ${client.id}`);
    });

    // Message publish handler
    this.aedes.on('publish', async (packet, client) => {
      if (!client) return; // Internal message

      try {
        await this.handlePublish(packet, client);
      } catch (error) {
        console.error('Error handling publish:', error);
      }
    });

    // Subscribe handler
    this.aedes.on('subscribe', (subscriptions, client) => {
      console.log(
        `Client ${client.id} subscribed to:`,
        subscriptions.map((s) => s.topic).join(', ')
      );
    });

    // Error handler
    this.aedes.on('clientError', (client, error) => {
      console.error(`Client ${client.id} error:`, error);
    });
  }

  private async handlePublish(packet: any, client: any): Promise<void> {
    const topic = packet.topic;

    // Skip system topics
    if (topic.startsWith('$SYS/')) return;

    // Parse Sparkplug topic
    const parsed = parseTopic(topic);

    if (!parsed.isValid) {
      console.warn(`Invalid Sparkplug topic: ${topic}`, parsed.errors);
      return;
    }

    // Handle different message types
    switch (parsed.messageType) {
      case MessageType.NBIRTH:
        await this.handleNBirth(parsed, packet.payload, client);
        break;
      case MessageType.NDEATH:
        await this.handleNDeath(parsed, packet.payload, client);
        break;
      case MessageType.DBIRTH:
        await this.handleDBirth(parsed, packet.payload, client);
        break;
      case MessageType.DDEATH:
        await this.handleDDeath(parsed, packet.payload, client);
        break;
      case MessageType.NDATA:
        await this.handleNData(parsed, packet.payload, client);
        break;
      case MessageType.DDATA:
        await this.handleDData(parsed, packet.payload, client);
        break;
      case MessageType.NCMD:
      case MessageType.DCMD:
        console.log(`Command received: ${parsed.messageType} on ${topic}`);
        break;
      case MessageType.STATE:
        console.log(`STATE message received from ${parsed.edgeNodeId}`);
        break;
    }
  }

  private async handleNBirth(parsed: any, payload: Buffer, client: any): Promise<void> {
    try {
      const decoded = decodePayload(new Uint8Array(payload));
      const bdSeq = getBdSeq(decoded);

      if (bdSeq !== null && parsed.groupId && parsed.edgeNodeId) {
        this.stateManager.setNodeOnline(parsed.groupId, parsed.edgeNodeId, bdSeq);
        console.log(
          `Node birth: ${parsed.groupId}/${parsed.edgeNodeId} with bdSeq ${bdSeq}`
        );
      }
    } catch (error) {
      console.error('Error handling NBIRTH:', error);
    }
  }

  private async handleNDeath(parsed: any, payload: Buffer, client: any): Promise<void> {
    if (parsed.groupId && parsed.edgeNodeId) {
      this.stateManager.setNodeOffline(parsed.groupId, parsed.edgeNodeId);
      console.log(`Node death: ${parsed.groupId}/${parsed.edgeNodeId}`);
    }
  }

  private async handleDBirth(parsed: any, payload: Buffer, client: any): Promise<void> {
    if (parsed.groupId && parsed.edgeNodeId && parsed.deviceId) {
      this.stateManager.setDeviceOnline(
        parsed.groupId,
        parsed.edgeNodeId,
        parsed.deviceId
      );
      console.log(
        `Device birth: ${parsed.groupId}/${parsed.edgeNodeId}/${parsed.deviceId}`
      );
    }
  }

  private async handleDDeath(parsed: any, payload: Buffer, client: any): Promise<void> {
    if (parsed.groupId && parsed.edgeNodeId && parsed.deviceId) {
      this.stateManager.setDeviceOffline(
        parsed.groupId,
        parsed.edgeNodeId,
        parsed.deviceId
      );
      console.log(
        `Device death: ${parsed.groupId}/${parsed.edgeNodeId}/${parsed.deviceId}`
      );
    }
  }

  private async handleNData(parsed: any, payload: Buffer, client: any): Promise<void> {
    try {
      const decoded = decodePayload(new Uint8Array(payload));

      if (decoded.seq !== undefined && parsed.groupId && parsed.edgeNodeId) {
        const valid = this.stateManager.updateNodeSeq(
          parsed.groupId,
          parsed.edgeNodeId,
          decoded.seq
        );

        if (!valid) {
          console.warn(`Sequence validation failed for ${parsed.groupId}/${parsed.edgeNodeId}`);
        }
      }
    } catch (error) {
      console.error('Error handling NDATA:', error);
    }
  }

  private async handleDData(parsed: any, payload: Buffer, client: any): Promise<void> {
    // Device data handling
    console.log(`Device data: ${parsed.groupId}/${parsed.edgeNodeId}/${parsed.deviceId}`);
  }

  async start(): Promise<void> {
    const mqttConfig = this.config.getMQTTConfig();

    // Create TCP server
    this.tcpServer = createServer(this.aedes.handle);

    // Create WebSocket server
    this.wsServer = createHttpServer();
    const wss = new WebSocketServer({ server: this.wsServer });

    wss.on('connection', (ws, req) => {
      // Wrap WebSocket in a duplex stream for Aedes
      const stream = websocketStream(ws as any);
      this.aedes.handle(stream);
    });

    // Start TCP server
    await new Promise<void>((resolve, reject) => {
      this.tcpServer!.listen(mqttConfig.ports.tcp, (err?: Error) => {
        if (err) {
          reject(err);
        } else {
          console.log(`✅ MQTT TCP broker listening on port ${mqttConfig.ports.tcp}`);
          resolve();
        }
      });
    });

    // Start WebSocket server
    await new Promise<void>((resolve, reject) => {
      this.wsServer!.listen(mqttConfig.ports.ws, (err?: Error) => {
        if (err) {
          reject(err);
        } else {
          console.log(`✅ MQTT WebSocket broker listening on port ${mqttConfig.ports.ws}`);
          resolve();
        }
      });
    });
  }

  async stop(): Promise<void> {
    if (this.tcpServer) {
      await new Promise<void>((resolve) => {
        this.tcpServer!.close(() => resolve());
      });
    }

    if (this.wsServer) {
      await new Promise<void>((resolve) => {
        this.wsServer!.close(() => resolve());
      });
    }

    await new Promise<void>((resolve) => {
      this.aedes.close(() => resolve());
    });

    console.log('✅ MQTT broker stopped');
  }

  getAedes(): Aedes {
    return this.aedes;
  }

  getStats() {
    return this.stateManager.getStatistics();
  }
}
