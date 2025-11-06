import { useNamespaceStore } from '../../stores/namespaceStore';

export function NamespaceExplorer() {
  const { nodes, devices } = useNamespaceStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Namespace Explorer</h2>
        <p className="text-slate-400">
          Visualize your Sparkplug namespace hierarchy
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Edge Nodes ({nodes.length})</h3>

          <div className="space-y-2">
            {nodes.length === 0 ? (
              <p className="text-slate-400 text-sm">No nodes discovered yet</p>
            ) : (
              nodes.map((node) => (
                <div
                  key={`${node.groupId}/${node.edgeNodeId}`}
                  className="bg-slate-700 rounded px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{node.edgeNodeId}</div>
                      <div className="text-sm text-slate-400">Group: {node.groupId}</div>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        node.online ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    bdSeq: {node.bdSeq}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Devices ({devices.length})</h3>

          <div className="space-y-2">
            {devices.length === 0 ? (
              <p className="text-slate-400 text-sm">No devices discovered yet</p>
            ) : (
              devices.map((device) => (
                <div
                  key={`${device.groupId}/${device.edgeNodeId}/${device.deviceId}`}
                  className="bg-slate-700 rounded px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{device.deviceId}</div>
                      <div className="text-sm text-slate-400">
                        {device.groupId}/{device.edgeNodeId}
                      </div>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        device.online ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
