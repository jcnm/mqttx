/**
 * Sessions Tab Component
 * Display active MQTT sessions with enhanced Sparkplug B tracking and stale detection
 */

import { useBrokerStore } from '../../stores/brokerStore';
import { SessionViewer } from './SessionViewer';

export function SessionsTab() {
  const { sessions } = useBrokerStore();

  // Convert Map to Array
  const sessionsList = Array.from(sessions.values());

  if (sessionsList.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">👥</div>
        <p className="text-slate-400">No active sessions</p>
        <p className="text-sm text-slate-500 mt-2">
          Client sessions will appear here when they connect to the broker
        </p>
      </div>
    );
  }

  return <SessionViewer sessions={sessionsList} />;
}
