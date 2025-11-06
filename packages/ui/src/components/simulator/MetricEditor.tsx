/**
 * Metric Editor Component
 * Form for adding/editing metric definitions with data generation logic
 */

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { MetricDefinition, DataGenerationType } from '../../types/simulator.types';
import { generatePreviewData } from '../../services/dataGenerator';

interface MetricEditorProps {
  metric?: MetricDefinition;
  onSave: (metric: MetricDefinition) => void;
  onCancel: () => void;
}

const DATATYPES = [
  { value: 1, label: 'Int8' },
  { value: 2, label: 'Int16' },
  { value: 3, label: 'Int32' },
  { value: 4, label: 'Int64' },
  { value: 5, label: 'UInt8' },
  { value: 6, label: 'UInt16' },
  { value: 7, label: 'UInt32' },
  { value: 8, label: 'UInt64' },
  { value: 9, label: 'Float' },
  { value: 10, label: 'Double' },
  { value: 11, label: 'Boolean' },
  { value: 12, label: 'String' },
  { value: 13, label: 'DateTime' },
  { value: 14, label: 'Text' },
];

const GENERATION_TYPES: { value: DataGenerationType; label: string }[] = [
  { value: 'static', label: 'Static' },
  { value: 'random', label: 'Random' },
  { value: 'sine', label: 'Sine Wave' },
  { value: 'linear', label: 'Linear Trend' },
  { value: 'formula', label: 'Custom Formula' },
];

export function MetricEditor({ metric, onSave, onCancel }: MetricEditorProps) {
  const [name, setName] = useState(metric?.name || '');
  const [datatype, setDatatype] = useState(metric?.datatype || 9);
  const [engineeringUnits, setEngineeringUnits] = useState(
    metric?.properties?.engineeringUnits || ''
  );
  const [min, setMin] = useState(metric?.properties?.min?.toString() || '');
  const [max, setMax] = useState(metric?.properties?.max?.toString() || '');
  const [description, setDescription] = useState(metric?.properties?.description || '');

  const [generationType, setGenerationType] = useState<DataGenerationType>(
    metric?.logic?.type || 'static'
  );

  // Logic parameters
  const [staticValue, setStaticValue] = useState(
    metric?.logic?.params?.value?.toString() || '0'
  );
  const [randomMin, setRandomMin] = useState(
    metric?.logic?.params?.min?.toString() || '0'
  );
  const [randomMax, setRandomMax] = useState(
    metric?.logic?.params?.max?.toString() || '100'
  );
  const [amplitude, setAmplitude] = useState(
    metric?.logic?.params?.amplitude?.toString() || '1'
  );
  const [frequency, setFrequency] = useState(
    metric?.logic?.params?.frequency?.toString() || '0.1'
  );
  const [phase, setPhase] = useState(metric?.logic?.params?.phase?.toString() || '0');
  const [slope, setSlope] = useState(metric?.logic?.params?.slope?.toString() || '1');
  const [formula, setFormula] = useState(metric?.logic?.params?.formula || 't');

  // Generate preview data
  const previewData = useMemo(() => {
    const logic = {
      type: generationType,
      params: {
        value: parseFloat(staticValue) || 0,
        min: parseFloat(randomMin) || 0,
        max: parseFloat(randomMax) || 100,
        amplitude: parseFloat(amplitude) || 1,
        frequency: parseFloat(frequency) || 0.1,
        phase: parseFloat(phase) || 0,
        slope: parseFloat(slope) || 1,
        formula,
      },
    };

    return generatePreviewData(logic, 10, 20);
  }, [generationType, staticValue, randomMin, randomMax, amplitude, frequency, phase, slope, formula]);

  const handleSave = () => {
    const newMetric: MetricDefinition = {
      name,
      datatype,
      value: 0,
      properties: {
        engineeringUnits: engineeringUnits || undefined,
        min: min ? parseFloat(min) : undefined,
        max: max ? parseFloat(max) : undefined,
        description: description || undefined,
      },
      logic: {
        type: generationType,
        params: {
          value: parseFloat(staticValue) || 0,
          min: parseFloat(randomMin) || 0,
          max: parseFloat(randomMax) || 100,
          amplitude: parseFloat(amplitude) || 1,
          frequency: parseFloat(frequency) || 0.1,
          phase: parseFloat(phase) || 0,
          slope: parseFloat(slope) || 1,
          formula,
        },
      },
    };

    onSave(newMetric);
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 max-h-[80vh] overflow-y-auto">
      <h3 className="text-lg font-semibold text-white mb-4">
        {metric ? 'Edit Metric' : 'Add Metric'}
      </h3>

      {/* Basic Info */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Metric Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Temperature"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Datatype *
            </label>
            <select
              value={datatype}
              onChange={(e) => setDatatype(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DATATYPES.map((dt) => (
                <option key={dt.value} value={dt.value}>
                  {dt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Engineering Units
            </label>
            <input
              type="text"
              value={engineeringUnits}
              onChange={(e) => setEngineeringUnits(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., °C, kPa"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Min Range</label>
            <input
              type="number"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Max Range</label>
            <input
              type="number"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="Optional description"
          />
        </div>
      </div>

      {/* Data Generation Logic */}
      <div className="border-t border-slate-700 pt-6 mb-6">
        <h4 className="text-md font-semibold text-white mb-4">Data Generation Logic</h4>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Generation Type *
          </label>
          <select
            value={generationType}
            onChange={(e) => setGenerationType(e.target.value as DataGenerationType)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {GENERATION_TYPES.map((gt) => (
              <option key={gt.value} value={gt.value}>
                {gt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic parameters based on generation type */}
        {generationType === 'static' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Value</label>
            <input
              type="number"
              value={staticValue}
              onChange={(e) => setStaticValue(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {generationType === 'random' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Min</label>
              <input
                type="number"
                value={randomMin}
                onChange={(e) => setRandomMin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Max</label>
              <input
                type="number"
                value={randomMax}
                onChange={(e) => setRandomMax(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {generationType === 'sine' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Amplitude
              </label>
              <input
                type="number"
                value={amplitude}
                onChange={(e) => setAmplitude(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Frequency (Hz)
              </label>
              <input
                type="number"
                step="0.01"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Phase</label>
              <input
                type="number"
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {generationType === 'linear' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Starting Value
              </label>
              <input
                type="number"
                value={staticValue}
                onChange={(e) => setStaticValue(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Slope (change/sec)
              </label>
              <input
                type="number"
                step="0.1"
                value={slope}
                onChange={(e) => setSlope(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {generationType === 'formula' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Formula (use 't' for time)
            </label>
            <input
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Math.sin(t) * 100"
            />
            <p className="text-xs text-slate-500 mt-1">
              Example: Math.sin(t) * 100 + Math.random() * 10
            </p>
          </div>
        )}
      </div>

      {/* Preview Chart */}
      <div className="border-t border-slate-700 pt-6 mb-6">
        <h4 className="text-md font-semibold text-white mb-4">Preview (10 seconds)</h4>
        <div className="h-48 bg-slate-800 rounded-lg p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={previewData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis
                dataKey="time"
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
                label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
                label={{ value: 'Value', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '0.375rem',
                }}
                labelStyle={{ color: '#cbd5e1' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end border-t border-slate-700 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!name}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {metric ? 'Update' : 'Add'} Metric
        </button>
      </div>
    </div>
  );
}
