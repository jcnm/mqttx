/**
 * Detail Panel Component
 * Shows full details of selected node or device with tabs
 */

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  BarChart3,
  TrendingUp,
  Cake,
  ScrollText,
  Clipboard,
  FolderOpen,
  X,
  Copy
} from 'lucide-react';
import { useSCADAStore } from '../../stores/scadaStore';
import { MetricGrid } from './MetricDisplay';
import { DeviceCard } from './DeviceCard';
import { TemplateDisplay } from './TemplateDisplay';
import { DataSetTable } from './DataSetTable';

type TabType = 'overview' | 'metrics' | 'birth' | 'history' | 'templates' | 'datasets';

export function DetailPanel() {
  const { nodes, devices, selectedNode, selectedDevice, setSelectedNode, setSelectedDevice } =
    useSCADAStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [metricSearch, setMetricSearch] = useState('');

  // Get selected entity
  const node = selectedNode ? nodes.get(selectedNode) : null;
  const device = selectedDevice ? devices.get(selectedDevice) : null;

  const entity = node || device;
  const isNode = !!node;

  // Close panel
  const handleClose = () => {
    setSelectedNode(null);
    setSelectedDevice(null);
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (!entity) return;

    const data = {
      type: isNode ? 'node' : 'device',
      ...(isNode && node
        ? {
            groupId: node.groupId,
            edgeNodeId: node.edgeNodeId,
            online: node.online,
            bdSeq: node.bdSeq.toString(),
            seq: node.seq.toString(),
            birthTimestamp: node.birthTimestamp.toString(),
            lastUpdate: node.lastUpdate?.toString(),
            metrics: Array.from(node.metrics.entries()).map(([name, metric]) => ({
              name,
              value: String(metric.value),
              datatype: metric.datatype,
              timestamp: metric.timestamp.toString(),
            })),
            devices: node.devices,
          }
        : {}),
      ...(device
        ? {
            deviceId: device.deviceId,
            online: device.online,
            lastUpdate: device.lastUpdate?.toString(),
            tags: device.tags,
            metrics: Array.from(device.metrics.entries()).map(([name, metric]) => ({
              name,
              value: String(metric.value),
              datatype: metric.datatype,
              timestamp: metric.timestamp.toString(),
            })),
          }
        : {}),
    };

    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  // Extract templates and datasets
  const { templates, datasets, regularMetrics } = useMemo(() => {
    const templates = new Map();
    const datasets = new Map();
    const regularMetrics = new Map();

    entity?.metrics.forEach((metric, name) => {
      if (metric.datatype === 19) {
        // Template
        templates.set(name, { template: metric.value, timestamp: metric.timestamp });
      } else if (metric.datatype === 16) {
        // DataSet
        datasets.set(name, { dataset: metric.value, timestamp: metric.timestamp });
      } else {
        regularMetrics.set(name, metric);
      }
    });

    return { templates, datasets, regularMetrics };
  }, [entity]);

  // Filter metrics (only regular metrics, excluding templates and datasets)
  const filteredMetrics = useMemo(() => {
    if (!metricSearch) return regularMetrics;

    const filtered = new Map();
    regularMetrics.forEach((metric, name) => {
      if (name.toLowerCase().includes(metricSearch.toLowerCase())) {
        filtered.set(name, metric);
      }
    });
    return filtered;
  }, [regularMetrics, metricSearch]);

  // Empty state
  if (!entity) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">👆</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No Selection
          </h3>
          <p className="text-slate-400">
            Select a node or device to view details
          </p>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; icon: React.ComponentType<{ className?: string }>; label: string; tooltip: string }[] = [
    {
      id: 'overview',
      icon: BarChart3,
      label: 'Overview',
      tooltip: 'Overview - General information and statistics'
    },
    {
      id: 'metrics',
      icon: TrendingUp,
      label: `Metrics (${regularMetrics.size})`,
      tooltip: `Metrics - Real-time metric values (${regularMetrics.size})`
    },
    {
      id: 'birth',
      icon: Cake,
      label: 'Birth',
      tooltip: 'Birth Certificate - Initial connection data'
    },
    {
      id: 'history',
      icon: ScrollText,
      label: 'History',
      tooltip: 'History - Historical metric data over time'
    },
    {
      id: 'templates',
      icon: Clipboard,
      label: `Templates (${templates.size})`,
      tooltip: `Templates - User Defined Types (${templates.size})`
    },
    {
      id: 'datasets',
      icon: FolderOpen,
      label: `DataSets (${datasets.size})`,
      tooltip: `DataSets - Tabular data structures (${datasets.size})`
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white truncate">
                {isNode && node ? node.edgeNodeId : device?.deviceId}
              </h2>
              <span
                className={`w-3 h-3 rounded-full ${
                  entity.online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              <span
                className={`px-2 py-1 text-xs font-semibold text-white rounded ${
                  isNode ? 'bg-emerald-700' : 'bg-blue-700'
                }`}
              >
                {isNode ? 'Edge Node' : 'Device'}
              </span>
            </div>
            {isNode && node && (
              <p className="text-slate-400">Group: {node.groupId}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title="Copy to clipboard"
            >
              <Copy className="w-5 h-5" />
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.tooltip}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-emerald-600'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content - Scrollable Container */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 max-h-[calc(100vh-400px)] overflow-y-auto">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Status</p>
                <p
                  className={`text-lg font-bold ${
                    entity.online ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {entity.online ? 'ONLINE' : 'OFFLINE'}
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Metrics</p>
                <p className="text-lg font-bold text-white">{entity.metrics.size}</p>
              </div>
              {isNode && node && (
                <>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Devices</p>
                    <p className="text-lg font-bold text-white">{node.devices.length}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Sequence</p>
                    <p className="text-lg font-bold text-white font-mono">
                      {node.seq.toString()}
                    </p>
                  </div>
                </>
              )}
            </div>

            {isNode && node && (
              <>
                <div className="bg-slate-800 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-white mb-2">
                    Connection Info
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Group ID:</span>
                      <span className="text-white font-mono">{node.groupId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Edge Node ID:</span>
                      <span className="text-white font-mono">{node.edgeNodeId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Birth Sequence:</span>
                      <span className="text-white font-mono">
                        {node.bdSeq.toString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Birth Time:</span>
                      <span className="text-white">
                        {format(new Date(Number(node.birthTimestamp)), 'PPpp')}
                      </span>
                    </div>
                    {node.lastUpdate && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Last Update:</span>
                        <span className="text-white">
                          {format(new Date(Number(node.lastUpdate)), 'PPpp')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {node.devices.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">
                      Devices ({node.devices.length})
                    </h4>
                    <div className="space-y-2">
                      {node.devices.map((dev) => (
                        <DeviceCard
                          key={dev.deviceId}
                          device={dev}
                          compact
                          onSelect={() => setSelectedDevice(dev.deviceId)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {device && (
              <div className="bg-slate-800 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-white mb-2">Device Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Device ID:</span>
                    <span className="text-white font-mono">{device.deviceId}</span>
                  </div>
                  {device.lastUpdate && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Last Update:</span>
                      <span className="text-white">
                        {format(new Date(Number(device.lastUpdate)), 'PPpp')}
                      </span>
                    </div>
                  )}
                  {device.tags && device.tags.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tags:</span>
                      <div className="flex gap-1">
                        {device.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs bg-slate-700 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="space-y-4">
            {/* Search */}
            <input
              type="text"
              value={metricSearch}
              onChange={(e) => setMetricSearch(e.target.value)}
              placeholder="Search metrics..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />

            {/* Metrics Grid */}
            {filteredMetrics.size > 0 ? (
              <MetricGrid metrics={filteredMetrics} />
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p>No metrics match your search</p>
              </div>
            )}
          </div>
        )}

        {/* Birth Certificate Tab */}
        {activeTab === 'birth' && isNode && node && (
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">
                Birth Certificate Data
              </h4>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">bdSeq:</span>
                  <span className="text-white">{node.bdSeq.toString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">seq:</span>
                  <span className="text-white">{node.seq.toString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">timestamp:</span>
                  <span className="text-white">{node.birthTimestamp.toString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-2">
                Birth Metrics ({node.metrics.size})
              </h4>
              <MetricGrid metrics={node.metrics} />
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <p className="text-sm text-slate-400 mb-4">
              Historical metric data will be displayed here when metric history tracking
              is implemented.
            </p>
            <div className="bg-slate-800 rounded-lg p-8 text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-slate-400">
                Metric history tracking coming in Phase 4
              </p>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            {templates.size > 0 ? (
              Array.from(templates.entries()).map(([name, { template, timestamp }]) => (
                <TemplateDisplay
                  key={name}
                  name={name}
                  template={template}
                  timestamp={timestamp}
                />
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-2">📋</div>
                <p>No templates defined</p>
                <p className="text-xs text-slate-500 mt-2">
                  Templates (UDT) will appear here when received in Sparkplug B messages
                </p>
              </div>
            )}
          </div>
        )}

        {/* DataSets Tab */}
        {activeTab === 'datasets' && (
          <div className="space-y-4">
            {datasets.size > 0 ? (
              Array.from(datasets.entries()).map(([name, { dataset, timestamp }]) => (
                <DataSetTable
                  key={name}
                  name={name}
                  dataset={dataset}
                  timestamp={timestamp}
                />
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-2">📊</div>
                <p>No datasets available</p>
                <p className="text-xs text-slate-500 mt-2">
                  DataSets will appear here when received in Sparkplug B messages
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
