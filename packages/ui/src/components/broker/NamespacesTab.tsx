/**
 * Namespaces Tab Component
 * Display all Sparkplug namespaces with group IDs, edge nodes, devices, and metrics
 */

import { useMemo, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Layers,
  Server,
  Cpu,
  Activity,
  Clock,
  Hash,
  ChevronRight,
  ChevronDown,
  Circle,
  X,
  CheckCircle,
  XCircle,
  Info,
  FileJson,
} from 'lucide-react';
import { useBrokerStore } from '../../stores/brokerStore';
import type { BrokerLog } from '../../types/broker.types';

// Sparkplug datatype names
const DATATYPE_NAMES: Record<number, string> = {
  1: 'Int8',
  2: 'Int16',
  3: 'Int32',
  4: 'Int64',
  5: 'UInt8',
  6: 'UInt16',
  7: 'UInt32',
  8: 'UInt64',
  9: 'Float',
  10: 'Double',
  11: 'Boolean',
  12: 'String',
  13: 'DateTime',
  14: 'Text',
  15: 'UUID',
  16: 'DataSet',
  17: 'Bytes',
  18: 'File',
  19: 'Template',
};

interface EdgeNodeState {
  edgeNodeId: string;
  groupId: string;
  isOnline: boolean;
  bdSeq?: bigint;
  seq?: bigint;
  birthTimestamp?: number;
  deathTimestamp?: number;
  devices: Map<string, DeviceState>;
  latestMetrics: Map<string, MetricInfo>;
  messageCount: number;
  lastActivity: number;
}

interface DeviceState {
  deviceId: string;
  isOnline: boolean;
  birthTimestamp?: number;
  deathTimestamp?: number;
  latestMetrics: Map<string, MetricInfo>;
  messageCount: number;
  lastActivity: number;
}

interface MetricInfo {
  name: string;
  value: unknown;
  datatype: number;
  timestamp?: number;
  alias?: number;
}

