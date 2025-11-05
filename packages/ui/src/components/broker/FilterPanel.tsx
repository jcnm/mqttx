/**
 * Filter Panel Component
 * Reusable filter panel for logs with topic pattern, message type, QoS, and time range
 */

import { useState } from 'react';
import type { LogFilter, MessageType } from '../../types/broker.types';

interface FilterPanelProps {
  filter: LogFilter;
  onFilterChange: (filter: Partial<LogFilter>) => void;
  onClearFilters: () => void;
}

export function FilterPanel({ filter, onFilterChange, onClearFilters }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const messageTypes: MessageType[] = [
    'NBIRTH',
    'NDATA',
    'NDEATH',
    'DBIRTH',
    'DDATA',
    'DDEATH',
    'NCMD',
    'DCMD',
    'STATE',
  ];

  const hasActiveFilters =
    filter.clientId || filter.topic || filter.messageType || filter.qos !== undefined || filter.timeRange;

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🔍</span>
          <span className="text-sm font-semibold text-slate-200">Filters</span>
          {hasActiveFilters && (
            <span className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </div>
        <span className="text-slate-400 text-sm">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {/* Filter Controls */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-slate-800">
          {/* Client ID Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Client ID</label>
            <input
              type="text"
              value={filter.clientId || ''}
              onChange={(e) => onFilterChange({ clientId: e.target.value || undefined })}
              placeholder="Filter by client ID..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Topic Pattern Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Topic Pattern
              <span className="text-slate-500 ml-2">(supports wildcards: + and #)</span>
            </label>
            <input
              type="text"
              value={filter.topic || ''}
              onChange={(e) => onFilterChange({ topic: e.target.value || undefined })}
              placeholder="e.g., spBv1.0/+/NDATA/#"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
            />
          </div>

          {/* Message Type Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Message Type</label>
            <div className="grid grid-cols-3 gap-2">
              {messageTypes.map((type) => (
                <button
                  key={type}
                  onClick={() =>
                    onFilterChange({
                      messageType: filter.messageType === type ? undefined : type,
                    })
                  }
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    filter.messageType === type
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* QoS Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">QoS Level</label>
            <div className="flex gap-2">
              {[0, 1, 2].map((qos) => (
                <button
                  key={qos}
                  onClick={() =>
                    onFilterChange({
                      qos: filter.qos === qos ? undefined : (qos as 0 | 1 | 2),
                    })
                  }
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    filter.qos === qos
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                  }`}
                >
                  QoS {qos}
                </button>
              ))}
            </div>
          </div>

          {/* Time Range Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Time Range</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">From</label>
                <input
                  type="datetime-local"
                  value={
                    filter.timeRange?.start
                      ? new Date(filter.timeRange.start).toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={(e) => {
                    const start = e.target.value ? new Date(e.target.value).getTime() : undefined;
                    onFilterChange({
                      timeRange: start
                        ? { start, end: filter.timeRange?.end || Date.now() }
                        : undefined,
                    });
                  }}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">To</label>
                <input
                  type="datetime-local"
                  value={
                    filter.timeRange?.end
                      ? new Date(filter.timeRange.end).toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={(e) => {
                    const end = e.target.value ? new Date(e.target.value).getTime() : undefined;
                    onFilterChange({
                      timeRange: end
                        ? { start: filter.timeRange?.start || 0, end }
                        : undefined,
                    });
                  }}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="w-full px-4 py-2 bg-red-900/20 text-red-400 border border-red-800/30 rounded hover:bg-red-900/30 transition-colors text-sm font-medium"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
