/**
 * Sparkplug Command Builder
 * Build all types of Sparkplug B messages: NBIRTH, NDEATH, DBIRTH, DDEATH, NDATA, DDATA, NCMD, DCMD, STATE
 */

import { useState } from 'react';
import { MetricEditorAdvanced } from './MetricEditorAdvanced';
import type { Metric } from '@sparkplug/codec';

export type SparkplugMessageType =
  | 'NBIRTH'
  | 'NDEATH'
  | 'DBIRTH'
  | 'DDEATH'
  | 'NDATA'
  | 'DDATA'
  | 'NCMD'
  | 'DCMD'
  | 'STATE';

export interface SparkplugCommand {
  messageType: SparkplugMessageType;
  metrics: Metric[];
  timestamp?: bigint;

  // For STATE messages
  online?: boolean;
}

interface SparkplugCommandBuilderProps {
  command: SparkplugCommand;
  onChange: (command: SparkplugCommand) => void;
  targetType: 'node' | 'device'; // Node-level or Device-level
}

export function SparkplugCommandBuilder({ command, onChange, targetType }: SparkplugCommandBuilderProps) {
  const [showPreview, setShowPreview] = useState(false);

  // Message type options based on target type
  const nodeMessageTypes: SparkplugMessageType[] = ['NBIRTH', 'NDEATH', 'NDATA', 'NCMD', 'STATE'];
  const deviceMessageTypes: SparkplugMessageType[] = ['DBIRTH', 'DDEATH', 'DDATA', 'DCMD'];

  const availableTypes = targetType === 'node' ? nodeMessageTypes : deviceMessageTypes;

  const handleAddMetric = () => {
    const newMetric: Metric = {
      name: `metric_${command.metrics.length + 1}`,
      timestamp: BigInt(Date.now()),
      datatype: 3, // Int32
      value: 0,
    };

    onChange({
      ...command,
      metrics: [...command.metrics, newMetric],
    });
  };

  const handleRemoveMetric = (index: number) => {
    onChange({
      ...command,
      metrics: command.metrics.filter((_, i) => i !== index),
    });
  };

  const handleUpdateMetric = (index: number, updatedMetric: Metric) => {
    onChange({
      ...command,
      metrics: command.metrics.map((m, i) => (i === index ? updatedMetric : m)),
    });
  };

  const getMessageTypeDescription = (type: SparkplugMessageType): string => {
    const descriptions: Record<SparkplugMessageType, string> = {
      NBIRTH: 'Node Birth - Initial connection with full metrics list and bdSeq',
      NDEATH: 'Node Death - Last Will message sent when node disconnects',
      DBIRTH: 'Device Birth - Device comes online with full metrics list',
      DDEATH: 'Device Death - Device goes offline',
      NDATA: 'Node Data - Update one or more node metrics',
      DDATA: 'Device Data - Update one or more device metrics',
      NCMD: 'Node Command - Send command to node',
      DCMD: 'Device Command - Send command to device',
      STATE: 'State Message - Primary Host Application state (online/offline)',
    };
    return descriptions[type];
  };

  const getBadgeColor = (type: SparkplugMessageType): string => {
    const colors: Record<SparkplugMessageType, string> = {
      NBIRTH: 'bg-emerald-900/50 text-emerald-400',
      NDEATH: 'bg-red-900/50 text-red-400',
      DBIRTH: 'bg-blue-900/50 text-blue-400',
      DDEATH: 'bg-orange-900/50 text-orange-400',
      NDATA: 'bg-cyan-900/50 text-cyan-400',
      DDATA: 'bg-indigo-900/50 text-indigo-400',
      NCMD: 'bg-purple-900/50 text-purple-400',
      DCMD: 'bg-pink-900/50 text-pink-400',
      STATE: 'bg-yellow-900/50 text-yellow-400',
    };
    return colors[type];
  };

  return (
    <div className="space-y-4">
      {/* Message Type Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">
          Message Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {availableTypes.map((type) => (
            <button
              key={type}
              onClick={() => onChange({ ...command, messageType: type })}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                command.messageType === type
                  ? getBadgeColor(type)
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs text-slate-400 bg-slate-800/50 rounded p-2">
          ℹ️ {getMessageTypeDescription(command.messageType)}
        </div>
      </div>

      {/* STATE Message Special Handling */}
      {command.messageType === 'STATE' && (
        <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-400 mb-3">STATE Message (Primary Host Application)</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Host Application State
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onChange({ ...command, online: true })}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    command.online
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  🟢 ONLINE
                </button>
                <button
                  onClick={() => onChange({ ...command, online: false })}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    command.online === false
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  🔴 OFFLINE
                </button>
              </div>
            </div>
            <div className="text-xs text-slate-400">
              STATE messages are published on the topic: <code className="bg-slate-900 px-1 py-0.5 rounded">spBv1.0/STATE/&lt;scada_host_id&gt;</code>
              <br />
              Used by Primary Host Applications to indicate their online/offline status.
            </div>
          </div>
        </div>
      )}

      {/* Metrics Editor (for all types except NDEATH/DDEATH which typically have no metrics) */}
      {command.messageType !== 'NDEATH' && command.messageType !== 'DDEATH' && command.messageType !== 'STATE' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-400">
              Metrics
              <span className="ml-2 text-xs text-slate-500">
                ({command.metrics.length} metric{command.metrics.length !== 1 ? 's' : ''})
              </span>
            </label>
            <button
              onClick={handleAddMetric}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-medium"
            >
              + Add Metric
            </button>
          </div>

          {command.metrics.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-slate-400 text-sm">No metrics defined</p>
              <p className="text-slate-500 text-xs mt-1">
                {command.messageType === 'NBIRTH' || command.messageType === 'DBIRTH'
                  ? 'BIRTH messages typically include a full list of available metrics'
                  : 'Add metrics to include in this message'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {command.metrics.map((metric, index) => (
                <MetricEditorAdvanced
                  key={index}
                  metric={metric}
                  onChange={(updated) => handleUpdateMetric(index, updated)}
                  onRemove={() => handleRemoveMetric(index)}
                  showAdvanced={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Special Instructions for DEATH Messages */}
      {(command.messageType === 'NDEATH' || command.messageType === 'DDEATH') && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4">
          <h4 className="font-semibold text-red-400 mb-2">DEATH Message</h4>
          <div className="text-xs text-slate-400 space-y-1">
            <p>• DEATH messages are typically sent as MQTT Last Will messages</p>
            <p>• They usually contain the bdSeq metric to indicate which birth certificate they correspond to</p>
            <p>• QoS should be 0 or 1</p>
            <p>• Retain flag should be false</p>
            {command.metrics.length === 0 && (
              <p className="text-amber-400 mt-2">💡 Tip: Add a bdSeq metric for Sparkplug B compliance</p>
            )}
          </div>
        </div>
      )}

      {/* Special Instructions for BIRTH Messages */}
      {(command.messageType === 'NBIRTH' || command.messageType === 'DBIRTH') && (
        <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-lg p-4">
          <h4 className="font-semibold text-emerald-400 mb-2">BIRTH Message</h4>
          <div className="text-xs text-slate-400 space-y-1">
            <p>• BIRTH messages must include bdSeq metric (birth/death sequence 0-255)</p>
            <p>• Should include all available metrics with their current values</p>
            <p>• Timestamp should be included for all metrics</p>
            <p>• Used to establish the baseline metric list for the node/device</p>
            {!command.metrics.some(m => m.name === 'bdSeq') && (
              <p className="text-amber-400 mt-2">⚠️ Warning: bdSeq metric is missing (required for Sparkplug B)</p>
            )}
          </div>
        </div>
      )}

      {/* Preview Toggle */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-2"
      >
        {showPreview ? '▼' : '▶'} Preview Payload
      </button>

      {/* Payload Preview */}
      {showPreview && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-white">Payload Preview</h4>
            <button
              onClick={() => {
                const payload = JSON.stringify({
                  timestamp: Date.now(),
                  metrics: command.metrics.map(m => ({
                    name: m.name,
                    datatype: m.datatype,
                    value: m.value?.toString(),
                    timestamp: m.timestamp?.toString(),
                  })),
                  ...(command.messageType === 'STATE' && { online: command.online }),
                }, null, 2);
                navigator.clipboard.writeText(payload);
              }}
              className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded"
            >
              📋 Copy
            </button>
          </div>
          <pre className="text-xs text-slate-300 bg-slate-950 p-3 rounded overflow-x-auto">
            {JSON.stringify(
              {
                messageType: command.messageType,
                timestamp: Date.now(),
                metrics: command.metrics.map((m) => ({
                  name: m.name,
                  alias: m.alias,
                  timestamp: m.timestamp?.toString(),
                  datatype: m.datatype,
                  value: m.value !== undefined ? m.value.toString() : null,
                })),
                ...(command.messageType === 'STATE' && { online: command.online }),
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
