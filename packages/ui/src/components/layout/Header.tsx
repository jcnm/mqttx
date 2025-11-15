import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface HeaderProps {
  isConnected: boolean;
  onOpenSettings?: () => void;
}

const navLinks = [
  { path: '/scada', label: 'SCADA', icon: '📊' },
  { path: '/broker', label: 'Broker', icon: '🔌' },
  { path: '/simulator', label: 'Simulator', icon: '⚙️' },
  { path: '/commands', label: 'Commands', icon: '📡' },
];

export function Header({ isConnected, onOpenSettings }: HeaderProps) {
  const { user, logout } = useAuthStore();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-900/30 text-red-400 border-red-800';
      case 'operator':
        return 'bg-blue-900/30 text-blue-400 border-blue-800';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Sparkplug B MQTT Analyser</h1>
            <p className="text-xs text-slate-400">ISO/IEC 20237:2023 Compliant • Industrial SCADA Platform</p>
          </div>

          <div className="flex items-center gap-4">
            {/* User Info */}
            {user && (
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
                <span className="text-sm text-slate-300">{user.username}</span>
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded border ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
              </div>
            )}

            {/* Connection Status */}
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

            {/* Settings Button */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                title="Settings"
              >
                <span>⚙️</span>
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={logout}
              className="px-3 py-2 bg-red-900/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-red-800/30"
              title="Logout"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
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
