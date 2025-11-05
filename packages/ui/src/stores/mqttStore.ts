import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import mqtt, { type MqttClient, type IClientPublishOptions } from 'mqtt';
import type { BrokerLog } from '../types/broker.types';

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

      const client = mqtt.connect(brokerUrl, {
        clientId: `scada-ui-${Math.random().toString(16).slice(2, 8)}`,
        clean: true,
        reconnectPeriod: 5000,
        keepalive: 60,
        protocolVersion: 5, // MQTT v5
      });

      client.on('connect', () => {
        console.log('✅ Connected to MQTT broker:', brokerUrl);
        set((state) => {
          state.isConnected = true;
          state.connectionError = null;
          state.brokerUrl = brokerUrl;
        });

        // Subscribe to all Sparkplug topics
        client.subscribe('spBv1.0/#', { qos: 0 });
        client.subscribe('$sparkplug/#', { qos: 0 });
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
          const log: BrokerLog = {
            id: `log-${timestamp}-${Math.random().toString(36).slice(2, 9)}`,
            timestamp,
            type: 'publish',
            clientId: 'broker', // Would come from broker internals
            topic,
            qos: packet.qos,
            retain: packet.retain,
            payload: new Uint8Array(payload),
            origin: {
              ip: 'unknown',
              port: 0,
            },
          };
          onMessage(log);
        }
      });

      client.on('close', () => {
        console.log('❌ Disconnected from MQTT broker');
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
        console.log('🔄 Reconnecting to MQTT broker...');
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
        console.log(`📥 Subscribed to: ${topic}`);
      } else {
        console.warn('Cannot subscribe: MQTT client not connected');
      }
    },

    unsubscribe: (topic: string) => {
      const { client } = get();
      if (client && client.connected) {
        client.unsubscribe(topic);
        console.log(`📤 Unsubscribed from: ${topic}`);
      }
    },

    setOnMessage: (callback) => {
      set((state) => {
        state.onMessage = callback;
      });
    },
  }))
);
