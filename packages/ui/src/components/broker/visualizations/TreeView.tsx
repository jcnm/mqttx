/**
 * Tree View Component
 * Hierarchical topic structure with collapsible nodes and message details
 */

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  ChevronRight,
  ChevronDown,
  Circle,
  FolderTree,
  MessageSquare,
  Clock,
  Hash,
  Layers,
  Database,
  Tag,
  X,
  Activity,
  Cpu,
  FileJson,
} from 'lucide-react';
import type { BrokerLog, MessageType } from '../../../types/broker.types';

interface TreeViewProps {
  logs: BrokerLog[];
}

interface TreeNode {
  name: string;
  fullPath: string;
  messageCount: number;
  children: Map<string, TreeNode>;
  isActive: boolean;
  messageTypes: Map<string, number>;
  messages: BrokerLog[]; // Store actual messages for detail view
}

function buildTree(logs: BrokerLog[]): TreeNode {
  const root: TreeNode = {
    name: 'root',
    fullPath: '',
    messageCount: 0,
    children: new Map(),
    isActive: false,
    messageTypes: new Map(),
    messages: [],
  };

  logs.forEach((log) => {
    if (!log.topic) return;

    const parts = log.topic.split('/');
    let current = root;
    let path = '';

    parts.forEach((part, idx) => {
      path = idx === 0 ? part : `${path}/${part}`;

      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          fullPath: path,
          messageCount: 0,
          children: new Map(),
          isActive: false,
          messageTypes: new Map(),
          messages: [],
        });
      }

      current = current.children.get(part)!;
      current.messageCount++;
      current.isActive = true;

      if (log.messageType) {
        const count = current.messageTypes.get(log.messageType) || 0;
        current.messageTypes.set(log.messageType, count + 1);
      }

      // Store message at leaf node (full topic path)
      if (idx === parts.length - 1) {
        current.messages.push(log);
        // Keep only last 50 messages per topic
        if (current.messages.length > 50) {
          current.messages = current.messages.slice(-50);
        }
      }
    });
  });

  return root;
}

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

