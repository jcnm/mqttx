/**
 * Simulator Store
 * Manages simulated EoN nodes, devices, and ReactFlow canvas state
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  SimulatedEoN,
  SimulatorNode,
  SimulatorEdge,
  NodeTemplate,
  SimulatorStats,
} from '../types/simulator.types';

interface SimulatorState {
  // Data
  nodes: Map<string, SimulatedEoN>;
  flowNodes: SimulatorNode[];
  flowEdges: SimulatorEdge[];
  templates: NodeTemplate[];

  // UI State
  selectedNode: string | null;
  isRunning: boolean;
  speed: number; // Simulation speed multiplier: 1x, 2x, 5x, 10x
  stats: SimulatorStats;

  // Actions
  addNode: (node: SimulatedEoN) => void;
  updateNode: (id: string, updates: Partial<SimulatedEoN>) => void;
  removeNode: (id: string) => void;

  setFlowNodes: (nodes: SimulatorNode[]) => void;
  setFlowEdges: (edges: SimulatorEdge[]) => void;

  addTemplate: (template: NodeTemplate) => void;
  removeTemplate: (id: string) => void;

  setSelectedNode: (id: string | null) => void;

  startSimulation: () => void;
  stopSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  setSpeed: (speed: number) => void;

  updateStats: (stats: Partial<SimulatorStats>) => void;

  resetSimulation: () => void;
  clearAll: () => void;
}

export const useSimulatorStore = create<SimulatorState>()(
  immer((set) => ({
    // Initial State
    nodes: new Map(),
    flowNodes: [],
    flowEdges: [],
    templates: [
      {
        id: 'temp-sensor',
        name: 'Temperature Sensor',
        description: 'Basic temperature sensor with sine wave data',
        type: 'device',
        config: {
          deviceId: 'temp-sensor-01',
          protocol: 'SparkplugB' as const,
          metrics: [
            {
              name: 'Temperature',
              datatype: 9, // Float
              value: 20.0,
              properties: {
                engineeringUnits: '°C',
                min: -40,
                max: 125,
              },
              logic: {
                type: 'sine' as const,
                params: {
                  min: 15,
                  max: 35,
                  frequency: 0.1,
                  amplitude: 10,
                },
              },
            },
          ],
          dataProduction: {
            frequency: 1000,
            logic: { type: 'sine' as const, params: {} },
            enabled: true,
          },
          state: 'stopped' as const,
        },
      },
      {
        id: 'pressure-sensor',
        name: 'Pressure Sensor',
        description: 'Pressure sensor with random data',
        type: 'device',
        config: {
          deviceId: 'pressure-sensor-01',
          protocol: 'SparkplugB' as const,
          metrics: [
            {
              name: 'Pressure',
              datatype: 9,
              value: 101.325,
              properties: {
                engineeringUnits: 'kPa',
                min: 0,
                max: 200,
              },
              logic: {
                type: 'random' as const,
                params: { min: 95, max: 110 },
              },
            },
          ],
          dataProduction: {
            frequency: 2000,
            logic: { type: 'random' as const, params: {} },
            enabled: true,
          },
          state: 'stopped' as const,
        },
      },
    ],
    selectedNode: null,
    isRunning: false,
    speed: 1,
    stats: {
      totalNodes: 0,
      runningNodes: 0,
      totalDevices: 0,
      messagesPublished: 0,
      messagesPerSecond: 0,
      uptime: 0,
    },

    // Node Actions
    addNode: (node) =>
      set((state) => {
        state.nodes.set(node.id, node);
        state.stats.totalNodes = state.nodes.size;
        state.stats.totalDevices = Array.from(state.nodes.values()).reduce(
          (sum, n) => sum + n.devices.length,
          0
        );
      }),

    updateNode: (id, updates) =>
      set((state) => {
        const node = state.nodes.get(id);
        if (node) {
          state.nodes.set(id, { ...node, ...updates });
        }
      }),

    removeNode: (id) =>
      set((state) => {
        state.nodes.delete(id);
        state.stats.totalNodes = state.nodes.size;
        state.stats.totalDevices = Array.from(state.nodes.values()).reduce(
          (sum, n) => sum + n.devices.length,
          0
        );
        if (state.selectedNode === id) {
          state.selectedNode = null;
        }
      }),

    // Flow Actions
    setFlowNodes: (nodes) =>
      set((state) => {
        state.flowNodes = nodes;
      }),

    setFlowEdges: (edges) =>
      set((state) => {
        state.flowEdges = edges;
      }),

    // Template Actions
    addTemplate: (template) =>
      set((state) => {
        state.templates.push(template);
      }),

    removeTemplate: (id) =>
      set((state) => {
        state.templates = state.templates.filter((t) => t.id !== id);
      }),

    // Selection Actions
    setSelectedNode: (id) =>
      set((state) => {
        state.selectedNode = id;
      }),

    // Simulation Control
    startSimulation: () =>
      set((state) => {
        state.isRunning = true;
        // Update all node states to running
        for (const [id, node] of state.nodes) {
          if (node.state === 'stopped' || node.state === 'paused') {
            state.nodes.set(id, { ...node, state: 'running' });
          }
        }
        state.stats.runningNodes = Array.from(state.nodes.values()).filter(
          (n) => n.state === 'running'
        ).length;
      }),

    stopSimulation: () =>
      set((state) => {
        state.isRunning = false;
        // Update all node states to stopped
        for (const [id, node] of state.nodes) {
          state.nodes.set(id, { ...node, state: 'stopped' });
        }
        state.stats.runningNodes = 0;
        state.stats.uptime = 0;
      }),

    pauseSimulation: () =>
      set((state) => {
        state.isRunning = false;
        // Update all running node states to paused
        for (const [id, node] of state.nodes) {
          if (node.state === 'running') {
            state.nodes.set(id, { ...node, state: 'paused' });
          }
        }
      }),

    resumeSimulation: () =>
      set((state) => {
        state.isRunning = true;
        // Update all paused node states to running
        for (const [id, node] of state.nodes) {
          if (node.state === 'paused') {
            state.nodes.set(id, { ...node, state: 'running' });
          }
        }
        state.stats.runningNodes = Array.from(state.nodes.values()).filter(
          (n) => n.state === 'running'
        ).length;
      }),

    setSpeed: (speed) =>
      set((state) => {
        state.speed = speed;
      }),

    // Stats Actions
    updateStats: (stats) =>
      set((state) => {
        state.stats = { ...state.stats, ...stats };
      }),

    // Reset & Clear
    resetSimulation: () =>
      set((state) => {
        state.isRunning = false;
        for (const [id, node] of state.nodes) {
          state.nodes.set(id, { ...node, state: 'stopped' });
        }
        state.stats = {
          totalNodes: state.nodes.size,
          runningNodes: 0,
          totalDevices: Array.from(state.nodes.values()).reduce(
            (sum, n) => sum + n.devices.length,
            0
          ),
          messagesPublished: 0,
          messagesPerSecond: 0,
          uptime: 0,
        };
      }),

    clearAll: () =>
      set((state) => {
        state.nodes.clear();
        state.flowNodes = [];
        state.flowEdges = [];
        state.selectedNode = null;
        state.isRunning = false;
        state.stats = {
          totalNodes: 0,
          runningNodes: 0,
          totalDevices: 0,
          messagesPublished: 0,
          messagesPerSecond: 0,
          uptime: 0,
        };
      }),
  }))
);
