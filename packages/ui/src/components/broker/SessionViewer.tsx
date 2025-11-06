/**
 * Session Viewer Component
 * Displays active MQTT sessions with enhanced Sparkplug B tracking and stale detection
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import type { Session } from '../../types/broker.types';

interface SessionViewerProps {
  sessions: Session[];
}

export function SessionViewer({ sessions }: SessionViewerProps) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [filterStale, setFilterStale] = useState(false);
  const [filterSparkplug, setFilterSparkplug] = useState(false);

  const filteredSessions = sessions.filter(session => {
    if (filterStale && !session.isStale) return false;
    if (filterSparkplug && !session.sparkplugState) return false;
    return true;
  });

  const staleSessions = sessions.filter(s => s.isStale).length;
  const sparkplugSessions = sessions.filter(s => s.sparkplugState).length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Sessions"
          value={sessions.length}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Sparkplug Nodes"
          value={sparkplugSessions}
          icon="⚡"
          color="green"
        />
        <StatCard
          title="Stale Sessions"
          value={staleSessions}
          icon="⚠️"
          color={staleSessions > 0 ? 'red' : 'gray'}
        />
        <StatCard
          title="Active (Fresh)"
          value={sessions.length - staleSessions}
          icon="✓"
          color="emerald"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterStale(!filterStale)}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            filterStale
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {filterStale ? '✓' : ''} Show Only Stale
        </button>
        <button
          onClick={() => setFilterSparkplug(!filterSparkplug)}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            filterSparkplug
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {filterSparkplug ? '✓' : ''} Show Only Sparkplug
        </button>
      </div>

      {/* Session List */}
      <div className="space-y-2">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No sessions found matching the filters
          </div>
        ) : (
          filteredSessions.map(session => (
            <SessionCard
              key={session.clientId}
              session={session}
              isExpanded={expandedSession === session.clientId}
              onToggle={() => setExpandedSession(
                expandedSession === session.clientId ? null : session.clientId
              )}
            />
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: {
  title: string;
  value: number;
  icon: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-900/30 border-blue-700 text-blue-400',
    green: 'bg-green-900/30 border-green-700 text-green-400',
    red: 'bg-red-900/30 border-red-700 text-red-400',
    emerald: 'bg-emerald-900/30 border-emerald-700 text-emerald-400',
    gray: 'bg-gray-800/30 border-gray-700 text-gray-400',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color] || colorClasses.gray}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm opacity-80">{title}</div>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

function SessionCard({ session, isExpanded, onToggle }: {
  session: Session;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const timeSinceActivity = Date.now() - session.lastActivity;
  const activityAgo = formatDuration(timeSinceActivity);
  const connectedDuration = formatDuration(Date.now() - session.connectedAt);

  return (
    <div className={`rounded-lg border overflow-hidden ${
      session.isStale
        ? 'bg-red-900/10 border-red-700/50'
        : 'bg-gray-900 border-gray-800'
    }`}>
      {/* Session Header */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left: Session Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Client ID */}
              <span className="text-sm font-mono font-semibold text-white">
                {session.clientId}
              </span>

              {/* Status Badges */}
              {session.isStale && (
                <span className="px-2 py-0.5 text-xs rounded bg-red-600 text-white">
                  ⚠️ STALE
                </span>
              )}

              {session.sparkplugState && (
                <span className="px-2 py-0.5 text-xs rounded bg-green-600 text-white">
                  ⚡ Sparkplug
                </span>
              )}

              {session.cleanSession && (
                <span className="px-2 py-0.5 text-xs rounded bg-blue-600 text-white">
                  Clean
                </span>
              )}

              {session.willMessage && (
                <span className="px-2 py-0.5 text-xs rounded bg-purple-600 text-white">
                  Will
                </span>
              )}
            </div>

            {/* Additional Info */}
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{session.ip}:{session.port}</span>
              <span>•</span>
              <span>Connected: {connectedDuration}</span>
              <span>•</span>
              <span className={session.isStale ? 'text-red-400 font-semibold' : ''}>
                Last Activity: {activityAgo}
              </span>
              <span>•</span>
              <span>{session.subscriptions.length} subscriptions</span>
            </div>

            {/* Sparkplug Info Preview */}
            {session.sparkplugState && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-400">
                  {session.sparkplugState.groupId}/{session.sparkplugState.edgeNodeId}
                </span>
                {session.sparkplugState.ndeathPublished && (
                  <span className="px-2 py-0.5 rounded bg-red-900/30 text-red-400">
                    NDEATH Published
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: Stats & Expand */}
          <div className="flex items-center gap-4">
            <div className="text-right text-xs text-gray-400">
              <div>↓ {formatBytes(session.stats.bytesIn)}</div>
              <div>↑ {formatBytes(session.stats.bytesOut)}</div>
            </div>
            <span className="text-gray-600">
              {isExpanded ? '▼' : '▶'}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-800 p-4 bg-gray-950 space-y-4">
          {/* Connection Details */}
          <Section title="Connection Details">
            <InfoRow label="Client ID" value={session.clientId} />
            <InfoRow label="IP Address" value={session.ip} />
            <InfoRow label="Port" value={session.port.toString()} />
            <InfoRow label="Connected At" value={format(session.connectedAt, 'yyyy-MM-dd HH:mm:ss.SSS')} />
            <InfoRow label="Last Activity" value={format(session.lastActivity, 'yyyy-MM-dd HH:mm:ss.SSS')} />
            <InfoRow label="Keep Alive" value={`${session.keepAlive}s`} />
            <InfoRow label="Protocol Version" value={getProtocolVersion(session.protocolVersion)} />
            <InfoRow label="Clean Session" value={session.cleanSession ? 'Yes' : 'No'} />
            <InfoRow label="Session Expiry" value={`${session.sessionExpiry}s`} />
            <InfoRow label="Is Stale" value={session.isStale ? 'Yes ⚠️' : 'No ✓'} />
          </Section>

          {/* Statistics */}
          <Section title="Statistics">
            <InfoRow label="Bytes Received" value={formatBytes(session.stats.bytesIn)} />
            <InfoRow label="Bytes Sent" value={formatBytes(session.stats.bytesOut)} />
            <InfoRow label="Messages Received" value={session.stats.messagesIn.toString()} />
            <InfoRow label="Messages Sent" value={session.stats.messagesOut.toString()} />
          </Section>

          {/* Will Message */}
          {session.willMessage && (
            <Section title="Last Will & Testament">
              <InfoRow label="Topic" value={session.willMessage.topic} />
              <InfoRow label="QoS" value={session.willMessage.qos.toString()} />
              <InfoRow label="Retain" value={session.willMessage.retain ? 'Yes' : 'No'} />
              <InfoRow label="Payload Size" value={`${session.willMessage.payload.length} bytes`} />
            </Section>
          )}

          {/* Subscriptions */}
          {session.subscriptions.length > 0 && (
            <Section title="Subscriptions">
              <div className="space-y-1">
                {session.subscriptions.map((topic, idx) => (
                  <div key={idx} className="text-sm font-mono text-yellow-400 bg-gray-900 px-2 py-1 rounded">
                    {topic}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Sparkplug State */}
          {session.sparkplugState && (
            <Section title="Sparkplug B State">
              <InfoRow label="Group ID" value={session.sparkplugState.groupId || 'N/A'} />
              <InfoRow label="Edge Node ID" value={session.sparkplugState.edgeNodeId || 'N/A'} />
              {session.sparkplugState.bdSeq !== undefined && (
                <InfoRow label="Birth/Death Seq" value={session.sparkplugState.bdSeq.toString()} />
              )}
              {session.sparkplugState.expectedSeq !== undefined && (
                <InfoRow label="Expected Seq" value={session.sparkplugState.expectedSeq.toString()} />
              )}
              {session.sparkplugState.birthTimestamp && (
                <InfoRow
                  label="Birth Timestamp"
                  value={format(session.sparkplugState.birthTimestamp, 'yyyy-MM-dd HH:mm:ss.SSS')}
                />
              )}
              <InfoRow
                label="NDEATH Published"
                value={session.sparkplugState.ndeathPublished ? 'Yes' : 'No'}
              />
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-400 mb-2">{title}</h4>
      <div className="bg-gray-900 rounded p-3 space-y-1.5">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-400">{label}:</span>
      <span className="text-white font-mono">{value}</span>
    </div>
  );
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getProtocolVersion(version: number): string {
  const versions: Record<number, string> = {
    3: 'MQTT 3.1',
    4: 'MQTT 3.1.1',
    5: 'MQTT 5.0',
  };
  return versions[version] || `Unknown (${version})`;
}
