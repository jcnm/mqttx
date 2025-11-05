import { useState, useEffect } from 'react';
import { useMQTTStore } from './stores/mqttStore';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { NamespaceExplorer } from './components/namespace/NamespaceExplorer';
import { SCADACanvas } from './components/scada/SCADACanvas';
import { CommandPanel } from './components/control/CommandPanel';

function App() {
  const [activeView, setActiveView] = useState<'explorer' | 'scada' | 'commands'>('scada');
  const { connect, disconnect, isConnected } = useMQTTStore();

  useEffect(() => {
    // Connect to broker on mount
    const brokerUrl = import.meta.env.VITE_BROKER_URL || 'ws://localhost:8083';
    connect(brokerUrl);

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <div className="flex-1 flex flex-col">
        <Header isConnected={isConnected} />

        <main className="flex-1 overflow-auto p-6">
          {activeView === 'explorer' && <NamespaceExplorer />}
          {activeView === 'scada' && <SCADACanvas />}
          {activeView === 'commands' && <CommandPanel />}
        </main>
      </div>
    </div>
  );
}

export default App;
