import { NavLink } from 'react-router-dom';

interface HeaderProps {
  isConnected: boolean;
}

const navLinks = [
  { path: '/scada', label: 'SCADA', icon: '📊' },
  { path: '/broker', label: 'Broker', icon: '🔌' },
  { path: '/simulator', label: 'Simulator', icon: '⚙️' },
  { path: '/commands', label: 'Commands', icon: '📡' },
];

export function Header({ isConnected }: HeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Sparkplug B MQTT Analyser</h1>
            <p className="text-xs text-slate-400">ISO/IEC 20237:2023 Compliant • Industrial SCADA Platform</p>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-xs text-slate-300">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <nav className="px-6 border-t border-slate-800">
        <div className="flex gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium transition-colors relative ${
                  isActive
                    ? 'text-white bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
