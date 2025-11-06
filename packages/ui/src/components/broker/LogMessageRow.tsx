/**
 * Log Message Row Component
 * Expandable row showing decoded Sparkplug payload with syntax highlighting
 */

import { useState } from 'react';
import { format } from 'date-fns';
import type { BrokerLog } from '../../types/broker.types';
import { MessageInspector } from './MessageInspector';

interface LogMessageRowProps {
  log: BrokerLog;
}

export function LogMessageRow({ log }: LogMessageRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showInspector, setShowInspector] = useState(false);

  const handleCopy = async () => {
    const text = log.decoded
      ? JSON.stringify(log.decoded, null, 2)
      : log.payload
        ? new TextDecoder().decode(log.payload)
        : '';

    await navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      publish: 'text-emerald-500',
      subscribe: 'text-blue-500',
      unsubscribe: 'text-orange-500',
      connect: 'text-green-500',
      disconnect: 'text-red-500',
    };
    return colors[type] || 'text-slate-400';
  };

  const getMessageTypeColor = (msgType?: string) => {
    if (!msgType) return '';

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

    return colors[msgType] || 'bg-slate-800 text-slate-400 border-slate-700';
  };

  const formatPayloadSize = (size?: number) => {
    if (!size) return null;
    return size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} B`;
  };

  return (
    <>
      {showInspector && (
        <MessageInspector log={log} onClose={() => setShowInspector(false)} />
      )}

      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
        {/* Row Header */}
        <div
          className="p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
        <div className="flex items-start justify-between gap-4">
          {/* Left: Main Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Timestamp */}
              <span className="text-xs text-slate-400 font-mono">
                {format(log.timestamp, 'HH:mm:ss.SSS')}
              </span>

              {/* Type */}
              <span className={`text-xs font-semibold uppercase ${getTypeColor(log.type)}`}>
                {log.type}
              </span>

              {/* Message Type */}
              {log.messageType && (
                <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${getMessageTypeColor(log.messageType)}`}>
                  {log.messageType}
                </span>
              )}

              {/* QoS */}
              {log.qos !== undefined && (
                <span className="text-xs text-slate-500">QoS {log.qos}</span>
              )}

              {/* Retain */}
              {log.retain && (
                <span className="text-xs bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded">
                  RETAIN
                </span>
              )}
            </div>

            {/* Client ID and Topic */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-blue-400 font-mono">{log.clientId}</span>
              {log.topic && (
                <>
                  <span className="text-slate-600">→</span>
                  <span className="text-yellow-400 font-mono truncate">{log.topic}</span>
                </>
              )}
            </div>
          </div>

          {/* Right: Metadata */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {log.payload && (
              <span>{formatPayloadSize(log.payload.length)}</span>
            )}
            <span>{log.origin.ip}:{log.origin.port}</span>
            <span className="text-slate-600">{isExpanded ? '▼' : '▶'}</span>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-800 p-4 bg-slate-950">
          <div className="space-y-3">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <div className="text-slate-500 mb-1">Full Timestamp</div>
                <div className="text-slate-300 font-mono">
                  {format(log.timestamp, 'yyyy-MM-dd HH:mm:ss.SSS')}
                </div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Origin</div>
                <div className="text-slate-300 font-mono">
                  {log.origin.ip}:{log.origin.port}
                </div>
              </div>
              {log.qos !== undefined && (
                <div>
                  <div className="text-slate-500 mb-1">Quality of Service</div>
                  <div className="text-slate-300">QoS {log.qos}</div>
                </div>
              )}
              {log.retain !== undefined && (
                <div>
                  <div className="text-slate-500 mb-1">Retain Flag</div>
                  <div className="text-slate-300">{log.retain ? 'Yes' : 'No'}</div>
                </div>
              )}
            </div>

            {/* Payload Section */}
            {log.payload && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-400">
                      {log.decoded ? 'Decoded Sparkplug Payload' : 'Raw Payload'}
                    </span>
                    {log.decoded && (
                      <span className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded">
                        Sparkplug B
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInspector(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      🔍 Deep Inspect
                    </button>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                    >
                      {copySuccess ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>
                </div>

                <pre className="text-xs text-slate-300 bg-slate-900 rounded-lg p-4 overflow-x-auto font-mono max-h-96 overflow-y-auto border border-slate-800">
                  {log.decoded
                    ? JSON.stringify(log.decoded, null, 2)
                    : new TextDecoder().decode(log.payload)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </>
  );
}
