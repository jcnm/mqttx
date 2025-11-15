/**
 * Alarm System for SCADA
 * Monitors metrics and triggers alarms based on configurable thresholds
 * Sparkplug B Compliant - uses quality codes for alarm states
 */

export enum AlarmSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum AlarmState {
  NORMAL = 'normal',
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  CLEARED = 'cleared',
}

export interface AlarmThreshold {
  id: string;
  metricName: string;
  nodeKey: string; // groupId/edgeNodeId or groupId/edgeNodeId/deviceId
  condition: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
  value: number;
  severity: AlarmSeverity;
  message: string;
  enabled: boolean;
}

export interface Alarm {
  id: string;
  thresholdId: string;
  nodeKey: string;
  metricName: string;
  severity: AlarmSeverity;
  state: AlarmState;
  message: string;
  value: number;
  threshold: number;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  clearedAt?: Date;
  acknowledgedBy?: string;
}

export class AlarmManager {
  private thresholds: Map<string, AlarmThreshold> = new Map();
  private activeAlarms: Map<string, Alarm> = new Map();
  private alarmHistory: Alarm[] = [];
  private listeners: Set<(alarm: Alarm) => void> = new Set();

  /**
   * Add alarm threshold
   */
  addThreshold(threshold: AlarmThreshold): void {
    this.thresholds.set(threshold.id, threshold);
  }

  /**
   * Remove alarm threshold
   */
  removeThreshold(id: string): void {
    this.thresholds.delete(id);
  }

  /**
   * Get all thresholds
   */
  getThresholds(): AlarmThreshold[] {
    return Array.from(this.thresholds.values());
  }

  /**
   * Get thresholds for a specific node/metric
   */
  getThresholdsFor(nodeKey: string, metricName?: string): AlarmThreshold[] {
    return Array.from(this.thresholds.values()).filter(
      (t) => t.nodeKey === nodeKey && (!metricName || t.metricName === metricName)
    );
  }

  /**
   * Check metric value against thresholds
   */
  checkMetric(nodeKey: string, metricName: string, value: number): void {
    const thresholds = this.getThresholdsFor(nodeKey, metricName).filter((t) => t.enabled);

    for (const threshold of thresholds) {
      const triggered = this.evaluateCondition(value, threshold.condition, threshold.value);
      const alarmKey = `${threshold.id}:${nodeKey}:${metricName}`;

      if (triggered && !this.activeAlarms.has(alarmKey)) {
        // Trigger new alarm
        const alarm: Alarm = {
          id: `alarm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          thresholdId: threshold.id,
          nodeKey,
          metricName,
          severity: threshold.severity,
          state: AlarmState.ACTIVE,
          message: threshold.message,
          value,
          threshold: threshold.value,
          triggeredAt: new Date(),
        };

        this.activeAlarms.set(alarmKey, alarm);
        this.alarmHistory.unshift(alarm);
        this.notifyListeners(alarm);
      } else if (!triggered && this.activeAlarms.has(alarmKey)) {
        // Clear alarm
        const alarm = this.activeAlarms.get(alarmKey)!;
        alarm.state = AlarmState.CLEARED;
        alarm.clearedAt = new Date();
        this.activeAlarms.delete(alarmKey);
        this.notifyListeners(alarm);
      }
    }
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'gt':
        return value > threshold;
      case 'lt':
        return value < threshold;
      case 'eq':
        return value === threshold;
      case 'ne':
        return value !== threshold;
      case 'gte':
        return value >= threshold;
      case 'lte':
        return value <= threshold;
      default:
        return false;
    }
  }

  /**
   * Acknowledge alarm
   */
  acknowledgeAlarm(alarmId: string, acknowledgedBy: string): void {
    for (const alarm of this.activeAlarms.values()) {
      if (alarm.id === alarmId) {
        alarm.state = AlarmState.ACKNOWLEDGED;
        alarm.acknowledgedAt = new Date();
        alarm.acknowledgedBy = acknowledgedBy;
        this.notifyListeners(alarm);
        break;
      }
    }
  }

  /**
   * Get active alarms
   */
  getActiveAlarms(): Alarm[] {
    return Array.from(this.activeAlarms.values());
  }

  /**
   * Get alarm history
   */
  getAlarmHistory(limit = 100): Alarm[] {
    return this.alarmHistory.slice(0, limit);
  }

  /**
   * Get alarm counts by severity
   */
  getAlarmCounts(): Record<AlarmSeverity, number> {
    const counts = {
      [AlarmSeverity.INFO]: 0,
      [AlarmSeverity.WARNING]: 0,
      [AlarmSeverity.CRITICAL]: 0,
    };

    for (const alarm of this.activeAlarms.values()) {
      counts[alarm.severity]++;
    }

    return counts;
  }

  /**
   * Subscribe to alarm events
   */
  subscribe(listener: (alarm: Alarm) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify listeners
   */
  private notifyListeners(alarm: Alarm): void {
    this.listeners.forEach((listener) => listener(alarm));
  }

  /**
   * Clear all alarms
   */
  clearAllAlarms(): void {
    for (const alarm of this.activeAlarms.values()) {
      alarm.state = AlarmState.CLEARED;
      alarm.clearedAt = new Date();
      this.notifyListeners(alarm);
    }
    this.activeAlarms.clear();
  }

  /**
   * Clear alarm history
   */
  clearHistory(): void {
    this.alarmHistory = [];
  }
}

// Singleton instance
export const alarmManager = new AlarmManager();

// Default alarm thresholds for common metrics
export const defaultThresholds: Omit<AlarmThreshold, 'id' | 'nodeKey'>[] = [
  {
    metricName: 'temperature',
    condition: 'gt',
    value: 80,
    severity: AlarmSeverity.CRITICAL,
    message: 'Temperature exceeded critical threshold',
    enabled: true,
  },
  {
    metricName: 'temperature',
    condition: 'gt',
    value: 60,
    severity: AlarmSeverity.WARNING,
    message: 'Temperature exceeded warning threshold',
    enabled: true,
  },
  {
    metricName: 'pressure',
    condition: 'gt',
    value: 150,
    severity: AlarmSeverity.CRITICAL,
    message: 'Pressure exceeded critical threshold',
    enabled: true,
  },
  {
    metricName: 'humidity',
    condition: 'gt',
    value: 90,
    severity: AlarmSeverity.WARNING,
    message: 'Humidity exceeded warning threshold',
    enabled: true,
  },
];
