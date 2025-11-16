/**
 * Simulation Service - Persistent Simulation Engine Manager
 * Manages simulation engine lifecycle independent of component mount/unmount
 * Allows simulation to continue running even when navigating away from Simulation view
 */

import type { MqttClient } from 'mqtt';
import { createSimulationEngine } from './simulationEngine';
import type { SimulatorStats } from '../types/simulator.types';
import type { MessageTrace } from '../types/message-trace.types';

interface SimulationServiceState {
  engine: ReturnType<typeof createSimulationEngine> | null;
  mqttClient: MqttClient | null;
  statsCallback: ((stats: SimulatorStats) => void) | null;
  isInitialized: boolean;
}

class SimulationService {
  private state: SimulationServiceState = {
    engine: null,
    mqttClient: null,
    statsCallback: null,
    isInitialized: false,
  };

  /**
   * Initialize the simulation service with MQTT client
   */
  initialize(mqttClient: MqttClient, speed: number = 1): void {
    if (!this.state.isInitialized) {
      console.log('🎮 Initializing Simulation Service');
      this.state.mqttClient = mqttClient;
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
  setStatsCallback(callback: (stats: SimulatorStats) => void): void {
    this.state.statsCallback = callback;
  }

  /**
   * Get the stats callback
   */
  getStatsCallback(): ((stats: SimulatorStats) => void) | null {
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
    this.state.engine = null;
    this.state.mqttClient = null;
    this.state.statsCallback = null;
    this.state.isInitialized = false;
  }
}

// Export singleton instance
export const simulationService = new SimulationService();
