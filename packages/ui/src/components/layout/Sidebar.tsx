import { BarChart3, GitBranch, Zap, type LucideIcon } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: 'explorer' | 'scada' | 'commands') => void;
}

interface ViewItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const views: ViewItem[] = [
    { id: 'scada', label: 'SCADA Dashboard', icon: BarChart3 },
    { id: 'explorer', label: 'Namespace Explorer', icon: GitBranch },
    { id: 'commands', label: 'Command Panel', icon: Zap },
  ];

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700">
      <div className="p-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Views
        </div>

        <nav className="space-y-2">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === view.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <view.icon className="w-5 h-5" />
              <span className="font-medium">{view.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
