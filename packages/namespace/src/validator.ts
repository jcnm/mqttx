// Sparkplug Topic Validator
// Validates topic components and message constraints

import { MessageType } from './types.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateTopic(topic: string): ValidationResult {
  const errors: string[] = [];

  if (!topic || topic.trim() === '') {
    errors.push('Topic cannot be empty');
    return { valid: false, errors };
  }

  if (topic.length > 65536) {
    errors.push('Topic exceeds maximum length of 65536 characters');
  }

  const parts = topic.split('/');

  if (parts.length < 3) {
    errors.push('Topic must have at least 3 parts');
  }

  // Check for invalid characters
  if (/[#\+]/.test(topic) && !topic.includes('#') && !topic.includes('+')) {
    errors.push('Topic contains invalid wildcard characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateNamespace(namespace: string): ValidationResult {
  const errors: string[] = [];

  if (!namespace || namespace.trim() === '') {
    errors.push('Namespace cannot be empty');
  } else if (!/^spB?v\d+\.\d+$/.test(namespace)) {
    errors.push(`Invalid namespace format: ${namespace}. Expected format: spBvX.Y`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateGroupId(groupId: string): ValidationResult {
  const errors: string[] = [];

  if (!groupId || groupId.trim() === '') {
    errors.push('Group ID cannot be empty');
  }

  if (groupId.includes('/')) {
    errors.push('Group ID cannot contain forward slashes');
  }

  if (groupId.includes('#') || groupId.includes('+')) {
    errors.push('Group ID cannot contain wildcard characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateEdgeNodeId(edgeNodeId: string): ValidationResult {
  const errors: string[] = [];

  if (!edgeNodeId || edgeNodeId.trim() === '') {
    errors.push('Edge Node ID cannot be empty');
  }

  if (edgeNodeId.includes('/')) {
    errors.push('Edge Node ID cannot contain forward slashes');
  }

  if (edgeNodeId.includes('#') || edgeNodeId.includes('+')) {
    errors.push('Edge Node ID cannot contain wildcard characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateDeviceId(deviceId: string): ValidationResult {
  const errors: string[] = [];

  if (!deviceId || deviceId.trim() === '') {
    errors.push('Device ID cannot be empty');
  }

  if (deviceId.includes('/')) {
    errors.push('Device ID cannot contain forward slashes');
  }

  if (deviceId.includes('#') || deviceId.includes('+')) {
    errors.push('Device ID cannot contain wildcard characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateMessageType(messageType: string): ValidationResult {
  const errors: string[] = [];

  const validTypes = [
    'NBIRTH',
    'NDEATH',
    'NDATA',
    'NCMD',
    'DBIRTH',
    'DDEATH',
    'DDATA',
    'DCMD',
    'STATE',
  ];

  if (!validTypes.includes(messageType)) {
    errors.push(`Invalid message type: ${messageType}. Must be one of: ${validTypes.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateQoS(qos: number, messageType: MessageType): ValidationResult {
  const errors: string[] = [];

  if (qos < 0 || qos > 2) {
    errors.push(`Invalid QoS: ${qos}. Must be 0, 1, or 2`);
  }

  // Sparkplug specification: LWT (NDEATH/DDEATH) must use QoS 0
  if ((messageType === MessageType.NDEATH || messageType === MessageType.DDEATH) && qos !== 0) {
    errors.push(`${messageType} messages must use QoS 0`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateRetain(retain: boolean, messageType: MessageType): ValidationResult {
  const errors: string[] = [];

  // Sparkplug specification: Only STATE messages should be retained
  if (retain && messageType !== MessageType.STATE) {
    errors.push(`Only STATE messages should be retained, not ${messageType}`);
  }

  // LWT messages (NDEATH/DDEATH) should not be retained
  if (
    retain &&
    (messageType === MessageType.NDEATH || messageType === MessageType.DDEATH)
  ) {
    errors.push(`${messageType} messages must not be retained`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
