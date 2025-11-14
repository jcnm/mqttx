/**
 * DataSet Table Component
 * Displays Sparkplug B DataSets as interactive tables
 * Spec: ISO/IEC 20237:2023 Section 7.3
 */

import { useState, useMemo } from 'react';

export interface DataSetValue {
  intValue?: number;
  longValue?: bigint | number;
  floatValue?: number;
  doubleValue?: number;
  booleanValue?: boolean;
  stringValue?: string;
}

export interface DataSetRow {
  elements: DataSetValue[];
}

export interface DataSet {
  numOfColumns: number;
  columns: string[];
  types: number[];
  rows: DataSetRow[];
}

interface DataSetTableProps {
  name: string;
  dataset: DataSet;
  timestamp?: bigint;
  compact?: boolean;
}

export function DataSetTable({
  name,
  dataset,
  timestamp,
  compact = false,
}: DataSetTableProps) {
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

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
    };
    return types[datatype] || `Type${datatype}`;
  };

  const extractValue = (value: DataSetValue): any => {
    if (value.intValue !== undefined) return value.intValue;
    if (value.longValue !== undefined) return value.longValue;
    if (value.floatValue !== undefined) return value.floatValue;
    if (value.doubleValue !== undefined) return value.doubleValue;
    if (value.booleanValue !== undefined) return value.booleanValue;
    if (value.stringValue !== undefined) return value.stringValue;
    return null;
  };

  const formatValue = (value: any, datatype: number): string => {
    if (value === null || value === undefined) return '-';

    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (datatype === 11) {
      // Boolean
      return value ? '✓' : '✗';
    }

    if (datatype === 13) {
      // DateTime
      const date = new Date(Number(value));
      return date.toLocaleString();
    }

    if (datatype === 9 || datatype === 10) {
      // Float/Double
      return Number(value).toFixed(2);
    }

    return String(value);
  };

  // Sort and filter rows
  const processedRows = useMemo(() => {
    let rows = [...dataset.rows];

    // Filter by search term
    if (searchTerm) {
      rows = rows.filter((row) =>
        row.elements.some((element) => {
          const value = extractValue(element);
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Sort by column
    if (sortColumn !== null) {
      rows.sort((a, b) => {
        const aVal = extractValue(a.elements[sortColumn]);
        const bVal = extractValue(b.elements[sortColumn]);

        if (aVal === null) return 1;
        if (bVal === null) return -1;

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal);
        const bStr = String(bVal);
        return sortOrder === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return rows;
  }, [dataset.rows, searchTerm, sortColumn, sortOrder]);

  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnIndex);
      setSortOrder('asc');
    }
  };

  const exportToCSV = () => {
    const headers = dataset.columns.join(',');
    const rows = processedRows.map((row) =>
      row.elements.map((element, i) => {
        const value = extractValue(element);
        const formatted = formatValue(value, dataset.types[i]);
        // Escape quotes and wrap in quotes if contains comma
        return formatted.includes(',') ? `"${formatted.replace(/"/g, '""')}"` : formatted;
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dataset-${name}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (compact) {
    return (
      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-cyan-400">{name}</span>
          <span className="text-xs text-slate-500">
            {dataset.rows.length} rows × {dataset.columns.length} cols
          </span>
        </div>
        <div className="text-xs text-slate-400 space-y-1">
          {dataset.columns.map((col, i) => (
            <div key={i} className="flex items-center gap-2">
              <span>{col}</span>
              <span className="text-slate-600">({getDatatypeName(dataset.types[i])})</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 p-4 border-b border-slate-700">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
              <span>📊</span>
              {name}
            </h4>
            <p className="text-sm text-slate-400 mt-1">
              {dataset.rows.length} rows × {dataset.columns.length} columns
            </p>
          </div>
          {timestamp && (
            <span className="text-xs text-slate-500">
              {new Date(Number(timestamp)).toLocaleString()}
            </span>
          )}
        </div>

        {/* Search and Export */}
        <div className="mt-4 flex items-center gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search in table..."
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent"
          />
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Export to CSV"
          >
            📥 CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              {dataset.columns.map((column, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                  onClick={() => handleSort(index)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{column}</span>
                    <span className="text-xs text-slate-500">
                      ({getDatatypeName(dataset.types[index])})
                    </span>
                    {sortColumn === index && (
                      <span className="text-cyan-400">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={dataset.columns.length}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  {searchTerm ? 'No matching rows found' : 'No data'}
                </td>
              </tr>
            ) : (
              processedRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-t border-slate-800 hover:bg-slate-800/30 transition-colors"
                >
                  {row.elements.map((element, colIndex) => {
                    const value = extractValue(element);
                    const formatted = formatValue(value, dataset.types[colIndex]);

                    return (
                      <td key={colIndex} className="px-4 py-3">
                        <span className="text-sm text-white font-mono">
                          {formatted}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-slate-800/50 px-4 py-2 border-t border-slate-700 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Showing {processedRows.length} of {dataset.rows.length} rows
          {searchTerm && ` (filtered)`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">DataSet • Sparkplug B</span>
        </div>
      </div>
    </div>
  );
}

/**
 * DataSet Grid Component
 * Display multiple datasets
 */
interface DataSetGridProps {
  datasets: Map<string, { dataset: DataSet; timestamp?: bigint }>;
  compact?: boolean;
}

export function DataSetGrid({ datasets, compact = false }: DataSetGridProps) {
  const datasetArray = Array.from(datasets.entries());

  if (datasetArray.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <div className="text-4xl mb-2">📊</div>
        <p>No datasets available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {datasetArray.map(([name, { dataset, timestamp }]) => (
        <DataSetTable
          key={name}
          name={name}
          dataset={dataset}
          timestamp={timestamp}
          compact={compact}
        />
      ))}
    </div>
  );
}
