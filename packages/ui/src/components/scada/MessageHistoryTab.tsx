/**
 * Message History Tab Component
 * Displays message history for a selected node or device in SCADA view
 * with inspection capabilities similar to broker LinearView
 */

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { MessageDetailPopover } from '../common/MessageDetailPopover';
import type { BrokerLog } from '../../types/broker.types';

interface MessageHistoryTabProps {
  logs: BrokerLog[];
  entityType: 'node' | 'device';
}

export function MessageHistoryTab({ logs, entityType }: MessageHistoryTabProps) {
  const [selectedLog, setSelectedLog] = useState<BrokerLog | null>(null);
  const [selectedMessageNumber, setSelectedMessageNumber] = useState<number | undefined>();
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');

  // Filter logs by direction
  const filteredLogs = useMemo(() => {
    if (filter === 'all') return logs;

    return logs.filter((log) => {
      const messageType = log.messageType;
      if (!messageType) return false;

      if (filter === 'sent') {
        // Sent messages: BIRTH, DATA, DEATH
        return ['NBIRTH', 'NDATA', 'NDEATH', 'DBIRTH', 'DDATA', 'DDEATH'].includes(messageType);
      } else if (filter === 'received') {
        // Received messages: CMD
        return ['NCMD', 'DCMD'].includes(messageType);
      }

      return true;
    });
  }, [logs, filter]);

  // Stats
  const stats = useMemo(() => {
    const sent = logs.filter((log) => {
      const mt = log.messageType;
      return mt && ['NBIRTH', 'NDATA', 'NDEATH', 'DBIRTH', 'DDATA', 'DDEATH'].includes(mt);
    }).length;

    const received = logs.filter((log) => {
      const mt = log.messageType;
      return mt && ['NCMD', 'DCMD'].includes(mt);
    }).length;

    return { total: logs.length, sent, received };
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Messages</h3>
        <p className="text-slate-400">
          No MQTT messages recorded for this {entityType} yet
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Messages will appear here as they are sent or received
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="text-xs text-slate-400 mb-1">Total</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-emerald-900/20 rounded-lg p-3 border border-emerald-700">
          <div className="text-xs text-emerald-400 mb-1">Sent</div>
          <div className="text-2xl font-bold text-emerald-400">{stats.sent}</div>
        </div>
        <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-700">
          <div className="text-xs text-purple-400 mb-1">Received</div>
          <div className="text-2xl font-bold text-purple-400">{stats.received}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">Filter:</span>
        {(['all', 'sent', 'received'] as const).map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              filter === filterType
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {filterType === 'all' && '📋 All'}
            {filterType === 'sent' && '📤 Sent Only'}
            {filterType === 'received' && '📥 Received Only'}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No messages match the current filter</p>
          </div>
        ) : (
          filteredLogs.slice().reverse().map((log, index) => {
            const messageNumber = filteredLogs.length - index;
            const isReceived = log.messageType && ['NCMD', 'DCMD'].includes(log.messageType);

            return (
              <div
                key={log.id}
                className="bg-slate-800/50 rounded-lg border border-slate-700 hover:border-blue-600 cursor-pointer transition-all p-3"
                onClick={() => {
                  setSelectedLog(log);
                  setSelectedMessageNumber(messageNumber);
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Message Number & Icon */}
                  <div className="flex flex-col items-center">
                    <span className="text-2xl">{isReceived ? '📥' : '📤'}</span>
                    <span className="text-xs font-mono text-blue-400 font-semibold">
                      #{messageNumber}
                    </span>
                  </div>

                  {/* Message Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500">
                        {format(log.timestamp, 'HH:mm:ss.SSS')}
                      </span>
                      {log.messageType && (
                        <MessageTypeBadge messageType={log.messageType} />
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
                    <div className="text-sm text-slate-300 font-mono truncate">
                      {log.topic}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-blue-400 hover:text-blue-300">
                      🔍 Inspect
                    </span>
                    <span className="text-xs text-slate-600">
                      {log.payload?.length || 0} bytes
                    </span>
                  </div>
                </div>
              </div>
            );
          })
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

function MessageTypeBadge({ messageType }: { messageType: string }) {
  const colors: Record<string, string> = {
    NBIRTH: 'bg-green-900/30 text-green-400 border-green-700',
    NDATA: 'bg-blue-900/30 text-blue-400 border-blue-700',
    NDEATH: 'bg-red-900/30 text-red-400 border-red-700',
    DBIRTH: 'bg-emerald-900/30 text-emerald-400 border-emerald-700',
    DDATA: 'bg-cyan-900/30 text-cyan-400 border-cyan-700',
    DDEATH: 'bg-pink-900/30 text-pink-400 border-pink-700',
    NCMD: 'bg-purple-900/30 text-purple-400 border-purple-700',
    DCMD: 'bg-violet-900/30 text-violet-400 border-violet-700',
    STATE: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded border font-semibold ${
        colors[messageType] || 'bg-slate-800 text-slate-400 border-slate-700'
      }`}
    >
      {messageType}
    </span>
  );
}
