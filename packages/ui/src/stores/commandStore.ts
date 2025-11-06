/**
 * Command Store
 * Manages commands, scheduling, and command history
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  Command,
  CommandTemplate,
  CommandHistory,
  ConditionalRule,
} from '../types/command.types';

interface CommandState {
  // Data
  commands: Map<string, Command>;
  templates: CommandTemplate[];
  history: CommandHistory;
  conditionalRules: Map<string, ConditionalRule>;

  // UI State
  selectedCommand: string | null;

  // Actions
  createCommand: (command: Omit<Command, 'id' | 'createdAt' | 'status'>) => string;
  updateCommand: (id: string, updates: Partial<Command>) => void;
  removeCommand: (id: string) => void;

  sendCommand: (id: string) => Promise<void>;
  cancelCommand: (id: string) => void;
  resendCommand: (id: string) => void;

  addTemplate: (template: CommandTemplate) => void;
  removeTemplate: (id: string) => void;

  addConditionalRule: (rule: ConditionalRule) => void;
  updateConditionalRule: (id: string, updates: Partial<ConditionalRule>) => void;
  removeConditionalRule: (id: string) => void;
  toggleConditionalRule: (id: string, enabled: boolean) => void;

  setSelectedCommand: (id: string | null) => void;

  clearHistory: () => void;
  clearAll: () => void;
}

export const useCommandStore = create<CommandState>()(
  immer((set, get) => ({
    // Initial State
    commands: new Map(),
    templates: [
      {
        id: 'rebirth-request',
        name: 'Rebirth Request',
        description: 'Request a node to republish its birth certificate',
        type: 'NCMD',
        metrics: [
          {
            name: 'Node Control/Rebirth',
            value: true,
            datatype: 11, // Boolean
          },
        ],
        defaultMQTT: {
          qos: 0,
          retain: false,
        },
      },
      {
        id: 'reboot-device',
        name: 'Reboot Device',
        description: 'Reboot a specific device',
        type: 'DCMD',
        metrics: [
          {
            name: 'Device Control/Reboot',
            value: true,
            datatype: 11,
          },
        ],
        defaultMQTT: {
          qos: 1,
          retain: false,
        },
      },
    ],
    history: {
      commands: [],
      totalSent: 0,
      totalAcknowledged: 0,
      totalFailed: 0,
    },
    conditionalRules: new Map(),
    selectedCommand: null,

    // Command Actions
    createCommand: (command) => {
      let id: string = '';
      set((state) => {
        id = `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const newCommand: Command = {
          ...command,
          id,
          createdAt: Date.now(),
          status: 'pending',
        };
        state.commands.set(id, newCommand);
      });
      return id;
    },

    updateCommand: (id, updates) =>
      set((state) => {
        const command = state.commands.get(id);
        if (command) {
          state.commands.set(id, { ...command, ...updates });
        }
      }),

    removeCommand: (id) =>
      set((state) => {
        state.commands.delete(id);
        if (state.selectedCommand === id) {
          state.selectedCommand = null;
        }
      }),

    sendCommand: async (id) => {
      const command = get().commands.get(id);
      if (!command) return;

      set((state) => {
        const cmd = state.commands.get(id);
        if (cmd) {
          cmd.status = 'sent';
          cmd.sentAt = Date.now();
        }
      });

      // Add to history
      set((state) => {
        const cmd = state.commands.get(id);
        if (cmd) {
          state.history.commands.push(cmd);
          state.history.totalSent++;
          state.history.lastExecuted = Date.now();
        }
      });

      // Actual MQTT publish would happen here via mqttStore
      // This is a placeholder for the integration
    },

    cancelCommand: (id) =>
      set((state) => {
        const command = state.commands.get(id);
        if (command && command.status === 'pending') {
          command.status = 'cancelled';
        }
      }),

    resendCommand: (id) => {
      const command = get().commands.get(id);
      if (!command) return;

      set((state) => {
        const cmd = state.commands.get(id);
        if (cmd) {
          cmd.status = 'pending';
          cmd.sentAt = undefined;
          cmd.acknowledgedAt = undefined;
          cmd.error = undefined;
        }
      });

      get().sendCommand(id);
    },

    // Template Actions
    addTemplate: (template) =>
      set((state) => {
        state.templates.push(template);
      }),

    removeTemplate: (id) =>
      set((state) => {
        state.templates = state.templates.filter((t) => t.id !== id);
      }),

    // Conditional Rule Actions
    addConditionalRule: (rule) =>
      set((state) => {
        state.conditionalRules.set(rule.id, rule);
      }),

    updateConditionalRule: (id, updates) =>
      set((state) => {
        const rule = state.conditionalRules.get(id);
        if (rule) {
          state.conditionalRules.set(id, { ...rule, ...updates });
        }
      }),

    removeConditionalRule: (id) =>
      set((state) => {
        state.conditionalRules.delete(id);
      }),

    toggleConditionalRule: (id, enabled) =>
      set((state) => {
        const rule = state.conditionalRules.get(id);
        if (rule) {
          rule.enabled = enabled;
        }
      }),

    // Selection Actions
    setSelectedCommand: (id) =>
      set((state) => {
        state.selectedCommand = id;
      }),

    // Clear Actions
    clearHistory: () =>
      set((state) => {
        state.history = {
          commands: [],
          totalSent: 0,
          totalAcknowledged: 0,
          totalFailed: 0,
        };
      }),

    clearAll: () =>
      set((state) => {
        state.commands.clear();
        state.conditionalRules.clear();
        state.selectedCommand = null;
      }),
  }))
);
