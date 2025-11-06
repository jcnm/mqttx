/**
 * Advanced Metric Editor
 * Full support for all Sparkplug B datatypes with appropriate editors
 */

import { useState } from 'react';
import type { Metric } from '@sparkplug/codec';

interface MetricEditorAdvancedProps {
  metric: Metric;
  onChange: (metric: Metric) => void;
  onRemove: () => void;
  showAdvanced?: boolean;
}

// Sparkplug B Datatype definitions
const DATATYPES: Record<number, { name: string; type: 'number' | 'boolean' | 'string' | 'bigint' }> = {
  1: { name: 'Int8', type: 'number' },
  2: { name: 'Int16', type: 'number' },
  3: { name: 'Int32', type: 'number' },
  4: { name: 'Int64', type: 'bigint' },
  5: { name: 'UInt8', type: 'number' },
  6: { name: 'UInt16', type: 'number' },
  7: { name: 'UInt32', type: 'number' },
  8: { name: 'UInt64', type: 'bigint' },
  9: { name: 'Float', type: 'number' },
  10: { name: 'Double', type: 'number' },
  11: { name: 'Boolean', type: 'boolean' },
  12: { name: 'String', type: 'string' },
  13: { name: 'DateTime', type: 'bigint' },
  14: { name: 'Text', type: 'string' },
  15: { name: 'UUID', type: 'string' },
  16: { name: 'DataSet', type: 'string' },
  17: { name: 'Bytes', type: 'string' },
  18: { name: 'File', type: 'string' },
  19: { name: 'Template', type: 'string' },
};

export function MetricEditorAdvanced({
  metric,
  onChange,
  onRemove,
  showAdvanced = false,
}: MetricEditorAdvancedProps) {
  const [expanded, setExpanded] = useState(false);

  const datatypeInfo = DATATYPES[metric.datatype as number] || { name: 'Unknown', type: 'string' };

  const handleFieldChange = (field: keyof Metric, value: any) => {
    onChange({ ...metric, [field]: value });
  };

  const handleValueChange = (newValue: string) => {
    let parsedValue: any;

    switch (datatypeInfo.type) {
      case 'number':
        parsedValue = newValue === '' ? 0 : parseFloat(newValue);
        break;
      case 'bigint':
        parsedValue = BigInt(newValue || '0');
        break;
      case 'boolean':
        parsedValue = newValue === 'true';
        break;
      case 'string':
      default:
        parsedValue = newValue;
        break;
    }

    handleFieldChange('value', parsedValue);
  };

  const renderValueEditor = () => {
    const currentValue = metric.value !== undefined ? String(metric.value) : '';

    switch (datatypeInfo.type) {
      case 'boolean':
        return (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleFieldChange('value', true)}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                metric.value === true
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              ✓ True
            </button>
            <button
              onClick={() => handleFieldChange('value', false)}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                metric.value === false
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              ✗ False
            </button>
          </div>
        );

      case 'string':
        // For longer text types, use textarea
        if (metric.datatype === 14 || metric.datatype === 16) {
          return (
            <textarea
              value={currentValue}
              onChange={(e) => handleValueChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm font-mono resize-y"
              rows={3}
              placeholder="Enter value..."
            />
          );
        }
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleValueChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
            placeholder="Enter value..."
          />
        );

      case 'bigint':
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9-]/g, '');
              handleValueChange(val || '0');
            }}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm font-mono"
            placeholder="Enter integer..."
          />
        );

      case 'number':
      default:
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleValueChange(e.target.value)}
            step={metric.datatype === 9 || metric.datatype === 10 ? '0.01' : '1'}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
            placeholder="Enter value..."
          />
        );
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      {/* Header with metric name and controls */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 mr-3">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={metric.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-600 rounded text-white text-sm font-medium flex-1"
              placeholder="Metric name"
            />
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                datatypeInfo.type === 'number'
                  ? 'bg-blue-900/50 text-blue-400'
                  : datatypeInfo.type === 'boolean'
                    ? 'bg-purple-900/50 text-purple-400'
                    : datatypeInfo.type === 'bigint'
                      ? 'bg-cyan-900/50 text-cyan-400'
                      : 'bg-emerald-900/50 text-emerald-400'
              }`}
            >
              {datatypeInfo.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-white transition-colors"
            title="Toggle advanced options"
          >
            {expanded ? '▼' : '▶'}
          </button>
          <button
            onClick={onRemove}
            className="text-red-400 hover:text-red-300 transition-colors"
            title="Remove metric"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Basic Fields */}
      <div className="space-y-3">
        {/* Datatype Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Datatype</label>
          <select
            value={metric.datatype}
            onChange={(e) => {
              const newDatatype = parseInt(e.target.value);
              handleFieldChange('datatype', newDatatype);
              // Reset value when datatype changes
              const newDatatypeInfo = DATATYPES[newDatatype];
              if (newDatatypeInfo.type === 'boolean') {
                handleFieldChange('value', false);
              } else if (newDatatypeInfo.type === 'bigint') {
                handleFieldChange('value', BigInt(0));
              } else if (newDatatypeInfo.type === 'number') {
                handleFieldChange('value', 0);
              } else {
                handleFieldChange('value', '');
              }
            }}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
          >
            {Object.entries(DATATYPES).map(([value, info]) => (
              <option key={value} value={value}>
                {info.name}
              </option>
            ))}
          </select>
        </div>

        {/* Value Editor */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Value</label>
          {renderValueEditor()}
        </div>

        {/* Alias (optional) */}
        {expanded && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Alias <span className="text-slate-500">(optional)</span>
            </label>
            <input
              type="number"
              value={metric.alias !== undefined ? String(metric.alias) : ''}
              onChange={(e) =>
                handleFieldChange('alias', e.target.value === '' ? undefined : BigInt(e.target.value))
              }
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
              placeholder="Metric alias (0-65535)"
            />
            <p className="text-xs text-slate-500 mt-1">
              Used for efficient metric references in NDATA/DDATA messages
            </p>
          </div>
        )}

        {/* Timestamp */}
        {expanded && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Timestamp</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={metric.timestamp !== undefined ? String(metric.timestamp) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  try {
                    handleFieldChange('timestamp', val === '' ? undefined : BigInt(val));
                  } catch {
                    // Ignore invalid bigint
                  }
                }}
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm font-mono"
                placeholder="Timestamp (ms since epoch)"
              />
              <button
                onClick={() => handleFieldChange('timestamp', BigInt(Date.now()))}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg font-medium"
              >
                Now
              </button>
            </div>
          </div>
        )}

        {/* Advanced Metadata */}
        {expanded && showAdvanced && (
          <div className="pt-3 border-t border-slate-700 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300">Advanced Properties</h4>

            {/* Engineering Units */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Engineering Units <span className="text-slate-500">(optional)</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
                placeholder="e.g., °C, PSI, RPM, kW"
              />
            </div>

            {/* Min/Max Range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Min Value</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
                  placeholder="Min"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Max Value</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Historical Flag */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`historical-${metric.name}`}
                className="w-4 h-4 bg-slate-900 border-slate-600 rounded"
              />
              <label htmlFor={`historical-${metric.name}`} className="text-xs text-slate-400">
                Historical data (not real-time)
              </label>
            </div>

            {/* Transient Flag */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`transient-${metric.name}`}
                className="w-4 h-4 bg-slate-900 border-slate-600 rounded"
              />
              <label htmlFor={`transient-${metric.name}`} className="text-xs text-slate-400">
                Transient (don't store)
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
