/**
 * Template Display Component
 * Displays Sparkplug B Templates (User Defined Types)
 * Spec: ISO/IEC 20237:2023 Section 7.4
 */

import { useState } from 'react';

export interface TemplateMetric {
  name: string;
  datatype: number;
  value?: any;
}

export interface Template {
  version?: string;
  metrics: TemplateMetric[];
  parameters?: Record<string, any>;
  templateRef?: string;
  isDefinition?: boolean;
}

interface TemplateDisplayProps {
  name: string;
  template: Template;
  timestamp?: bigint;
  compact?: boolean;
}

export function TemplateDisplay({
  name,
  template,
  timestamp,
  compact = false,
}: TemplateDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const getDatatypeName = (datatype: number): string => {
    const types: Record<number, string> = {
      1: 'Int8',
      2: 'Int16',
      3: 'Int32',
      4: 'Int64',
      5: 'UInt8',
      6: 'UInt16',
      7: 'UInt32',
      8: 'UInt64',
      9: 'Float',
      10: 'Double',
      11: 'Boolean',
      12: 'String',
      13: 'DateTime',
      14: 'Text',
      17: 'Bytes',
      19: 'Template',
    };
    return types[datatype] || `Unknown(${datatype})`;
  };

  const formatValue = (value: any, datatype: number): string => {
    if (value === undefined || value === null) return 'null';

    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (datatype === 11) {
      // Boolean
      return value ? 'true' : 'false';
    }

    if (datatype === 13) {
      // DateTime
      const date = new Date(Number(value));
      return date.toISOString();
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  };

  if (compact) {
    return (
      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {isExpanded ? '▼' : '▶'}
            </span>
            <span className="text-sm font-semibold text-purple-400">{name}</span>
            {template.templateRef && (
              <span className="text-xs text-slate-400">
                → {template.templateRef}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500">
            {template.metrics.length} fields
          </span>
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-2 pl-6">
            {template.metrics.map((metric, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-slate-400">{metric.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                    {getDatatypeName(metric.datatype)}
                  </span>
                  {metric.value !== undefined && (
                    <span className="text-white font-mono">
                      {formatValue(metric.value, metric.datatype)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 p-4 border-b border-slate-700">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-lg font-bold text-purple-400 flex items-center gap-2">
              <span>📋</span>
              {name}
            </h4>
            {template.templateRef && (
              <p className="text-sm text-slate-400 mt-1">
                Type: {template.templateRef}
                {template.version && ` v${template.version}`}
              </p>
            )}
            {template.isDefinition && (
              <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-purple-900/30 text-purple-300 border border-purple-700 rounded">
                DEFINITION
              </span>
            )}
          </div>
          {timestamp && (
            <span className="text-xs text-slate-500">
              {new Date(Number(timestamp)).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Metrics Table */}
      <div className="p-4">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-700">
              <th className="pb-2">Field Name</th>
              <th className="pb-2">Data Type</th>
              <th className="pb-2 text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {template.metrics.map((metric, index) => (
              <tr
                key={index}
                className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
              >
                <td className="py-3">
                  <span className="text-sm text-white font-medium">
                    {metric.name}
                  </span>
                </td>
                <td className="py-3">
                  <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded font-mono">
                    {getDatatypeName(metric.datatype)}
                  </span>
                </td>
                <td className="py-3 text-right">
                  {metric.value !== undefined ? (
                    <span className="text-sm text-white font-mono">
                      {formatValue(metric.value, metric.datatype)}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 italic">no value</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Parameters (if any) */}
        {template.parameters && Object.keys(template.parameters).length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <h5 className="text-sm font-semibold text-slate-400 mb-2">
              Parameters
            </h5>
            <div className="space-y-1">
              {Object.entries(template.parameters).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{key}</span>
                  <span className="text-white font-mono">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-800/50 px-4 py-2 border-t border-slate-700">
        <p className="text-xs text-slate-500">
          {template.metrics.length} field{template.metrics.length !== 1 ? 's' : ''}
          {template.isDefinition
            ? ' • Template Definition'
            : ' • Template Instance'}
        </p>
      </div>
    </div>
  );
}

/**
 * Template Grid Component
 * Display multiple templates in a grid
 */
interface TemplateGridProps {
  templates: Map<string, { template: Template; timestamp?: bigint }>;
  compact?: boolean;
}

export function TemplateGrid({ templates, compact = false }: TemplateGridProps) {
  const templateArray = Array.from(templates.entries());

  if (templateArray.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <div className="text-4xl mb-2">📋</div>
        <p>No templates defined</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {templateArray.map(([name, { template, timestamp }]) => (
        <TemplateDisplay
          key={name}
          name={name}
          template={template}
          timestamp={timestamp}
          compact={compact}
        />
      ))}
    </div>
  );
}
