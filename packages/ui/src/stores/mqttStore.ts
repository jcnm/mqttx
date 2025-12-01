import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import mqtt, { type MqttClient, type IClientPublishOptions } from 'mqtt';
import { decodePayload } from '@sparkplug/codec';
import type { BrokerLog, MessageType } from '../types/broker.types';

/**
 * Extract Sparkplug message type from topic
 * Topic format: spBv1.0/{groupId}/{messageType}/{edgeNodeId}[/{deviceId}]
 */
function extractMessageType(topic: string): MessageType | undefined {
  if (!topic) return undefined;

  // Handle STATE messages
  if (topic.startsWith('spBv1.0/STATE/')) {
    return 'STATE';
  }

  // Handle Sparkplug B messages
  if (topic.startsWith('spBv1.0/')) {
    const parts = topic.split('/');
    if (parts.length >= 3) {
      const msgType = parts[2];
      const validTypes: MessageType[] = ['NBIRTH', 'NDATA', 'NDEATH', 'DBIRTH', 'DDATA', 'DDEATH', 'NCMD', 'DCMD', 'STATE'];
      if (validTypes.includes(msgType as MessageType)) {
        return msgType as MessageType;
      }
    }
  }

  return undefined;
}

/**
 * Parse Sparkplug topic to extract metadata
 */
function parseSparkplugTopic(topic: string): {
  groupId?: string;
  edgeNodeId?: string;
  deviceId?: string;
  messageType?: string;
} | null {
  if (!topic.startsWith('spBv1.0/')) return null;

  const parts = topic.split('/');
  if (parts.length < 4) return null;

  return {
    groupId: parts[1],
    messageType: parts[2],
    edgeNodeId: parts[3],
    deviceId: parts.length > 4 ? parts[4] : undefined,
  };
}

interface MQTTState {
  client: MqttClient | null;
  isConnected: boolean;
  connectionError: string | null;
  messages: Array<{ topic: string; payload: Buffer; timestamp: number }>;
  brokerUrl: string | null;

  connect: (brokerUrl: string) => void;
  disconnect: () => void;
  publish: (topic: string, payload: string | Buffer, options?: IClientPublishOptions) => void;
  subscribe: (topic: string, qos?: 0 | 1 | 2) => void;
  unsubscribe: (topic: string) => void;

  // Callbacks for integration with other stores
  onMessage?: (log: BrokerLog) => void;
  setOnMessage: (callback: (log: BrokerLog) => void) => void;
}

export const useMQTTStore = create<MQTTState>()(
  immer((set, get) => ({
    client: null,
    isConnected: false,
    connectionError: null,
    messages: [],
    brokerUrl: null,
    onMessage: undefined,

    connect: (brokerUrl: string) => {
      // Disconnect existing client if any
      const existingClient = get().client;
      if (existingClient) {
        existingClient.end();
      }

      const clientId = `scada-ui-${Math.random().toString(16).slice(2, 8)}`;

      const client = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        reconnectPeriod: 5000,
        keepalive: 60,
        protocolVersion: 4, // MQTT v3.1.1 (Aedes broker support)
      });

      client.on('connect', () => {
        console.log('Connected to MQTT broker:', brokerUrl);
        set((state) => {
          state.isConnected = true;
          state.connectionError = null;
          state.brokerUrl = brokerUrl;
        });

        // Subscribe to all Sparkplug B topics with QoS 1 for reliable delivery
        client.subscribe('spBv1.0/#', { qos: 1 });
        client.subscribe('$sparkplug/#', { qos: 1 });
      });

      client.on('message', (topic, payload, packet) => {
        const timestamp = Date.now();

        // Store message in local buffer
        set((state) => {
          state.messages.push({ topic, payload, timestamp });
          // Keep last 100 messages
          if (state.messages.length > 100) {
            state.messages.shift();
          }
        });

        // Call onMessage callback if set (for broker store integration)
        const { onMessage } = get();
        if (onMessage) {
          // Extract message type from topic
          const messageType = extractMessageType(topic);

          // Parse Sparkplug topic for metadata
          const parsed = parseSparkplugTopic(topic);

          // Try to decode Sparkplug payload
          let decoded: any = undefined;
          let sparkplugMetadata: BrokerLog['sparkplugMetadata'] = undefined;

          if (topic.startsWith('spBv1.0/') && payload.length > 0) {
            try {
              decoded = decodePayload(new Uint8Array(payload));

              if (parsed) {
                sparkplugMetadata = {
                  groupId: parsed.groupId,
                  edgeNodeId: parsed.edgeNodeId,
                  deviceId: parsed.deviceId,
                  seq: decoded?.seq !== undefined ? BigInt(decoded.seq) : undefined,
                  metricCount: decoded?.metrics?.length || 0,
                };
              }
            } catch (err) {
              // Not a valid Sparkplug payload, ignore
              console.debug('Could not decode Sparkplug payload:', err);
            }
          }

          const log: BrokerLog = {
            id: `log-${timestamp}-${Math.random().toString(36).slice(2, 9)}`,
            timestamp,
            type: 'publish',
            clientId: clientId, // Use our own clientId since MQTT doesn't provide publisher's ID
            topic,
            qos: packet.qos,
            retain: packet.retain,
            messageType,
            payload: new Uint8Array(payload),
            decoded,
            sparkplugMetadata,
            origin: {
              ip: 'mqtt-subscription',
              port: 0,
            },
          };
          onMessage(log);
        }
      });

      client.on('close', () => {
        console.log('Disconnected from MQTT broker');
        set((state) => {
          state.isConnected = false;
        });
      });

      client.on('error', (error) => {
        console.error('MQTT error:', error);
        set((state) => {
          state.connectionError = error.message;
        });
      });

      client.on('reconnect', () => {
        console.log('Reconnecting to MQTT broker...');
      });

      set((state) => {
        // Use type assertion to avoid Immer WritableDraft issues with complex MQTT client type
        state.client = client as any;
      });
    },

    disconnect: () => {
      const { client } = get();
      if (client) {
        client.end();
        set((state) => {
          state.client = null;
          state.isConnected = false;
          state.brokerUrl = null;
        });
      }
    },

    publish: (topic: string, payload: string | Buffer, options?: IClientPublishOptions) => {
      const { client } = get();
      if (client && client.connected) {
        client.publish(topic, payload, options || { qos: 0 });
      } else {
        console.warn('Cannot publish: MQTT client not connected');
      }
    },

    subscribe: (topic: string, qos = 0) => {
      const { client } = get();
      if (client && client.connected) {
        client.subscribe(topic, { qos });
        console.log(`Subscribed to: ${topic}`);
      } else {
        console.warn('Cannot subscribe: MQTT client not connected');
      }
    },

    unsubscribe: (topic: string) => {
      const { client } = get();
      if (client && client.connected) {
        client.unsubscribe(topic);
        console.log(`Unsubscribed from: ${topic}`);
      }
    },

    setOnMessage: (callback) => {
      set((state) => {
        state.onMessage = callback;
      });
    },
  }))
);
