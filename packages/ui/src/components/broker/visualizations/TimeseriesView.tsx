/**
 * Timeseries View Component
 * Line chart showing message counts over time using Recharts
 */

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from 'recharts';
import { format } from 'date-fns';
import type { BrokerLog, MessageType } from '../../../types/broker.types';

interface TimeseriesViewProps {
  logs: BrokerLog[];
}

interface DataPoint {
  timestamp: number;
  total: number;
  NBIRTH?: number;
  NDATA?: number;
  NDEATH?: number;
  DBIRTH?: number;
  DDATA?: number;
  DDEATH?: number;
  NCMD?: number;
  DCMD?: number;
  STATE?: number;
}

export function TimeseriesView({ logs }: TimeseriesViewProps) {
  const [visibleLines, setVisibleLines] = useState<Set<string>>(
    new Set(['total', 'NBIRTH', 'NDATA', 'NDEATH', 'DBIRTH', 'DDATA'])
  );

  // Aggregate logs by time bucket (1 second intervals)
  const chartData = useMemo(() => {
    if (logs.length === 0) return [];

    // Group logs by second
    const buckets = new Map<number, Map<MessageType | 'total', number>>();

    logs.forEach((log) => {
      const bucketTime = Math.floor(log.timestamp / 1000) * 1000; // Round to second

      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, new Map());
      }

      const bucket = buckets.get(bucketTime)!;

      // Increment total
      bucket.set('total', (bucket.get('total') || 0) + 1);

      // Increment message type if present
      if (log.messageType) {
        bucket.set(log.messageType, (bucket.get(log.messageType) || 0) + 1);
      }
    });

    // Convert to array and sort by timestamp
    const data: DataPoint[] = Array.from(buckets.entries())
      .map(([timestamp, counts]) => {
        const point: DataPoint = {
          timestamp,
          total: counts.get('total') || 0,
        };

        // Add message type counts
        (['NBIRTH', 'NDATA', 'NDEATH', 'DBIRTH', 'DDATA', 'DDEATH', 'NCMD', 'DCMD', 'STATE'] as const).forEach(
          (type) => {
            if (counts.has(type)) {
              point[type] = counts.get(type);
            }
          }
        );

        return point;
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    return data;
  }, [logs]);

  const messageTypes = [
    { key: 'total', color: '#10b981', label: 'Total' },
    { key: 'NBIRTH', color: '#22c55e', label: 'NBIRTH' },
    { key: 'NDATA', color: '#3b82f6', label: 'NDATA' },
    { key: 'NDEATH', color: '#ef4444', label: 'NDEATH' },
    { key: 'DBIRTH', color: '#10b981', label: 'DBIRTH' },
    { key: 'DDATA', color: '#06b6d4', label: 'DDATA' },
    { key: 'DDEATH', color: '#ec4899', label: 'DDEATH' },
    { key: 'NCMD', color: '#a855f7', label: 'NCMD' },
    { key: 'DCMD', color: '#8b5cf6', label: 'DCMD' },
    { key: 'STATE', color: '#eab308', label: 'STATE' },
  ];

  const toggleLine = (key: string) => {
    setVisibleLines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        <div className="text-center">
          <div className="text-5xl mb-4">📈</div>
          <p>No data to display</p>
          <p className="text-sm text-slate-500 mt-2">Messages will appear here as they flow through the broker</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend Controls */}
      <div className="flex flex-wrap gap-2">
        {messageTypes.map((type) => (
          <button
            key={type.key}
            onClick={() => toggleLine(type.key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              visibleLines.has(type.key)
                ? 'bg-slate-800 text-slate-200 border border-slate-700'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: visibleLines.has(type.key) ? type.color : '#64748b',
              }}
            />
            {type.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(ts) => format(ts, 'HH:mm:ss')}
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
              }}
              labelFormatter={(ts) => format(ts as number, 'yyyy-MM-dd HH:mm:ss')}
              labelStyle={{ color: '#cbd5e1', fontSize: '12px', fontWeight: 'bold' }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
              formatter={(value) => {
                const type = messageTypes.find((t) => t.key === value);
                return type ? type.label : value;
              }}
            />

            {messageTypes.map((type) => {
              if (!visibleLines.has(type.key)) return null;
              return (
                <Line
                  key={type.key}
                  type="monotone"
                  dataKey={type.key}
                  stroke={type.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name={type.label}
                />
              );
            })}

            <Brush
              dataKey="timestamp"
              height={30}
              stroke="#10b981"
              tickFormatter={(ts) => format(ts, 'HH:mm')}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {messageTypes.slice(0, 5).map((type) => {
          const total = chartData.reduce((sum, point) => sum + (point[type.key as keyof DataPoint] as number || 0), 0);
          return (
            <div key={type.key} className="bg-slate-900 rounded-lg p-3 border border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: type.color }} />
                <span className="text-xs text-slate-400">{type.label}</span>
              </div>
              <p className="text-xl font-bold text-white">{total}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
