/**
 * Node Card Component
 * Displays Edge of Network node information with metrics and devices
 */

import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { EoNNode } from '../../types/scada.types';
import { MetricGrid } from './MetricDisplay';
import { DeviceCard } from './DeviceCard';

interface NodeCardProps {
  node: EoNNode;
  onSelect?: () => void;
  expanded?: boolean;
}

export function NodeCard({ node, onSelect, expanded: controlledExpanded }: NodeCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = controlledExpanded ?? internalExpanded;

  // Format timestamps
  const lastUpdate = useMemo(() => {
    if (!node.lastUpdate) return 'Never';
    const date = new Date(Number(node.lastUpdate));
    return formatDistanceToNow(date, { addSuffix: true });
  }, [node.lastUpdate]);

  const birthTime = useMemo(() => {
    const date = new Date(Number(node.birthTimestamp));
    return date.toLocaleString();
  }, [node.birthTimestamp]);

  // Get top metrics
  const topMetrics = useMemo(() => {
    const metrics = Array.from(node.metrics.entries()).slice(0, 3);
    return new Map(metrics);
  }, [node.metrics]);

  const handleCardClick = () => {
    if (controlledExpanded === undefined) {
      setInternalExpanded(!expanded);
    }
    if (onSelect) {
      onSelect();
    }
  };

  return (
    <div
      className={`bg-slate-800 rounded-lg border-2 transition-all duration-200 ${
        node.online
          ? 'border-emerald-600 hover:border-emerald-500 shadow-emerald-900/20 shadow-lg'
          : 'border-red-600 hover:border-red-500 opacity-75'
      }`}
    >
      {/* Header - Always Visible */}
      <div
        onClick={handleCardClick}
        className="p-4 cursor-pointer hover:bg-slate-750 transition-colors"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white truncate">
                {node.edgeNodeId}
              </h3>
              <span
                className={`w-3 h-3 rounded-full ${
                  node.online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`}
              />
            </div>
            <p className="text-sm text-slate-400 truncate">
              Group: {node.groupId}
            </p>
          </div>

          {/* Protocol Tag */}
          <span className="px-2 py-1 text-xs font-semibold text-white bg-emerald-700 rounded">
            Sparkplug B
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="bg-slate-900 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-400">Devices</p>
            <p className="text-lg font-bold text-white">{node.devices.length}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-400">Metrics</p>
            <p className="text-lg font-bold text-white">{node.metrics.size}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-400">Seq</p>
            <p className="text-lg font-bold text-white">{node.seq.toString()}</p>
          </div>
        </div>

        {/* Quick Info */}
        <div className="space-y-1 text-xs text-slate-400">
          <div className="flex justify-between">
            <span>bdSeq:</span>
            <span className="font-mono text-slate-300">{node.bdSeq.toString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Last Update:</span>
            <span className="text-slate-300">{lastUpdate}</span>
          </div>
        </div>

        {/* Expand Indicator */}
        <div className="flex justify-center mt-3 pt-3 border-t border-slate-700">
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-700 space-y-4">
          {/* Birth Certificate Info */}
          <div className="bg-slate-900 rounded-lg p-3 space-y-2">
            <h4 className="text-sm font-semibold text-white">Birth Certificate</h4>
            <div className="space-y-1 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Birth Time:</span>
                <span className="text-slate-300">{birthTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Birth Sequence:</span>
                <span className="font-mono text-slate-300">{node.bdSeq.toString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Sequence:</span>
                <span className="font-mono text-slate-300">{node.seq.toString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span
                  className={`font-semibold ${
                    node.online ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {node.online ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>

          {/* Top Metrics */}
          {topMetrics.size > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-white">Key Metrics</h4>
                {node.metrics.size > 3 && (
                  <span className="text-xs text-slate-400">
                    Showing 3 of {node.metrics.size}
                  </span>
                )}
              </div>
              <MetricGrid metrics={topMetrics} compact />
            </div>
          )}

          {/* Devices List */}
          {node.devices.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">
                Devices ({node.devices.length})
              </h4>
              <div className="space-y-2">
                {node.devices.map((device) => (
                  <DeviceCard key={device.deviceId} device={device} compact />
                ))}
              </div>
            </div>
          )}

          {/* View Details Button */}
          {onSelect && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              View Full Details
            </button>
          )}
        </div>
      )}
    </div>
  );
}
