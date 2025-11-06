/**
 * Settings Store
 * Manages application and broker configuration settings
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BrokerConfig {
  url: string;
  port: number;
  protocol: 'ws' | 'wss' | 'mqtt' | 'mqtts';
  username?: string;
  password?: string;
  clientIdPrefix: string;
  cleanSession: boolean;
  keepAlive: number;
  reconnectPeriod: number;
}

export interface SimulatorDefaults {
  groupId: string;
  bdSeqStrategy: 'sequential' | 'random' | 'timestamp';
  rebirthTimeout: number;
  qos: 0 | 1 | 2;
  cleanSession: boolean;
  dataFrequency: number;
  autoReconnect: boolean;
  reconnectDelay: number;
}

interface SettingsState {
  // Broker Configuration
  brokerConfig: BrokerConfig;

  // Simulator Defaults
  simulatorDefaults: SimulatorDefaults;

  // UI Preferences
  theme: 'dark' | 'light';

  // Actions
  updateBrokerConfig: (config: Partial<BrokerConfig>) => void;
  updateSimulatorDefaults: (defaults: Partial<SimulatorDefaults>) => void;
  resetBrokerConfig: () => void;
  resetSimulatorDefaults: () => void;

  // Computed
  getBrokerUrl: () => string;
}

const defaultBrokerConfig: BrokerConfig = {
  url: 'localhost',
  port: 8083,
  protocol: 'ws',
  clientIdPrefix: 'scada-ui',
  cleanSession: true,
  keepAlive: 60,
  reconnectPeriod: 5000,
};

const defaultSimulatorDefaults: SimulatorDefaults = {
  groupId: 'Group1',
  bdSeqStrategy: 'sequential',
  rebirthTimeout: 60,
  qos: 1,
  cleanSession: true,
  dataFrequency: 1000,
  autoReconnect: true,
  reconnectDelay: 5000,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      brokerConfig: defaultBrokerConfig,
      simulatorDefaults: defaultSimulatorDefaults,
      theme: 'dark',

      updateBrokerConfig: (config) =>
        set((state) => ({
          brokerConfig: { ...state.brokerConfig, ...config },
        })),

      updateSimulatorDefaults: (defaults) =>
        set((state) => ({
          simulatorDefaults: { ...state.simulatorDefaults, ...defaults },
        })),

      resetBrokerConfig: () =>
        set({ brokerConfig: defaultBrokerConfig }),

      resetSimulatorDefaults: () =>
        set({ simulatorDefaults: defaultSimulatorDefaults }),

      getBrokerUrl: () => {
        const { brokerConfig } = get();
        return `${brokerConfig.protocol}://${brokerConfig.url}:${brokerConfig.port}`;
      },
    }),
    {
      name: 'mqttx-settings',
    }
  )
);
