/**
 * Alarm Monitoring Hook
 * Automatically monitors SCADA metrics and triggers alarms
 */

import { useEffect } from 'react';
import { useSCADAStore } from '../stores/scadaStore';
import { alarmManager } from '../services/alarmSystem';
import { toastService } from '../services/toastService';
import type { Alarm } from '../services/alarmSystem';

export function useAlarmMonitoring() {
  const { nodes } = useSCADAStore();

  // Monitor node metrics
  useEffect(() => {
    nodes.forEach((node) => {
      const nodeKey = `${node.groupId}/${node.edgeNodeId}`;

      node.metrics.forEach((metric, metricName) => {
        const value = metric.value;

        // Only check numeric values
        if (typeof value === 'number') {
          alarmManager.checkMetric(nodeKey, metricName, value);
        }
      });
    });
  }, [nodes]);

  // Monitor device metrics
  useEffect(() => {
    // For devices, we need to get groupId/edgeNodeId from parent node
    nodes.forEach((node) => {
      node.devices.forEach((device) => {
        const deviceKey = `${node.groupId}/${node.edgeNodeId}/${device.deviceId}`;

        device.metrics.forEach((metric, metricName) => {
          const value = metric.value;

          // Only check numeric values
          if (typeof value === 'number') {
            alarmManager.checkMetric(deviceKey, metricName, value);
          }
        });
      });
    });
  }, [nodes]);

  // Subscribe to alarm notifications
  useEffect(() => {
    const unsubscribe = alarmManager.subscribe((alarm: Alarm) => {
      if (alarm.state === 'active') {
        // Show toast notification for new alarms
        switch (alarm.severity) {
          case 'critical':
            toastService.error(`🚨 ${alarm.message}`, 10000);
            break;
          case 'warning':
            toastService.warning(`⚠️ ${alarm.message}`);
            break;
          case 'info':
            toastService.info(`ℹ️ ${alarm.message}`);
            break;
        }
      }
    });

    return unsubscribe;
  }, []);
}
