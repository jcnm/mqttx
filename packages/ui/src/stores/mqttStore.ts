import { create } from 'zustand';
import mqtt, { type MqttClient } from 'mqtt';

interface MQTTState {
  client: MqttClient | null;
  isConnected: boolean;
  messages: Array<{ topic: string; payload: Buffer; timestamp: number }>;
  connect: (brokerUrl: string) => void;
  disconnect: () => void;
  publish: (topic: string, payload: string | Buffer, qos?: 0 | 1 | 2) => void;
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
}

export const useMQTTStore = create<MQTTState>((set, get) => ({
  client: null,
  isConnected: false,
  messages: [],

  connect: (brokerUrl: string) => {
    const client = mqtt.connect(brokerUrl, {
      clientId: `scada-ui-${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      reconnectPeriod: 5000,
    });

    client.on('connect', () => {
      console.log('✅ Connected to MQTT broker');
      set({ isConnected: true });

      // Subscribe to all Sparkplug topics
      client.subscribe('spBv1.0/#');
      client.subscribe('$sparkplug/#');
    });

    client.on('message', (topic, payload) => {
      set((state) => ({
        messages: [
          ...state.messages.slice(-99), // Keep last 100 messages
          { topic, payload, timestamp: Date.now() },
        ],
      }));
    });

    client.on('close', () => {
      console.log('❌ Disconnected from MQTT broker');
      set({ isConnected: false });
    });

    client.on('error', (error) => {
      console.error('MQTT error:', error);
    });

    set({ client });
  },

  disconnect: () => {
    const { client } = get();
    if (client) {
      client.end();
      set({ client: null, isConnected: false });
    }
  },

  publish: (topic: string, payload: string | Buffer, qos = 0) => {
    const { client } = get();
    if (client && client.connected) {
      client.publish(topic, payload, { qos });
    }
  },

  subscribe: (topic: string) => {
    const { client } = get();
    if (client && client.connected) {
      client.subscribe(topic);
    }
  },

  unsubscribe: (topic: string) => {
    const { client } = get();
    if (client && client.connected) {
      client.unsubscribe(topic);
    }
  },
}));
