/**
 * ReactFlow Canvas Component
 * Main canvas for the node-based simulator designer
 */

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { EoNNode } from './nodes/EoNNode';
import { DeviceNode } from './nodes/DeviceNode';
import { useSimulatorStore } from '../../stores/simulatorStore';

// Custom edge component (animated)
const AnimatedEdge = ({ id, sourceX, sourceY, targetX, targetY }: any) => {
  const edgePath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
  return (
    <g>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={2}
        stroke="#3b82f6"
        fill="none"
        strokeDasharray="5,5"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="10"
          dur="0.5s"
          repeatCount="indefinite"
        />
      </path>
    </g>
  );
};

interface ReactFlowCanvasProps {
  onNodeClick?: (nodeId: string) => void;
}

export function ReactFlowCanvas({ onNodeClick }: ReactFlowCanvasProps) {
  const { flowNodes, flowEdges, setFlowNodes, setFlowEdges, setSelectedNode } =
    useSimulatorStore();

  const [nodes, , onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Define custom node types
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      eon: EoNNode,
      device: DeviceNode,
    }),
    []
  );

  // Define custom edge types
  const edgeTypes: EdgeTypes = useMemo(
    () => ({
      animated: AnimatedEdge,
    }),
    []
  );

  // Handle connection between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      // Validate connection (devices can only connect to EoN nodes)
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return;

      // Only allow device -> eon connections
      if (sourceNode.type === 'device' && targetNode.type === 'eon') {
        const newEdge = {
          ...connection,
          type: 'animated',
          animated: true,
        };
        setEdges((eds) => addEdge(newEdge, eds));
      } else if (sourceNode.type === 'eon' && targetNode.type === 'device') {
        // Also allow eon -> device (reverse)
        const newEdge = {
          ...connection,
          type: 'animated',
          animated: true,
        };
        setEdges((eds) => addEdge(newEdge, eds));
      }
    },
    [nodes, setEdges]
  );

  // Handle node selection
  const onNodeClickHandler = useCallback(
    (_event: React.MouseEvent, node: any) => {
      setSelectedNode(node.id);
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [setSelectedNode, onNodeClick]
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  // Sync local state with store
  const onNodesChangeHandler = useCallback(
    (changes: any) => {
      onNodesChange(changes);
      setFlowNodes(nodes);
    },
    [onNodesChange, nodes, setFlowNodes]
  );

  const onEdgesChangeHandler = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
      setFlowEdges(edges);
    },
    [onEdgesChange, edges, setFlowEdges]
  );

  return (
    <div className="w-full h-full bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChangeHandler}
        onConnect={onConnect}
        onNodeClick={onNodeClickHandler}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        className="bg-slate-950"
      >
        {/* Background grid */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#334155"
          className="bg-slate-950"
        />

        {/* Controls */}
        <Controls
          className="!bg-slate-900 !border-slate-700 [&>button]:!bg-slate-800 [&>button]:!border-slate-700 [&>button]:!text-slate-300 [&>button:hover]:!bg-slate-700"
          showInteractive={false}
        />

        {/* Mini Map */}
        <MiniMap
          className="!bg-slate-900 !border-slate-700"
          nodeColor={(node) => {
            if (node.type === 'eon') return '#10b981';
            if (node.type === 'device') return '#3b82f6';
            return '#64748b';
          }}
          maskColor="rgba(15, 23, 42, 0.8)"
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
}
