/**
 * Plant Simulator Component
 * Graphical node-based designer for simulating EoN nodes and devices
 */

import { useState, useEffect, useRef } from 'react';
import { useSimulatorStore } from '../../stores/simulatorStore';
import { useMQTTStore } from '../../stores/mqttStore';
import { ReactFlowCanvas } from './ReactFlowCanvas';
import { SimulatorControls } from './SimulatorControls';
import { ConfigPanel } from './ConfigPanel';
import { NodeTemplates } from './NodeTemplates';
import { createSimulationEngine } from '../../services/simulationEngine';
import type { SimulatedEoN, EoNNodeData } from '../../types/simulator.types';

export function PlantSimulator() {
  const {
    nodes,
    setFlowNodes,
    isRunning,
    speed,
    addNode,
    updateStats,
  } = useSimulatorStore();

  const { client: mqttClient, isConnected } = useMQTTStore();

  const [showTemplates, setShowTemplates] = useState(false);
  const simulationEngineRef = useRef<ReturnType<typeof createSimulationEngine> | null>(null);

  // Initialize simulation engine
  useEffect(() => {
    if (mqttClient) {
      simulationEngineRef.current = createSimulationEngine(mqttClient, speed);
    }
  }, [mqttClient, speed]);

  // Update engine speed when changed
  useEffect(() => {
    if (simulationEngineRef.current) {
      simulationEngineRef.current.setSpeed(speed);
    }
  }, [speed]);

  // Start/stop simulation engine
  useEffect(() => {
    if (!simulationEngineRef.current) return;

    if (isRunning) {
      simulationEngineRef.current.start(nodes, (engineStats) => {
        updateStats(engineStats);
      });
    } else {
      simulationEngineRef.current.stop(nodes);
    }

    return () => {
      if (simulationEngineRef.current && isRunning) {
        simulationEngineRef.current.stop(nodes);
      }
    };
  }, [isRunning, nodes, updateStats]);

  // Sync nodes to ReactFlow
  useEffect(() => {
    const newFlowNodes = Array.from(nodes.values()).map((node, index) => {
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

    setFlowNodes(newFlowNodes);
  }, [nodes, setFlowNodes]);

  const handleAddNode = () => {
    const nodeId = `node-${Date.now()}`;
    const newNode: SimulatedEoN = {
      id: nodeId,
      position: { x: 100, y: 100 },
      config: {
        groupId: 'Group1',
        edgeNodeId: `Node${nodes.size + 1}`,
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
          qos: 1,
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
  };

  const handleLoadTemplate = () => {
    setShowTemplates(true);
  };

  const handleSelectTemplate = (template: any) => {
    // Add template nodes to canvas
    template.config.forEach((nodeConfig: Partial<SimulatedEoN>, index: number) => {
      const nodeId = `node-${Date.now()}-${index}`;
      const newNode: SimulatedEoN = {
        id: nodeId,
        position: { x: 100 + index * 350, y: 100 },
        config: nodeConfig.config!,
        devices: nodeConfig.devices || [],
        state: 'stopped',
        metrics: nodeConfig.metrics || [],
      };
      addNode(newNode);
    });

    setShowTemplates(false);
  };

  const handleExportConfig = () => {
    const config = Array.from(nodes.values());
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulator-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = () => {
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
  };

  return (
    <div className="h-full bg-slate-950 flex flex-col">
      {/* Simulator Controls */}
      <SimulatorControls
        onAddNode={handleAddNode}
        onLoadTemplate={handleLoadTemplate}
        onExportConfig={handleExportConfig}
        onImportConfig={handleImportConfig}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* ReactFlow Canvas */}
        <div className="flex-1 relative">
          {!isConnected && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-red-900/90 border border-red-700 rounded-lg px-4 py-2 text-white text-sm">
              ⚠️ MQTT not connected. Please connect to broker first.
            </div>
          )}

          {nodes.size === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="text-center">
                <div className="text-6xl mb-4">⚙️</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Nodes Created</h3>
                <p className="text-slate-400 mb-4">
                  Start by adding EoN nodes or loading a template
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handleAddNode}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    + Add EoN Node
                  </button>
                  <button
                    onClick={handleLoadTemplate}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
                  >
                    📋 Load Template
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <ReactFlowCanvas />
          )}
        </div>

        {/* Configuration Panel */}
        <ConfigPanel />
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <NodeTemplates
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}
