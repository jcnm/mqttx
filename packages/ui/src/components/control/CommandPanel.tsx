import { useState } from 'react';
import { useNamespaceStore } from '../../stores/namespaceStore';
import { useMQTTStore } from '../../stores/mqttStore';

export function CommandPanel() {
  const { nodes } = useNamespaceStore();
  const { publish } = useMQTTStore();

  const [selectedNode, setSelectedNode] = useState('');
  const [commandType, setCommandType] = useState<'rebirth' | 'custom'>('rebirth');

  const handleSendCommand = () => {
    if (!selectedNode) return;

    const [groupId, edgeNodeId] = selectedNode.split('/');
    const topic = `spBv1.0/${groupId}/NCMD/${edgeNodeId}`;

    // This is a simplified command - in production, you'd encode a proper Sparkplug payload
    publish(topic, JSON.stringify({ command: commandType }));

    console.log(`Sent ${commandType} command to ${selectedNode}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Command Panel</h2>
        <p className="text-slate-400">
          Send commands to nodes and devices
        </p>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 max-w-2xl">
        <h3 className="text-lg font-semibold mb-4">Send Node Command (NCMD)</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Node
            </label>
            <select
              value={selectedNode}
              onChange={(e) => setSelectedNode(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
            >
              <option value="">-- Select a node --</option>
              {nodes.map((node) => (
                <option
                  key={`${node.groupId}/${node.edgeNodeId}`}
                  value={`${node.groupId}/${node.edgeNodeId}`}
                >
                  {node.groupId}/{node.edgeNodeId} ({node.online ? 'Online' : 'Offline'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Command Type
            </label>
            <select
              value={commandType}
              onChange={(e) => setCommandType(e.target.value as any)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
            >
              <option value="rebirth">Rebirth (Node Control/Rebirth)</option>
              <option value="custom">Custom Command</option>
            </select>
          </div>

          <button
            onClick={handleSendCommand}
            disabled={!selectedNode}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Send Command
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 max-w-2xl">
        <h3 className="text-lg font-semibold mb-2">About Commands</h3>
        <div className="text-sm text-slate-400 space-y-2">
          <p>
            <strong className="text-slate-300">Rebirth:</strong> Requests the node to republish
            its NBIRTH message, resetting its state and reestablishing all metrics.
          </p>
          <p>
            <strong className="text-slate-300">Custom Command:</strong> Send custom metric commands
            to control node behavior.
          </p>
        </div>
      </div>
    </div>
  );
}
