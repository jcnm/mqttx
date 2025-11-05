import { useNamespaceStore } from '../../stores/namespaceStore';
import { useMQTTStore } from '../../stores/mqttStore';

export function SCADACanvas() {
  const { nodes, devices } = useNamespaceStore();
  const { messages } = useMQTTStore();

  const onlineNodes = nodes.filter((n) => n.online).length;
  const onlineDevices = devices.filter((d) => d.online).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">SCADA Dashboard</h2>
        <p className="text-slate-400">
          Real-time monitoring and control
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6">
          <div className="text-blue-100 text-sm font-medium">Total Nodes</div>
          <div className="text-4xl font-bold text-white mt-2">{nodes.length}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6">
          <div className="text-green-100 text-sm font-medium">Online Nodes</div>
          <div className="text-4xl font-bold text-white mt-2">{onlineNodes}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6">
          <div className="text-purple-100 text-sm font-medium">Total Devices</div>
          <div className="text-4xl font-bold text-white mt-2">{devices.length}</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6">
          <div className="text-orange-100 text-sm font-medium">Online Devices</div>
          <div className="text-4xl font-bold text-white mt-2">{onlineDevices}</div>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Messages</h3>

        <div className="space-y-2 max-h-96 overflow-auto">
          {messages.slice(-10).reverse().map((msg, idx) => (
            <div key={idx} className="bg-slate-700 rounded px-4 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-mono">{msg.topic}</span>
                <span className="text-slate-500 text-xs">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}

          {messages.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-8">
              No messages received yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
