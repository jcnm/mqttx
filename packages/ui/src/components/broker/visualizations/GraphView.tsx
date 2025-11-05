/**
 * Graph View Component
 * Network graph showing message flow between clients and topics using @xyflow/react
 */

import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { BrokerLog } from '../../../types/broker.types';

interface GraphViewProps {
  logs: BrokerLog[];
}

interface NodeData extends Record<string, unknown> {
  label: string;
  type: 'client' | 'topic';
  messageCount: number;
}

export function GraphView({ logs }: GraphViewProps) {
  const { nodes, edges } = useMemo(() => {
    const clientNodes = new Map<string, { messageCount: number }>();
    const topicNodes = new Map<string, { messageCount: number }>();
    const edgeMap = new Map<string, { count: number; messageType?: string }>();

    // Process logs to build graph
    logs.forEach((log) => {
      // Track clients
      if (!clientNodes.has(log.clientId)) {
        clientNodes.set(log.clientId, { messageCount: 0 });
      }
      clientNodes.get(log.clientId)!.messageCount++;

      // Track topics and edges
      if (log.topic) {
        if (!topicNodes.has(log.topic)) {
          topicNodes.set(log.topic, { messageCount: 0 });
        }
        topicNodes.get(log.topic)!.messageCount++;

        // Create edge
        const edgeId = `${log.clientId}-${log.topic}`;
        if (!edgeMap.has(edgeId)) {
          edgeMap.set(edgeId, { count: 0, messageType: log.messageType });
        }
        edgeMap.get(edgeId)!.count++;
      }
    });

    // Create nodes
    const flowNodes: Node<NodeData>[] = [];
    let yPos = 0;

    // Client nodes on the left
    Array.from(clientNodes.entries()).forEach(([clientId, data]) => {
      flowNodes.push({
        id: `client-${clientId}`,
        type: 'default',
        position: { x: 50, y: yPos },
        data: {
          label: clientId,
          type: 'client',
          messageCount: data.messageCount,
        },
        sourcePosition: Position.Right,
        style: {
          background: '#1e40af',
          color: '#fff',
          border: '2px solid #3b82f6',
          borderRadius: '8px',
          padding: '10px',
          fontSize: '12px',
          width: 150,
        },
      });
      yPos += 100;
    });

    // Topic nodes on the right
    yPos = 0;
    Array.from(topicNodes.entries()).forEach(([topic, data]) => {
      flowNodes.push({
        id: `topic-${topic}`,
        type: 'default',
        position: { x: 400, y: yPos },
        data: {
          label: topic,
          type: 'topic',
          messageCount: data.messageCount,
        },
        targetPosition: Position.Left,
        style: {
          background: '#854d0e',
          color: '#fff',
          border: '2px solid #eab308',
          borderRadius: '8px',
          padding: '10px',
          fontSize: '11px',
          width: 200,
          wordBreak: 'break-all',
        },
      });
      yPos += 100;
    });

    // Create edges
    const flowEdges: Edge[] = Array.from(edgeMap.entries()).map(([edgeId, data]) => {
      const [clientId, topic] = edgeId.split('-', 2);

      // Determine color based on message type
      let color = '#64748b';
      if (data.messageType) {
        const colors: Record<string, string> = {
          NBIRTH: '#22c55e',
          NDATA: '#3b82f6',
          NDEATH: '#ef4444',
          DBIRTH: '#10b981',
          DDATA: '#06b6d4',
          DDEATH: '#ec4899',
          NCMD: '#a855f7',
          DCMD: '#8b5cf6',
          STATE: '#eab308',
        };
        color = colors[data.messageType] || color;
      }

      return {
        id: edgeId,
        source: `client-${clientId}`,
        target: `topic-${topic}`,
        label: `${data.count}`,
        animated: data.count > 10,
        style: { stroke: color, strokeWidth: Math.min(data.count / 5, 4) },
        labelStyle: { fill: color, fontSize: 10, fontWeight: 'bold' },
        labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8 },
      };
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        <div className="text-center">
          <div className="text-5xl mb-4">🕸️</div>
          <p>No data to display</p>
          <p className="text-sm text-slate-500 mt-2">Message flow will appear here as clients communicate</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.2}
        maxZoom={2}
      >
        <Background color="#334155" gap={16} />
        <Controls className="bg-slate-800 border-slate-700" />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as Record<string, unknown>;
            const nodeType = data.type as string;
            return nodeType === 'client' ? '#3b82f6' : '#eab308';
          }}
          className="bg-slate-900 border-slate-700"
        />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 border border-slate-800">
        <div className="text-xs font-semibold text-slate-300 mb-2">Legend</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-700 border-2 border-blue-500" />
            <span className="text-xs text-slate-400">Client</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-700 border-2 border-yellow-500" />
            <span className="text-xs text-slate-400">Topic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-slate-500" />
            <span className="text-xs text-slate-400">Message Flow</span>
          </div>
        </div>
      </div>
    </div>
  );
}