// Build Sparkplug state from logs
function buildSparkplugState(logs: BrokerLog[]): Map<string, Map<string, EdgeNodeState>> {
  const groups = new Map<string, Map<string, EdgeNodeState>>();

  // Process logs in order to build state
  for (const log of logs) {
    if (!log.messageType || !log.sparkplugMetadata) continue;

    const { groupId, edgeNodeId, deviceId } = log.sparkplugMetadata;
    if (!groupId || !edgeNodeId) continue;

    // Get or create group
    if (!groups.has(groupId)) {
      groups.set(groupId, new Map());
    }
    const group = groups.get(groupId)!;

    // Get or create edge node
    if (!group.has(edgeNodeId)) {
      group.set(edgeNodeId, {
        edgeNodeId,
        groupId,
        isOnline: false,
        devices: new Map(),
        latestMetrics: new Map(),
        messageCount: 0,
        lastActivity: log.timestamp,
      });
    }
    const node = group.get(edgeNodeId)!;
    node.messageCount++;
    node.lastActivity = Math.max(node.lastActivity, log.timestamp);

    // Handle message types
    switch (log.messageType) {
      case 'NBIRTH':
        node.isOnline = true;
        node.birthTimestamp = log.timestamp;
        node.bdSeq = log.sparkplugMetadata.bdSeq;
        node.seq = log.sparkplugMetadata.seq;
        // Clear old metrics on rebirth
        node.latestMetrics.clear();
        // Add metrics from birth
        if (log.decoded?.metrics) {
          for (const metric of log.decoded.metrics) {
            if (metric.name) {
              node.latestMetrics.set(metric.name, {
                name: metric.name,
                value: metric.value,
                datatype: metric.datatype ?? 0,
                timestamp: metric.timestamp ? Number(metric.timestamp) : log.timestamp,
                alias: metric.alias !== undefined ? Number(metric.alias) : undefined,
              });
            }
          }
        }
        break;

      case 'NDEATH':
        node.isOnline = false;
        node.deathTimestamp = log.timestamp;
        // Mark all devices offline
        for (const device of node.devices.values()) {
          device.isOnline = false;
          device.deathTimestamp = log.timestamp;
        }
        break;

      case 'NDATA':
        node.seq = log.sparkplugMetadata.seq;
        // Update metrics
        if (log.decoded?.metrics) {
          for (const metric of log.decoded.metrics) {
            const name = metric.name || (metric.alias !== undefined ? `alias_${metric.alias}` : undefined);
            if (name) {
              node.latestMetrics.set(name, {
                name,
                value: metric.value,
                datatype: metric.datatype ?? 0,
                timestamp: metric.timestamp ? Number(metric.timestamp) : log.timestamp,
                alias: metric.alias !== undefined ? Number(metric.alias) : undefined,
              });
            }
          }
        }
        break;

      case 'DBIRTH':
        if (deviceId) {
          if (!node.devices.has(deviceId)) {
            node.devices.set(deviceId, {
              deviceId,
              isOnline: false,
              latestMetrics: new Map(),
              messageCount: 0,
              lastActivity: log.timestamp,
            });
          }
          const device = node.devices.get(deviceId)!;
          device.isOnline = true;
          device.birthTimestamp = log.timestamp;
          device.messageCount++;
          device.lastActivity = log.timestamp;
          device.latestMetrics.clear();
          // Add metrics
          if (log.decoded?.metrics) {
            for (const metric of log.decoded.metrics) {
              if (metric.name) {
                device.latestMetrics.set(metric.name, {
                  name: metric.name,
                  value: metric.value,
                  datatype: metric.datatype ?? 0,
                  timestamp: metric.timestamp ? Number(metric.timestamp) : log.timestamp,
                  alias: metric.alias !== undefined ? Number(metric.alias) : undefined,
                });
              }
            }
          }
        }
        break;

      case 'DDEATH':
        if (deviceId && node.devices.has(deviceId)) {
          const device = node.devices.get(deviceId)!;
          device.isOnline = false;
          device.deathTimestamp = log.timestamp;
        }
        break;

      case 'DDATA':
        if (deviceId) {
          if (!node.devices.has(deviceId)) {
            node.devices.set(deviceId, {
              deviceId,
              isOnline: true,
              latestMetrics: new Map(),
              messageCount: 0,
              lastActivity: log.timestamp,
            });
          }
          const device = node.devices.get(deviceId)!;
          device.messageCount++;
          device.lastActivity = log.timestamp;
          // Update metrics
          if (log.decoded?.metrics) {
            for (const metric of log.decoded.metrics) {
              const name = metric.name || (metric.alias !== undefined ? `alias_${metric.alias}` : undefined);
              if (name) {
                device.latestMetrics.set(name, {
                  name,
                  value: metric.value,
                  datatype: metric.datatype ?? 0,
                  timestamp: metric.timestamp ? Number(metric.timestamp) : log.timestamp,
                  alias: metric.alias !== undefined ? Number(metric.alias) : undefined,
                });
              }
            }
          }
        }
        break;
    }
  }

  return groups;
}

function formatMetricValue(value: unknown, datatype: number): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'number') {
    if (datatype === 9 || datatype === 10) {
      return value.toFixed(4);
    }
    return value.toString();
  }
  if (typeof value === 'string') return value;
  if (value instanceof Uint8Array) {
    return `[${value.length} bytes]`;
  }
  return JSON.stringify(value);
}