// Message Detail Panel Component
function MessageDetailPanel({
  node,
  onClose,
}: {
  node: TreeNode;
  onClose: () => void;
}) {
  const [selectedMessage, setSelectedMessage] = useState<BrokerLog | null>(
    node.messages.length > 0 ? node.messages[node.messages.length - 1] : null
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'raw'>('overview');

  const latestMessages = [...node.messages].reverse().slice(0, 20);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <FolderTree className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-semibold text-white">Topic Details</h3>
              <p className="text-sm text-yellow-400 font-mono">{node.fullPath}</p>
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

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Message List */}
          <div className="w-72 border-r border-slate-700 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/30">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <MessageSquare className="w-4 h-4" />
                <span>Recent Messages ({node.messages.length})</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {latestMessages.map((msg) => (
                <button
                  type="button"
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${
                    selectedMessage?.id === msg.id ? 'bg-slate-800 border-l-2 border-l-emerald-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      getMessageTypeColor(msg.messageType)
                    }`}>
                      {msg.messageType || 'PUBLISH'}
                    </span>
                    <span className="text-xs text-slate-500">
                      QoS {msg.qos ?? 0}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(msg.timestamp, 'HH:mm:ss.SSS')}
                  </div>
                  {msg.decoded?.metrics && (
                    <div className="text-xs text-cyan-400 mt-1">
                      {msg.decoded.metrics.length} metrics
                    </div>
                  )}
                </button>
              ))}
              {latestMessages.length === 0 && (
                <div className="px-4 py-8 text-center text-slate-500 text-sm">
                  No messages yet
                </div>
              )}
            </div>
          </div>

          {/* Right: Message Details */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedMessage ? (
              <>
                {/* Tabs */}
                <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-700 bg-slate-800/30">
                  {[
                    { id: 'overview', label: 'Overview', icon: Layers },
                    { id: 'metrics', label: 'Metrics', icon: Activity },
                    { id: 'raw', label: 'Raw Data', icon: FileJson },
                  ].map((tab) => (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {activeTab === 'overview' && (
                    <MessageOverview message={selectedMessage} />
                  )}
                  {activeTab === 'metrics' && (
                    <MetricsView message={selectedMessage} />
                  )}
                  {activeTab === 'raw' && (
                    <RawDataView message={selectedMessage} />
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a message to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageOverview({ message }: { message: BrokerLog }) {
  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="grid grid-cols-2 gap-4">
        <InfoCard
          icon={Clock}
          label="Timestamp"
          value={format(message.timestamp, 'yyyy-MM-dd HH:mm:ss.SSS')}
        />
        <InfoCard
          icon={Tag}
          label="Message Type"
          value={message.messageType || 'PUBLISH'}
          valueClass={getMessageTypeColor(message.messageType)}
        />
        <InfoCard
          icon={Hash}
          label="QoS Level"
          value={`QoS ${message.qos ?? 0}`}
        />
        <InfoCard
          icon={Database}
          label="Retain"
          value={message.retain ? 'Yes' : 'No'}
        />
      </div>

      {/* Client Info */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          Client Information
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-500">Client ID:</span>
            <span className="ml-2 text-white font-mono">{message.clientId}</span>
          </div>
          <div>
            <span className="text-slate-500">Origin:</span>
            <span className="ml-2 text-white font-mono">
              {message.origin.ip}:{message.origin.port}
            </span>
          </div>
        </div>
      </div>

      {/* Sparkplug Metadata */}
      {message.sparkplugMetadata && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-yellow-400" />
            Sparkplug B Metadata
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {message.sparkplugMetadata.groupId && (
              <div>
                <span className="text-slate-500">Group ID:</span>
                <span className="ml-2 text-blue-400 font-mono">
                  {message.sparkplugMetadata.groupId}
                </span>
              </div>
            )}
            {message.sparkplugMetadata.edgeNodeId && (
              <div>
                <span className="text-slate-500">Edge Node:</span>
                <span className="ml-2 text-emerald-400 font-mono">
                  {message.sparkplugMetadata.edgeNodeId}
                </span>
              </div>
            )}
            {message.sparkplugMetadata.deviceId && (
              <div>
                <span className="text-slate-500">Device ID:</span>
                <span className="ml-2 text-purple-400 font-mono">
                  {message.sparkplugMetadata.deviceId}
                </span>
              </div>
            )}
            {message.sparkplugMetadata.seq !== undefined && (
              <div>
                <span className="text-slate-500">Sequence:</span>
                <span className="ml-2 text-white font-mono">
                  {message.sparkplugMetadata.seq.toString()}
                </span>
              </div>
            )}
            {message.sparkplugMetadata.bdSeq !== undefined && (
              <div>
                <span className="text-slate-500">Birth/Death Seq:</span>
                <span className="ml-2 text-white font-mono">
                  {message.sparkplugMetadata.bdSeq.toString()}
                </span>
              </div>
            )}
            {message.sparkplugMetadata.metricCount !== undefined && (
              <div>
                <span className="text-slate-500">Metric Count:</span>
                <span className="ml-2 text-cyan-400 font-mono">
                  {message.sparkplugMetadata.metricCount}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Decoded Payload Summary */}
      {message.decoded && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <FileJson className="w-4 h-4 text-cyan-400" />
            Payload Summary
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {message.decoded.timestamp && (
              <div>
                <span className="text-slate-500">Payload Timestamp:</span>
                <span className="ml-2 text-white">
                  {format(Number(message.decoded.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                </span>
              </div>
            )}
            {message.decoded.seq !== undefined && (
              <div>
                <span className="text-slate-500">Payload Sequence:</span>
                <span className="ml-2 text-white font-mono">
                  {message.decoded.seq.toString()}
                </span>
              </div>
            )}
            {message.decoded.metrics && (
              <div>
                <span className="text-slate-500">Metrics:</span>
                <span className="ml-2 text-cyan-400 font-semibold">
                  {message.decoded.metrics.length} metrics
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MQTT Packet Details */}
      {message.mqttPacket && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            MQTT Packet Details
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-500">Packet Type:</span>
              <span className="ml-2 text-white">
                {message.mqttPacket.fixedHeader.messageTypeName}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Packet Size:</span>
              <span className="ml-2 text-white">
                {message.mqttPacket.totalPacketSize} bytes
              </span>
            </div>
            <div>
              <span className="text-slate-500">Payload Length:</span>
              <span className="ml-2 text-white">
                {message.mqttPacket.payloadLength} bytes
              </span>
            </div>
            <div>
              <span className="text-slate-500">DUP Flag:</span>
              <span className="ml-2 text-white">
                {message.mqttPacket.fixedHeader.dup ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricsView({ message }: { message: BrokerLog }) {
  const metrics = message.decoded?.metrics || [];

  if (metrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No metrics in this message</p>
          <p className="text-sm mt-1">This message may not be a Sparkplug payload</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-300">
          Metrics ({metrics.length})
        </h4>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="text-left px-4 py-2 text-slate-400 font-medium">Name</th>
              <th className="text-left px-4 py-2 text-slate-400 font-medium">Value</th>
              <th className="text-left px-4 py-2 text-slate-400 font-medium">Type</th>
              <th className="text-left px-4 py-2 text-slate-400 font-medium">Alias</th>
              <th className="text-left px-4 py-2 text-slate-400 font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {metrics.map((metric, idx) => (
              <tr key={metric.name || idx} className="hover:bg-slate-700/30">
                <td className="px-4 py-2 font-mono text-emerald-400">
                  {metric.name || `[alias: ${metric.alias}]`}
                </td>
                <td className="px-4 py-2 font-mono text-white">
                  {formatMetricValue(metric.value, metric.datatype ?? 0)}
                </td>
                <td className="px-4 py-2 text-slate-400">
                  {DATATYPE_NAMES[metric.datatype ?? 0] || `Unknown (${metric.datatype})`}
                </td>
                <td className="px-4 py-2 text-slate-500 font-mono">
                  {metric.alias !== undefined ? metric.alias : '-'}
                </td>
                <td className="px-4 py-2 text-slate-400 text-xs">
                  {metric.timestamp
                    ? format(Number(metric.timestamp), 'HH:mm:ss.SSS')
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RawDataView({ message }: { message: BrokerLog }) {
  const payloadHex = message.payload
    ? Array.from(message.payload)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ')
    : 'No payload';

  return (
    <div className="space-y-4">
      {/* Decoded JSON */}
      {message.decoded && (
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Decoded Payload (JSON)</h4>
          <pre className="bg-slate-950 rounded-lg p-4 border border-slate-700 text-xs font-mono text-slate-300 overflow-x-auto max-h-64">
            {JSON.stringify(
              message.decoded,
              (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
              2
            )}
          </pre>
        </div>
      )}

      {/* Raw Hex */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 mb-2">Raw Payload (Hex)</h4>
        <pre className="bg-slate-950 rounded-lg p-4 border border-slate-700 text-xs font-mono text-slate-400 overflow-x-auto max-h-48 break-all">
          {payloadHex}
        </pre>
      </div>

      {/* Payload Size */}
      <div className="text-sm text-slate-500">
        Payload size: {message.payload?.length || 0} bytes
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  valueClass = 'text-white',
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className={`font-medium ${valueClass}`}>{value}</div>
    </div>
  );
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

function getMessageTypeColor(type?: MessageType): string {
  const colors: Record<string, string> = {
    NBIRTH: 'bg-green-900/50 text-green-400',
    NDATA: 'bg-blue-900/50 text-blue-400',
    NDEATH: 'bg-red-900/50 text-red-400',
    DBIRTH: 'bg-emerald-900/50 text-emerald-400',
    DDATA: 'bg-cyan-900/50 text-cyan-400',
    DDEATH: 'bg-pink-900/50 text-pink-400',
    NCMD: 'bg-purple-900/50 text-purple-400',
    DCMD: 'bg-violet-900/50 text-violet-400',
    STATE: 'bg-yellow-900/50 text-yellow-400',
  };
  return type ? colors[type] || 'bg-slate-700 text-slate-300' : 'bg-slate-700 text-slate-300';
}

function TreeNodeComponent({
  node,
  level = 0,
  onNodeClick,
}: {
  node: TreeNode;
  level?: number;
  onNodeClick: (node: TreeNode) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const hasChildren = node.children.size > 0;
  const indent = level * 20;

  // Get dominant message type
  const dominantType = Array.from(node.messageTypes.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];

  const typeColors: Record<string, string> = {
    NBIRTH: 'text-green-500',
    NDATA: 'text-blue-500',
    NDEATH: 'text-red-500',
    DBIRTH: 'text-emerald-500',
    DDATA: 'text-cyan-500',
    DDEATH: 'text-pink-500',
    NCMD: 'text-purple-500',
    DCMD: 'text-violet-500',
    STATE: 'text-yellow-500',
  };

  const typeColor = dominantType ? typeColors[dominantType] || 'text-slate-400' : 'text-slate-400';

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleDoubleClick = () => {
    if (node.messages.length > 0) {
      onNodeClick(node);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded hover:bg-slate-800/50 transition-colors cursor-pointer group ${
          node.isActive ? 'text-slate-200' : 'text-slate-500'
        }`}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {/* Expand/Collapse Icon */}
        <span className="w-4 flex-shrink-0">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-500" />
            )
          ) : (
            <Circle className="w-2 h-2 text-slate-600 ml-1" />
          )}
        </span>

        {/* Node Name */}
        <span className={`text-sm font-mono flex-1 ${typeColor}`}>
          {node.name}
        </span>

        {/* Message Count Badge */}
        {node.messageCount > 0 && (
          <span className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
            {node.messageCount}
          </span>
        )}

        {/* View Details Button (on hover, only for leaf nodes with messages) */}
        {node.messages.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNodeClick(node);
            }}
            className="hidden group-hover:flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors"
          >
            <MessageSquare className="w-3 h-3" />
            View
          </button>
        )}

        {/* Message Type Badges (on hover) */}
        {node.messageTypes.size > 0 && node.messages.length === 0 && (
          <div className="hidden group-hover:flex items-center gap-1">
            {Array.from(node.messageTypes.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([type, count]) => (
                <span
                  key={type}
                  className={`text-xs px-1.5 py-0.5 rounded ${typeColors[type] || 'text-slate-400'} bg-slate-900/80`}
                >
                  {type}:{count}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {Array.from(node.children.values())
            .sort((a, b) => b.messageCount - a.messageCount)
            .map((child) => (
              <TreeNodeComponent
                key={child.name}
                node={child}
                level={level + 1}
                onNodeClick={onNodeClick}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export function TreeView({ logs }: TreeViewProps) {
  const tree = useMemo(() => buildTree(logs), [logs]);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  if (logs.length === 0 || tree.children.size === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        <div className="text-center">
          <FolderTree className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No topics to display</p>
          <p className="text-sm text-slate-500 mt-2">Topic hierarchy will appear here as messages are published</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Total Topics</p>
          <p className="text-xl font-bold text-white">{tree.children.size}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Total Messages</p>
          <p className="text-xl font-bold text-white">{tree.messageCount}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Active Paths</p>
          <p className="text-xl font-bold text-white">
            {logs.filter((log) => log.topic).length}
          </p>
        </div>
      </div>

      {/* Tree */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <FolderTree className="w-4 h-4" />
            Topic Hierarchy
          </h4>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3" /> Collapsed
            </span>
            <span className="flex items-center gap-1">
              <ChevronDown className="w-3 h-3" /> Expanded
            </span>
            <span className="flex items-center gap-1">
              <Circle className="w-2 h-2" /> Leaf
            </span>
            <span className="text-emerald-400">Double-click to view details</span>
          </div>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {Array.from(tree.children.values())
            .sort((a, b) => b.messageCount - a.messageCount)
            .map((child) => (
              <TreeNodeComponent
                key={child.name}
                node={child}
                level={0}
                onNodeClick={setSelectedNode}
              />
            ))}
        </div>
      </div>

      {/* Message Type Legend */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Message Types</h4>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {[
            { type: 'NBIRTH', color: 'text-green-500', desc: 'Node Birth' },
            { type: 'NDATA', color: 'text-blue-500', desc: 'Node Data' },
            { type: 'NDEATH', color: 'text-red-500', desc: 'Node Death' },
            { type: 'DBIRTH', color: 'text-emerald-500', desc: 'Device Birth' },
            { type: 'DDATA', color: 'text-cyan-500', desc: 'Device Data' },
            { type: 'DDEATH', color: 'text-pink-500', desc: 'Device Death' },
            { type: 'NCMD', color: 'text-purple-500', desc: 'Node Cmd' },
            { type: 'DCMD', color: 'text-violet-500', desc: 'Device Cmd' },
            { type: 'STATE', color: 'text-yellow-500', desc: 'State' },
          ].map((item) => (
            <div key={item.type} className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${item.color}`}>{item.type}</span>
              <span className="text-xs text-slate-500">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Panel Modal */}
      {selectedNode && (
        <MessageDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
    </div>
  );
}
