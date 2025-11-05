/**
 * Navigation Component
 * Provides navigation links between different views
 */

import { NavLink } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  description: string;
}

const navItems: NavItem[] = [
  {
    path: '/scada',
    label: 'SCADA',
    icon: '📊',
    description: 'Real-time monitoring of EoN nodes and devices',
  },
  {
    path: '/broker',
    label: 'Broker',
    icon: '🔌',
    description: 'Broker logs, sessions, and configuration',
  },
  {
    path: '/simulator',
    label: 'Simulator',
    icon: '⚙️',
    description: 'Graphical plant simulator designer',
  },
  {
    path: '/commands',
    label: 'Commands',
    icon: '📡',
    description: 'Device control and command scheduling',
  },
];

export function Navigation() {
  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-6 py-2">
      <div className="flex gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `group flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`
            }
            title={item.description}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
