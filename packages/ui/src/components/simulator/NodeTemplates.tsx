/**
 * Node Templates Component
 * Pre-built templates for quick setup
 */

import { useState } from 'react';
import type { SimulatedEoN } from '../../types/simulator.types';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  nodeCount: number;
  deviceCount: number;
  metricCount: number;
  category: 'sensor' | 'controller' | 'gateway' | 'system';
  config: Partial<SimulatedEoN>[];
}

const TEMPLATES: Template[] = [
  {
    id: 'temp-sensor',
    name: 'Simple Temperature Sensor',
    description: '1 EoN node with a single temperature sensor device',
    icon: '🌡️',
    nodeCount: 1,
    deviceCount: 1,
    metricCount: 1,
    category: 'sensor',
    config: [
      {
        config: {
          groupId: 'Group1',
          edgeNodeId: 'TempSensor01',
          protocol: 'SparkplugB',
          sparkplugConfig: {
            bdSeqStrategy: 'sequential',
            rebirthTimeout: 60,
          },
          lifecycle: {
            autoReconnect: true,
            reconnectDelay: 5000,
          },
          network: {
            qos: 1,
            cleanSession: true,
          },
          persistence: {
            enabled: false,
          },
        },
        devices: [],
        metrics: [
          {
            name: 'Temperature',
            datatype: 9,
            value: 20,
            properties: {
              engineeringUnits: '°C',
              min: -40,
              max: 125,
            },
            logic: {
              type: 'sine',
              params: {
                amplitude: 10,
                frequency: 0.05,
                min: 15,
                max: 35,
              },
            },
          },
        ],
      },
    ],
  },
  {
    id: 'motor-controller',
    name: 'Motor Controller',
    description: '1 EoN with motor device (speed, torque, status)',
    icon: '⚙️',
    nodeCount: 1,
    deviceCount: 1,
    metricCount: 3,
    category: 'controller',
    config: [
      {
        config: {
          groupId: 'Group1',
          edgeNodeId: 'MotorController01',
          protocol: 'SparkplugB',
          sparkplugConfig: {
            bdSeqStrategy: 'sequential',
            rebirthTimeout: 60,
          },
          lifecycle: {
            autoReconnect: true,
            reconnectDelay: 5000,
          },
          network: {
            qos: 1,
            cleanSession: true,
          },
          persistence: {
            enabled: false,
          },
        },
        devices: [],
        metrics: [
          {
            name: 'Speed',
            datatype: 9,
            value: 1500,
            properties: {
              engineeringUnits: 'RPM',
              min: 0,
              max: 3000,
            },
            logic: {
              type: 'sine',
              params: {
                amplitude: 500,
                frequency: 0.1,
                min: 1000,
                max: 2000,
              },
            },
          },
          {
            name: 'Torque',
            datatype: 9,
            value: 50,
            properties: {
              engineeringUnits: 'Nm',
              min: 0,
              max: 100,
            },
            logic: {
              type: 'random',
              params: {
                min: 40,
                max: 60,
              },
            },
          },
          {
            name: 'Status',
            datatype: 11,
            value: true,
            logic: {
              type: 'static',
              params: {
                value: 1,
              },
            },
          },
        ],
      },
    ],
  },
  {
    id: 'gateway-sensors',
    name: 'Gateway with Sensors',
    description: '1 EoN + 3 devices: temperature, pressure, flow',
    icon: '🌐',
    nodeCount: 1,
    deviceCount: 3,
    metricCount: 3,
    category: 'gateway',
    config: [
      {
        config: {
          groupId: 'Group1',
          edgeNodeId: 'Gateway01',
          protocol: 'SparkplugB',
          sparkplugConfig: {
            bdSeqStrategy: 'sequential',
            rebirthTimeout: 60,
          },
          lifecycle: {
            autoReconnect: true,
            reconnectDelay: 5000,
          },
          network: {
            qos: 1,
            cleanSession: true,
          },
          persistence: {
            enabled: false,
          },
        },
        devices: [],
        metrics: [
          {
            name: 'Temperature',
            datatype: 9,
            value: 22,
            properties: {
              engineeringUnits: '°C',
              min: -20,
              max: 80,
            },
            logic: {
              type: 'sine',
              params: {
                amplitude: 5,
                frequency: 0.05,
              },
            },
          },
          {
            name: 'Pressure',
            datatype: 9,
            value: 101.325,
            properties: {
              engineeringUnits: 'kPa',
              min: 80,
              max: 120,
            },
            logic: {
              type: 'random',
              params: {
                min: 95,
                max: 105,
              },
            },
          },
          {
            name: 'Flow',
            datatype: 9,
            value: 50,
            properties: {
              engineeringUnits: 'L/min',
              min: 0,
              max: 100,
            },
            logic: {
              type: 'linear',
              params: {
                value: 40,
                slope: 0.5,
              },
            },
          },
        ],
      },
    ],
  },
  {
    id: 'industrial-robot',
    name: 'Industrial Robot',
    description: '1 EoN with robot device (position, velocity, state)',
    icon: '🤖',
    nodeCount: 1,
    deviceCount: 1,
    metricCount: 3,
    category: 'controller',
    config: [
      {
        config: {
          groupId: 'Group1',
          edgeNodeId: 'Robot01',
          protocol: 'SparkplugB',
          sparkplugConfig: {
            bdSeqStrategy: 'sequential',
            rebirthTimeout: 60,
          },
          lifecycle: {
            autoReconnect: true,
            reconnectDelay: 5000,
          },
          network: {
            qos: 1,
            cleanSession: true,
          },
          persistence: {
            enabled: false,
          },
        },
        devices: [],
        metrics: [
          {
            name: 'PositionX',
            datatype: 9,
            value: 0,
            properties: {
              engineeringUnits: 'mm',
              min: -1000,
              max: 1000,
            },
            logic: {
              type: 'sine',
              params: {
                amplitude: 500,
                frequency: 0.2,
              },
            },
          },
          {
            name: 'PositionY',
            datatype: 9,
            value: 0,
            properties: {
              engineeringUnits: 'mm',
              min: -1000,
              max: 1000,
            },
            logic: {
              type: 'formula',
              params: {
                formula: 'Math.cos(t * 0.2) * 500',
              },
            },
          },
          {
            name: 'State',
            datatype: 12,
            value: 'IDLE',
            logic: {
              type: 'static',
              params: {
                value: 0,
              },
            },
          },
        ],
      },
    ],
  },
  {
    id: 'hvac-system',
    name: 'HVAC System',
    description: '1 EoN + 4 metrics: temp, humidity, fan speed, compressor',
    icon: '❄️',
    nodeCount: 1,
    deviceCount: 1,
    metricCount: 4,
    category: 'system',
    config: [
      {
        config: {
          groupId: 'Group1',
          edgeNodeId: 'HVAC01',
          protocol: 'SparkplugB',
          sparkplugConfig: {
            bdSeqStrategy: 'sequential',
            rebirthTimeout: 60,
          },
          lifecycle: {
            autoReconnect: true,
            reconnectDelay: 5000,
          },
          network: {
            qos: 1,
            cleanSession: true,
          },
          persistence: {
            enabled: false,
          },
        },
        devices: [],
        metrics: [
          {
            name: 'Temperature',
            datatype: 9,
            value: 22,
            properties: {
              engineeringUnits: '°C',
              min: 15,
              max: 30,
            },
            logic: {
              type: 'sine',
              params: {
                amplitude: 3,
                frequency: 0.1,
                min: 20,
                max: 24,
              },
            },
          },
          {
            name: 'Humidity',
            datatype: 9,
            value: 50,
            properties: {
              engineeringUnits: '%',
              min: 30,
              max: 70,
            },
            logic: {
              type: 'random',
              params: {
                min: 45,
                max: 55,
              },
            },
          },
          {
            name: 'FanSpeed',
            datatype: 3,
            value: 1200,
            properties: {
              engineeringUnits: 'RPM',
              min: 0,
              max: 2000,
            },
            logic: {
              type: 'linear',
              params: {
                value: 1000,
                slope: 10,
              },
            },
          },
          {
            name: 'CompressorStatus',
            datatype: 11,
            value: true,
            logic: {
              type: 'static',
              params: {
                value: 1,
              },
            },
          },
        ],
      },
    ],
  },
];

interface NodeTemplatesProps {
  onSelectTemplate: (template: Template) => void;
  onClose: () => void;
}

export function NodeTemplates({ onSelectTemplate, onClose }: NodeTemplatesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'sensor', label: 'Sensors' },
    { id: 'controller', label: 'Controllers' },
    { id: 'gateway', label: 'Gateways' },
    { id: 'system', label: 'Systems' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Node Templates</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-slate-700 space-y-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => onSelectTemplate(template)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-3xl">{template.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold mb-1 truncate">
                      {template.name}
                    </h4>
                    <p className="text-sm text-slate-400 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="text-emerald-500">●</span>
                    {template.nodeCount} {template.nodeCount === 1 ? 'Node' : 'Nodes'}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-blue-500">●</span>
                    {template.deviceCount}{' '}
                    {template.deviceCount === 1 ? 'Device' : 'Devices'}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-purple-500">●</span>
                    {template.metricCount}{' '}
                    {template.metricCount === 1 ? 'Metric' : 'Metrics'}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTemplate(template);
                  }}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                >
                  Add to Canvas
                </button>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <p>No templates found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