// Edge Node Detail Panel
function EdgeNodeDetailPanel({
  node,
  onClose,
}: {
  node: EdgeNodeState;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'devices'>('metrics');
  const [selectedDevice, setSelectedDevice] = useState<DeviceState | null>(null);

  const metrics = Array.from(node.latestMetrics.values());
  const devices = Array.from(node.devices.values());

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{node.edgeNodeId}</h3>
                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                  node.isOnline
                    ? 'bg-green-900/50 text-green-400'
                    : 'bg-red-900/50 text-red-400'
                }`}>
                  {node.isOnline ? (
                    <><CheckCircle className="w-3 h-3" /> Online</>
                  ) : (
                    <><XCircle className="w-3 h-3" /> Offline</>
                  )}
                </span>
              </div>
              <p className="text-sm text-blue-400">Group: {node.groupId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 p-4 border-b border-slate-700 bg-slate-800/30">
          <div className="text-center">
            <p className="text-xs text-slate-400">Messages</p>
            <p className="text-lg font-bold text-white">{node.messageCount}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Devices</p>
            <p className="text-lg font-bold text-yellow-400">{devices.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Metrics</p>
            <p className="text-lg font-bold text-cyan-400">{metrics.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Sequence</p>
            <p className="text-lg font-bold text-white font-mono">
              {node.seq?.toString() || '-'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-700 bg-slate-800/20">
          {[
            { id: 'metrics', label: 'Node Metrics', icon: Activity, count: metrics.length },
            { id: 'devices', label: 'Devices', icon: Cpu, count: devices.length },
          ].map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as typeof activeTab);
                setSelectedDevice(null);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className="text-xs opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'metrics' && (
            <MetricsTable metrics={metrics} />
          )}

          {activeTab === 'devices' && !selectedDevice && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {devices.map((device) => (
                <button
                  type="button"
                  key={device.deviceId}
                  onClick={() => setSelectedDevice(device)}
                  className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white font-mono">
                      {device.deviceId}
                    </span>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      device.isOnline
                        ? 'bg-green-900/50 text-green-400'
                        : 'bg-red-900/50 text-red-400'
                    }`}>
                      {device.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div>
                      <span className="text-slate-500">Metrics:</span>
                      <span className="ml-1 text-cyan-400">{device.latestMetrics.size}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Messages:</span>
                      <span className="ml-1 text-white">{device.messageCount}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    Last activity: {formatDistanceToNow(device.lastActivity, { addSuffix: true })}
                  </div>
                </button>
              ))}
              {devices.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-500">
                  <Cpu className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No devices registered</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'devices' && selectedDevice && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setSelectedDevice(null)}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to devices
              </button>

              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Cpu className="w-5 h-5 text-purple-400" />
                    <div>
                      <h4 className="font-semibold text-white">{selectedDevice.deviceId}</h4>
                      <p className="text-xs text-slate-400">
                        {selectedDevice.latestMetrics.size} metrics
                      </p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                    selectedDevice.isOnline
                      ? 'bg-green-900/50 text-green-400'
                      : 'bg-red-900/50 text-red-400'
                  }`}>
                    {selectedDevice.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                <MetricsTable metrics={Array.from(selectedDevice.latestMetrics.values())} />
              </div>
            </div>
          )}
        </div>

        {/* Footer with timestamps */}
        <div className="px-6 py-3 border-t border-slate-700 bg-slate-800/30 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {node.birthTimestamp && (
                <span>
                  <Clock className="w-3 h-3 inline mr-1" />
                  Birth: {format(node.birthTimestamp, 'yyyy-MM-dd HH:mm:ss')}
                </span>
              )}
              {node.deathTimestamp && (
                <span className="text-red-400">
                  <XCircle className="w-3 h-3 inline mr-1" />
                  Death: {format(node.deathTimestamp, 'yyyy-MM-dd HH:mm:ss')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {node.bdSeq !== undefined && (
                <span>
                  <Hash className="w-3 h-3 inline mr-1" />
                  bdSeq: {node.bdSeq.toString()}
                </span>
              )}
              <span>
                Last activity: {formatDistanceToNow(node.lastActivity, { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricsTable({ metrics }: { metrics: MetricInfo[] }) {
  if (metrics.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No metrics available</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-900/50">
          <tr>
            <th className="text-left px-4 py-2 text-slate-400 font-medium">Name</th>
            <th className="text-left px-4 py-2 text-slate-400 font-medium">Value</th>
            <th className="text-left px-4 py-2 text-slate-400 font-medium">Type</th>
            <th className="text-left px-4 py-2 text-slate-400 font-medium">Alias</th>
            <th className="text-left px-4 py-2 text-slate-400 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {metrics.map((metric) => (
            <tr key={metric.name} className="hover:bg-slate-700/30">
              <td className="px-4 py-2 font-mono text-emerald-400">
                {metric.name}
              </td>
              <td className="px-4 py-2 font-mono text-white">
                {formatMetricValue(metric.value, metric.datatype)}
              </td>
              <td className="px-4 py-2 text-slate-400">
                {DATATYPE_NAMES[metric.datatype] || `Type ${metric.datatype}`}
              </td>
              <td className="px-4 py-2 text-slate-500 font-mono">
                {metric.alias !== undefined ? metric.alias : '-'}
              </td>
              <td className="px-4 py-2 text-slate-400 text-xs">
                {metric.timestamp
                  ? format(metric.timestamp, 'HH:mm:ss.SSS')
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Edge Node Card Component
function EdgeNodeCard({
  node,
  onViewDetails,
}: {
  node: EdgeNodeState;
  onViewDetails: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const devices = Array.from(node.devices.values());
  const metrics = Array.from(node.latestMetrics.values()).slice(0, 5);

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-4">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
            </span>
            <Server className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="font-semibold text-white font-mono">
                {node.edgeNodeId}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
                  node.isOnline
                    ? 'bg-green-900/50 text-green-400'
                    : 'bg-red-900/50 text-red-400'
                }`}>
                  <Circle className={`w-2 h-2 ${node.isOnline ? 'fill-green-400' : 'fill-red-400'}`} />
                  {node.isOnline ? 'Online' : 'Offline'}
                </span>
                <span className="text-xs text-slate-500">
                  {formatDistanceToNow(node.lastActivity, { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-400">Devices</div>
              <div className="text-lg font-bold text-yellow-400">{devices.length}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Metrics</div>
              <div className="text-lg font-bold text-cyan-400">{node.latestMetrics.size}</div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-500 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-700 p-4 bg-slate-900/30">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-900 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-400">Messages</p>
              <p className="font-bold text-white">{node.messageCount}</p>
            </div>
            <div className="bg-slate-900 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-400">Sequence</p>
              <p className="font-bold text-white font-mono">{node.seq?.toString() || '-'}</p>
            </div>
            <div className="bg-slate-900 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-400">BD Seq</p>
              <p className="font-bold text-white font-mono">{node.bdSeq?.toString() || '-'}</p>
            </div>
            <div className="bg-slate-900 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-400">Birth</p>
              <p className="font-bold text-white text-xs">
                {node.birthTimestamp ? format(node.birthTimestamp, 'HH:mm:ss') : '-'}
              </p>
            </div>
          </div>

          {/* Recent Metrics Preview */}
          {metrics.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Recent Metrics
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {metrics.map((metric) => (
                  <div key={metric.name} className="bg-slate-900 rounded-lg p-2">
                    <p className="text-xs text-slate-400 truncate">{metric.name}</p>
                    <p className="font-mono text-sm text-white truncate">
                      {formatMetricValue(metric.value, metric.datatype)}
                    </p>
                  </div>
                ))}
              </div>
              {node.latestMetrics.size > 5 && (
                <p className="text-xs text-slate-500 mt-2">
                  +{node.latestMetrics.size - 5} more metrics
                </p>
              )}
            </div>
          )}

          {/* Devices Preview */}
          {devices.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Devices
              </h5>
              <div className="flex flex-wrap gap-2">
                {devices.map((device) => (
                  <div
                    key={device.deviceId}
                    className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-1.5"
                  >
                    <Cpu className="w-3 h-3 text-purple-400" />
                    <span className="text-sm text-white font-mono">{device.deviceId}</span>
                    <Circle className={`w-2 h-2 ${device.isOnline ? 'fill-green-400' : 'fill-red-400'}`} />
                    <span className="text-xs text-slate-400">
                      {device.latestMetrics.size} metrics
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function NamespacesTab() {
  const { logs } = useBrokerStore();
  const [selectedNode, setSelectedNode] = useState<EdgeNodeState | null>(null);

  // Build Sparkplug state from logs
  const sparkplugState = useMemo(() => buildSparkplugState(logs), [logs]);

  // Calculate statistics
  const stats = useMemo(() => {
    let totalGroups = 0;
    let totalEdgeNodes = 0;
    let totalDevices = 0;
    let onlineNodes = 0;
    let totalMetrics = 0;

    for (const [, group] of sparkplugState) {
      totalGroups++;
      for (const [, node] of group) {
        totalEdgeNodes++;
        if (node.isOnline) onlineNodes++;
        totalDevices += node.devices.size;
        totalMetrics += node.latestMetrics.size;
        for (const device of node.devices.values()) {
          totalMetrics += device.latestMetrics.size;
        }
      }
    }

    return { totalGroups, totalEdgeNodes, totalDevices, onlineNodes, totalMetrics };
  }, [sparkplugState]);

  if (sparkplugState.size === 0) {
    return (
      <div className="space-y-4">
        {/* Stats showing zero state */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
            <p className="text-xs text-slate-400">Groups</p>
            <p className="text-xl font-bold text-blue-500">0</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
            <p className="text-xs text-slate-400">Edge Nodes</p>
            <p className="text-xl font-bold text-emerald-500">0</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
            <p className="text-xs text-slate-400">Online</p>
            <p className="text-xl font-bold text-green-500">0</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
            <p className="text-xs text-slate-400">Devices</p>
            <p className="text-xl font-bold text-yellow-500">0</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
            <p className="text-xs text-slate-400">Metrics</p>
            <p className="text-xl font-bold text-cyan-500">0</p>
          </div>
        </div>

        <div className="text-center py-12 bg-slate-900 rounded-lg border border-slate-800">
          <Layers className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">No Sparkplug namespaces detected</p>
          <p className="text-sm text-slate-500 mt-2">
            Namespaces will appear here when Sparkplug nodes publish birth certificates
          </p>
        </div>

        {/* Info Panel */}
        <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-400 mb-2">About Sparkplug Namespaces</h4>
              <p className="text-sm text-slate-400 mb-3">
                Sparkplug B uses namespaces to organize MQTT topics in a hierarchical structure:
              </p>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>
                  <code className="text-yellow-400">spBv1.0</code> - Sparkplug B Version 1.0 (most common)
                </li>
                <li>Groups organize related Edge of Network (EoN) nodes</li>
                <li>Each EoN node can have multiple devices attached</li>
                <li>
                  Topic format:{' '}
                  <code className="text-yellow-400">namespace/groupId/messageType/edgeNodeId/deviceId</code>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Groups</p>
          <p className="text-xl font-bold text-blue-500">{stats.totalGroups}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Edge Nodes</p>
          <p className="text-xl font-bold text-emerald-500">{stats.totalEdgeNodes}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Online</p>
          <p className="text-xl font-bold text-green-500">{stats.onlineNodes}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Devices</p>
          <p className="text-xl font-bold text-yellow-500">{stats.totalDevices}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Total Metrics</p>
          <p className="text-xl font-bold text-cyan-500">{stats.totalMetrics}</p>
        </div>
      </div>

      {/* Groups and Edge Nodes */}
      <div className="space-y-6">
        {Array.from(sparkplugState.entries()).map(([groupId, nodes]) => (
          <div key={groupId} className="bg-slate-900 rounded-lg border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Group: {groupId}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {nodes.size} edge node{nodes.size !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  Topic prefix: <code className="text-yellow-400">spBv1.0/{groupId}/</code>
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {Array.from(nodes.values())
                .sort((a, b) => b.lastActivity - a.lastActivity)
                .map((node) => (
                  <EdgeNodeCard
                    key={node.edgeNodeId}
                    node={node}
                    onViewDetails={() => setSelectedNode(node)}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sparkplug Topic Structure Reference */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <FileJson className="w-4 h-4" />
          Sparkplug B Topic Structure
        </h4>
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          {[
            { type: 'NBIRTH', color: 'text-green-400', path: 'spBv1.0/[group]/NBIRTH/[node]' },
            { type: 'NDATA', color: 'text-blue-400', path: 'spBv1.0/[group]/NDATA/[node]' },
            { type: 'NDEATH', color: 'text-red-400', path: 'spBv1.0/[group]/NDEATH/[node]' },
            { type: 'NCMD', color: 'text-purple-400', path: 'spBv1.0/[group]/NCMD/[node]' },
            { type: 'DBIRTH', color: 'text-emerald-400', path: 'spBv1.0/[group]/DBIRTH/[node]/[device]' },
            { type: 'DDATA', color: 'text-cyan-400', path: 'spBv1.0/[group]/DDATA/[node]/[device]' },
            { type: 'DDEATH', color: 'text-pink-400', path: 'spBv1.0/[group]/DDEATH/[node]/[device]' },
            { type: 'DCMD', color: 'text-violet-400', path: 'spBv1.0/[group]/DCMD/[node]/[device]' },
          ].map((item) => (
            <div key={item.type} className="bg-slate-800 rounded p-2 flex items-center gap-2">
              <span className={`font-semibold ${item.color}`}>{item.type}:</span>
              <span className="text-slate-400">{item.path}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Panel Modal */}
      {selectedNode && (
        <EdgeNodeDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
