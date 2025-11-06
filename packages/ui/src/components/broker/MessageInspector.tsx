/**
 * Message Inspector Component
 * Deep inspection of MQTT messages with raw packet details, hex dump, and decoded payload
 */

import React, { useState } from 'react';
import type { BrokerLog } from '../../types/broker.types';

interface MessageInspectorProps {
  log: BrokerLog;
  onClose: () => void;
}

type InspectorTab = 'overview' | 'mqtt' | 'raw' | 'sparkplug' | 'session';

export function MessageInspector({ log, onClose }: MessageInspectorProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>('overview');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-white">Message Inspector</h2>
            <span className={`px-2 py-1 rounded text-xs font-mono ${getMessageTypeColor(log.messageType)}`}>
              {log.messageType || log.type.toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded hover:bg-gray-800"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 px-4">
          {(['overview', 'mqtt', 'raw', 'sparkplug', 'session'] as InspectorTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'overview' && <OverviewTab log={log} />}
          {activeTab === 'mqtt' && <MQTTTab log={log} />}
          {activeTab === 'raw' && <RawTab log={log} />}
          {activeTab === 'sparkplug' && <SparkplugTab log={log} />}
          {activeTab === 'session' && <SessionTab log={log} />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ log }: { log: BrokerLog }) {
  return (
    <div className="space-y-4">
      <Section title="Message Information">
        <InfoRow label="ID" value={log.id} />
        <InfoRow label="Timestamp" value={new Date(log.timestamp).toISOString()} />
        <InfoRow label="Type" value={log.type} />
        <InfoRow label="Client ID" value={log.clientId} />
        {log.topic && <InfoRow label="Topic" value={log.topic} />}
        {log.qos !== undefined && <InfoRow label="QoS" value={log.qos.toString()} />}
        {log.retain !== undefined && <InfoRow label="Retain" value={log.retain ? 'Yes' : 'No'} />}
        <InfoRow label="Origin" value={`${log.origin.ip}:${log.origin.port}`} />
      </Section>

      {log.payload && (
        <Section title="Payload Summary">
          <InfoRow label="Size" value={`${log.payload.length} bytes`} />
          {log.decoded && (
            <>
              <InfoRow label="Metrics" value={log.decoded.metrics?.length || 0} />
              {log.decoded.seq !== undefined && <InfoRow label="Sequence" value={log.decoded.seq.toString()} />}
              {log.decoded.timestamp && (
                <InfoRow label="Timestamp" value={new Date(Number(log.decoded.timestamp)).toISOString()} />
              )}
            </>
          )}
        </Section>
      )}

      {log.sparkplugMetadata && (
        <Section title="Sparkplug Metadata">
          {log.sparkplugMetadata.groupId && <InfoRow label="Group ID" value={log.sparkplugMetadata.groupId} />}
          {log.sparkplugMetadata.edgeNodeId && <InfoRow label="Edge Node ID" value={log.sparkplugMetadata.edgeNodeId} />}
          {log.sparkplugMetadata.deviceId && <InfoRow label="Device ID" value={log.sparkplugMetadata.deviceId} />}
          {log.sparkplugMetadata.bdSeq !== undefined && (
            <InfoRow label="Birth/Death Seq" value={log.sparkplugMetadata.bdSeq.toString()} />
          )}
          {log.sparkplugMetadata.seq !== undefined && (
            <InfoRow label="Sequence" value={log.sparkplugMetadata.seq.toString()} />
          )}
          {log.sparkplugMetadata.metricCount !== undefined && (
            <InfoRow label="Metric Count" value={log.sparkplugMetadata.metricCount.toString()} />
          )}
          {log.sparkplugMetadata.isStale !== undefined && (
            <InfoRow label="Stale" value={log.sparkplugMetadata.isStale ? 'Yes' : 'No'} />
          )}
        </Section>
      )}
    </div>
  );
}

function MQTTTab({ log }: { log: BrokerLog }) {
  const mqttPacket = log.mqttPacket;

  if (!mqttPacket) {
    return <div className="text-gray-400">No MQTT packet details available</div>;
  }

  return (
    <div className="space-y-4">
      <Section title="Fixed Header">
        <InfoRow label="Message Type" value={`${mqttPacket.fixedHeader.messageTypeName} (${mqttPacket.fixedHeader.messageType})`} />
        <InfoRow label="DUP Flag" value={mqttPacket.fixedHeader.dup ? 'Yes' : 'No'} />
        <InfoRow label="QoS Level" value={mqttPacket.fixedHeader.qos.toString()} />
        <InfoRow label="RETAIN Flag" value={mqttPacket.fixedHeader.retain ? 'Yes' : 'No'} />
        <InfoRow label="Remaining Length" value={`${mqttPacket.fixedHeader.remainingLength} bytes`} />
      </Section>

      <Section title="Variable Header">
        {mqttPacket.variableHeader.topicName && (
          <InfoRow label="Topic Name" value={mqttPacket.variableHeader.topicName} />
        )}
        {mqttPacket.variableHeader.packetIdentifier !== undefined && (
          <InfoRow label="Packet Identifier" value={mqttPacket.variableHeader.packetIdentifier.toString()} />
        )}
        {mqttPacket.variableHeader.protocolName && (
          <InfoRow label="Protocol Name" value={mqttPacket.variableHeader.protocolName} />
        )}
        {mqttPacket.variableHeader.protocolLevel !== undefined && (
          <InfoRow label="Protocol Level" value={mqttPacket.variableHeader.protocolLevel.toString()} />
        )}
        {mqttPacket.variableHeader.keepAlive !== undefined && (
          <InfoRow label="Keep Alive" value={`${mqttPacket.variableHeader.keepAlive}s`} />
        )}
        {mqttPacket.variableHeader.connectFlags && (
          <>
            <div className="text-sm font-medium text-gray-300 mt-2">Connect Flags:</div>
            <div className="ml-4 space-y-1">
              <InfoRow label="Clean Session" value={mqttPacket.variableHeader.connectFlags.cleanSession ? 'Yes' : 'No'} />
              <InfoRow label="Will Flag" value={mqttPacket.variableHeader.connectFlags.willFlag ? 'Yes' : 'No'} />
              {mqttPacket.variableHeader.connectFlags.willFlag && (
                <>
                  <InfoRow label="Will QoS" value={mqttPacket.variableHeader.connectFlags.willQoS?.toString() || '0'} />
                  <InfoRow label="Will Retain" value={mqttPacket.variableHeader.connectFlags.willRetain ? 'Yes' : 'No'} />
                </>
              )}
              <InfoRow label="Password Flag" value={mqttPacket.variableHeader.connectFlags.passwordFlag ? 'Yes' : 'No'} />
              <InfoRow label="Username Flag" value={mqttPacket.variableHeader.connectFlags.usernameFlag ? 'Yes' : 'No'} />
            </div>
          </>
        )}
        {mqttPacket.variableHeader.properties && Object.keys(mqttPacket.variableHeader.properties).length > 0 && (
          <>
            <div className="text-sm font-medium text-gray-300 mt-2">MQTT 5.0 Properties:</div>
            <pre className="bg-gray-800 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(mqttPacket.variableHeader.properties, null, 2)}
            </pre>
          </>
        )}
      </Section>

      <Section title="Packet Summary">
        <InfoRow label="Payload Length" value={`${mqttPacket.payloadLength} bytes`} />
        <InfoRow label="Total Packet Size" value={`${mqttPacket.totalPacketSize} bytes`} />
      </Section>
    </div>
  );
}

function RawTab({ log }: { log: BrokerLog }) {
  const rawData = log.mqttPacket?.raw || log.payload;

  if (!rawData || rawData.length === 0) {
    return <div className="text-gray-400">No raw data available</div>;
  }

  return (
    <div className="space-y-4">
      <Section title="Hex Dump">
        <div className="bg-gray-800 p-4 rounded font-mono text-xs overflow-auto">
          <HexDump data={rawData} />
        </div>
      </Section>

      <Section title="Raw Bytes">
        <div className="bg-gray-800 p-4 rounded font-mono text-xs break-all">
          {Array.from(rawData)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join(' ')}
        </div>
      </Section>

      <Section title="ASCII Representation">
        <div className="bg-gray-800 p-4 rounded font-mono text-xs break-all">
          {Array.from(rawData)
            .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
            .join('')}
        </div>
      </Section>
    </div>
  );
}

function SparkplugTab({ log }: { log: BrokerLog }) {
  if (!log.decoded) {
    return <div className="text-gray-400">No Sparkplug B payload decoded</div>;
  }

  return (
    <div className="space-y-4">
      <Section title="Payload">
        <pre className="bg-gray-800 p-4 rounded text-xs overflow-auto">
          {JSON.stringify(log.decoded, replaceBigInt, 2)}
        </pre>
      </Section>

      {log.decoded.metrics && log.decoded.metrics.length > 0 && (
        <Section title="Metrics">
          <div className="space-y-2">
            {log.decoded.metrics.map((metric: any, idx: number) => (
              <div key={idx} className="bg-gray-800 p-3 rounded">
                <div className="font-medium text-white">{metric.name || `Metric ${idx}`}</div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  {metric.alias !== undefined && <InfoRow label="Alias" value={metric.alias.toString()} />}
                  <InfoRow label="Data Type" value={getDataTypeName(metric.datatype)} />
                  <InfoRow label="Value" value={formatMetricValue(metric.value)} />
                  {metric.timestamp && (
                    <InfoRow label="Timestamp" value={new Date(Number(metric.timestamp)).toISOString()} />
                  )}
                  {metric.properties && (
                    <div className="col-span-2">
                      <div className="text-xs text-gray-400">Properties:</div>
                      <pre className="text-xs mt-1">{JSON.stringify(metric.properties, replaceBigInt, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function SessionTab({ log }: { log: BrokerLog }) {
  if (!log.sessionInfo) {
    return <div className="text-gray-400">No session information available</div>;
  }

  return (
    <div className="space-y-4">
      <Section title="Session Information">
        <InfoRow label="New Session" value={log.sessionInfo.isNewSession ? 'Yes' : 'No'} />
        {log.sessionInfo.sessionExpiry !== undefined && (
          <InfoRow label="Session Expiry" value={`${log.sessionInfo.sessionExpiry}s`} />
        )}
        {log.sessionInfo.lastWillTopic && <InfoRow label="Last Will Topic" value={log.sessionInfo.lastWillTopic} />}
      </Section>
    </div>
  );
}

// Helper Components

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}:</span>
      <span className="text-white font-mono">{value}</span>
    </div>
  );
}

function HexDump({ data }: { data: Uint8Array }) {
  const bytesPerLine = 16;
  const lines: React.ReactElement[] = [];

  for (let i = 0; i < data.length; i += bytesPerLine) {
    const chunk = data.slice(i, i + bytesPerLine);
    const offset = i.toString(16).padStart(8, '0');
    const hex = Array.from(chunk)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
    const ascii = Array.from(chunk)
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
      .join('');

    const hexPadded = hex.padEnd(bytesPerLine * 3 - 1, ' ');

    lines.push(
      <div key={i} className="text-gray-300">
        <span className="text-blue-400">{offset}</span>
        {'  '}
        <span className="text-green-400">{hexPadded}</span>
        {'  '}
        <span className="text-gray-500">|</span>
        <span>{ascii}</span>
        <span className="text-gray-500">|</span>
      </div>
    );
  }

  return <div>{lines}</div>;
}

// Helper Functions

function getMessageTypeColor(messageType?: string): string {
  if (!messageType) return 'bg-gray-600 text-white';

  const colors: Record<string, string> = {
    NBIRTH: 'bg-green-600 text-white',
    NDEATH: 'bg-red-600 text-white',
    DBIRTH: 'bg-blue-600 text-white',
    DDEATH: 'bg-orange-600 text-white',
    NDATA: 'bg-purple-600 text-white',
    DDATA: 'bg-indigo-600 text-white',
    NCMD: 'bg-yellow-600 text-white',
    DCMD: 'bg-amber-600 text-white',
    STATE: 'bg-cyan-600 text-white',
  };

  return colors[messageType] || 'bg-gray-600 text-white';
}

function getDataTypeName(datatype: number): string {
  const types: Record<number, string> = {
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
  };
  return types[datatype] || `Unknown (${datatype})`;
}

function formatMetricValue(value: any): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function replaceBigInt(_key: string, value: any): any {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}
