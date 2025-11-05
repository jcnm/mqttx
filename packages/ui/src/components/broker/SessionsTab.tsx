/**
 * Sessions Tab Component
 * Display active MQTT sessions with client details and statistics
 */

import { useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { useBrokerStore } from '../../stores/brokerStore';

export function SessionsTab() {
  const { sessions, removeSession } = useBrokerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Convert Map to Array and apply search filter
  const sessionsList = useMemo(() => {
    const list = Array.from(sessions.values());
    if (!searchQuery) return list;

    return list.filter((session) =>
      session.clientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.ip.includes(searchQuery)
    );
  }, [sessions, searchQuery]);

  const handleDisconnect = (clientId: string) => {
    if (confirm(`Disconnect client "${clientId}"?`)) {
      removeSession(clientId);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (sessions.size === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">👥</div>
        <p className="text-slate-400">No active sessions</p>
        <p className="text-sm text-slate-500 mt-2">
          Client sessions will appear here when they connect to the broker
        </p>
      </div>
    );
  }

  const selected = selectedSession ? sessions.get(selectedSession) : null;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client ID or IP address..."
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
        <div className="text-sm text-slate-400">
          {sessionsList.length} of {sessions.size} sessions
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sessions List */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {sessionsList.map((session) => (
            <div
              key={session.clientId}
              onClick={() => setSelectedSession(session.clientId)}
              className={`bg-slate-900 rounded-lg border p-4 cursor-pointer transition-all ${
                selectedSession === session.clientId
                  ? 'border-emerald-600 bg-slate-800'
                  : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Client ID */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-semibold text-white font-mono truncate">
                      {session.clientId}
                    </span>
                  </div>

                  {/* IP and Connection Time */}
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      🌐 {session.ip}:{session.port}
                    </span>
                    <span className="flex items-center gap-1">
                      ⏱️ {formatDistanceToNow(session.connectedAt, { addSuffix: true })}
                    </span>
                  </div>

                  {/* Flags */}
                  <div className="flex items-center gap-2 mt-2">
                    {session.cleanSession && (
                      <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded">
                        Clean Session
                      </span>
                    )}
                    {session.subscriptions.length > 0 && (
                      <span className="text-xs bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded">
                        {session.subscriptions.length} subs
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <div className="text-xs text-slate-400">Messages</div>
                  <div className="text-sm font-semibold text-emerald-500">
                    ↓{session.stats.messagesIn} ↑{session.stats.messagesOut}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Session Details Panel */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          {selected ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{selected.clientId}</h3>
                  <p className="text-sm text-slate-400">Session Details</p>
                </div>
                <button
                  onClick={() => handleDisconnect(selected.clientId)}
                  className="px-3 py-1.5 bg-red-900/20 text-red-400 border border-red-800/30 rounded text-xs font-medium hover:bg-red-900/30 transition-colors"
                >
                  Disconnect
                </button>
              </div>

              {/* Connection Info */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Connection
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">IP Address</span>
                    <span className="text-slate-300 font-mono">
                      {selected.ip}:{selected.port}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Connected At</span>
                    <span className="text-slate-300">
                      {format(selected.connectedAt, 'yyyy-MM-dd HH:mm:ss')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration</span>
                    <span className="text-slate-300">
                      {formatDistanceToNow(selected.connectedAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Clean Session</span>
                    <span className={selected.cleanSession ? 'text-green-400' : 'text-red-400'}>
                      {selected.cleanSession ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Session Expiry</span>
                    <span className="text-slate-300">
                      {selected.sessionExpiry === 0
                        ? 'Never'
                        : `${selected.sessionExpiry}s`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Statistics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Messages In</div>
                    <div className="text-lg font-bold text-emerald-500">
                      {selected.stats.messagesIn}
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Messages Out</div>
                    <div className="text-lg font-bold text-blue-500">
                      {selected.stats.messagesOut}
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Bytes In</div>
                    <div className="text-lg font-bold text-emerald-500">
                      {formatBytes(selected.stats.bytesIn)}
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Bytes Out</div>
                    <div className="text-lg font-bold text-blue-500">
                      {formatBytes(selected.stats.bytesOut)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscriptions */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Subscriptions ({selected.subscriptions.length})
                </h4>
                {selected.subscriptions.length === 0 ? (
                  <p className="text-sm text-slate-500">No active subscriptions</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {selected.subscriptions.map((topic, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-800 rounded px-3 py-2 text-xs font-mono text-yellow-400"
                      >
                        {topic}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">👈</div>
              <p className="text-slate-400">Select a session to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
