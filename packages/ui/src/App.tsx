import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useMQTTStore } from './stores/mqttStore';
import { useBrokerStore } from './stores/brokerStore';
import { useSettingsStore } from './stores/settingsStore';
import { Header } from './components/layout/Header';
import { SettingsModal } from './components/settings/SettingsModal';

// Components
import { SCADAView } from './components/scada/SCADAView';
import { BrokerViewer } from './components/broker/BrokerViewer';
import { PlantSimulatorNew } from './components/simulator/PlantSimulatorNew';
import { CommandPanel } from './components/commands/CommandPanel';

function App() {
  const { connect, disconnect, isConnected, setOnMessage } = useMQTTStore();
  const { addLog } = useBrokerStore();
  const { getBrokerUrl } = useSettingsStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // Connect to broker on mount using settings
    const brokerUrl = getBrokerUrl();
    connect(brokerUrl);

    // Set up message callback for broker store integration
    setOnMessage((log) => {
      addLog(log);
    });

    return () => {
      disconnect();
    };
  }, [connect, disconnect, setOnMessage, addLog, getBrokerUrl]);

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
        <Header isConnected={isConnected} onOpenSettings={() => setSettingsOpen(true)} />

        <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/scada" replace />} />
            <Route path="/scada" element={<SCADAView />} />
            <Route path="/broker" element={<BrokerViewer />} />
            <Route path="/simulator" element={<PlantSimulatorNew />} />
            <Route path="/commands" element={<CommandPanel />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
