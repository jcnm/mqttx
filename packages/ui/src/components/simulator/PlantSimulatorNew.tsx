/**
 * Plant Simulator - Production Grade
 * Complete industrial plant designer with Sparkplug B support
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSimulatorStore } from '../../stores/simulatorStore';
import { useMQTTStore } from '../../stores/mqttStore';
import { EnhancedReactFlowCanvas } from './EnhancedReactFlowCanvas';
import { SimulatorControls } from './SimulatorControls';
import { ConfigPanel } from './ConfigPanel';
import { ToolPanel } from './ToolPanel';
import { createSimulationEngine } from '../../services/simulationEngine';
import type {
  SimulatedEoN,
  SimulatedDevice,
  EoNNodeData,
  SimulatorNode,
} from '../../types/simulator.types';
import {
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
} from '@xyflow/react';

export function PlantSimulatorNew() {
  const {
    nodes: storeNodes,
    templates,
    setFlowNodes,
    isRunning,
    speed,
    addNode,
    updateNode,
    updateStats,
  } = useSimulatorStore();

  const { client: mqttClient, isConnected } = useMQTTStore();

  // UI State
  const [toolPanelOpen, setToolPanelOpen] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState<Node>([]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState([]);

  const simulationEngineRef = useRef<ReturnType<typeof createSimulationEngine> | null>(null);

  // Initialize simulation engine
  useEffect(() => {
    if (mqttClient) {
      simulationEngineRef.current = createSimulationEngine(mqttClient, speed);
    }
  }, [mqttClient, speed]);

  // Update engine speed
  useEffect(() => {
    if (simulationEngineRef.current) {
      simulationEngineRef.current.setSpeed(speed);
    }
  }, [speed]);

  // Start/stop simulation
  useEffect(() => {
    if (!simulationEngineRef.current) return;

    if (isRunning) {
      simulationEngineRef.current.start(storeNodes, (engineStats) => {
        updateStats(engineStats);
      });
    } else {
      simulationEngineRef.current.stop(storeNodes);
    }

    return () => {
      if (simulationEngineRef.current) {
        simulationEngineRef.current.stop(storeNodes);
      }
    };
  }, [isRunning, storeNodes, updateStats]);

  // Sync store nodes to ReactFlow nodes
  useEffect(() => {
    const newFlowNodes: SimulatorNode[] = Array.from(storeNodes.values()).map((node, index) => {
      const nodeData: EoNNodeData = {
        label: node.config.edgeNodeId,
        config: node.config,
        state: node.state,
        deviceCount: node.devices.length,
      };

      return {
        id: node.id,
        type: 'eon',
        position: node.position || { x: 100 + index * 350, y: 100 + (index % 3) * 200 },
        data: nodeData,
      };
    });

    setReactFlowNodes(newFlowNodes);
    setFlowNodes(newFlowNodes);
  }, [storeNodes, setFlowNodes, setReactFlowNodes]);

  // Handle drag start from tool panel
  const handleDragStart = useCallback((event: React.DragEvent, type: string, data?: any) => {
    console.log('🎯 Drag started:', type, data);
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/reactflow-type', type);
    if (data) {
      event.dataTransfer.setData('application/reactflow-data', JSON.stringify(data));
    }
  }, []);

  // Create node configuration based on type
  const createNodeFromType = useCallback(
    (nodeType: string, position: { x: number; y: number }) => {
      const nodeId = `node-${Date.now()}`;
      const baseNodeNumber = storeNodes.size + 1;

      // Base configuration
      const baseConfig = {
        groupId: 'Group1',
        edgeNodeId: `${nodeType.toUpperCase()}_${baseNodeNumber}`,
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
      };

      let devices: SimulatedDevice[] = [];

      // Customize based on node type
      switch (nodeType) {
        case 'eon':
          // Basic EoN with no devices
          break;

        case 'device':
          devices = [
            {
              id: `device-${Date.now()}`,
              deviceId: `Device_${baseNodeNumber}`,
              protocol: 'SparkplugB',
              metrics: [
                { name: 'Status', datatype: 11, value: true },
                { name: 'Value', datatype: 9, value: 0 },
              ],
              dataProduction: {
                frequency: 1000,
                logic: { type: 'random', params: {} },
                enabled: true,
              },
              state: 'stopped',
            },
          ];
          break;

        case 'sensor':
          devices = [
            {
              id: `sensor-${Date.now()}`,
              deviceId: `Sensor_${baseNodeNumber}`,
              protocol: 'SparkplugB',
              metrics: [
                {
                  name: 'Temperature',
                  datatype: 9,
                  value: 25.0,
                  properties: { engineeringUnits: '°C', min: -40, max: 125 },
                },
                {
                  name: 'Pressure',
                  datatype: 9,
                  value: 101.3,
                  properties: { engineeringUnits: 'kPa', min: 0, max: 200 },
                },
                {
                  name: 'Humidity',
                  datatype: 9,
                  value: 45.0,
                  properties: { engineeringUnits: '%', min: 0, max: 100 },
                },
              ],
              dataProduction: {
                frequency: 1000,
                logic: { type: 'sine', params: { min: 20, max: 30, frequency: 0.1 } },
                enabled: true,
              },
              state: 'stopped',
            },
          ];
          break;

        case 'actuator':
          devices = [
            {
              id: `actuator-${Date.now()}`,
              deviceId: `Actuator_${baseNodeNumber}`,
              protocol: 'SparkplugB',
              metrics: [
                { name: 'Command', datatype: 11, value: false },
                {
                  name: 'Position',
                  datatype: 9,
                  value: 0,
                  properties: { engineeringUnits: '%', min: 0, max: 100 },
                },
                {
                  name: 'Speed',
                  datatype: 9,
                  value: 0,
                  properties: { engineeringUnits: 'RPM', min: 0, max: 3000 },
                },
                {
                  name: 'Current',
                  datatype: 9,
                  value: 0,
                  properties: { engineeringUnits: 'A', min: 0, max: 50 },
                },
              ],
              dataProduction: {
                frequency: 500,
                logic: { type: 'random', params: {} },
                enabled: true,
              },
              state: 'stopped',
            },
          ];
          break;

        case 'controller':
          devices = [
            {
              id: `plc-${Date.now()}`,
              deviceId: `PLC_${baseNodeNumber}`,
              protocol: 'SparkplugB',
              metrics: [
                {
                  name: 'AI_1',
                  datatype: 9,
                  value: 0,
                  properties: { engineeringUnits: 'V', min: 0, max: 10 },
                },
                {
                  name: 'AI_2',
                  datatype: 9,
                  value: 0,
                  properties: { engineeringUnits: 'V', min: 0, max: 10 },
                },
                { name: 'DI_1', datatype: 11, value: false },
                { name: 'DI_2', datatype: 11, value: false },
                { name: 'DO_1', datatype: 11, value: false },
                { name: 'DO_2', datatype: 11, value: false },
              ],
              dataProduction: {
                frequency: 2000,
                logic: { type: 'random', params: {} },
                enabled: true,
              },
              state: 'stopped',
            },
          ];
          break;
      }

      const newNode: SimulatedEoN = {
        id: nodeId,
        position,
        config: baseConfig,
        devices,
        state: 'stopped',
        metrics: [],
      };

      return newNode;
    },
    [storeNodes.size]
  );

  // Handle drop on canvas
  const handleCanvasDrop = useCallback(
    (position: { x: number; y: number }, data: any) => {
      console.log('🎯 Drop received:', position, data);
      const { type, nodeType } = data;

      if (type === 'create-node') {
        // Create new node at drop position with proper type
        const newNode = createNodeFromType(nodeType || 'eon', position);
        addNode(newNode);
        setSelectedNodeId(newNode.id);
      } else if (type === 'create-device') {
        // Add device to selected node or create standalone
        console.log('Create device:', data);
      } else if (type === 'load-template') {
        // Load template at position
        const { template } = data;
        template.config.forEach((nodeConfig: Partial<SimulatedEoN>, index: number) => {
          const nodeId = `node-${Date.now()}-${index}`;
          const newNode: SimulatedEoN = {
            id: nodeId,
            position: {
              x: position.x + index * 350,
              y: position.y,
            },
            config: nodeConfig.config!,
            devices: nodeConfig.devices || [],
            state: 'stopped',
            metrics: nodeConfig.metrics || [],
          };
          addNode(newNode);
        });
      }
    },
    [createNodeFromType, addNode]
  );

  // Handle node click
  const handleNodeClick = useCallback((node: SimulatorNode) => {
    setSelectedNodeId(node.id);
  }, []);

  // Handle edge connection
  const handleConnect = useCallback(
    (connection: Connection) => {
      setReactFlowEdges((edges) => addEdge(connection, edges));
    },
    [setReactFlowEdges]
  );

  // Quick add node (from toolbar button)
  const handleAddNode = useCallback(() => {
    const nodeId = `node-${Date.now()}`;
    const newNode: SimulatedEoN = {
      id: nodeId,
      position: {
        x: 100 + storeNodes.size * 100,
        y: 100 + (storeNodes.size % 3) * 150,
      },
      config: {
        groupId: 'Group1',
        edgeNodeId: `Node${storeNodes.size + 1}`,
        protocol: 'SparkplugB',
        sparkplugConfig: {
          bdSeqStrategy: 'sequential',
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
      devices: [],
      state: 'stopped',
      metrics: [],
    };

    addNode(newNode);
    setSelectedNodeId(nodeId);

    // Flash feedback
    console.log(`✅ Created node: ${newNode.config.edgeNodeId}`);
  }, [storeNodes.size, addNode]);

  // Handle export config
  const handleExportConfig = useCallback(() => {
    const config = Array.from(storeNodes.values());
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plant-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [storeNodes]);

  // Handle import config
  const handleImportConfig = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const config = JSON.parse(event.target?.result as string);
            config.forEach((node: SimulatedEoN) => {
              addNode(node);
            });
          } catch (error) {
            console.error('Error importing config:', error);
            alert('Failed to import configuration. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [addNode]);

  const selectedNode = selectedNodeId ? storeNodes.get(selectedNodeId) : null;

  return (
    <div className="h-full bg-slate-950 flex flex-col">
      {/* Simulator Controls - Top Bar */}
      <SimulatorControls
        onAddNode={handleAddNode}
        onLoadTemplate={() => setToolPanelOpen(true)}
        onExportConfig={handleExportConfig}
        onImportConfig={handleImportConfig}
      />

      {/* Main Content Area - Below Controls */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Tool Panel - Left Side (inside main content) */}
        <ToolPanel
          isOpen={toolPanelOpen}
          onToggle={() => setToolPanelOpen(!toolPanelOpen)}
          templates={templates}
          onDragStart={handleDragStart}
        />

        {/* ReactFlow Canvas */}
        <div className="flex-1 relative">
          {!isConnected && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-red-900/90 backdrop-blur border border-red-700 rounded-lg px-4 py-2 text-white text-sm font-medium shadow-lg">
              ⚠️ MQTT not connected. Connect to broker to enable simulation.
            </div>
          )}

          {/* Always render canvas for drag & drop support */}
          <EnhancedReactFlowCanvas
            nodes={reactFlowNodes as SimulatorNode[]}
            edges={reactFlowEdges}
            onNodesChange={onNodesChange as any}
            onEdgesChange={onEdgesChange as any}
            onConnect={handleConnect}
            onNodeClick={handleNodeClick}
            onCanvasDrop={handleCanvasDrop}
          />

          {/* Empty state overlay - allows drops to pass through */}
          {storeNodes.size === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center max-w-lg pointer-events-auto bg-slate-900/95 backdrop-blur rounded-xl p-8 border border-slate-700 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Design Your Industrial Plant
                </h3>
                <p className="text-slate-400 mb-6">
                  Drag nodes from the left panel or click "Add Node" to start building your
                  Sparkplug B network simulation.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleAddNode}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    + Add First Node
                  </button>
                  <button
                    onClick={() => setToolPanelOpen(true)}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Browse Templates
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Configuration Panel - Right Side - Always render */}
        <ConfigPanel
          node={selectedNode || undefined}
          onClose={() => setSelectedNodeId(null)}
          onUpdate={(updates) => {
            if (selectedNodeId) {
              updateNode(selectedNodeId, updates);
            }
          }}
        />
      </div>
    </div>
  );
}
