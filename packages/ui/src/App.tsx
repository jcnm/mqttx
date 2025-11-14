import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useMQTTStore } from './stores/mqttStore';
import { useBrokerStore } from './stores/brokerStore';
import { useSettingsStore } from './stores/settingsStore';
import { useAuthStore } from './stores/authStore';
import { Header } from './components/layout/Header';
import { SettingsModal } from './components/settings/SettingsModal';
import { LoginPage } from './components/auth/LoginPage';

// Components
import { SCADAView } from './components/scada/SCADAView';
import { BrokerViewer } from './components/broker/BrokerViewer';
import { PlantSimulatorNew } from './components/simulator/PlantSimulatorNew';
import { CommandPanel } from './components/commands/CommandPanel';

function App() {
  const { connect, disconnect, isConnected, setOnMessage } = useMQTTStore();
  const { addLog } = useBrokerStore();
  const { getBrokerUrl } = useSettingsStore();
  const { user, checkAuth } = useAuthStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Check for existing authentication on mount
    checkAuth();
    setAuthChecked(true);
  }, [checkAuth]);

  useEffect(() => {
    // Only connect to broker if authenticated
    if (!user) return;

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
  }, [user, connect, disconnect, setOnMessage, addLog, getBrokerUrl]);

  // Wait for auth check to complete
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

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
