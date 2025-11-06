/**
 * Data Generator Service
 * Generates metric values based on various logic types
 */

import type { DataGenerationLogic } from '../types/simulator.types';

/**
 * Simple seeded random number generator for reproducibility
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
}

/**
 * Generate a static value
 */
export function generateStaticValue(value: number): number {
  return value;
}

/**
 * Generate a random value within a range
 * @param min Minimum value
 * @param max Maximum value
 * @param seed Optional seed for reproducibility
 */
export function generateRandomValue(min: number, max: number, seed?: number): number {
  if (seed !== undefined) {
    const rng = new SeededRandom(seed);
    return min + rng.next() * (max - min);
  }
  return min + Math.random() * (max - min);
}

/**
 * Generate a sine wave value
 * @param time Current time in seconds
 * @param amplitude Wave amplitude
 * @param frequency Wave frequency in Hz
 * @param phase Phase shift in radians (default: 0)
 * @param offset Vertical offset (default: 0)
 */
export function generateSineValue(
  time: number,
  amplitude: number,
  frequency: number,
  phase: number = 0,
  offset: number = 0
): number {
  return amplitude * Math.sin(2 * Math.PI * frequency * time + phase) + offset;
}

/**
 * Generate a linear trend value
 * @param time Current time in seconds
 * @param start Starting value
 * @param slope Rate of change per second
 */
export function generateLinearValue(time: number, start: number, slope: number): number {
  return start + slope * time;
}

/**
 * Generate a value using a custom JavaScript formula
 * @param time Current time in seconds
 * @param formula JavaScript expression (e.g., "Math.sin(t) * 100")
 * @returns Evaluated value or 0 if formula is invalid
 */
export function generateFormulaValue(time: number, formula: string): number {
  try {
    // Create a safe evaluation context with 't' as the time variable
    // @ts-ignore - 't' is used in the eval'd formula string
    const t = time;
    const result = eval(formula);
    return typeof result === 'number' ? result : 0;
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return 0;
  }
}

/**
 * Apply noise to a value
 * @param value Base value
 * @param noiseLevel Noise level as a percentage (0-1)
 */
export function applyNoise(value: number, noiseLevel: number): number {
  const noise = (Math.random() - 0.5) * 2 * noiseLevel * Math.abs(value);
  return value + noise;
}

/**
 * Generate a metric value based on data generation logic
 * @param time Current time in seconds
 * @param logic Data generation logic configuration
 * @param speedMultiplier Simulation speed multiplier
 * @returns Generated value
 */
export function generateMetricValue(
  time: number,
  logic: DataGenerationLogic,
  speedMultiplier: number = 1
): number {
  const adjustedTime = time * speedMultiplier;

  switch (logic.type) {
    case 'static':
      return logic.params.value ?? 0;

    case 'random': {
      const min = logic.params.min ?? 0;
      const max = logic.params.max ?? 100;
      const seed = logic.params.seed;
      return generateRandomValue(min, max, seed);
    }

    case 'sine': {
      const amplitude = logic.params.amplitude ?? 1;
      const frequency = logic.params.frequency ?? 1;
      const phase = logic.params.phase ?? 0;
      const offset = logic.params.min !== undefined && logic.params.max !== undefined
        ? (logic.params.min + logic.params.max) / 2
        : 0;
      return generateSineValue(adjustedTime, amplitude, frequency, phase, offset);
    }

    case 'linear': {
      const start = logic.params.value ?? 0;
      const slope = logic.params.slope ?? 1;
      return generateLinearValue(adjustedTime, start, slope);
    }

    case 'formula': {
      const formula = logic.params.formula ?? 't';
      return generateFormulaValue(adjustedTime, formula);
    }

    default:
      return 0;
  }
}

/**
 * Clamp a value between min and max
 */
export function clampValue(value: number, min?: number, max?: number): number {
  let result = value;
  if (min !== undefined && result < min) result = min;
  if (max !== undefined && result > max) result = max;
  return result;
}

/**
 * Convert value to appropriate Sparkplug datatype
 * @param value Raw value
 * @param datatype Sparkplug datatype code
 * @returns Typed value
 */
export function convertToDatatype(
  value: number,
  datatype: number
): number | bigint | boolean | string {
  switch (datatype) {
    // Integer types (1-4)
    case 1: // Int8
    case 2: // Int16
    case 3: // Int32
      return Math.floor(value);

    case 4: // Int64
      return BigInt(Math.floor(value));

    // Unsigned integer types (5-8)
    case 5: // UInt8
    case 6: // UInt16
    case 7: // UInt32
      return Math.floor(Math.abs(value));

    case 8: // UInt64
      return BigInt(Math.floor(Math.abs(value)));

    // Float types (9-10)
    case 9: // Float
    case 10: // Double
      return value;

    // Boolean (11)
    case 11:
      return value > 0.5;

    // String (12)
    case 12:
      return value.toString();

    // DateTime (13)
    case 13:
      return BigInt(Math.floor(value));

    // Text (14)
    case 14:
      return value.toString();

    default:
      return value;
  }
}

/**
 * Generate preview data for a metric over a time period
 * @param logic Data generation logic
 * @param durationSeconds Duration in seconds
 * @param samplesPerSecond Number of samples per second
 * @returns Array of { time, value } pairs
 */
export function generatePreviewData(
  logic: DataGenerationLogic,
  durationSeconds: number = 10,
  samplesPerSecond: number = 10
): Array<{ time: number; value: number }> {
  const totalSamples = durationSeconds * samplesPerSecond;
  const data: Array<{ time: number; value: number }> = [];

  for (let i = 0; i < totalSamples; i++) {
    const time = i / samplesPerSecond;
    const value = generateMetricValue(time, logic, 1);
    data.push({ time, value });
  }

  return data;
}
