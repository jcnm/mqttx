/**
 * Export Button Component
 * Export data to JSON or CSV with timestamp in filename
 */

import { useState } from 'react';
import { format } from 'date-fns';
import type { BrokerLog } from '../../types/broker.types';

interface ExportButtonProps {
  data: BrokerLog[];
  filename?: string;
}

export function ExportButton({ data, filename = 'broker-logs' }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const exportAsJSON = () => {
    const timestamp = format(Date.now(), 'yyyy-MM-dd_HH-mm-ss');
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${timestamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const exportAsCSV = () => {
    const timestamp = format(Date.now(), 'yyyy-MM-dd_HH-mm-ss');

    // CSV headers
    const headers = [
      'Timestamp',
      'Type',
      'Client ID',
      'Topic',
      'QoS',
      'Retain',
      'Message Type',
      'Payload Size',
      'IP',
      'Port',
    ];

    // CSV rows
    const rows = data.map((log) => [
      format(log.timestamp, 'yyyy-MM-dd HH:mm:ss.SSS'),
      log.type,
      log.clientId,
      log.topic || '',
      log.qos !== undefined ? log.qos.toString() : '',
      log.retain !== undefined ? (log.retain ? 'Yes' : 'No') : '',
      log.messageType || '',
      log.payload ? log.payload.length.toString() : '',
      log.origin.ip,
      log.origin.port.toString(),
    ]);

    // Combine headers and rows
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${timestamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  if (data.length === 0) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-slate-800 text-slate-500 rounded-lg text-sm font-medium cursor-not-allowed"
      >
        Export (No Data)
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        <span>📥</span>
        Export
        <span className="text-xs">({data.length})</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-20 overflow-hidden">
            <button
              onClick={exportAsJSON}
              className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-3"
            >
              <span className="text-lg">📄</span>
              <div>
                <div className="font-medium">Export as JSON</div>
                <div className="text-xs text-slate-500">Structured data format</div>
              </div>
            </button>

            <button
              onClick={exportAsCSV}
              className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-3 border-t border-slate-800"
            >
              <span className="text-lg">📊</span>
              <div>
                <div className="font-medium">Export as CSV</div>
                <div className="text-xs text-slate-500">Spreadsheet compatible</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
