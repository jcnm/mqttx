/**
 * Device Node Component
 * Custom ReactFlow node for device nodes
 */

import { memo, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { DeviceNodeData } from '../../../types/simulator.types';

interface DeviceNodeProps {
  data: DeviceNodeData;
  selected?: boolean;
}

export const DeviceNode = memo(({ data, selected }: DeviceNodeProps) => {
  const getStatusColor = useCallback(() => {
    switch (data.state) {
      case 'running':
        return 'border-blue-500 bg-blue-500/10';
      case 'paused':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'error':
        return 'border-red-500 bg-red-500/10';
      default:
        return 'border-slate-600 bg-slate-800/50';
    }
  }, [data.state]);

  const getStatusIcon = useCallback(() => {
    switch (data.state) {
      case 'running':
        return (
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
          </div>
        );
      case 'paused':
        return <div className="w-2 h-2 rounded-full bg-yellow-500"></div>;
      case 'error':
        return <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>;
      default:
        return <div className="w-2 h-2 rounded-full bg-slate-500"></div>;
    }
  }, [data.state]);

  const getProtocolBadgeColor = useCallback(() => {
    return data.protocol === 'SparkplugB'
      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }, [data.protocol]);

  return (
    <div
      className={`
        relative min-w-[240px] rounded-lg border-2 transition-all
        ${getStatusColor()}
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950' : ''}
        ${data.state === 'running' ? 'shadow-lg shadow-blue-500/20' : ''}
      `}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-900/80 rounded-t-lg">
        <div className="flex items-center gap-2 mb-2">
          {getStatusIcon()}
          <h3 className="text-sm font-semibold text-white truncate flex-1">
            {data.deviceId}
          </h3>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`px-2 py-0.5 text-[10px] font-medium rounded border ${getProtocolBadgeColor()}`}
          >
            {data.protocol}
          </span>
          {data.metricCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded border bg-slate-700/30 text-slate-300 border-slate-600/50">
              {data.metricCount} {data.metricCount === 1 ? 'Metric' : 'Metrics'}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 bg-slate-900/60">
        <div className="text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Status</span>
            <span className="text-slate-300 font-medium capitalize">{data.state}</span>
          </div>
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-3 h-3 !bg-blue-500 !border-2 !border-blue-300"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 !bg-blue-500 !border-2 !border-blue-300"
      />
    </div>
  );
});

DeviceNode.displayName = 'DeviceNode';
