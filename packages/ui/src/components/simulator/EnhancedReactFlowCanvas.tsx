/**
 * Enhanced ReactFlow Canvas with Drag & Drop Support
 * Production-grade canvas for plant design
 */

import { useCallback, useRef, DragEvent as ReactDragEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  type NodeTypes,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { EoNNode } from './nodes/EoNNode';
import type { SimulatorNode, SimulatorEdge, EoNNodeData } from '../../types/simulator.types';

interface EnhancedReactFlowCanvasProps {
  nodes: SimulatorNode[];
  edges: SimulatorEdge[];
  onNodesChange: OnNodesChange<Node>;
  onEdgesChange: OnEdgesChange<Edge>;
  onConnect: OnConnect;
  onNodeClick: (node: SimulatorNode) => void;
  onCanvasDrop: (position: { x: number; y: number }, data: any) => void;
}

const nodeTypes: NodeTypes = {
  eon: EoNNode,
};

function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onCanvasDrop,
}: EnhancedReactFlowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Handle drag over canvas
  const handleDragOver = useCallback((event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  // Handle drop on canvas
  const handleDrop = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      console.log('🎯 Canvas drop event fired');
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow-type');
      const data = event.dataTransfer.getData('application/reactflow-data');

      console.log('🎯 Drop data from transfer:', { type, data });

      if (!type) {
        console.warn('⚠️ No type in drop data');
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const dropData = data ? JSON.parse(data) : {};
      console.log('🎯 Calling onCanvasDrop with:', position, { type, ...dropData });
      onCanvasDrop(position, { type, ...dropData });
    },
    [screenToFlowPosition, onCanvasDrop]
  );

  return (
    <div ref={reactFlowWrapper} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onNodeClick(node as SimulatorNode)}
        nodeTypes={nodeTypes}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        fitView
        minZoom={0.1}
        maxZoom={4}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#475569', strokeWidth: 2 },
        }}
      >
        <Background
          color="#1e293b"
          gap={16}
          size={1}
          style={{ backgroundColor: '#0f172a' }}
        />
        <Controls
          position="bottom-right"
          className="bg-slate-800 border border-slate-600 rounded-lg"
        />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as EoNNodeData;
            return data.state === 'running'
              ? '#10b981'
              : data.state === 'stopped'
                ? '#ef4444'
                : '#6b7280';
          }}
          maskColor="rgba(15, 23, 42, 0.8)"
          className="bg-slate-900 border border-slate-700 rounded-lg"
        />

        {/* Canvas Instructions */}
        <Panel position="top-center" className="bg-slate-800/90 backdrop-blur border border-slate-600 rounded-lg px-4 py-2">
          <p className="text-xs text-slate-300 flex items-center gap-2">
            <span>💡</span>
            <span>Drag items from left panel to canvas • Click nodes to configure • Connect nodes with edges</span>
          </p>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function EnhancedReactFlowCanvas(props: EnhancedReactFlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  );
}
