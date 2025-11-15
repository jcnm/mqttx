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
    stats,
    addNode,
    updateStats,
  } = useSimulatorStore();

  const { client: mqttClient, isConnected } = useMQTTStore();

  const [showTemplates, setShowTemplates] = useState(false);
  const simulationEngineRef = useRef<ReturnType<typeof createSimulationEngine> | null>(null);
  const prevUptimeRef = useRef<number>(0);

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

  // Detect reset (when uptime goes from >0 to 0)
  useEffect(() => {
    if (prevUptimeRef.current > 0 && stats.uptime === 0) {
      console.log('🔄 Reset detected - resetting simulation engine...');
      if (simulationEngineRef.current) {
        simulationEngineRef.current.reset();
      }
    }
    prevUptimeRef.current = stats.uptime;
  }, [stats.uptime]);

  // Start/stop/pause/resume simulation engine
  useEffect(() => {
    if (!simulationEngineRef.current) return;

    // Check if any nodes are paused (resume scenario)
    const hasPausedNodes = Array.from(nodes.values()).some(n => n.state === 'paused');

    if (isRunning) {
      if (hasPausedNodes) {
        // Resume from pause
        console.log('▶️  Resuming simulation...');
        simulationEngineRef.current.resume();
      } else {
        // If simulation is running and nodes changed, restart it
        // First stop the current simulation
        if (simulationEngineRef.current.isRunning()) {
          console.log('📝 Nodes changed - restarting simulation...');
          simulationEngineRef.current.stop(nodes);
        }

        // Then start with updated nodes
        simulationEngineRef.current.start(nodes, (engineStats) => {
          updateStats(engineStats);
        });
      }
    } else {
      // Only pause/stop if actually running
      if (simulationEngineRef.current.isRunning()) {
        // Check if nodes are being paused vs stopped
        const hasRunningNodes = Array.from(nodes.values()).some(n => n.state === 'running');
        if (hasPausedNodes && !hasRunningNodes) {
          // Pause scenario
          console.log('⏸️  Pausing simulation...');
          simulationEngineRef.current.pause();
        } else {
          // Stop scenario
          console.log('🛑 Stopping simulation...');
          simulationEngineRef.current.stop(nodes);
        }
      }
    }

    return () => {
      if (simulationEngineRef.current && simulationEngineRef.current.isRunning()) {
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
    const nodeNumber = nodes.size + 1;
    const newNode: SimulatedEoN = {
      id: nodeId,
      position: { x: 100, y: 100 },
      config: {
        groupId: 'Group1',
        edgeNodeId: `Node${nodeNumber}`,
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
      // Add default metrics so the node can publish immediately
      metrics: [
        {
          name: 'NodeStatus',
          datatype: 11, // Boolean
          value: true,
          properties: {
            description: 'Node operational status',
          },
        },
        {
          name: 'Temperature',
          datatype: 9, // Float
          value: 25.0,
          properties: {
            engineeringUnits: '°C',
            min: 0,
            max: 100,
            description: 'Node temperature',
          },
          logic: {
            type: 'sine',
            params: { min: 20, max: 30, frequency: 0.05 },
          },
        },
        {
          name: 'Uptime',
          datatype: 7, // UInt32
          value: 0,
          properties: {
            engineeringUnits: 'seconds',
            description: 'Node uptime',
          },
          logic: {
            type: 'linear',
            params: { value: 0, slope: 1 },
          },
        },
      ],
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
