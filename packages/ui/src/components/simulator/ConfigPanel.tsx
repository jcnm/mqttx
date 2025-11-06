/**
 * Configuration Panel Component
 * Dynamic panel for configuring selected EoN nodes or devices
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSimulatorStore } from '../../stores/simulatorStore';
import { MetricEditor } from './MetricEditor';
import type { MetricDefinition, SimulatedEoN } from '../../types/simulator.types';

type TabType = 'identity' | 'devices' | 'configuration' | 'metrics' | 'lifecycle';

interface ConfigPanelProps {
  node?: SimulatedEoN;
  onClose?: () => void;
  onUpdate?: (updates: Partial<SimulatedEoN>) => void;
}

export function ConfigPanel({ node: propsNode, onClose: propsOnClose, onUpdate: propsOnUpdate }: ConfigPanelProps = {}) {
  const { selectedNode, nodes, updateNode, setSelectedNode } = useSimulatorStore();
  const [activeTab, setActiveTab] = useState<TabType>('identity');
  const [showMetricEditor, setShowMetricEditor] = useState(false);
  const [editingMetric, setEditingMetric] = useState<MetricDefinition | undefined>();
  const [panelWidth, setPanelWidth] = useState(384); // Default 384px (w-96)
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      // For right panel, we calculate from the right side of the viewport
      const newWidth = Math.max(320, Math.min(800, window.innerWidth - e.clientX));
      setPanelWidth(newWidth);
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add/remove event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Get the selected node data - use props or store
  const node = propsNode || (selectedNode ? nodes.get(selectedNode) : null);

  if (!node) {
    return (
      <div
        ref={panelRef}
        className="relative bg-slate-900 border-l border-slate-700 p-6 flex items-center justify-center"
        style={{ width: panelWidth, minWidth: panelWidth }}
      >
        <div className="text-center text-slate-500">
          <p>Select a node or device to configure</p>
        </div>

        {/* Resize Handle - on left edge for right panel */}
        <div
          onMouseDown={handleMouseDown}
          className={`
            absolute top-0 left-0 bottom-0 w-1 cursor-ew-resize
            hover:bg-emerald-500 transition-colors z-20
            ${isResizing ? 'bg-emerald-500' : 'bg-transparent'}
          `}
          title="Drag to resize"
        >
          {/* Visual indicator */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-12 bg-slate-600 rounded-r" />
        </div>
      </div>
    );
  }

  const isEoN = node.config !== undefined;

  const handleClose = () => {
    if (propsOnClose) {
      propsOnClose();
    } else {
      setSelectedNode(null);
    }
  };

  const handleUpdate = (updates: Partial<SimulatedEoN>) => {
    if (propsOnUpdate) {
      propsOnUpdate(updates);
    } else if (selectedNode) {
      updateNode(selectedNode, updates);
    }
  };

  const handleSaveMetric = (metric: MetricDefinition) => {
    if (!node) return;

    const existingMetrics = node.metrics || [];
    const metricIndex = existingMetrics.findIndex((m) => m.name === metric.name);

    let updatedMetrics: MetricDefinition[];
    if (metricIndex >= 0) {
      // Update existing
      updatedMetrics = [...existingMetrics];
      updatedMetrics[metricIndex] = metric;
    } else {
      // Add new
      updatedMetrics = [...existingMetrics, metric];
    }

    handleUpdate({ ...node, metrics: updatedMetrics });
    setShowMetricEditor(false);
    setEditingMetric(undefined);
  };

  const handleDeleteMetric = (metricName: string) => {
    if (!node) return;
    const updatedMetrics = (node.metrics || []).filter((m) => m.name !== metricName);
    handleUpdate({ ...node, metrics: updatedMetrics });
  };

  const handleEditMetric = (metric: MetricDefinition) => {
    setEditingMetric(metric);
    setShowMetricEditor(true);
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'identity', label: 'Identity' },
    { id: 'devices', label: 'Devices' },
    { id: 'configuration', label: 'Configuration' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'lifecycle', label: 'Lifecycle' },
  ];

  return (
    <div
      ref={panelRef}
      className="relative bg-slate-900 border-l border-slate-700 flex flex-col max-h-full overflow-hidden"
      style={{ width: panelWidth, minWidth: panelWidth }}
    >
      {/* Resize Handle - on left edge for right panel */}
      <div
        onMouseDown={handleMouseDown}
        className={`
          absolute top-0 left-0 bottom-0 w-1 cursor-ew-resize
          hover:bg-emerald-500 transition-colors z-20
          ${isResizing ? 'bg-emerald-500' : 'bg-transparent'}
        `}
        title="Drag to resize"
      >
        {/* Visual indicator */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-12 bg-slate-600 rounded-r" />
      </div>

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {isEoN ? 'EoN Configuration' : 'Device Configuration'}
        </h3>
        <button
          onClick={handleClose}
          className="text-slate-400 hover:text-white transition-colors px-2"
        >
          ×
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 border-b border-slate-700">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {showMetricEditor ? (
          <MetricEditor
            metric={editingMetric}
            onSave={handleSaveMetric}
            onCancel={() => {
              setShowMetricEditor(false);
              setEditingMetric(undefined);
            }}
          />
        ) : (
          <>
            {/* Identity Tab */}
            {activeTab === 'identity' && (
              <div className="space-y-4">
                {isEoN ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Group ID
                      </label>
                      <input
                        type="text"
                        value={node.config.groupId}
                        onChange={(e) =>
                          handleUpdate({
                            config: { ...node.config, groupId: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Edge Node ID
                      </label>
                      <input
                        type="text"
                        value={node.config.edgeNodeId}
                        onChange={(e) =>
                          handleUpdate({
                            config: { ...node.config, edgeNodeId: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Device ID
                    </label>
                    <input
                      type="text"
                      value={(node as any).deviceId || ''}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                      disabled
                    />
                  </div>
                )}
              </div>
            )}

            {/* Devices Tab */}
            {activeTab === 'devices' && isEoN && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-white">
                    Devices ({node.devices?.length || 0})
                  </h4>
                  <p className="text-xs text-slate-400">
                    Drag devices from the left panel to add
                  </p>
                </div>

                {(node.devices || []).length === 0 ? (
                  <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
                    <p className="text-lg mb-2">📟</p>
                    <p>No devices attached</p>
                    <p className="text-xs mt-1">
                      Select this node and drag a device from the left panel
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(node.devices || []).map((device, index) => (
                      <div
                        key={device.id}
                        className="bg-slate-800 rounded-lg p-3 border border-slate-700 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="text-sm font-medium text-white">
                                {device.deviceId}
                              </h5>
                              <span className="px-2 py-0.5 bg-purple-900/50 text-purple-400 rounded text-xs">
                                {device.protocol}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              {device.metrics?.length || 0} metrics • {device.dataProduction.frequency}ms
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const updatedDevices = node.devices.filter((_, i) => i !== index);
                              handleUpdate({ devices: updatedDevices });
                            }}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-700">
                          <p className="text-xs text-slate-500 mb-1">Metrics:</p>
                          <div className="flex flex-wrap gap-1">
                            {device.metrics?.slice(0, 6).map((metric) => (
                              <span
                                key={metric.name}
                                className="px-1.5 py-0.5 bg-slate-900 text-slate-300 rounded text-xs"
                              >
                                {metric.name}
                              </span>
                            ))}
                            {device.metrics && device.metrics.length > 6 && (
                              <span className="px-1.5 py-0.5 bg-slate-900 text-slate-400 rounded text-xs">
                                +{device.metrics.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Configuration Tab */}
            {activeTab === 'configuration' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Protocol
                  </label>
                  <select
                    value={node.config?.protocol || 'SparkplugB'}
                    onChange={(e) =>
                      handleUpdate({
                        config: {
                          ...node.config,
                          protocol: e.target.value as 'SparkplugB' | 'RawMQTTv5',
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                  >
                    <option value="SparkplugB">Sparkplug B</option>
                    <option value="RawMQTTv5">Raw MQTT v5</option>
                  </select>
                </div>

                {isEoN && node.config && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        bdSeq Strategy
                      </label>
                      <select
                        value={node.config.sparkplugConfig.bdSeqStrategy}
                        onChange={(e) =>
                          handleUpdate({
                            config: {
                              ...node.config,
                              sparkplugConfig: {
                                ...node.config.sparkplugConfig,
                                bdSeqStrategy: e.target.value as any,
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                      >
                        <option value="sequential">Sequential</option>
                        <option value="random">Random</option>
                        <option value="timestamp">Timestamp</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Rebirth Timeout (seconds)
                      </label>
                      <input
                        type="number"
                        value={node.config.sparkplugConfig.rebirthTimeout}
                        onChange={(e) =>
                          handleUpdate({
                            config: {
                              ...node.config,
                              sparkplugConfig: {
                                ...node.config.sparkplugConfig,
                                rebirthTimeout: parseInt(e.target.value) || 60,
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        QoS
                      </label>
                      <select
                        value={node.config.network.qos}
                        onChange={(e) =>
                          handleUpdate({
                            config: {
                              ...node.config,
                              network: {
                                ...node.config.network,
                                qos: parseInt(e.target.value) as 0 | 1 | 2,
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                      >
                        <option value="0">0 - At most once</option>
                        <option value="1">1 - At least once</option>
                        <option value="2">2 - Exactly once</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="cleanSession"
                        checked={node.config.network.cleanSession}
                        onChange={(e) =>
                          handleUpdate({
                            config: {
                              ...node.config,
                              network: {
                                ...node.config.network,
                                cleanSession: e.target.checked,
                              },
                            },
                          })
                        }
                        className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded"
                      />
                      <label htmlFor="cleanSession" className="text-sm text-slate-300">
                        Clean Session
                      </label>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Metrics Tab */}
            {activeTab === 'metrics' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-white">Metrics</h4>
                  <button
                    onClick={() => {
                      setEditingMetric(undefined);
                      setShowMetricEditor(true);
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    + Add Metric
                  </button>
                </div>

                {(node.metrics || []).length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No metrics defined</p>
                    <p className="text-xs mt-1">Click "Add Metric" to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(node.metrics || []).map((metric) => (
                      <div
                        key={metric.name}
                        className="bg-slate-800 rounded-lg p-3 border border-slate-700"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h5 className="text-sm font-medium text-white">{metric.name}</h5>
                            <p className="text-xs text-slate-400">
                              {metric.logic?.type || 'static'} •{' '}
                              {metric.properties?.engineeringUnits || 'no units'}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditMetric(metric)}
                              className="px-2 py-1 text-xs bg-slate-700 text-white rounded hover:bg-slate-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMetric(metric.name)}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Lifecycle Tab */}
            {activeTab === 'lifecycle' && isEoN && node.config && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoReconnect"
                    checked={node.config.lifecycle.autoReconnect}
                    onChange={(e) =>
                      handleUpdate({
                        config: {
                          ...node.config,
                          lifecycle: {
                            ...node.config.lifecycle,
                            autoReconnect: e.target.checked,
                          },
                        },
                      })
                    }
                    className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded"
                  />
                  <label htmlFor="autoReconnect" className="text-sm text-slate-300">
                    Auto Reconnect
                  </label>
                </div>

                {node.config.lifecycle.autoReconnect && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Reconnect Delay (ms)
                    </label>
                    <input
                      type="number"
                      value={node.config.lifecycle.reconnectDelay || 5000}
                      onChange={(e) =>
                        handleUpdate({
                          config: {
                            ...node.config,
                            lifecycle: {
                              ...node.config.lifecycle,
                              reconnectDelay: parseInt(e.target.value) || 5000,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Birth Schedule (cron)
                  </label>
                  <input
                    type="text"
                    value={node.config.lifecycle.birthSchedule || ''}
                    onChange={(e) =>
                      handleUpdate({
                        config: {
                          ...node.config,
                          lifecycle: {
                            ...node.config.lifecycle,
                            birthSchedule: e.target.value || undefined,
                          },
                        },
                      })
                    }
                    placeholder="e.g., 0 */5 * * * * (every 5 minutes)"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Death Schedule (cron)
                  </label>
                  <input
                    type="text"
                    value={node.config.lifecycle.deathSchedule || ''}
                    onChange={(e) =>
                      handleUpdate({
                        config: {
                          ...node.config,
                          lifecycle: {
                            ...node.config.lifecycle,
                            deathSchedule: e.target.value || undefined,
                          },
                        },
                      })
                    }
                    placeholder="Optional"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
