/**
 * SCADA MQTT Service
 * Dedicated MQTT client for SCADA Host Application
 * Implements Sparkplug B Host Application specification:
 * - Publishes STATE message on connect/disconnect
 * - Subscribes to all Sparkplug topics (spBv1.0/#)
 * - Can send NCMD/DCMD commands to EoN and devices
 * - STATE triggers broker to request rebirth from online devices
 */

import mqtt, { type MqttClient } from 'mqtt';
import { encodePayload } from '@sparkplug/codec';
import type { BrokerLog } from '../types/broker.types';

interface ScadaMqttServiceState {
  client: MqttClient | null;
  isConnected: boolean;
  brokerUrl: string | null;
  connectionError: string | null;
  scadaHostId: string;
  messages: Array<{ topic: string; payload: Buffer; timestamp: number }>;
  onMessageCallback: ((log: BrokerLog) => void) | null;
}

class ScadaMqttService {
  private state: ScadaMqttServiceState = {
    client: null,
    isConnected: false,
    brokerUrl: null,
    connectionError: null,
    scadaHostId: 'MQTTX-SCADA', // Sparkplug B Host Application ID
    messages: [],
    onMessageCallback: null,
  };

  /**
   * Connect to MQTT broker as Sparkplug B Host Application
   */
  connect(brokerUrl: string): void {
    // Disconnect existing client if any
    if (this.state.client) {
      this.state.client.end();
    }

    console.log('🔌 [SCADA MQTT] Connecting to broker:', brokerUrl);

    const client = mqtt.connect(brokerUrl, {
      clientId: `scada-host-${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      reconnectPeriod: 5000,
      keepalive: 60,
      protocolVersion: 4, // MQTT v3.1.1
      // Sparkplug B: Will message for STATE = OFFLINE
      will: {
        topic: `STATE/${this.state.scadaHostId}`,
        payload: Buffer.from('OFFLINE'),
        qos: 1,
        retain: true,
      },
    });

    client.on('connect', () => {
      console.log('✅ [SCADA MQTT] Connected to broker');
      this.state.isConnected = true;
      this.state.connectionError = null;
      this.state.brokerUrl = brokerUrl;

      // Sparkplug B: Publish STATE = ONLINE (retained)
      // This triggers the broker to request rebirth from all online EoN
      this.publishState('ONLINE');

      // Subscribe to all Sparkplug B topics
      client.subscribe('spBv1.0/#', { qos: 0 }, (err) => {
        if (err) {
          console.error('❌ [SCADA MQTT] Failed to subscribe:', err);
        } else {
          console.log('📥 [SCADA MQTT] Subscribed to spBv1.0/#');
        }
      });

      // Subscribe to STATE messages
      client.subscribe(`STATE/#`, { qos: 0 }, (err) => {
        if (err) {
          console.error('❌ [SCADA MQTT] Failed to subscribe to STATE:', err);
        } else {
          console.log('📥 [SCADA MQTT] Subscribed to STATE/#');
        }
      });
    });

    client.on('message', (topic, payload, packet) => {
      const timestamp = Date.now();

      // Store message in local buffer
      this.state.messages.push({ topic, payload, timestamp });
      // Keep last 100 messages
      if (this.state.messages.length > 100) {
        this.state.messages.shift();
      }

      console.log(`📥 [SCADA MQTT] Received: ${topic} (${payload.length} bytes)`);

      // Call onMessage callback if set
      if (this.state.onMessageCallback) {
        const log: BrokerLog = {
          id: `scada-log-${timestamp}-${Math.random().toString(36).slice(2, 9)}`,
          timestamp,
          type: 'publish',
          clientId: 'scada-host',
          topic,
          qos: packet.qos,
          retain: packet.retain,
          payload: new Uint8Array(payload),
          origin: {
            ip: 'scada',
            port: 0,
          },
        };
        this.state.onMessageCallback(log);
      }
    });

    client.on('close', () => {
      console.log('❌ [SCADA MQTT] Disconnected from broker');
      this.state.isConnected = false;
    });

    client.on('error', (error) => {
      console.error('❌ [SCADA MQTT] Error:', error);
      this.state.connectionError = error.message;
    });

    client.on('reconnect', () => {
      console.log('🔄 [SCADA MQTT] Reconnecting...');
    });

    this.state.client = client;
  }

  /**
   * Publish STATE message (ONLINE/OFFLINE)
   * This is a Sparkplug B Host Application requirement
   */
  private publishState(state: 'ONLINE' | 'OFFLINE'): void {
    if (!this.state.client || !this.state.client.connected) {
      console.warn('⚠️  [SCADA MQTT] Cannot publish STATE: not connected');
      return;
    }

    const topic = `STATE/${this.state.scadaHostId}`;
    const payload = Buffer.from(state);

    this.state.client.publish(
      topic,
      payload,
      { qos: 1, retain: true },
      (error) => {
        if (error) {
          console.error(`❌ [SCADA MQTT] Failed to publish STATE: ${error.message}`);
        } else {
          console.log(`✅ [SCADA MQTT] Published STATE: ${state} → ${topic}`);
        }
      }
    );
  }

  /**
   * Send NCMD (Node Command) to an Edge Node
   */
  sendNodeCommand(groupId: string, edgeNodeId: string, metrics: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.state.client || !this.state.client.connected) {
        reject(new Error('MQTT client not connected'));
        return;
      }

      const topic = `spBv1.0/${groupId}/NCMD/${edgeNodeId}`;

      const sparkplugPayload = {
        timestamp: BigInt(Date.now()),
        seq: BigInt(0), // Commands don't need sequence tracking
        metrics: metrics.map((m) => ({
          name: m.name,
          timestamp: BigInt(Date.now()),
          datatype: m.datatype,
          value: m.value,
        })),
      };

      const payload = encodePayload(sparkplugPayload as any);

      this.state.client.publish(topic, payload as any, { qos: 0 }, (error) => {
        if (error) {
          console.error(`❌ [SCADA MQTT] Failed to send NCMD: ${error.message}`);
          reject(error);
        } else {
          console.log(`✅ [SCADA MQTT] Sent NCMD → ${topic}`);
          resolve();
        }
      });
    });
  }

  /**
   * Send DCMD (Device Command) to a device
   */
  sendDeviceCommand(
    groupId: string,
    edgeNodeId: string,
    deviceId: string,
    metrics: any[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.state.client || !this.state.client.connected) {
        reject(new Error('MQTT client not connected'));
        return;
      }

      const topic = `spBv1.0/${groupId}/DCMD/${edgeNodeId}/${deviceId}`;

      const sparkplugPayload = {
        timestamp: BigInt(Date.now()),
        seq: BigInt(0),
        metrics: metrics.map((m) => ({
          name: m.name,
          timestamp: BigInt(Date.now()),
          datatype: m.datatype,
          value: m.value,
        })),
      };

      const payload = encodePayload(sparkplugPayload as any);

      this.state.client.publish(topic, payload as any, { qos: 0 }, (error) => {
        if (error) {
          console.error(`❌ [SCADA MQTT] Failed to send DCMD: ${error.message}`);
          reject(error);
        } else {
          console.log(`✅ [SCADA MQTT] Sent DCMD → ${topic}`);
          resolve();
        }
      });
    });
  }

  /**
   * Disconnect from broker (publishes STATE = OFFLINE via will message)
   */
  disconnect(): void {
    if (this.state.client) {
      console.log('🔌 [SCADA MQTT] Disconnecting...');
      // The will message will automatically publish STATE = OFFLINE
      this.state.client.end();
      this.state.client = null;
      this.state.isConnected = false;
      this.state.brokerUrl = null;
    }
  }

  /**
   * Set callback for received messages
   */
  setOnMessage(callback: (log: BrokerLog) => void): void {
    this.state.onMessageCallback = callback;
  }

  /**
   * Get the MQTT client instance
   */
  getClient(): MqttClient | null {
    return this.state.client;
  }

  /**
   * Check if connected
   */
  isClientConnected(): boolean {
    return this.state.isConnected && this.state.client !== null;
  }

  /**
   * Get connection state
   */
  getState(): Readonly<ScadaMqttServiceState> {
    return { ...this.state };
  }

  /**
   * Get messages buffer
   */
  getMessages(): ReadonlyArray<{ topic: string; payload: Buffer; timestamp: number }> {
    return [...this.state.messages];
  }
}

// Export singleton instance
export const scadaMqttService = new ScadaMqttService();
