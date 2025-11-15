/**
 * File Display Component
 * Displays Sparkplug B File datatype (18)
 * ISO/IEC 20237:2023 Section 7.5
 */

import { useState } from 'react';
import { Download, FileText, Image, Code, File } from 'lucide-react';

export interface FileData {
  fileName?: string;
  fileType?: string;
  value: Uint8Array;
}

export interface FileDisplayProps {
  name: string;
  file: FileData;
  timestamp?: bigint;
  compact?: boolean;
}

export function FileDisplay({ name, file, timestamp, compact = false }: FileDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const fileSize = file.value.length;
  const fileName = file.fileName || name;
  const fileType = file.fileType || detectFileType(fileName);

  // Detect if file is displayable
  const isImage = fileType.startsWith('image/');
  const isText = fileType.startsWith('text/') || fileType.includes('json') || fileType.includes('xml');
  const canPreview = isImage || isText;

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Download file
  const handleDownload = () => {
    const blob = new Blob([file.value.buffer as ArrayBuffer], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get file icon
  const getFileIcon = () => {
    if (isImage) return <Image className="w-5 h-5" />;
    if (isText) return <FileText className="w-5 h-5" />;
    if (fileType.includes('json') || fileType.includes('javascript')) return <Code className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  // Render preview
  const renderPreview = () => {
    if (!canPreview) {
      return (
        <div className="bg-slate-800 rounded-lg p-8 text-center">
          <File className="w-12 h-12 mx-auto mb-2 text-slate-500" />
          <p className="text-slate-400">No preview available</p>
        </div>
      );
    }

    if (isImage) {
      try {
        const blob = new Blob([file.value.buffer as ArrayBuffer], { type: fileType });
        const url = URL.createObjectURL(blob);
        return (
          <div className="bg-slate-800 rounded-lg p-4">
            <img
              src={url}
              alt={fileName}
              className="max-w-full max-h-96 mx-auto"
              onLoad={() => URL.revokeObjectURL(url)}
            />
          </div>
        );
      } catch (error) {
        return <p className="text-red-400">Failed to load image</p>;
      }
    }

    if (isText) {
      try {
        const decoder = new TextDecoder();
        const text = decoder.decode(file.value);
        const preview = text.length > 1000 ? text.substring(0, 1000) + '...' : text;
        return (
          <pre className="bg-slate-800 rounded-lg p-4 overflow-x-auto text-sm text-slate-300">
            {preview}
          </pre>
        );
      } catch (error) {
        return <p className="text-red-400">Failed to decode text</p>;
      }
    }

    return null;
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800">
      {/* Header */}
      <div
        className="bg-slate-800 p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {getFileIcon()}
          <div>
            <h4 className="text-lg font-bold text-cyan-400">{fileName}</h4>
            <div className="flex gap-4 text-xs text-slate-400 mt-1">
              <span>Type: {fileType}</span>
              <span>Size: {formatSize(fileSize)}</span>
              {timestamp && (
                <span>
                  Updated: {new Date(Number(timestamp)).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            title="Download file"
          >
            <Download className="w-5 h-5" />
          </button>
          <span className="text-slate-400">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {/* Preview */}
      {isExpanded && (
        <div className="p-4">
          {renderPreview()}
        </div>
      )}
    </div>
  );
}

/**
 * Grid for displaying multiple files
 */
export function FileGrid({ files }: { files: Map<string, { file: FileData; timestamp?: bigint }> }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {Array.from(files.entries()).map(([name, { file, timestamp }]) => (
        <FileDisplay
          key={name}
          name={name}
          file={file}
          timestamp={timestamp}
          compact={true}
        />
      ))}
    </div>
  );
}

/**
 * Detect file type from extension
 */
function detectFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();

  const typeMap: Record<string, string> = {
    // Images
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    webp: 'image/webp',

    // Text
    txt: 'text/plain',
    csv: 'text/csv',
    html: 'text/html',
    htm: 'text/html',
    xml: 'text/xml',

    // Code
    json: 'application/json',
    js: 'application/javascript',
    ts: 'application/typescript',
    py: 'text/x-python',
    java: 'text/x-java',

    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

    // Archives
    zip: 'application/zip',
    tar: 'application/x-tar',
    gz: 'application/gzip',
  };

  return typeMap[ext || ''] || 'application/octet-stream';
}
