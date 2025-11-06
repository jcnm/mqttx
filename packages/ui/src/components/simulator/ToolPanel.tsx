/**
 * Tool Panel - Left Retractable Panel
 * Contains templates, tools, and node creation options for drag & drop
 */

import { useState } from 'react';
import type { NodeTemplate } from '../../types/simulator.types';

interface ToolPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  templates: NodeTemplate[];
  onDragStart: (event: React.DragEvent<HTMLDivElement>, type: string, data?: any) => void;
}

export function ToolPanel({ isOpen, onToggle, templates, onDragStart }: ToolPanelProps) {
  const [activeTab, setActiveTab] = useState<'nodes' | 'templates' | 'devices'>('nodes');

  // Basic node types that can be dragged to canvas
  const nodeTypes = [
    {
      type: 'eon',
      label: 'Edge of Network Node',
      icon: '🔷',
      description: 'Primary Sparkplug B edge node',
      color: 'bg-blue-600',
    },
    {
      type: 'device',
      label: 'Device',
      icon: '📟',
      description: 'Sparkplug B device attached to EoN',
      color: 'bg-purple-600',
    },
    {
      type: 'sensor',
      label: 'Sensor',
      icon: '🌡️',
      description: 'Temperature, pressure, flow sensor',
      color: 'bg-green-600',
    },
    {
      type: 'actuator',
      label: 'Actuator',
      icon: '⚡',
      description: 'Motor, valve, relay control',
      color: 'bg-orange-600',
    },
    {
      type: 'controller',
      label: 'PLC/Controller',
      icon: '🖥️',
      description: 'Programmable logic controller',
      color: 'bg-cyan-600',
    },
  ];

  const deviceTypes = [
    {
      type: 'analog-input',
      label: 'Analog Input',
      icon: '📈',
      metrics: ['value', 'unit', 'min', 'max'],
    },
    {
      type: 'digital-input',
      label: 'Digital Input',
      icon: '🔘',
      metrics: ['state'],
    },
    {
      type: 'analog-output',
      label: 'Analog Output',
      icon: '📉',
      metrics: ['setpoint', 'feedback', 'unit'],
    },
    {
      type: 'digital-output',
      label: 'Digital Output',
      icon: '💡',
      metrics: ['command', 'state'],
    },
  ];

  return (
    <div className="relative flex">
      {/* Panel - slides in/out */}
      <div
        className={`
          w-80 bg-slate-900 border-r border-slate-700
          transition-all duration-300 ease-in-out
          flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-80'}
        `}
        style={{ marginLeft: isOpen ? 0 : -320 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white mb-1">Plant Designer</h2>
          <p className="text-xs text-slate-400">Drag & drop to canvas</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {[
            { id: 'nodes' as const, label: 'Nodes', icon: '🔷' },
            { id: 'devices' as const, label: 'Devices', icon: '📟' },
            { id: 'templates' as const, label: 'Templates', icon: '📋' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-colors
                ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white border-b-2 border-emerald-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Nodes Tab */}
          {activeTab === 'nodes' && (
            <>
              <p className="text-xs text-slate-400 mb-3">
                Drag node types to canvas to create new instances
              </p>
              {nodeTypes.map((node) => (
                <div
                  key={node.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, 'create-node', { nodeType: node.type })}
                  className={`
                    ${node.color} bg-opacity-20 border border-opacity-50
                    hover:bg-opacity-30 cursor-grab active:cursor-grabbing
                    rounded-lg p-3 transition-all
                    border-current
                  `}
                  style={{
                    borderColor: node.color.replace('bg-', '').replace('-600', ''),
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{node.icon}</span>
                    <span className="font-semibold text-white text-sm">{node.label}</span>
                  </div>
                  <p className="text-xs text-slate-300 ml-9">{node.description}</p>
                </div>
              ))}
            </>
          )}

          {/* Devices Tab */}
          {activeTab === 'devices' && (
            <>
              <p className="text-xs text-slate-400 mb-3">
                Drag device types to add to existing nodes
              </p>
              {deviceTypes.map((device) => (
                <div
                  key={device.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, 'create-device', { deviceType: device.type })}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{device.icon}</span>
                    <span className="font-medium text-white text-sm">{device.label}</span>
                  </div>
                  <div className="ml-7">
                    <p className="text-xs text-slate-400 mb-1">Metrics:</p>
                    <div className="flex flex-wrap gap-1">
                      {device.metrics.map((metric) => (
                        <span
                          key={metric}
                          className="px-1.5 py-0.5 bg-slate-900 text-slate-300 rounded text-xs"
                        >
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-400">Saved plant configurations</p>
                <button className="text-xs text-emerald-500 hover:text-emerald-400">
                  + New
                </button>
              </div>

              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm mb-2">No templates yet</p>
                  <p className="text-xs text-slate-600">
                    Select nodes on canvas and click "Save as Template"
                  </p>
                </div>
              ) : (
                templates.map((template) => (
                  <div
                    key={template.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, 'load-template', { template })}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white text-sm">{template.name}</span>
                      <span className="text-xs text-slate-400">
                        {Array.isArray(template.config) ? `${template.config.length} nodes` : '1 node'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{template.description}</p>
                    {template.category && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-blue-900/50 text-blue-400 rounded text-xs">
                        {template.category}
                      </span>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Footer - Quick Actions */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          <button
            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
            onClick={() => {
              /* Create template from selection */
            }}
          >
            💾 Save Selection as Template
          </button>
          <button
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            onClick={() => {
              /* Clear canvas */
            }}
          >
            🗑️ Clear Canvas
          </button>
        </div>
      </div>

      {/* Toggle Button - positioned at the edge of the panel */}
      <button
        onClick={onToggle}
        className="absolute -right-8 top-1/2 -translate-y-1/2 bg-slate-800 hover:bg-slate-700 text-white px-2 py-4 rounded-r-lg border border-l-0 border-slate-600 transition-colors z-10"
        title={isOpen ? 'Close panel' : 'Open tools'}
      >
        {isOpen ? '◀' : '▶'}
      </button>
    </div>
  );
}
