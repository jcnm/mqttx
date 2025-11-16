/**
 * Simulator Store
 * Manages simulated EoN nodes, devices, and ReactFlow canvas state
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import type {
  SimulatedEoN,
  SimulatorNode,
  SimulatorEdge,
  NodeTemplate,
  SimulatorStats,
} from '../types/simulator.types';

// Enable Immer support for Map and Set
enableMapSet();

/**
 * Get initial value for a metric based on its type
 */
function getInitialMetricValue(metric: any): any {
  // If metric has a static value defined, use it
  if (metric.value !== undefined && !metric.logic) {
    return metric.value;
  }

  // If metric has logic, calculate initial value based on logic type
  if (metric.logic) {
    switch (metric.logic.type) {
      case 'static':
        return metric.logic.params.value ?? 0;
      case 'sine':
      case 'random':
        return metric.logic.params.min ?? 0;
      case 'linear':
        return metric.logic.params.value ?? 0;
      default:
        return 0;
    }
  }

  // Default based on datatype
  switch (metric.datatype) {
    case 11: // Boolean
      return false;
    case 12: // String
    case 14: // Text
      return '';
    default:
      return 0;
  }
}

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
  initializeDemo: () => void; // Initialize with demo nodes
}

export const useSimulatorStore = create<SimulatorState>()(
  immer((set) => ({
    // Initial State
    nodes: new Map(),
    flowNodes: [],
    flowEdges: [],
    templates: [
      // Template 1: EoN with Complex Device (Industrial Pump Station)
      {
        id: 'pump-station',
        name: 'Pump Station',
        description: 'Complete pump station with complex monitoring and control',
        type: 'plant' as const,
        category: 'Water Treatment',
        config: [
          {
            config: {
              groupId: 'WaterTreatment',
              edgeNodeId: 'PumpStation_01',
              protocol: 'SparkplugB' as const,
              sparkplugConfig: {
                bdSeqStrategy: 'sequential' as const,
                rebirthTimeout: 60,
              },
              lifecycle: {
                autoReconnect: true,
                reconnectDelay: 5000,
              },
              network: {
                qos: 1 as 0 | 1 | 2,
                cleanSession: true,
              },
              persistence: {
                enabled: true,
              },
            },
            devices: [
              {
                id: 'pump-01',
                deviceId: 'CentrifugalPump_01',
                protocol: 'SparkplugB' as const,
                metrics: [
                  {
                    name: 'Running',
                    datatype: 11,
                    value: false,
                    properties: { description: 'Pump running status' },
                  },
                  {
                    name: 'FlowRate',
                    datatype: 9,
                    value: 0,
                    properties: {
                      engineeringUnits: 'm³/h',
                      min: 0,
                      max: 500,
                      description: 'Current flow rate',
                    },
                    logic: {
                      type: 'sine' as const,
                      params: { min: 100, max: 450, frequency: 0.05 },
                    },
                  },
                  {
                    name: 'Pressure',
                    datatype: 9,
                    value: 0,
                    properties: {
                      engineeringUnits: 'bar',
                      min: 0,
                      max: 10,
                      description: 'Discharge pressure',
                    },
                    logic: {
                      type: 'sine' as const,
                      params: { min: 4.5, max: 6.5, frequency: 0.08 },
                    },
                  },
                  {
                    name: 'Power',
                    datatype: 9,
                    value: 0,
                    properties: {
                      engineeringUnits: 'kW',
                      min: 0,
                      max: 150,
                      description: 'Motor power consumption',
                    },
                    logic: {
                      type: 'random' as const,
                      params: { min: 85, max: 135 },
                    },
                  },
                  {
                    name: 'Temperature',
                    datatype: 9,
                    value: 25.0,
                    properties: {
                      engineeringUnits: '°C',
                      min: 0,
                      max: 100,
                      description: 'Motor winding temperature',
                    },
                    logic: {
                      type: 'sine' as const,
                      params: { min: 45, max: 75, frequency: 0.02 },
                    },
                  },
                  {
                    name: 'Vibration',
                    datatype: 9,
                    value: 0,
                    properties: {
                      engineeringUnits: 'mm/s',
                      min: 0,
                      max: 20,
                      description: 'Vibration level (RMS)',
                    },
                    logic: {
                      type: 'random' as const,
                      params: { min: 1.2, max: 3.5 },
                    },
                  },
                  {
                    name: 'RunHours',
                    datatype: 7, // UInt32
                    value: 15420,
                    properties: {
                      engineeringUnits: 'hours',
                      description: 'Total runtime hours',
                    },
                  },
                  {
                    name: 'Alarm',
                    datatype: 11,
                    value: false,
                    properties: { description: 'Active alarm condition' },
                  },
                ],
                dataProduction: {
                  frequency: 500, // Fast updates for industrial control
                  logic: { type: 'sine' as const, params: {} },
                  enabled: true,
                },
                state: 'stopped' as const,
              },
            ],
            state: 'stopped' as const,
            metrics: [],
          },
        ],
      },
      // Template 2: EoN with 2 Simple Devices (Environmental Monitoring)
      {
        id: 'env-monitoring',
        name: 'Environmental Monitor',
        description: 'Basic environmental monitoring with temperature and humidity sensors',
        type: 'plant' as const,
        category: 'Building Automation',
        config: [
          {
            config: {
              groupId: 'Building',
              edgeNodeId: 'EnvMonitor_01',
              protocol: 'SparkplugB' as const,
              sparkplugConfig: {
                bdSeqStrategy: 'sequential' as const,
                rebirthTimeout: 60,
              },
              lifecycle: {
                autoReconnect: true,
                reconnectDelay: 5000,
              },
              network: {
                qos: 1 as 0 | 1 | 2,
                cleanSession: true,
              },
              persistence: {
                enabled: false,
              },
            },
            devices: [
              {
                id: 'temp-sensor',
                deviceId: 'TempSensor_01',
                protocol: 'SparkplugB' as const,
                metrics: [
                  {
                    name: 'Temperature',
                    datatype: 9,
                    value: 22.0,
                    properties: {
                      engineeringUnits: '°C',
                      min: -40,
                      max: 85,
                    },
                    logic: {
                      type: 'sine' as const,
                      params: { min: 18, max: 26, frequency: 0.1 },
                    },
                  },
                  {
                    name: 'Online',
                    datatype: 11,
                    value: true,
                  },
                ],
                dataProduction: {
                  frequency: 2000,
                  logic: { type: 'sine' as const, params: {} },
                  enabled: true,
                },
                state: 'stopped' as const,
              },
              {
                id: 'humidity-sensor',
                deviceId: 'HumiditySensor_01',
                protocol: 'SparkplugB' as const,
                metrics: [
                  {
                    name: 'Humidity',
                    datatype: 9,
                    value: 45.0,
                    properties: {
                      engineeringUnits: '%RH',
                      min: 0,
                      max: 100,
                    },
                    logic: {
                      type: 'random' as const,
                      params: { min: 35, max: 65 },
                    },
                  },
                  {
                    name: 'Online',
                    datatype: 11,
                    value: true,
                  },
                ],
                dataProduction: {
                  frequency: 2000,
                  logic: { type: 'random' as const, params: {} },
                  enabled: true,
                },
                state: 'stopped' as const,
              },
            ],
            state: 'stopped' as const,
            metrics: [],
          },
        ],
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
        // Reset counters on stop
        state.stats.messagesPublished = 0;
        state.stats.messagesPerSecond = 0;
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

        // Reset all nodes and their metrics
        for (const [id, node] of state.nodes) {
          // Reset node metrics to initial values
          const resetMetrics = node.metrics.map((metric) => ({
            ...metric,
            value: getInitialMetricValue(metric),
          }));

          // Reset device metrics to initial values
          const resetDevices = node.devices.map((device) => ({
            ...device,
            metrics: device.metrics.map((metric) => ({
              ...metric,
              value: getInitialMetricValue(metric),
            })),
          }));

          state.nodes.set(id, {
            ...node,
            state: 'stopped',
            metrics: resetMetrics,
            devices: resetDevices,
          });
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

    // Initialize Demo Configuration
    initializeDemo: () =>
      set((state) => {
        // Only initialize if there are no nodes
        if (state.nodes.size > 0) {
          console.log('⏭️  Demo already initialized (nodes exist)');
          return;
        }

        console.log('🎬 Initializing demo configuration...');

        // Create 2 demo EoN nodes from templates
        const template1 = state.templates.find(t => t.id === 'pump-station');
        const template2 = state.templates.find(t => t.id === 'hvac-system');

        if (template1 && template1.config && template1.config.length > 0) {
          const eonConfig = template1.config[0];
          const demoNode1: SimulatedEoN = {
            id: `eon-${Date.now()}-1`,
            state: 'stopped',
            config: {
              ...eonConfig.config,
              edgeNodeId: 'Demo_PumpStation_01',
            },
            metrics: eonConfig.metrics || [],
            devices: eonConfig.devices?.map((d, i) => ({
              ...d,
              id: `device-${Date.now()}-${i}`,
            })) || [],
          };
          state.nodes.set(demoNode1.id, demoNode1);
          console.log('✅ Created demo node:', demoNode1.config.edgeNodeId);
        }

        if (template2 && template2.config && template2.config.length > 0) {
          const eonConfig = template2.config[0];
          const demoNode2: SimulatedEoN = {
            id: `eon-${Date.now()}-2`,
            state: 'stopped',
            config: {
              ...eonConfig.config,
              edgeNodeId: 'Demo_HVAC_01',
            },
            metrics: eonConfig.metrics || [],
            devices: eonConfig.devices?.map((d, i) => ({
              ...d,
              id: `device-${Date.now() + 1000}-${i}`,
            })) || [],
          };
          state.nodes.set(demoNode2.id, demoNode2);
          console.log('✅ Created demo node:', demoNode2.config.edgeNodeId);
        }

        // Update stats
        state.stats.totalNodes = state.nodes.size;
        state.stats.totalDevices = Array.from(state.nodes.values()).reduce(
          (sum, n) => sum + n.devices.length,
          0
        );

        console.log(`🎬 Demo initialized: ${state.stats.totalNodes} nodes, ${state.stats.totalDevices} devices`);
      }),
  }))
);
