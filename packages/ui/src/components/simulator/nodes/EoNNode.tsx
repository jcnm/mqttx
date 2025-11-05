/**
 * EoN Node Component
 * Custom ReactFlow node for Edge of Network nodes
 */

import { memo, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { EoNNodeData } from '../../../types/simulator.types';

interface EoNNodeProps {
  data: EoNNodeData;
  selected?: boolean;
}

export const EoNNode = memo(({ data, selected }: EoNNodeProps) => {
  const getStatusColor = useCallback(() => {
    switch (data.state) {
      case 'running':
        return 'border-emerald-500 bg-emerald-500/10';
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
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
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
    return data.config.protocol === 'SparkplugB'
      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }, [data.config.protocol]);

  return (
    <div
      className={`
        relative min-w-[280px] rounded-lg border-2 transition-all
        ${getStatusColor()}
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950' : ''}
        ${data.state === 'running' ? 'shadow-lg shadow-emerald-500/20' : ''}
      `}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-900/80 rounded-t-lg">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon()}
              <h3 className="text-sm font-semibold text-white truncate">
                {data.config.edgeNodeId}
              </h3>
            </div>
            <p className="text-xs text-slate-400 truncate">
              Group: {data.config.groupId}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span
            className={`px-2 py-0.5 text-[10px] font-medium rounded border ${getProtocolBadgeColor()}`}
          >
            {data.config.protocol}
          </span>
          {data.deviceCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded border bg-slate-700/30 text-slate-300 border-slate-600/50">
              {data.deviceCount} {data.deviceCount === 1 ? 'Device' : 'Devices'}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 bg-slate-900/60">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-slate-500 mb-0.5">bdSeq Strategy</p>
            <p className="text-slate-300 font-medium">
              {data.config.sparkplugConfig.bdSeqStrategy}
            </p>
          </div>
          <div>
            <p className="text-slate-500 mb-0.5">Rebirth Timeout</p>
            <p className="text-slate-300 font-medium">
              {data.config.sparkplugConfig.rebirthTimeout}s
            </p>
          </div>
          <div>
            <p className="text-slate-500 mb-0.5">QoS</p>
            <p className="text-slate-300 font-medium">{data.config.network.qos}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-0.5">Clean Session</p>
            <p className="text-slate-300 font-medium">
              {data.config.network.cleanSession ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-3 h-3 !bg-emerald-500 !border-2 !border-emerald-300"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 !bg-emerald-500 !border-2 !border-emerald-300"
      />
    </div>
  );
});

EoNNode.displayName = 'EoNNode';
