/**
 * Message Detail Popover Component
 * Professional multi-tab message inspection with layer-by-layer analysis
 * Reusable across SCADA, Broker, and Simulation views
 */

import { useState } from 'react';
import { formatMetricValue, getDatatypeName } from '../../services/sparkplugProcessor';
import type { BrokerLog } from '../../types/broker.types';

interface MessageDetailPopoverProps {
  log: BrokerLog;
  messageNumber?: number;
  onClose: () => void;
}

type DetailTab = 'overview' | 'layers' | 'raw' | 'ascii' | 'structure';

export function MessageDetailPopover({ log, messageNumber, onClose }: MessageDetailPopoverProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[90vw] max-w-6xl h-[85vh] bg-slate-900 rounded-xl shadow-2xl border border-slate-700 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-2xl">🔍</div>
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
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-850 px-6">
          {(['overview', 'layers', 'raw', 'ascii', 'structure'] as DetailTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'layers' && '🌐 Protocol Layers'}
              {tab === 'raw' && '🔢 Hex View'}
              {tab === 'ascii' && '📝 ASCII'}
              {tab === 'structure' && '🏗️ Structure'}
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
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Timestamp" value={new Date(log.timestamp).toISOString()} />
          <InfoRow
            label="Client ID"
            value={log.clientId}
            highlight={log.clientId === 'broker' ? 'orange' : undefined}
          />
          <InfoRow label="Topic" value={log.topic || 'N/A'} />
          <InfoRow label="Message Type" value={log.messageType || 'Unknown'} />
          <InfoRow label="QoS" value={log.qos?.toString() || '0'} />
          <InfoRow label="Retain" value={log.retain ? 'Yes' : 'No'} />
          <InfoRow label="Payload Size" value={`${log.payload?.length || 0} bytes`} />
          <InfoRow
            label="Origin"
            value={log.origin.ip === 'broker' ? 'Broker (auto-published)' : `${log.origin.ip}:${log.origin.port}`}
            highlight={log.origin.ip === 'broker' ? 'orange' : undefined}
          />
        </div>

        {/* Will Testament Info */}
        {log.sessionInfo?.lastWillTopic && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="text-sm font-medium text-yellow-400 mb-2">⚠️ Last Will Testament Configured</div>
            <InfoRow label="Will Topic" value={log.sessionInfo.lastWillTopic} />
          </div>
        )}
      </div>

      {/* Sparkplug Metadata (if available) */}
      {log.sparkplugMetadata && (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">⚡ Sparkplug B Metadata</h3>
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

  const extractMessageType = (topic: string): string => {
    const match = topic.match(/spBv1\.0\/[^/]+\/([^/]+)\//);
    return match ? match[1] : 'UNKNOWN';
  };

  return (
    <div className="space-y-3">
      {/* Layer 1: Network & Transport */}
      <LayerSection
        title="Layer 1: Network & Transport"
        icon="🌐"
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
        icon="📨"
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
        icon="⚡"
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

// Structure Tab - Show alias mappings and structure
function StructureTab({ log }: { log: BrokerLog }) {
  if (!log.decoded?.metrics) {
    return <div className="text-slate-400">No structure information available</div>;
  }

  const metricsWithAliases = log.decoded.metrics.filter((m: any) => m.alias !== undefined);
  const metricsWithoutNames = log.decoded.metrics.filter((m: any) => !m.name && m.alias !== undefined);

  return (
    <div className="space-y-6">
      {/* Alias Mapping */}
      {metricsWithAliases.length > 0 && (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Alias Mapping ({metricsWithAliases.length} aliased metrics)
          </h3>
          <div className="space-y-2">
            {metricsWithAliases.map((metric: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-slate-950 rounded border border-slate-800">
                <div className="w-20">
                  <span className="text-blue-400 font-mono font-semibold">
                    #{metric.alias.toString()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{metric.name || 'Unnamed Metric'}</div>
                  <div className="text-xs text-slate-500">Type: {getDatatypeName(metric.datatype)}</div>
                </div>
                <div className="text-green-400 font-mono">
                  {formatMetricValue(metric.value, metric.datatype || 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimization Info */}
      {metricsWithoutNames.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h4 className="text-white font-semibold mb-2">Sparkplug B Optimization Detected</h4>
              <p className="text-sm text-slate-300">
                This message uses alias-only optimization for {metricsWithoutNames.length} metric(s).
                Metric names are omitted to reduce payload size (sent only in BIRTH messages).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Message Structure Tree */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Payload Structure</h3>
        <pre className="text-xs text-slate-300 overflow-auto">
          {JSON.stringify(log.decoded, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// Helper Components
function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: 'orange' | 'blue' | 'green' }) {
  const highlightColors = {
    orange: 'text-orange-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
  };

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
  icon: string;
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
          <span className="text-lg">{icon}</span>
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
