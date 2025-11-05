/**
 * Logs Tab Component
 * Display real-time broker logs with filtering and visualization modes
 */

import { useMemo, useState } from 'react';
import { useBrokerStore } from '../../stores/brokerStore';
import { FilterPanel } from './FilterPanel';
import { ExportButton } from './ExportButton';
import { LinearView } from './visualizations/LinearView';
import { TimeseriesView } from './visualizations/TimeseriesView';
import { GraphView } from './visualizations/GraphView';
import { TreeView } from './visualizations/TreeView';

// Helper function to match topic patterns (+ and # wildcards)
function matchesTopic(topic: string, pattern: string): boolean {
  const topicParts = topic.split('/');
  const patternParts = pattern.split('/');

  let tIdx = 0;
  let pIdx = 0;

  while (tIdx < topicParts.length && pIdx < patternParts.length) {
    const patternPart = patternParts[pIdx];

    if (patternPart === '#') {
      // # matches all remaining levels
      return true;
    } else if (patternPart === '+') {
      // + matches exactly one level
      tIdx++;
      pIdx++;
    } else if (patternPart === topicParts[tIdx]) {
      // Exact match
      tIdx++;
      pIdx++;
    } else {
      return false;
    }
  }

  // Both must be exhausted for a match (unless pattern ends with #)
  return tIdx === topicParts.length && (pIdx === patternParts.length || patternParts[pIdx] === '#');
}

export function LogsTab() {
  const { logs, filter, setFilter, visualizationMode, setVisualizationMode, clearLogs } = useBrokerStore();
  const [autoScroll, setAutoScroll] = useState(true);
  const [decodeSparkplug, setDecodeSparkplug] = useState(true);

  // Apply filters to logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Client ID filter
      if (filter.clientId && !log.clientId.toLowerCase().includes(filter.clientId.toLowerCase())) {
        return false;
      }

      // Topic pattern filter
      if (filter.topic && log.topic) {
        if (!matchesTopic(log.topic, filter.topic)) {
          return false;
        }
      }

      // Message type filter
      if (filter.messageType && log.messageType !== filter.messageType) {
        return false;
      }

      // QoS filter
      if (filter.qos !== undefined && log.qos !== filter.qos) {
        return false;
      }

      // Time range filter
      if (filter.timeRange) {
        if (log.timestamp < filter.timeRange.start || log.timestamp > filter.timeRange.end) {
          return false;
        }
      }

      return true;
    });
  }, [logs, filter]);

  const handleClearFilters = () => {
    setFilter({
      clientId: undefined,
      topic: undefined,
      messageType: undefined,
      qos: undefined,
      timeRange: undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Settings */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-emerald-600 focus:ring-offset-slate-900"
            />
            Auto-scroll
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={decodeSparkplug}
              onChange={(e) => setDecodeSparkplug(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-emerald-600 focus:ring-offset-slate-900"
            />
            Decode Sparkplug
          </label>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-red-900/20 text-red-400 border border-red-800/30 rounded-lg text-sm font-medium hover:bg-red-900/30 transition-colors"
          >
            Clear Logs
          </button>

          <ExportButton data={filteredLogs} filename="broker-logs" />
        </div>
      </div>

      {/* Visualization Mode Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">View:</span>
        {[
          { id: 'linear', label: 'Linear', icon: '📋' },
          { id: 'timeseries', label: 'Timeseries', icon: '📈' },
          { id: 'graph', label: 'Graph', icon: '🕸️' },
          { id: 'tree', label: 'Tree', icon: '🌳' },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setVisualizationMode(mode.id as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              visualizationMode === mode.id
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
          >
            <span>{mode.icon}</span>
            {mode.label}
          </button>
        ))}
      </div>

      {/* Filter Panel */}
      <FilterPanel filter={filter} onFilterChange={setFilter} onClearFilters={handleClearFilters} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Total Logs</p>
          <p className="text-xl font-bold text-white">{logs.length}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Filtered</p>
          <p className="text-xl font-bold text-emerald-500">{filteredLogs.length}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Unique Topics</p>
          <p className="text-xl font-bold text-yellow-500">
            {new Set(filteredLogs.map((log) => log.topic).filter(Boolean)).size}
          </p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Unique Clients</p>
          <p className="text-xl font-bold text-blue-500">
            {new Set(filteredLogs.map((log) => log.clientId)).size}
          </p>
        </div>
      </div>

      {/* Visualization Content */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-slate-400">No messages logged yet</p>
            <p className="text-sm text-slate-500 mt-2">
              {logs.length > 0
                ? 'Try adjusting your filters to see more results'
                : 'Messages will appear here as they flow through the broker'}
            </p>
          </div>
        ) : (
          <>
            {visualizationMode === 'linear' && <LinearView logs={filteredLogs} />}
            {visualizationMode === 'timeseries' && <TimeseriesView logs={filteredLogs} />}
            {visualizationMode === 'graph' && <GraphView logs={filteredLogs} />}
            {visualizationMode === 'tree' && <TreeView logs={filteredLogs} />}
          </>
        )}
      </div>
    </div>
  );
}
