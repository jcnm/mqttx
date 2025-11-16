/**
 * Message Trace Inspector
 * Displays detailed message inspection showing:
 * - Pre-encoding structure (Sparkplug payload with metrics)
 * - Post-encoding binary data (protobuf)
 * - Transmission details and status
 */

import { useState } from 'react';
import { format } from 'date-fns';
import type { MessageTrace } from '../../types/message-trace.types';

interface MessageTraceInspectorProps {
  trace: MessageTrace;
  messageNumber: number;
  onClose: () => void;
}

export function MessageTraceInspector({ trace, messageNumber, onClose }: MessageTraceInspectorProps) {
  const [activeTab, setActiveTab] = useState<'pre' | 'post' | 'transmission'>('pre');

  const getMessageTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      NBIRTH: 'bg-green-900/30 text-green-400 border-green-700',
      NDEATH: 'bg-red-900/30 text-red-400 border-red-700',
      NDATA: 'bg-blue-900/30 text-blue-400 border-blue-700',
      NCMD: 'bg-purple-900/30 text-purple-400 border-purple-700',
      DBIRTH: 'bg-emerald-900/30 text-emerald-400 border-emerald-700',
      DDEATH: 'bg-orange-900/30 text-orange-400 border-orange-700',
      DDATA: 'bg-cyan-900/30 text-cyan-400 border-cyan-700',
      DCMD: 'bg-violet-900/30 text-violet-400 border-violet-700',
    };
    return colors[type] || 'bg-slate-700 text-slate-300';
  };

  const renderPreEncoding = () => {
    const { payload, metricCount, seq, timestamp, bdSeq } = trace.preEncoding;

    return (
      <div className="space-y-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h4 className="text-sm font-semibold text-white mb-3">📦 Sparkplug B Payload Structure</h4>
          <div className="space-y-2">
            <InfoRow label="Timestamp" value={format(Number(timestamp), 'yyyy-MM-dd HH:mm:ss.SSS')} />
            <InfoRow label="Sequence Number" value={String(seq)} />
            {bdSeq !== undefined && <InfoRow label="Birth/Death Sequence" value={String(bdSeq)} />}
            <InfoRow label="Metric Count" value={String(metricCount)} color="blue" />
          </div>
        </div>

        {payload.metrics && payload.metrics.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h4 className="text-sm font-semibold text-white mb-3">📊 Metrics ({payload.metrics.length})</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {payload.metrics.map((metric: any, index: number) => (
                <div key={index} className="bg-slate-900 rounded-lg p-3 border border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{metric.name}</span>
                    <span className="text-xs text-slate-400">Datatype: {metric.datatype}</span>
                  </div>
                  <div className="text-sm text-emerald-400 font-mono">
                    Value: {formatMetricValue(metric.value, metric.datatype)}
                  </div>
                  {metric.alias !== undefined && (
                    <div className="text-xs text-slate-500 mt-1">Alias: {metric.alias}</div>
                  )}
                  {metric.properties && Object.keys(metric.properties).length > 0 && (
                    <div className="text-xs text-slate-500 mt-2">
                      <div className="font-medium">Properties:</div>
                      <pre className="mt-1 bg-slate-950 p-2 rounded overflow-x-auto">
                        {JSON.stringify(metric.properties, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h4 className="text-sm font-semibold text-white mb-3">🔍 Full Payload JSON</h4>
          <pre className="text-xs text-slate-300 bg-slate-950 p-3 rounded overflow-x-auto max-h-64">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  const renderPostEncoding = () => {
    const { encodedPayload, sizeBytes } = trace.postEncoding;

    // Group into 16-byte rows for better readability
    const hexRows: string[] = [];
    for (let i = 0; i < encodedPayload.length; i += 16) {
      const row = Array.from(encodedPayload.slice(i, i + 16))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join(' ');
      hexRows.push(row);
    }

    return (
      <div className="space-y-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h4 className="text-sm font-semibold text-white mb-3">📦 Encoded Binary Data (Protobuf)</h4>
          <div className="space-y-2">
            <InfoRow label="Size" value={`${sizeBytes} bytes`} color="blue" />
            <InfoRow label="Format" value="Protocol Buffers (Sparkplug B)" />
            <InfoRow label="Encoding" value="Binary" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h4 className="text-sm font-semibold text-white mb-3">🔢 Hexadecimal Representation</h4>
          <div className="bg-slate-950 p-3 rounded overflow-x-auto max-h-96">
            <pre className="text-xs text-emerald-400 font-mono">
              {hexRows.map((row, index) => (
                <div key={index} className="hover:bg-slate-800 px-1">
                  <span className="text-slate-600 mr-4">{(index * 16).toString(16).padStart(4, '0')}:</span>
                  {row}
                </div>
              ))}
            </pre>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h4 className="text-sm font-semibold text-white mb-3">📏 Size Analysis</h4>
          <div className="space-y-2">
            <InfoRow label="Original Metrics" value={String(trace.preEncoding.metricCount)} />
            <InfoRow label="Encoded Size" value={`${sizeBytes} bytes`} />
            <InfoRow label="Avg per Metric" value={`${(sizeBytes / trace.preEncoding.metricCount).toFixed(1)} bytes`} />
          </div>
        </div>
      </div>
    );
  };

  const renderTransmission = () => {
    const { publishedAt, status, error, mqttClientId } = trace.transmission;

    return (
      <div className="space-y-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h4 className="text-sm font-semibold text-white mb-3">📡 MQTT Transmission Details</h4>
          <div className="space-y-2">
            <InfoRow label="Topic" value={trace.topic} />
            <InfoRow label="QoS Level" value={String(trace.qos)} />
            <InfoRow label="Message Type" value={trace.messageType} color="blue" />
            <InfoRow label="Published At" value={format(publishedAt, 'yyyy-MM-dd HH:mm:ss.SSS')} />
            {mqttClientId && <InfoRow label="MQTT Client ID" value={mqttClientId} />}
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h4 className="text-sm font-semibold text-white mb-3">✅ Status</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">Status:</span>
              <span
                className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                  status === 'success'
                    ? 'bg-green-900/30 text-green-400 border border-green-700'
                    : status === 'error'
                    ? 'bg-red-900/30 text-red-400 border border-red-700'
                    : 'bg-yellow-900/30 text-yellow-400 border border-yellow-700'
                }`}
              >
                {status.toUpperCase()}
              </span>
            </div>
            {error && (
              <div className="mt-3 p-3 bg-red-950/50 border border-red-800 rounded-lg">
                <div className="text-sm font-medium text-red-400 mb-1">Error:</div>
                <div className="text-xs text-red-300">{error}</div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h4 className="text-sm font-semibold text-white mb-3">📋 Sparkplug Hierarchy</h4>
          <div className="space-y-2">
            <InfoRow label="Group ID" value={trace.groupId} />
            <InfoRow label="Edge Node ID" value={trace.edgeNodeId} />
            {trace.deviceId && <InfoRow label="Device ID" value={trace.deviceId} />}
            <InfoRow label="Entity Type" value={trace.deviceId ? 'Device' : 'Edge Node'} color="blue" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <div className="bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-white">🔍 Message Trace Inspector</h2>
              <span className="text-xs font-mono text-blue-400 font-semibold">#{messageNumber}</span>
              <span className={`px-2 py-0.5 text-xs rounded border font-semibold ${getMessageTypeColor(trace.messageType)}`}>
                {trace.messageType}
              </span>
            </div>
            <p className="text-sm text-slate-400">
              {trace.groupId}/{trace.edgeNodeId}{trace.deviceId && `/${trace.deviceId}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-slate-700 flex gap-2">
          <button
            onClick={() => setActiveTab('pre')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'pre'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            📦 Pre-Encoding
          </button>
          <button
            onClick={() => setActiveTab('post')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'post'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🔢 Post-Encoding
          </button>
          <button
            onClick={() => setActiveTab('transmission')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'transmission'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            📡 Transmission
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'pre' && renderPreEncoding()}
          {activeTab === 'post' && renderPostEncoding()}
          {activeTab === 'transmission' && renderTransmission()}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: 'blue' | 'green' | 'orange' }) {
  const highlightColors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
  };

  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-slate-400">{label}:</span>
      <span className={`font-mono ${color ? highlightColors[color] : 'text-slate-200'}`}>{value}</span>
    </div>
  );
}

function formatMetricValue(value: any, datatype: number): string {
  if (value === null || value === undefined) return 'null';

  // Handle different datatypes
  switch (datatype) {
    case 11: // Boolean
      return value ? 'true' : 'false';
    case 12: // String
    case 14: // Text
      return `"${value}"`;
    case 9: // Float
    case 10: // Double
      return typeof value === 'number' ? value.toFixed(2) : String(value);
    default:
      return String(value);
  }
}
