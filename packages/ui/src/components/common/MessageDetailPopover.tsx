/**
 * Message Detail Popover Component
 * Professional multi-tab message inspection with layer-by-layer analysis
 * Reusable across SCADA, Broker, and Simulation views
 */

import { useState } from 'react';
import { formatMetricValue, getDatatypeName } from '../../services/sparkplugProcessor';
import type { BrokerLog } from '../../types/broker.types';
import { Search, BarChart3, Globe, Hash, FileText, Layers, X, AlertTriangle, Zap, Lightbulb, Mail } from 'lucide-react';

interface MessageDetailPopoverProps {
  log: BrokerLog;
  messageNumber?: number;
  onClose: () => void;
}

type DetailTab = 'overview' | 'layers' | 'raw' | 'ascii' | 'structure';

// Helper function to extract message type from Sparkplug topic
function extractMessageType(topic: string): string {
  const match = topic.match(/spBv1\.0\/[^/]+\/([^/]+)\//);
  return match ? match[1] : 'UNKNOWN';
}

export function MessageDetailPopover({ log, messageNumber, onClose }: MessageDetailPopoverProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[90vw] max-w-6xl h-[85vh] bg-slate-900 rounded-xl shadow-2xl border border-slate-700 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Search className="w-6 h-6 text-slate-300" />
              <div>
                <h2 className="text-xl font-bold text-white">
                  Message Details
                  {messageNumber !== undefined && (
                    <span className="ml-3 text-sm font-normal text-blue-400">#{messageNumber}</span>
                  )}
                </h2>
                <p className="text-sm text-slate-400 mt-1 font-mono">{log.topic}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <X className="w-4 h-4" /> Close
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-850 px-6">
          {(['overview', 'layers', 'raw', 'ascii', 'structure'] as DetailTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab === 'overview' && <><BarChart3 className="w-4 h-4" /> Overview</>}
              {tab === 'layers' && <><Globe className="w-4 h-4" /> Protocol Layers</>}
              {tab === 'raw' && <><Hash className="w-4 h-4" /> Hex View</>}
              {tab === 'ascii' && <><FileText className="w-4 h-4" /> ASCII</>}
              {tab === 'structure' && <><Layers className="w-4 h-4" /> Structure</>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-slate-950">
          {activeTab === 'overview' && <OverviewTab log={log} />}
          {activeTab === 'layers' && <LayersTab log={log} />}
          {activeTab === 'raw' && <RawHexTab log={log} />}
          {activeTab === 'ascii' && <ASCIITab log={log} />}
          {activeTab === 'structure' && <StructureTab log={log} />}
        </div>
      </div>
    </div>
  );
}

// Overview Tab - Quick summary
function OverviewTab({ log }: { log: BrokerLog }) {
  return (
    <div className="space-y-6">
      {/* Message Info Card */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Message Information</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Timestamp" value={new Date(log.timestamp).toISOString()} />
            <InfoRow
              label="Client ID"
              value={log.clientId}
              highlight={log.clientId === 'broker' ? 'orange' : undefined}
            />
          </div>
          <InfoRow label="Topic" value={log.topic || 'N/A'} block={true} />
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Message Type" value={log.messageType || extractMessageType(log.topic || '')} />
            <InfoRow label="QoS" value={log.qos?.toString() || '0'} />
            <InfoRow label="Retain" value={log.retain ? 'Yes' : 'No'} />
            <InfoRow label="Payload Size" value={`${log.payload?.length || 0} bytes`} />
            <InfoRow
              label="Origin"
              value={log.origin.ip === 'broker' ? 'Broker (auto-published)' : `${log.origin.ip}:${log.origin.port}`}
              highlight={log.origin.ip === 'broker' ? 'orange' : undefined}
            />
          </div>
        </div>

        {/* Will Testament Info */}
        {log.sessionInfo?.lastWillTopic && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="text-sm font-medium text-yellow-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Last Will Testament Configured
            </div>
            <InfoRow label="Will Topic" value={log.sessionInfo.lastWillTopic} />
          </div>
        )}
      </div>

      {/* Sparkplug Metadata (if available) */}
      {log.sparkplugMetadata && (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" /> Sparkplug B Metadata
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {log.sparkplugMetadata.groupId && <InfoRow label="Group ID" value={log.sparkplugMetadata.groupId} />}
            {log.sparkplugMetadata.edgeNodeId && <InfoRow label="Edge Node ID" value={log.sparkplugMetadata.edgeNodeId} />}
            {log.sparkplugMetadata.deviceId && <InfoRow label="Device ID" value={log.sparkplugMetadata.deviceId} />}
            {log.sparkplugMetadata.bdSeq !== undefined && <InfoRow label="Birth/Death Seq" value={log.sparkplugMetadata.bdSeq.toString()} />}
            {log.sparkplugMetadata.seq !== undefined && <InfoRow label="Sequence Number" value={log.sparkplugMetadata.seq.toString()} />}
            {log.sparkplugMetadata.metricCount !== undefined && <InfoRow label="Metric Count" value={log.sparkplugMetadata.metricCount.toString()} />}
          </div>
        </div>
      )}

      {/* Sparkplug Payload */}
      {log.decoded && (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Sparkplug B Payload</h3>
          <div className="grid grid-cols-2 gap-4">
            {log.decoded.timestamp && (
              <InfoRow label="Payload Timestamp" value={new Date(Number(log.decoded.timestamp)).toISOString()} />
            )}
            {log.decoded.seq !== undefined && (
              <InfoRow label="Sequence Number" value={log.decoded.seq.toString()} />
            )}
            {log.decoded.metrics && (
              <InfoRow label="Metric Count" value={log.decoded.metrics.length.toString()} />
            )}
          </div>

          {/* Metrics Summary */}
          {log.decoded.metrics && log.decoded.metrics.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-slate-400 mb-2">Metrics Summary:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {log.decoded.metrics.map((metric: any, idx: number) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded border border-slate-800">
                    <div className="text-xs font-medium text-white truncate">
                      {metric.name || `Metric ${idx}`}
                      {metric.alias !== undefined && (
                        <span className="ml-2 text-blue-400">#{metric.alias.toString()}</span>
                      )}
                    </div>
                    <div className="text-sm text-green-400 font-mono mt-1">
                      {formatMetricValue(metric.value, metric.datatype || 0)}
                    </div>
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

// Layers Tab - Protocol stack analysis
function LayersTab({ log }: { log: BrokerLog }) {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(
    new Set(['layer1', 'layer2', 'layer3'])
  );

  const toggleLayer = (layer: string) => {
    const newExpanded = new Set(expandedLayers);
    if (newExpanded.has(layer)) {
      newExpanded.delete(layer);
    } else {
      newExpanded.add(layer);
    }
    setExpandedLayers(newExpanded);
  };

  return (
    <div className="space-y-3">
      {/* Layer 1: Network & Transport */}
      <LayerSection
        title="Layer 1: Network & Transport"
        icon={<Globe className="w-5 h-5 text-slate-300" />}
        expanded={expandedLayers.has('layer1')}
        onToggle={() => toggleLayer('layer1')}
      >
        <div className="space-y-2">
          <InfoRow label="Source IP" value={log.origin.ip} />
          <InfoRow label="Source Port" value={log.origin.port.toString()} />
          <InfoRow label="Protocol" value="TCP (Transmission Control Protocol)" />
          <InfoRow label="Connection" value="WebSocket over TCP" />
          <InfoRow label="Packet Size" value={`${log.payload?.length || 0} bytes`} />
        </div>
      </LayerSection>

      {/* Layer 2: MQTT */}
      <LayerSection
        title="Layer 2: MQTT (Message Queuing Telemetry Transport)"
        icon={<Mail className="w-5 h-5 text-slate-300" />}
        expanded={expandedLayers.has('layer2')}
        onToggle={() => toggleLayer('layer2')}
      >
        <div className="space-y-2">
          <InfoRow label="Protocol" value="MQTT v3.1.1 / v5.0" />
          {log.mqttPacket?.fixedHeader && (
            <>
              <InfoRow label="Packet Type" value={log.mqttPacket.fixedHeader.messageTypeName || 'PUBLISH'} />
              <InfoRow label="DUP Flag" value={log.mqttPacket.fixedHeader.dup ? 'Yes' : 'No'} />
              <InfoRow label="QoS Level" value={log.qos?.toString() || '0'} />
              <InfoRow label="Retain Flag" value={log.retain ? 'Yes' : 'No'} />
            </>
          )}
          {log.topic && <InfoRow label="Topic" value={log.topic} />}
          {log.clientId && <InfoRow label="Client ID" value={log.clientId} />}
        </div>
      </LayerSection>

      {/* Layer 3: Sparkplug B */}
      <LayerSection
        title="Layer 3: Sparkplug B (ISO/IEC 20237:2023)"
        icon={<Zap className="w-5 h-5 text-slate-300" />}
        expanded={expandedLayers.has('layer3')}
        onToggle={() => toggleLayer('layer3')}
      >
        {log.decoded ? (
          <div className="space-y-3">
            <InfoRow label="Specification" value="Eclipse Sparkplug B" />
            <InfoRow label="Message Type" value={log.messageType || extractMessageType(log.topic || '')} />
            {log.decoded.timestamp && (
              <InfoRow label="Timestamp" value={new Date(Number(log.decoded.timestamp)).toISOString()} />
            )}
            {log.decoded.seq !== undefined && (
              <InfoRow label="Sequence Number" value={log.decoded.seq.toString()} />
            )}

            {/* Metrics Detail */}
            {log.decoded.metrics && log.decoded.metrics.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium text-slate-300 mb-3">
                  Metrics Payload ({log.decoded.metrics.length} metrics):
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {log.decoded.metrics.map((metric: any, idx: number) => (
                    <MetricCard key={idx} metric={metric} index={idx} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-slate-400">No Sparkplug B payload decoded</div>
        )}
      </LayerSection>
    </div>
  );
}

// Raw Hex Tab - Multi-line hex dump with position labels
function RawHexTab({ log }: { log: BrokerLog }) {
  if (!log.payload || log.payload.length === 0) {
    return <div className="text-slate-400">No payload data</div>;
  }

  const bytesPerLine = 16;
  const lines: { offset: string; hex: string; ascii: string }[] = [];

  for (let i = 0; i < log.payload.length; i += bytesPerLine) {
    const chunk = log.payload.slice(i, i + bytesPerLine);
    const offset = i.toString(16).padStart(8, '0').toUpperCase();

    // Hex representation
    const hex = Array.from(chunk)
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');

    // ASCII representation
    const ascii = Array.from(chunk)
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
      .join('');

    lines.push({ offset, hex, ascii });
  }

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Hexadecimal Dump</h3>
        <div className="text-sm text-slate-400">
          Total: {log.payload.length} bytes
        </div>
      </div>

      <div className="font-mono text-xs">
        {/* Header */}
        <div className="flex gap-4 pb-2 border-b border-slate-700 text-slate-500 font-semibold">
          <div className="w-20">Offset</div>
          <div className="flex-1">Hexadecimal (00-0F)</div>
          <div className="w-32">ASCII</div>
        </div>

        {/* Data rows */}
        <div className="mt-2 space-y-1">
          {lines.map((line, idx) => (
            <div key={idx} className="flex gap-4 hover:bg-slate-800/50 px-2 py-1 rounded">
              <div className="w-20 text-blue-400">{line.offset}</div>
              <div className="flex-1 text-green-400">{line.hex}</div>
              <div className="w-32 text-slate-400">{line.ascii}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ASCII Tab - ASCII representation
function ASCIITab({ log }: { log: BrokerLog }) {
  if (!log.payload || log.payload.length === 0) {
    return <div className="text-slate-400">No payload data</div>;
  }

  const ascii = Array.from(log.payload)
    .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
    .join('');

  // Split into lines of 80 characters
  const lines: string[] = [];
  for (let i = 0; i < ascii.length; i += 80) {
    lines.push(ascii.slice(i, i + 80));
  }

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
      <h3 className="text-lg font-semibold text-white mb-4">ASCII Representation</h3>
      <div className="font-mono text-sm">
        <div className="space-y-1">
          {lines.map((line, idx) => (
            <div key={idx} className="flex gap-4 hover:bg-slate-800/50 px-2 py-1 rounded">
              <div className="w-16 text-blue-400">{(idx * 80).toString().padStart(6, '0')}</div>
              <div className="flex-1 text-slate-300">{line}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Message Type Descriptions for Sparkplug B
const MESSAGE_TYPE_INFO: Record<string, { description: string; purpose: string; qos: string; retain: string; color: string }> = {
  NBIRTH: {
    description: 'Node Birth Certificate',
    purpose: 'Establishes Edge Node online status with all metrics definitions. Must be first message from node after connect.',
    qos: 'QoS 1 (Required)',
    retain: 'No',
    color: 'green',
  },
  NDEATH: {
    description: 'Node Death Certificate',
    purpose: 'Indicates Edge Node has gone offline. Published by broker via Will Message or node on graceful disconnect.',
    qos: 'QoS 1 (Required)',
    retain: 'No',
    color: 'red',
  },
  DBIRTH: {
    description: 'Device Birth Certificate',
    purpose: 'Establishes Device online status with all device metrics definitions. Published by parent Edge Node.',
    qos: 'QoS 1 (Required)',
    retain: 'No',
    color: 'green',
  },
  DDEATH: {
    description: 'Device Death Certificate',
    purpose: 'Indicates Device has gone offline. Published by parent Edge Node.',
    qos: 'QoS 1 (Required)',
    retain: 'No',
    color: 'red',
  },
  NDATA: {
    description: 'Node Data',
    purpose: 'Contains changed metric values from Edge Node. Uses Report by Exception (RBE) - only changed values sent.',
    qos: 'QoS 0/1 (Configurable)',
    retain: 'No',
    color: 'cyan',
  },
  DDATA: {
    description: 'Device Data',
    purpose: 'Contains changed metric values from Device. Published by parent Edge Node using RBE.',
    qos: 'QoS 0/1 (Configurable)',
    retain: 'No',
    color: 'cyan',
  },
  NCMD: {
    description: 'Node Command',
    purpose: 'Command sent to Edge Node from SCADA Host. Can include Rebirth request or metric write commands.',
    qos: 'QoS 0/1 (Configurable)',
    retain: 'No',
    color: 'purple',
  },
  DCMD: {
    description: 'Device Command',
    purpose: 'Command sent to Device via parent Edge Node. Used for device control and configuration.',
    qos: 'QoS 0/1 (Configurable)',
    retain: 'No',
    color: 'purple',
  },
  STATE: {
    description: 'SCADA Host State',
    purpose: 'Indicates Primary Host Application online/offline status. Triggers rebirth from all Edge Nodes when online.',
    qos: 'QoS 1 (Required)',
    retain: 'Yes (Required)',
    color: 'yellow',
  },
};

// Structure Tab - Show Sparkplug B specification structure
function StructureTab({ log }: { log: BrokerLog }) {
  // Parse topic structure
  const topicParts = log.topic?.split('/') || [];
  const isSparkplug = log.topic?.startsWith('spBv1.0/');
  const messageType = log.messageType || topicParts[2] || 'UNKNOWN';
  const typeInfo = MESSAGE_TYPE_INFO[messageType];

  // Extract Sparkplug metadata
  const groupId = topicParts[1];
  const edgeNodeId = topicParts[3];
  const deviceId = topicParts[4];

  return (
    <div className="space-y-6">
      {/* Message Type Info Card */}
      {isSparkplug && typeInfo && (
        <div className={`bg-slate-900 rounded-lg border p-6 ${
          typeInfo.color === 'green' ? 'border-green-700' :
          typeInfo.color === 'red' ? 'border-red-700' :
          typeInfo.color === 'cyan' ? 'border-cyan-700' :
          typeInfo.color === 'purple' ? 'border-purple-700' :
          'border-yellow-700'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${
              typeInfo.color === 'green' ? 'bg-green-900/50' :
              typeInfo.color === 'red' ? 'bg-red-900/50' :
              typeInfo.color === 'cyan' ? 'bg-cyan-900/50' :
              typeInfo.color === 'purple' ? 'bg-purple-900/50' :
              'bg-yellow-900/50'
            }`}>
              <Zap className={`w-8 h-8 ${
                typeInfo.color === 'green' ? 'text-green-400' :
                typeInfo.color === 'red' ? 'text-red-400' :
                typeInfo.color === 'cyan' ? 'text-cyan-400' :
                typeInfo.color === 'purple' ? 'text-purple-400' :
                'text-yellow-400'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className={`text-2xl font-bold ${
                  typeInfo.color === 'green' ? 'text-green-400' :
                  typeInfo.color === 'red' ? 'text-red-400' :
                  typeInfo.color === 'cyan' ? 'text-cyan-400' :
                  typeInfo.color === 'purple' ? 'text-purple-400' :
                  'text-yellow-400'
                }`}>{messageType}</h3>
                <span className="text-slate-400 text-sm">({typeInfo.description})</span>
              </div>
              <p className="text-slate-300 text-sm mb-4">{typeInfo.purpose}</p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">QoS:</span>
                  <span className="text-white font-mono">{typeInfo.qos}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Retain:</span>
                  <span className="text-white font-mono">{typeInfo.retain}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Topic Structure */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" />
          Topic Structure (Sparkplug B Specification)
        </h3>

        {isSparkplug ? (
          <div className="space-y-4">
            {/* Visual Topic Breakdown */}
            <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm">
              <div className="flex flex-wrap items-center gap-1">
                <span className="px-2 py-1 bg-purple-900/50 text-purple-400 rounded">
                  {topicParts[0] || 'spBv1.0'}
                </span>
                <span className="text-slate-500">/</span>
                <span className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded">
                  {topicParts[1] || 'groupId'}
                </span>
                <span className="text-slate-500">/</span>
                <span className={`px-2 py-1 rounded ${
                  messageType === 'NBIRTH' || messageType === 'DBIRTH' ? 'bg-green-900/50 text-green-400' :
                  messageType === 'NDEATH' || messageType === 'DDEATH' ? 'bg-red-900/50 text-red-400' :
                  messageType === 'NDATA' || messageType === 'DDATA' ? 'bg-cyan-900/50 text-cyan-400' :
                  messageType === 'NCMD' || messageType === 'DCMD' ? 'bg-purple-900/50 text-purple-400' :
                  'bg-yellow-900/50 text-yellow-400'
                }`}>
                  {topicParts[2] || 'messageType'}
                </span>
                <span className="text-slate-500">/</span>
                <span className="px-2 py-1 bg-emerald-900/50 text-emerald-400 rounded">
                  {topicParts[3] || 'edgeNodeId'}
                </span>
                {topicParts[4] && (
                  <>
                    <span className="text-slate-500">/</span>
                    <span className="px-2 py-1 bg-orange-900/50 text-orange-400 rounded">
                      {topicParts[4]}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Sparkplug Entity Hierarchy */}
            <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
              <div className="text-sm font-semibold text-slate-300 mb-3">Entity Hierarchy</div>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Group:</span>
                  <span className="text-blue-400">{groupId || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-slate-600">└─</span>
                  <span className="text-slate-500">Edge Node:</span>
                  <span className="text-emerald-400">{edgeNodeId || 'N/A'}</span>
                </div>
                {deviceId && (
                  <div className="flex items-center gap-2 ml-8">
                    <span className="text-slate-600">└─</span>
                    <span className="text-slate-500">Device:</span>
                    <span className="text-orange-400">{deviceId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Topic Legend */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-purple-500"></span>
                <span className="text-slate-400">Namespace (spBv1.0)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-blue-500"></span>
                <span className="text-slate-400">Group ID</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-cyan-500"></span>
                <span className="text-slate-400">Message Type</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500"></span>
                <span className="text-slate-400">Edge Node ID</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-orange-500"></span>
                <span className="text-slate-400">Device ID (optional)</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-slate-400">
            Not a Sparkplug B topic. Topic: <code className="text-yellow-400">{log.topic}</code>
          </div>
        )}
      </div>

      {/* Payload Structure - Sparkplug Protobuf */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Payload Structure (Protobuf Schema)
        </h3>

        {log.decoded ? (
          <div className="space-y-4">
            {/* Payload Header */}
            <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
              <div className="text-sm font-semibold text-slate-300 mb-3">Payload Header</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">timestamp:</span>
                  <span className="text-cyan-400 font-mono">
                    {log.decoded.timestamp ? new Date(Number(log.decoded.timestamp)).toISOString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">seq:</span>
                  <span className="text-blue-400 font-mono">
                    {log.decoded.seq !== undefined ? log.decoded.seq.toString() : 'N/A'}
                  </span>
                </div>
                {log.decoded.uuid && (
                  <div className="flex justify-between col-span-2">
                    <span className="text-slate-400">uuid:</span>
                    <span className="text-purple-400 font-mono">{log.decoded.uuid}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Metrics Array Structure */}
            {log.decoded.metrics && log.decoded.metrics.length > 0 && (
              <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                <div className="text-sm font-semibold text-slate-300 mb-3">
                  Metrics Array ({log.decoded.metrics.length} metrics)
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {log.decoded.metrics.map((metric: any, idx: number) => (
                    <details key={idx} className="bg-slate-900 rounded border border-slate-700">
                      <summary className="px-3 py-2 cursor-pointer hover:bg-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 text-xs">#{idx}</span>
                          <span className="text-emerald-400 font-mono text-sm">
                            {metric.name || `alias_${metric.alias}`}
                          </span>
                        </div>
                        <span className="text-green-400 font-mono text-sm">
                          {formatMetricValue(metric.value, metric.datatype || 0)}
                        </span>
                      </summary>
                      <div className="px-3 py-2 border-t border-slate-700 text-xs space-y-1">
                        {metric.name && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">name:</span>
                            <span className="text-white font-mono">{metric.name}</span>
                          </div>
                        )}
                        {metric.alias !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">alias:</span>
                            <span className="text-blue-400 font-mono">{metric.alias.toString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-slate-400">datatype:</span>
                          <span className="text-purple-400 font-mono">
                            {metric.datatype} ({getDatatypeName(metric.datatype)})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">value:</span>
                          <span className="text-green-400 font-mono">
                            {formatMetricValue(metric.value, metric.datatype || 0)}
                          </span>
                        </div>
                        {metric.timestamp && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">timestamp:</span>
                            <span className="text-cyan-400 font-mono">
                              {new Date(Number(metric.timestamp)).toISOString()}
                            </span>
                          </div>
                        )}
                        {metric.is_historical !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">is_historical:</span>
                            <span className="text-yellow-400">{metric.is_historical ? 'true' : 'false'}</span>
                          </div>
                        )}
                        {metric.is_transient !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">is_transient:</span>
                            <span className="text-yellow-400">{metric.is_transient ? 'true' : 'false'}</span>
                          </div>
                        )}
                        {metric.is_null !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">is_null:</span>
                            <span className="text-red-400">{metric.is_null ? 'true' : 'false'}</span>
                          </div>
                        )}
                        {metric.properties && (
                          <div className="mt-2">
                            <span className="text-slate-400">properties:</span>
                            <pre className="mt-1 text-xs text-slate-300 bg-slate-800 p-2 rounded overflow-auto">
                              {JSON.stringify(metric.properties, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-slate-400">No decoded Sparkplug payload available</div>
        )}
      </div>

      {/* Alias Optimization Info */}
      {log.decoded?.metrics && (
        <>
          {log.decoded.metrics.filter((m: any) => m.alias !== undefined && !m.name).length > 0 && (
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-6 h-6 text-blue-400 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-semibold mb-2">Sparkplug B Alias Optimization</h4>
                  <p className="text-sm text-slate-300">
                    {log.decoded.metrics.filter((m: any) => m.alias !== undefined && !m.name).length} metric(s)
                    use alias-only references. Names are omitted after BIRTH to reduce payload size.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Raw JSON Structure */}
      <details className="bg-slate-900 rounded-lg border border-slate-800">
        <summary className="px-6 py-4 cursor-pointer hover:bg-slate-800 font-semibold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-400" />
          Raw Decoded Payload (JSON)
        </summary>
        <div className="px-6 py-4 border-t border-slate-800">
          <pre className="text-xs text-slate-300 overflow-auto max-h-64">
            {log.decoded
              ? JSON.stringify(log.decoded, (_key, value) =>
                  typeof value === 'bigint' ? value.toString() : value, 2)
              : 'No decoded payload'}
          </pre>
        </div>
      </details>
    </div>
  );
}

// Helper Components
function InfoRow({ label, value, highlight, block }: { label: string; value: string; highlight?: 'orange' | 'blue' | 'green'; block?: boolean }) {
  const highlightColors = {
    orange: 'text-orange-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
  };

  if (block) {
    return (
      <div className="text-sm py-1 space-y-1">
        <div className="text-slate-400">{label}:</div>
        <div className={`font-mono break-all ${highlight ? highlightColors[highlight] : 'text-slate-200'}`}>{value}</div>
      </div>
    );
  }

  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-slate-400">{label}:</span>
      <span className={`font-mono ${highlight ? highlightColors[highlight] : 'text-slate-200'}`}>{value}</span>
    </div>
  );
}

function LayerSection({
  title,
  icon,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-750 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium text-white text-sm">{title}</span>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

function MetricCard({ metric, index }: { metric: any; index: number }) {
  return (
    <div className="bg-slate-950 p-3 rounded border border-slate-800">
      <div className="flex justify-between items-start mb-2">
        <div className="font-medium text-white text-sm">
          {metric.name || `Metric ${index}`}
          {metric.alias !== undefined && (
            <span className="ml-2 text-xs text-blue-400">#{metric.alias.toString()}</span>
          )}
        </div>
        <div className="text-xs text-slate-500">{getDatatypeName(metric.datatype)}</div>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">Value:</span>
          <span className="text-green-400 font-mono">{formatMetricValue(metric.value, metric.datatype || 0)}</span>
        </div>
        {metric.timestamp && (
          <div className="flex justify-between">
            <span className="text-slate-400">Timestamp:</span>
            <span className="text-slate-300 font-mono text-xs">
              {new Date(Number(metric.timestamp)).toISOString()}
            </span>
          </div>
        )}
        {metric.properties && (
          <details className="mt-2">
            <summary className="text-slate-400 cursor-pointer hover:text-white">Properties</summary>
            <pre className="bg-slate-900 p-2 rounded mt-1 text-xs overflow-auto">
              {JSON.stringify(metric.properties, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
