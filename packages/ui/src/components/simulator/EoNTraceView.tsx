/**
 * EoN Trace View Component
 * Real-time message tracing for a specific EoN node during active session
 * Shows emissions (NBIRTH, NDATA, etc.) and receptions (NCMD, DCMD)
 */

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { useBrokerStore } from '../../stores/brokerStore';
import { useMQTTStore } from '../../stores/mqttStore';
import { encodePayload } from '@sparkplug/codec';
import { MessageDetailPopover } from '../common/MessageDetailPopover';
import type { SimulatedEoN, MetricDefinition } from '../../types/simulator.types';
import type { BrokerLog } from '../../types/broker.types';

interface EoNTraceViewProps {
  node: SimulatedEoN;
  onClose: () => void;
}

type MessageDirection = 'sent' | 'received' | 'all';

export function EoNTraceView({ node, onClose }: EoNTraceViewProps) {
  const { logs } = useBrokerStore();
  const { client: mqttClient } = useMQTTStore();

  const [filter, setFilter] = useState<MessageDirection>('all');
  const [commandMetrics, setCommandMetrics] = useState<MetricDefinition[]>([]);
  const [showCommandPanel, setShowCommandPanel] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedLog, setSelectedLog] = useState<BrokerLog | null>(null);
  const [selectedMessageNumber, setSelectedMessageNumber] = useState<number | undefined>();

  // Helper to extract message type from topic
  const extractMessageType = (topic: string): string | null => {
    const match = topic.match(/spBv1\.0\/[^/]+\/([^/]+)\//);
    return match ? match[1] : null;
  };

  // Filter logs for this specific EoN node
  const nodeLogs = useMemo(() => {
    const groupId = node.config.groupId;
    const edgeNodeId = node.config.edgeNodeId;

    return logs.filter((log) => {
      if (!log.topic) return false;

      // Match topic pattern: spBv1.0/{groupId}/{messageType}/{edgeNodeId}[/{deviceId}]
      const topicPattern = new RegExp(
        `^spBv1\\.0/${groupId}/(N|D)(BIRTH|DEATH|DATA|CMD)/${edgeNodeId}(/.*)?$`
      );

      if (!topicPattern.test(log.topic)) return false;

      // Get message type from log or extract from topic
      const messageType = log.messageType || extractMessageType(log.topic);
      if (!messageType) return false;

      // Apply direction filter
      if (filter === 'sent') {
        // Sent messages: NBIRTH, NDEATH, NDATA, DBIRTH, DDEATH, DDATA
        return ['NBIRTH', 'NDEATH', 'NDATA', 'DBIRTH', 'DDEATH', 'DDATA'].includes(messageType);
      } else if (filter === 'received') {
        // Received messages: NCMD, DCMD
        return ['NCMD', 'DCMD'].includes(messageType);
      }

      return true; // 'all' filter
    });
  }, [logs, node.config.groupId, node.config.edgeNodeId, filter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const sent = nodeLogs.filter((log) => {
      const messageType = log.messageType || (log.topic ? extractMessageType(log.topic) : null);
      return messageType && ['NBIRTH', 'NDEATH', 'NDATA', 'DBIRTH', 'DDEATH', 'DDATA'].includes(messageType);
    }).length;
    const received = nodeLogs.filter((log) => {
      const messageType = log.messageType || (log.topic ? extractMessageType(log.topic) : null);
      return messageType && ['NCMD', 'DCMD'].includes(messageType);
    }).length;

    // Calculate messages per second (last 60 seconds)
    const oneMinuteAgo = Date.now() - 60000;
    const recentMessages = nodeLogs.filter((log) => log.timestamp > oneMinuteAgo);
    const messagesPerSecond = (recentMessages.length / 60).toFixed(2);

    return { sent, received, total: nodeLogs.length, messagesPerSecond };
  }, [nodeLogs]);

  // Initialize command metrics from node metrics
  useEffect(() => {
    if (commandMetrics.length === 0 && node.metrics && node.metrics.length > 0) {
      setCommandMetrics(node.metrics.map(m => ({ ...m })));
    }
  }, [node.metrics, commandMetrics.length]);

  const handleSendCommand = async () => {
    if (!mqttClient || !mqttClient.connected) {
      alert('MQTT client not connected');
      return;
    }

    setSending(true);

    try {
      const topic = `spBv1.0/${node.config.groupId}/NCMD/${node.config.edgeNodeId}`;

      const sparkplugPayload = {
        timestamp: BigInt(Date.now()),
        seq: BigInt(0),
        metrics: commandMetrics.map((m) => ({
          name: m.name,
          timestamp: BigInt(Date.now()),
          datatype: m.datatype,
          value: m.value,
        })),
      };

      const payload = encodePayload(sparkplugPayload);

      await new Promise<void>((resolve, reject) => {
        mqttClient.publish(
          topic,
          payload as any,
          { qos: node.config.network.qos },
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      console.log(`✅ Command sent to ${node.config.edgeNodeId}`);
    } catch (error) {
      console.error('Failed to send command:', error);
      alert(`Failed to send command: ${error}`);
    } finally {
      setSending(false);
    }
  };

  const handleUpdateMetric = (index: number, field: keyof MetricDefinition, value: any) => {
    setCommandMetrics((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              📡 EoN Trace Session
              <span className="text-sm font-normal text-slate-400">
                {node.config.groupId}/{node.config.edgeNodeId}
              </span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Real-time message tracking and command control
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            ⏹️ Stop Session
          </button>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="px-6 py-3 bg-slate-900 border-b border-slate-700">
        <div className="grid grid-cols-4 gap-4">
          <StatCard icon="📊" label="Total Messages" value={stats.total} color="blue" />
          <StatCard icon="📤" label="Sent" value={stats.sent} color="green" />
          <StatCard icon="📥" label="Received" value={stats.received} color="purple" />
          <StatCard icon="⚡" label="Msg/sec" value={stats.messagesPerSecond} color="yellow" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Message Trace Panel */}
        <div className="flex-1 flex flex-col">
          {/* Filter Bar */}
          <div className="px-6 py-3 border-b border-slate-700 flex items-center justify-between">
            <div className="flex gap-2">
              {(['all', 'sent', 'received'] as MessageDirection[]).map((dir) => (
                <button
                  key={dir}
                  onClick={() => setFilter(dir)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                    filter === dir
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {dir === 'all' && '📋 All'}
                  {dir === 'sent' && '📤 Sent Only'}
                  {dir === 'received' && '📥 Received Only'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCommandPanel(!showCommandPanel)}
              className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${
                showCommandPanel
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {showCommandPanel ? '✓ Commands Panel' : '⚙️ Show Commands'}
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {nodeLogs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-slate-400">No messages yet</p>
                <p className="text-sm text-slate-500 mt-2">
                  Messages for this EoN will appear here in real-time
                </p>
              </div>
            ) : (
              nodeLogs.slice().reverse().map((log, index) => {
                const messageNumber = nodeLogs.length - index;
                return (
                  <MessageCard
                    key={log.id}
                    log={log}
                    messageNumber={messageNumber}
                    onClick={() => {
                      setSelectedLog(log);
                      setSelectedMessageNumber(messageNumber);
                    }}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Command Panel */}
        {showCommandPanel && (
          <div className="w-96 border-l border-slate-700 bg-slate-900 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">⚡ Quick Command</h3>
              <p className="text-xs text-slate-400 mt-1">
                Send NCMD to {node.config.edgeNodeId}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {commandMetrics.map((metric, index) => (
                <div key={index} className="bg-slate-800 rounded-lg p-3">
                  <div className="text-sm font-medium text-white mb-2">{metric.name}</div>
                  <input
                    type="text"
                    value={String(metric.value)}
                    onChange={(e) => {
                      let value: any = e.target.value;
                      // Parse based on datatype
                      if (metric.datatype === 11) {
                        // Boolean
                        value = value === 'true' || value === '1';
                      } else if (metric.datatype === 9 || metric.datatype === 10) {
                        // Float/Double
                        value = parseFloat(value) || 0;
                      } else if (metric.datatype <= 8) {
                        // Integer types
                        value = parseInt(value) || 0;
                      }
                      handleUpdateMetric(index, 'value', value);
                    }}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                  {metric.properties?.engineeringUnits && (
                    <div className="text-xs text-slate-400 mt-1">
                      Unit: {metric.properties.engineeringUnits}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-slate-700">
              <button
                onClick={handleSendCommand}
                disabled={sending}
                className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {sending ? '⏳ Sending...' : '📤 Send NCMD'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Message Detail Popover */}
      {selectedLog && (
        <MessageDetailPopover
          log={selectedLog}
          messageNumber={selectedMessageNumber}
          onClose={() => {
            setSelectedLog(null);
            setSelectedMessageNumber(undefined);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-900/30 border-blue-700',
    green: 'bg-green-900/30 border-green-700',
    purple: 'bg-purple-900/30 border-purple-700',
    yellow: 'bg-yellow-900/30 border-yellow-700',
  };

  return (
    <div className={`rounded-lg border p-3 ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function MessageCard({ log, messageNumber, onClick }: { log: BrokerLog; messageNumber: number; onClick: () => void }) {
  const getMessageTypeColor = (type?: string) => {
    if (!type) return 'bg-slate-700 text-slate-300';

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

  const isReceived = log.messageType && ['NCMD', 'DCMD'].includes(log.messageType);

  return (
    <div
      className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden cursor-pointer hover:border-blue-700 hover:shadow-lg transition-all"
      onClick={onClick}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Message Number Badge */}
            <div className="flex flex-col items-center">
              <span className="text-2xl">{isReceived ? '📥' : '📤'}</span>
              <span className="text-xs font-mono text-blue-400 font-semibold">#{messageNumber}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-500">
                  {format(log.timestamp, 'HH:mm:ss.SSS')}
                </span>
                {log.messageType && (
                  <span className={`px-2 py-0.5 text-xs rounded border font-semibold ${getMessageTypeColor(log.messageType)}`}>
                    {log.messageType}
                  </span>
                )}
                {log.qos !== undefined && (
                  <span className="text-xs text-slate-500">QoS {log.qos}</span>
                )}
                {log.decoded?.metrics && (
                  <span className="text-xs text-slate-500">
                    {log.decoded.metrics.length} metric{log.decoded.metrics.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-300 font-mono">{log.topic}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-slate-600">Click to inspect 🔍</span>
            <span className="text-xs text-slate-600">{log.payload?.length || 0} bytes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
