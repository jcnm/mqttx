/**
 * Linear View Component
 * Table layout for broker logs using @tanstack/react-table
 */

import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import type { BrokerLog } from '../../../types/broker.types';

interface LinearViewProps {
  logs: BrokerLog[];
}

export function LinearView({ logs }: LinearViewProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'timestamp', desc: true }]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const columns = useMemo<ColumnDef<BrokerLog>[]>(
    () => [
      {
        accessorKey: 'timestamp',
        header: 'Timestamp',
        cell: (info) => (
          <span className="text-xs text-slate-400">
            {format(info.getValue() as number, 'yyyy-MM-dd HH:mm:ss.SSS')}
          </span>
        ),
        size: 180,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: (info) => {
          const type = info.getValue() as string;
          const colors: Record<string, string> = {
            publish: 'text-emerald-500',
            subscribe: 'text-blue-500',
            unsubscribe: 'text-orange-500',
            connect: 'text-green-500',
            disconnect: 'text-red-500',
          };
          return (
            <span className={`text-xs font-semibold uppercase ${colors[type] || 'text-slate-400'}`}>
              {type}
            </span>
          );
        },
        size: 100,
      },
      {
        accessorKey: 'messageType',
        header: 'Message Type',
        cell: (info) => {
          const msgType = info.getValue() as string | undefined;
          if (!msgType) return <span className="text-xs text-slate-500">-</span>;

          const colors: Record<string, string> = {
            NBIRTH: 'bg-green-900/30 text-green-400 border-green-700',
            NDATA: 'bg-blue-900/30 text-blue-400 border-blue-700',
            NDEATH: 'bg-red-900/30 text-red-400 border-red-700',
            DBIRTH: 'bg-emerald-900/30 text-emerald-400 border-emerald-700',
            DDATA: 'bg-cyan-900/30 text-cyan-400 border-cyan-700',
            DDEATH: 'bg-pink-900/30 text-pink-400 border-pink-700',
            NCMD: 'bg-purple-900/30 text-purple-400 border-purple-700',
            DCMD: 'bg-violet-900/30 text-violet-400 border-violet-700',
            STATE: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
          };

          return (
            <span className={`text-xs px-2 py-0.5 rounded border ${colors[msgType] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
              {msgType}
            </span>
          );
        },
        size: 120,
      },
      {
        accessorKey: 'clientId',
        header: 'Client ID',
        cell: (info) => (
          <span className="text-xs text-blue-400 font-mono">{info.getValue() as string}</span>
        ),
        size: 150,
      },
      {
        accessorKey: 'topic',
        header: 'Topic',
        cell: (info) => {
          const topic = info.getValue() as string | undefined;
          return topic ? (
            <span className="text-xs text-yellow-400 font-mono truncate block">{topic}</span>
          ) : (
            <span className="text-xs text-slate-500">-</span>
          );
        },
        size: 250,
      },
      {
        accessorKey: 'qos',
        header: 'QoS',
        cell: (info) => {
          const qos = info.getValue() as number | undefined;
          return qos !== undefined ? (
            <span className="text-xs text-slate-300">{qos}</span>
          ) : (
            <span className="text-xs text-slate-500">-</span>
          );
        },
        size: 60,
      },
      {
        accessorKey: 'retain',
        header: 'Retain',
        cell: (info) => {
          const retain = info.getValue() as boolean | undefined;
          return retain !== undefined ? (
            <span className={`text-xs ${retain ? 'text-emerald-500' : 'text-slate-500'}`}>
              {retain ? 'Yes' : 'No'}
            </span>
          ) : (
            <span className="text-xs text-slate-500">-</span>
          );
        },
        size: 70,
      },
      {
        id: 'payloadSize',
        header: 'Payload Size',
        cell: (info) => {
          const payload = info.row.original.payload;
          if (!payload) return <span className="text-xs text-slate-500">-</span>;

          const size = payload.length;
          const formatted = size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} B`;
          return <span className="text-xs text-slate-300">{formatted}</span>;
        },
        size: 100,
      },
      {
        id: 'actions',
        header: '',
        cell: (info) => {
          const id = info.row.original.id;
          const isExpanded = expandedRows.has(id);
          return (
            <button
              onClick={() => {
                setExpandedRows((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) {
                    next.delete(id);
                  } else {
                    next.add(id);
                  }
                  return next;
                });
              }}
              className="text-xs text-emerald-500 hover:text-emerald-400"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          );
        },
        size: 50,
      },
    ],
    [expandedRows]
  );

  const table = useReactTable({
    data: logs,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto border border-slate-700 rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-slate-800 border-b border-slate-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-800">
            {table.getRowModel().rows.map((row) => {
              const isExpanded = expandedRows.has(row.original.id);
              return (
                <>
                  <tr key={row.id} className="hover:bg-slate-800/50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3" style={{ width: cell.column.getSize() }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && row.original.payload && (
                    <tr key={`${row.id}-expanded`}>
                      <td colSpan={columns.length} className="px-4 py-3 bg-slate-800/30">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-400">Payload:</span>
                            <button
                              onClick={() => {
                                const text = new TextDecoder().decode(row.original.payload);
                                navigator.clipboard.writeText(text);
                              }}
                              className="text-xs text-emerald-500 hover:text-emerald-400"
                            >
                              Copy
                            </button>
                          </div>
                          <pre className="text-xs text-slate-300 bg-slate-900 rounded p-3 overflow-x-auto font-mono max-h-64 overflow-y-auto">
                            {row.original.decoded
                              ? JSON.stringify(row.original.decoded, null, 2)
                              : new TextDecoder().decode(row.original.payload)}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            logs.length
          )}{' '}
          of {logs.length} logs
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1.5 text-sm bg-slate-800 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            First
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1.5 text-sm bg-slate-800 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-slate-400">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1.5 text-sm bg-slate-800 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1.5 text-sm bg-slate-800 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}
