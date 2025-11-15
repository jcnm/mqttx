/**
 * Metric Display Component
 * Shows a single metric with name, value, datatype, and trend
 */

import { useMemo } from 'react';
import { CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import type { MetricValue } from '../../types/scada.types';
import {
  getDatatypeName,
  getDatatypeColor,
  formatMetricValue,
} from '../../services/sparkplugProcessor';

interface MetricDisplayProps {
  metric: MetricValue;
  compact?: boolean;
  onClick?: () => void;
}

export function MetricDisplay({ metric, compact = false, onClick }: MetricDisplayProps) {
  // Format timestamp
  const timestamp = useMemo(() => {
    const date = new Date(Number(metric.timestamp));
    return date.toLocaleString();
  }, [metric.timestamp]);

  // Get datatype info
  const datatypeName = getDatatypeName(metric.datatype);
  const datatypeColor = getDatatypeColor(metric.datatype);

  // Format value with units
  const displayValue = useMemo(() => {
    const formatted = formatMetricValue(metric.value, metric.datatype);
    if (metric.properties?.engineeringUnits) {
      return `${formatted} ${metric.properties.engineeringUnits}`;
    }
    return formatted;
  }, [metric.value, metric.datatype, metric.properties]);

  // Determine if value is in range
  const isInRange = useMemo(() => {
    if (typeof metric.value !== 'number') return true;
    if (metric.properties?.min !== undefined && metric.value < metric.properties.min)
      return false;
    if (metric.properties?.max !== undefined && metric.value > metric.properties.max)
      return false;
    return true;
  }, [metric.value, metric.properties]);

  // Get quality indicator (ISO/IEC 20237:2023 Section 7.2.3)
  const qualityInfo = useMemo(() => {
    const quality = metric.properties?.quality;

    if (quality === undefined) {
      return { icon: null, label: null, color: '' };
    }

    // Sparkplug B Quality codes:
    // 0-191: Good
    // 192-223: Uncertain
    // 224-255: Bad
    if (quality >= 0 && quality < 192) {
      return {
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Good',
        color: 'text-emerald-500'
      };
    } else if (quality >= 192 && quality < 224) {
      return {
        icon: <HelpCircle className="w-4 h-4" />,
        label: 'Uncertain',
        color: 'text-yellow-500'
      };
    } else {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'Bad',
        color: 'text-red-500'
      };
    }
  }, [metric.properties?.quality]);

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`flex items-center justify-between p-2 rounded-lg bg-slate-800 border ${
          isInRange ? 'border-slate-700' : 'border-red-500'
        } ${onClick ? 'cursor-pointer hover:border-emerald-600 transition-colors' : ''}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-2 h-2 rounded-full ${datatypeColor}`} />
          <span className="text-sm text-slate-300 truncate">{metric.name}</span>
        </div>
        <span className="text-sm font-semibold text-white ml-2">{displayValue}</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg bg-slate-800 border ${
        isInRange ? 'border-slate-700' : 'border-red-500'
      } ${onClick ? 'cursor-pointer hover:border-emerald-600 transition-colors' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold text-white truncate">{metric.name}</h4>
          {metric.alias !== undefined && (
            <p className="text-xs text-slate-500 mt-0.5">Alias: {metric.alias.toString()}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {qualityInfo.icon && (
            <div className={`flex items-center gap-1 ${qualityInfo.color}`} title={`Quality: ${qualityInfo.label}`}>
              {qualityInfo.icon}
              <span className="text-xs">{qualityInfo.label}</span>
            </div>
          )}
          <span
            className={`px-2 py-1 text-xs font-medium text-white rounded ${datatypeColor}`}
          >
            {datatypeName}
          </span>
        </div>
      </div>

      {/* Value */}
      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">{displayValue}</span>
        </div>
        {!isInRange && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>Out of range</span>
          </div>
        )}
      </div>

      {/* Range Info */}
      {(metric.properties?.min !== undefined || metric.properties?.max !== undefined) && (
        <div className="mb-3 text-xs text-slate-400">
          Range:{' '}
          {metric.properties.min !== undefined ? metric.properties.min : '-∞'} to{' '}
          {metric.properties.max !== undefined ? metric.properties.max : '∞'}
        </div>
      )}

      {/* Timestamp */}
      <div className="pt-3 border-t border-slate-700">
        <p className="text-xs text-slate-500">Updated: {timestamp}</p>
      </div>
    </div>
  );
}

/**
 * Metric Display Grid
 * Shows multiple metrics in a grid layout
 */
interface MetricGridProps {
  metrics: Map<string, MetricValue>;
  onMetricClick?: (metricName: string) => void;
  maxDisplay?: number;
  compact?: boolean;
}

export function MetricGrid({
  metrics,
  onMetricClick,
  maxDisplay,
  compact = false,
}: MetricGridProps) {
  const metricsArray = Array.from(metrics.values());
  const displayMetrics = maxDisplay
    ? metricsArray.slice(0, maxDisplay)
    : metricsArray;
  const hasMore = maxDisplay && metricsArray.length > maxDisplay;

  if (displayMetrics.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p className="text-sm">No metrics available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={`grid gap-3 ${
          compact
            ? 'grid-cols-1'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {displayMetrics.map((metric) => (
          <MetricDisplay
            key={metric.name}
            metric={metric}
            compact={compact}
            onClick={onMetricClick ? () => onMetricClick(metric.name) : undefined}
          />
        ))}
      </div>
      {hasMore && (
        <p className="text-sm text-slate-400 text-center pt-2">
          +{metricsArray.length - maxDisplay} more metrics
        </p>
      )}
    </div>
  );
}
