/**
 * Command Panel Component
 * Send all types of Sparkplug B commands with full MQTT configuration
 */

import { useState, useEffect } from 'react';
import { useCommandStore } from '../../stores/commandStore';
import { format } from 'date-fns';
import mqtt, { MqttClient } from 'mqtt';
import { encodePayload } from '@sparkplug/codec';
import { ConnectionConfigPanel, type MQTTConnectionConfig } from './ConnectionConfigPanel';
import { TargetSelector, type CommandTarget } from './TargetSelector';
import { SparkplugCommandBuilder, type SparkplugCommand } from './SparkplugCommandBuilder';

type Tab = 'send' | 'history' | 'scheduled';

export function CommandPanel() {
  const { commands, createCommand, history } = useCommandStore();

  // State
  const [activeTab, setActiveTab] = useState<Tab>('send');
  const [connectionConfig, setConnectionConfig] = useState<MQTTConnectionConfig | null>(null);
  const [target, setTarget] = useState<CommandTarget | null>(null);
  const [command, setCommand] = useState<SparkplugCommand>({
    messageType: 'NDATA',
    metrics: [],
  });
  const [mqttClient, setMqttClient] = useState<MqttClient | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  // Arrays for rendering
  const commandsArray = Array.from(commands.values());
  const recentCommands = commandsArray.slice(-10).reverse();

  // Connect to MQTT broker
  const handleConnect = async () => {
    if (!connectionConfig) return;

    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Build connection URL
      const url = `${connectionConfig.protocol}://${connectionConfig.url}:${connectionConfig.port}`;

      // Build options
      const options: any = {
        clientId: connectionConfig.clientId,
        username: connectionConfig.username,
        password: connectionConfig.password,
        clean: connectionConfig.cleanSession,
        keepalive: connectionConfig.keepalive,
        reconnectPeriod: connectionConfig.reconnectPeriod,
      };

      // TLS options
      if (connectionConfig.useTLS) {
        options.rejectUnauthorized = connectionConfig.rejectUnauthorized;
        if (connectionConfig.ca) {
          options.ca = connectionConfig.ca;
        }
        if (connectionConfig.cert) {
          options.cert = connectionConfig.cert;
        }
        if (connectionConfig.key) {
          options.key = connectionConfig.key;
        }
      }

      // Create MQTT client
      const client = mqtt.connect(url, options);

      client.on('connect', () => {
        console.log('✅ Connected to MQTT broker for command sending');
        setMqttClient(client);
        setIsConnecting(false);
        setConnectionError(null);
      });

      client.on('error', (err) => {
        console.error('❌ MQTT connection error:', err);
        setConnectionError(err.message);
        setIsConnecting(false);
      });

      client.on('close', () => {
        console.log('🔌 MQTT connection closed');
        setMqttClient(null);
      });
    } catch (err) {
      setConnectionError((err as Error).message);
      setIsConnecting(false);
    }
  };

  // Disconnect from MQTT broker
  const handleDisconnect = () => {
    if (mqttClient) {
      mqttClient.end();
      setMqttClient(null);
    }
  };

  // Build Sparkplug topic
  const buildSparkplugTopic = (target: CommandTarget, messageType: string): string => {
    const namespace = target.namespace || 'spBv1.0';
    const groupId = target.groupId || 'Group1';
    const edgeNodeId = target.edgeNodeId || 'EoN1';

    if (messageType === 'STATE') {
      return `${namespace}/STATE/${groupId}`;
    }

    if (messageType.startsWith('D')) {
      // Device-level message
      const deviceId = target.deviceIdNew || target.deviceId || 'Device1';
      return `${namespace}/${groupId}/${messageType}/${edgeNodeId}/${deviceId}`;
    } else {
      // Node-level message
      return `${namespace}/${groupId}/${messageType}/${edgeNodeId}`;
    }
  };

  // Send command
  const handleSendCommand = async () => {
    if (!mqttClient || !target || !connectionConfig) {
      setSendError('Please configure connection and target first');
      return;
    }

    setIsSending(true);
    setSendError(null);
    setSendSuccess(null);

    try {
      let topic: string;
      let payload: Buffer;

      if (target.protocol === 'SparkplugB') {
        // Sparkplug B Protocol
        topic = buildSparkplugTopic(target, command.messageType);

        // Build Sparkplug payload
        const sparkplugPayload: any = {
          timestamp: BigInt(Date.now()),
          metrics: command.metrics,
        };

        // Add sequence numbers if needed
        if (target.seq !== undefined) {
          sparkplugPayload.seq = target.seq;
        }
        if (target.bdSeq !== undefined && (command.messageType === 'NBIRTH' || command.messageType === 'DBIRTH')) {
          // Add bdSeq to metrics for BIRTH messages
          sparkplugPayload.metrics = [
            {
              name: 'bdSeq',
              timestamp: sparkplugPayload.timestamp,
              datatype: 4, // Int64
              value: BigInt(target.bdSeq),
            },
            ...sparkplugPayload.metrics,
          ];
        }

        // Special handling for STATE messages
        if (command.messageType === 'STATE') {
          sparkplugPayload.metrics = [
            {
              name: 'online',
              timestamp: sparkplugPayload.timestamp,
              datatype: 11, // Boolean
              value: command.online ?? true,
            },
          ];
        }

        // Encode with @sparkplug/codec
        payload = Buffer.from(encodePayload(sparkplugPayload));
      } else {
        // Raw MQTT v5
        topic = `${target.namespace || 'custom'}/${target.groupId}/${target.edgeNodeId}`;
        if (target.deviceIdNew) {
          topic += `/${target.deviceIdNew}`;
        }

        // Simple JSON payload for raw MQTT
        const rawPayload = {
          timestamp: Date.now(),
          messageType: command.messageType,
          metrics: command.metrics.map((m) => ({
            name: m.name,
            value: m.value?.toString(),
            datatype: m.datatype,
          })),
        };
        payload = Buffer.from(JSON.stringify(rawPayload));
      }

      // Publish message
      await new Promise<void>((resolve, reject) => {
        mqttClient.publish(
          topic,
          payload,
          {
            qos: connectionConfig.qos,
            retain: false,
          },
          (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });

      // Add to command history
      createCommand({
        type: command.messageType as any, // Cast for now - will match CommandType
        target: {
          groupId: target.groupId || 'Unknown',
          edgeNodeId: target.edgeNodeId || 'Unknown',
          deviceId: target.deviceId || target.deviceIdNew,
        },
        metrics: command.metrics.map(m => ({
          name: m.name || 'unnamed',
          value: m.value !== undefined ? (typeof m.value === 'bigint' ? Number(m.value) : m.value as any) : 0,
          datatype: m.datatype as number,
          alias: m.alias,
          timestamp: m.timestamp,
        })),
        mqtt: {
          qos: connectionConfig.qos,
          retain: false,
        },
        schedule: {
          type: 'immediate',
        },
      });

      setSendSuccess(`✅ Command sent successfully on topic: ${topic}`);
      setIsSending(false);

      // Clear success message after 5 seconds
      setTimeout(() => setSendSuccess(null), 5000);
    } catch (err) {
      console.error('Failed to send command:', err);
      setSendError((err as Error).message);
      setIsSending(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, [mqttClient]);

  const tabs = [
    { id: 'send' as Tab, label: 'Send Command', icon: '📡' },
    { id: 'history' as Tab, label: 'History', icon: '📜' },
    { id: 'scheduled' as Tab, label: 'Scheduled', icon: '⏰' },
  ];

  return (
    <div className="h-full bg-slate-950 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Command Panel</h2>
          <p className="text-slate-400">
            Send all types of Sparkplug B commands with full MQTT configuration
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <p className="text-slate-400 text-sm">Connection</p>
            <p className="text-lg font-bold text-white">
              {mqttClient ? (
                <span className="text-emerald-400">🟢 Connected</span>
              ) : (
                <span className="text-red-400">🔴 Disconnected</span>
              )}
            </p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <p className="text-slate-400 text-sm">Total Sent</p>
            <p className="text-2xl font-bold text-white">{history.totalSent}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <p className="text-slate-400 text-sm">Acknowledged</p>
            <p className="text-2xl font-bold text-emerald-500">{history.totalAcknowledged}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <p className="text-slate-400 text-sm">Failed</p>
            <p className="text-2xl font-bold text-red-500">{history.totalFailed}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-800 mb-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-white bg-slate-900'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'send' && (
          <div className="space-y-6">
            {/* Connection Config */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Connection Configuration</h3>
                {mqttClient ? (
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={!connectionConfig || isConnecting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </button>
                )}
              </div>

              <ConnectionConfigPanel
                config={connectionConfig}
                onChange={setConnectionConfig}
              />

              {connectionError && (
                <div className="mt-4 bg-red-900/20 border border-red-800/30 rounded-lg p-3 text-sm text-red-400">
                  ❌ {connectionError}
                </div>
              )}
            </div>

            {/* Target Selection */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Target Selection</h3>
              <TargetSelector target={target} onChange={setTarget} />
            </div>

            {/* Command Builder */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Command Builder</h3>
              <SparkplugCommandBuilder
                command={command}
                onChange={setCommand}
                targetType={
                  command.messageType.startsWith('N') || command.messageType === 'STATE'
                    ? 'node'
                    : 'device'
                }
              />
            </div>

            {/* Send Button */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
              <button
                onClick={handleSendCommand}
                disabled={!mqttClient || !target || isSending}
                className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSending ? '⏳ Sending...' : '🚀 Send Command'}
              </button>

              {sendError && (
                <div className="mt-4 bg-red-900/20 border border-red-800/30 rounded-lg p-3 text-sm text-red-400">
                  ❌ {sendError}
                </div>
              )}

              {sendSuccess && (
                <div className="mt-4 bg-emerald-900/20 border border-emerald-800/30 rounded-lg p-3 text-sm text-emerald-400">
                  {sendSuccess}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Command History</h3>

            {recentCommands.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📜</div>
                <p className="text-slate-400">No commands sent yet</p>
                <p className="text-sm text-slate-500 mt-2">
                  Commands you send will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCommands.map((cmd) => (
                  <div
                    key={cmd.id}
                    className="bg-slate-800 border border-slate-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-white">{cmd.type}</div>
                        <div className="text-xs text-slate-400">
                          {cmd.target.groupId}/{cmd.target.edgeNodeId}
                          {cmd.target.deviceId && `/${cmd.target.deviceId}`}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          cmd.status === 'sent'
                            ? 'bg-blue-900/50 text-blue-400'
                            : cmd.status === 'acknowledged'
                            ? 'bg-emerald-900/50 text-emerald-400'
                            : cmd.status === 'failed'
                            ? 'bg-red-900/50 text-red-400'
                            : 'bg-yellow-900/50 text-yellow-400'
                        }`}
                      >
                        {cmd.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {format(cmd.createdAt, 'MMM dd, HH:mm:ss')}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      {cmd.metrics.length} metric{cmd.metrics.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'scheduled' && (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Scheduled Commands</h3>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">⏰</div>
              <p className="text-slate-400">Command scheduling coming soon</p>
              <p className="text-sm text-slate-500 mt-2">
                Schedule commands to run at specific times or intervals
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
