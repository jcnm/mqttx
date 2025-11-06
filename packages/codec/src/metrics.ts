// Sparkplug B Metric Utilities

import type { Metric, DataType } from './types.js';

export function createMetric(
  name: string,
  datatype: DataType,
  value: Metric['value'],
  options: {
    alias?: bigint;
    timestamp?: bigint;
    isHistorical?: boolean;
    isTransient?: boolean;
    properties?: Metric['properties'];
  } = {}
): Metric {
  return {
    name,
    datatype,
    value,
    timestamp: options.timestamp ?? BigInt(Date.now()),
    alias: options.alias,
    isHistorical: options.isHistorical,
    isTransient: options.isTransient,
    properties: options.properties,
    isNull: value === null || value === undefined,
  };
}

export function createInt32Metric(name: string, value: number, alias?: bigint): Metric {
  return createMetric(name, 3, value, { alias });
}

export function createInt64Metric(name: string, value: bigint, alias?: bigint): Metric {
  return createMetric(name, 4, value, { alias });
}

export function createFloatMetric(name: string, value: number, alias?: bigint): Metric {
  return createMetric(name, 9, value, { alias });
}

export function createDoubleMetric(name: string, value: number, alias?: bigint): Metric {
  return createMetric(name, 10, value, { alias });
}

export function createBooleanMetric(name: string, value: boolean, alias?: bigint): Metric {
  return createMetric(name, 11, value, { alias });
}

export function createStringMetric(name: string, value: string, alias?: bigint): Metric {
  return createMetric(name, 12, value, { alias });
}

export function createRebirthMetric(): Metric {
  return createBooleanMetric('Node Control/Rebirth', true);
}

export function getMetricValue<T = Metric['value']>(metric: Metric): T | null {
  if (metric.isNull) {
    return null;
  }
  return metric.value as T;
}

export function setMetricValue(metric: Metric, value: Metric['value']): Metric {
  return {
    ...metric,
    value,
    isNull: value === null || value === undefined,
    timestamp: BigInt(Date.now()),
  };
}
