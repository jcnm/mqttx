import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useBrokerStore } from './stores/brokerStore';
import { useSettingsStore } from './stores/settingsStore';
import { useAuthStore } from './stores/authStore';
import { useSimulatorStore } from './stores/simulatorStore';
import { Header } from './components/layout/Header';
import { SettingsModal } from './components/settings/SettingsModal';
import { LoginPage } from './components/auth/LoginPage';
import { initBrokerWebSocket, cleanupBrokerWebSocket } from './services/brokerWebSocket';
import { simulationService } from './services/simulationService';
import { scadaMqttService } from './services/scadaMqttService';

// Components
import { SCADAView } from './components/scada/SCADAView';
import { BrokerViewer } from './components/broker/BrokerViewer';
import { PlantSimulatorNew } from './components/simulator/PlantSimulatorNew';
import { CommandPanel } from './components/commands/CommandPanel';

function App() {
  const { addLog } = useBrokerStore();
  const { getBrokerUrl } = useSettingsStore();
  const { user, checkAuth } = useAuthStore();
  const { initializeDemo, startSimulation } = useSimulatorStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [scadaConnected, setScadaConnected] = useState(false);

  // DEBUG: Log pour voir où on en est
  console.log('🔍 App render - authChecked:', authChecked, 'user:', user);

  // Check connection status periodically
  useEffect(() => {
    const checkConnections = () => {
      setScadaConnected(scadaMqttService.isClientConnected());
    };

    // Check immediately
    checkConnections();

    // Check every 2 seconds
    const interval = setInterval(checkConnections, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check for existing authentication on mount
    console.log('🔍 Running checkAuth...');
    checkAuth();
    setAuthChecked(true);
  }, [checkAuth]);

  useEffect(() => {
    // Only connect to broker if authenticated
    if (!user) {
      console.log('🔍 No user, skipping broker initialization');
      return;
    }

    console.log('🔍 User authenticated, initializing services...');
    const brokerUrl = getBrokerUrl();
    console.log('🔍 Broker URL:', brokerUrl);

    console.log('🔌 Initializing 3 separate MQTT connections...');

    // 1. Connect SCADA MQTT Service (Host Application)
    scadaMqttService.connect(brokerUrl);
    scadaMqttService.setOnMessage((log) => {
      addLog(log);
    });
    setScadaConnected(true);

    // 2. Initialize Simulation Service (EoN/Device)
    if (!simulationService.isReady()) {
      console.log('🎮 Initializing Simulation Service');
      simulationService.initialize(brokerUrl, 1);

      // Initialize demo configuration with sample nodes
      initializeDemo();

      // Don't auto-start - user must manually start simulation
    }

    // 3. Initialize Broker WebSocket for real-time monitoring
    console.log('🔌 Initializing Broker WebSocket connection...');
    initBrokerWebSocket();

    return () => {
      // Disconnect SCADA service
      scadaMqttService.disconnect();
      setScadaConnected(false);

      // Disconnect broker WebSocket
      cleanupBrokerWebSocket();

      // Note: We do NOT destroy simulationService here because we want
      // the simulation to persist across route changes
      // It will be destroyed only on app unmount
    };
  }, [user, addLog, getBrokerUrl]);

  // Wait for auth check to complete
  if (!authChecked) {
    console.log('🔍 Waiting for auth check...');
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    console.log('🔍 No user, showing login page');
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  console.log('🔍 Rendering main app...');
  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
        <Header isConnected={scadaConnected} onOpenSettings={() => setSettingsOpen(true)} />

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
