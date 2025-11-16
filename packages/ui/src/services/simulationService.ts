/**
 * Simulation Service - Persistent Simulation Engine Manager
 * Manages simulation engine lifecycle independent of component mount/unmount
 * Uses dedicated MQTT client for EoN/Device simulation (Sparkplug B compliant)
 * Allows simulation to continue running even when navigating away from Simulation view
 */

import { createSimulationEngine } from './simulationEngine';
import { simulationMqttService } from './simulationMqttService';
import type { MessageTrace } from '../types/message-trace.types';

// Type for engine stats (subset of SimulatorStats)
type EngineStats = {
  messagesPublished: number;
  messagesPerSecond: number;
  uptime: number;
};

interface SimulationServiceState {
  engine: ReturnType<typeof createSimulationEngine> | null;
  statsCallback: ((stats: EngineStats) => void) | null;
  isInitialized: boolean;
}

class SimulationService {
  private state: SimulationServiceState = {
    engine: null,
    statsCallback: null,
    isInitialized: false,
  };

  /**
   * Initialize the simulation service with dedicated MQTT client
   */
  initialize(brokerUrl: string, speed: number = 1): void {
    if (!this.state.isInitialized) {
      console.log('🎮 Initializing Simulation Service');

      // Connect dedicated MQTT client for simulation
      simulationMqttService.connect(brokerUrl);

      // Wait for client to be available
      const mqttClient = simulationMqttService.getClient();
      if (!mqttClient) {
        console.error('❌ Failed to get MQTT client from simulationMqttService');
        return;
      }

      this.state.engine = createSimulationEngine(mqttClient, speed);
      this.state.isInitialized = true;
    } else if (this.state.engine) {
      // Update speed if already initialized
      this.state.engine.setSpeed(speed);
    }
  }

  /**
   * Get the simulation engine instance
   */
  getEngine(): ReturnType<typeof createSimulationEngine> | null {
    return this.state.engine;
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.state.isInitialized && this.state.engine !== null;
  }

  /**
   * Set the stats callback
   */
  setStatsCallback(callback: (stats: EngineStats) => void): void {
    this.state.statsCallback = callback;
  }

  /**
   * Get the stats callback
   */
  getStatsCallback(): ((stats: EngineStats) => void) | null {
    return this.state.statsCallback;
  }

  /**
   * Update speed
   */
  setSpeed(speed: number): void {
    if (this.state.engine) {
      this.state.engine.setSpeed(speed);
    }
  }

  /**
   * Set message trace callback for detailed message inspection
   */
  setMessageTraceCallback(callback: ((trace: MessageTrace) => void) | null): void {
    if (this.state.engine) {
      this.state.engine.setMessageTraceCallback(callback);
    }
  }

  /**
   * Reset the engine
   */
  reset(): void {
    if (this.state.engine) {
      console.log('🔄 Resetting Simulation Service');
      this.state.engine.reset();
    }
  }

  /**
   * Cleanup and destroy the service (only call on app unmount)
   */
  destroy(): void {
    console.log('🧹 Destroying Simulation Service');
    if (this.state.engine && this.state.engine.isRunning()) {
      // Get current nodes from store if needed
      this.state.engine.stop(new Map());
    }

    // Disconnect dedicated MQTT client
    simulationMqttService.disconnect();

    this.state.engine = null;
    this.state.statsCallback = null;
    this.state.isInitialized = false;
  }
}

// Export singleton instance
export const simulationService = new SimulationService();
