/**
 * Simulation MQTT Service
 * Dedicated MQTT client for simulated Edge of Network nodes and devices
 * This service acts as EoN/Device entities in Sparkplug B architecture
 */

import mqtt, { type MqttClient } from 'mqtt';

interface SimulationMqttServiceState {
  client: MqttClient | null;
  isConnected: boolean;
  brokerUrl: string | null;
  connectionError: string | null;
}

class SimulationMqttService {
  private state: SimulationMqttServiceState = {
    client: null,
    isConnected: false,
    brokerUrl: null,
    connectionError: null,
  };

  /**
   * Connect to MQTT broker with EoN/Device role
   */
  connect(brokerUrl: string): void {
    // Disconnect existing client if any
    if (this.state.client) {
      this.state.client.end();
    }

    console.log('🔌 [Simulation MQTT] Connecting to broker:', brokerUrl);

    const client = mqtt.connect(brokerUrl, {
      clientId: `eon-simulator-${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      reconnectPeriod: 5000,
      keepalive: 60,
      protocolVersion: 4, // MQTT v3.1.1
    });

    client.on('connect', () => {
      console.log('✅ [Simulation MQTT] Connected to broker');
      this.state.isConnected = true;
      this.state.connectionError = null;
      this.state.brokerUrl = brokerUrl;
    });

    client.on('message', (topic) => {
      // EoN receives NCMD and DCMD commands
      if (topic.includes('/NCMD/') || topic.includes('/DCMD/')) {
        console.log(`📥 [Simulation MQTT] Received command: ${topic}`);
        // Commands will be handled by simulation engine
      }
    });

    client.on('close', () => {
      console.log('❌ [Simulation MQTT] Disconnected from broker');
      this.state.isConnected = false;
    });

    client.on('error', (error) => {
      console.error('❌ [Simulation MQTT] Error:', error);
      this.state.connectionError = error.message;
    });

    client.on('reconnect', () => {
      console.log('🔄 [Simulation MQTT] Reconnecting...');
    });

    this.state.client = client;
  }

  /**
   * Disconnect from broker
   */
  disconnect(): void {
    if (this.state.client) {
      console.log('🔌 [Simulation MQTT] Disconnecting...');
      this.state.client.end();
      this.state.client = null;
      this.state.isConnected = false;
      this.state.brokerUrl = null;
    }
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
  getState(): Readonly<SimulationMqttServiceState> {
    return { ...this.state };
  }
}

// Export singleton instance
export const simulationMqttService = new SimulationMqttService();
