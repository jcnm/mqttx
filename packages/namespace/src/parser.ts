// Sparkplug Topic Parser
// Parses and validates Sparkplug topic strings

import { MessageType, VALID_MESSAGE_TYPES, type ParsedTopic } from './types.js';

/**
 * Parse a Sparkplug topic string
 *
 * Formats:
 * - Node messages: {namespace}/{group_id}/N{type}/{edge_node_id}
 * - Device messages: {namespace}/{group_id}/D{type}/{edge_node_id}/{device_id}
 * - STATE messages: {namespace}/STATE/{host_id}
 * - Certificate topics: $sparkplug/certificates/{namespace}/{group_id}/{type}/{edge_node_id}[/{device_id}]
 */
export function parseTopic(topic: string): ParsedTopic {
  const errors: string[] = [];
  const parts = topic.split('/');

  // Handle $sparkplug/certificates topics
  if (topic.startsWith('$sparkplug/certificates/')) {
    return parseCertificateTopic(topic);
  }

  // Minimum 3 parts required
  if (parts.length < 3) {
    errors.push('Topic must have at least 3 parts');
    return {
      namespace: parts[0] || '',
      groupId: undefined,
      messageType: MessageType.NDATA,
      edgeNodeId: undefined,
      deviceId: undefined,
      isValid: false,
      raw: topic,
      errors,
    };
  }

  const [namespace, groupIdOrState, messageType, edgeNodeId, deviceId] = parts;

  // Handle STATE messages
  if (groupIdOrState === 'STATE') {
    return {
      namespace,
      groupId: undefined,
      messageType: MessageType.STATE,
      edgeNodeId: messageType, // For STATE, this is the host_id
      deviceId: undefined,
      isValid: validateNamespace(namespace, errors),
      raw: topic,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // Validate message type
  if (!VALID_MESSAGE_TYPES.has(messageType)) {
    errors.push(`Invalid message type: ${messageType}`);
  }

  // Node messages (NBIRTH, NDEATH, NDATA, NCMD)
  if (messageType.startsWith('N')) {
    if (parts.length !== 4) {
      errors.push(`Node messages must have exactly 4 parts, got ${parts.length}`);
    }

    return {
      namespace,
      groupId: groupIdOrState,
      messageType: messageType as MessageType,
      edgeNodeId,
      deviceId: undefined,
      isValid: errors.length === 0 && validateNamespace(namespace, errors),
      raw: topic,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // Device messages (DBIRTH, DDEATH, DDATA, DCMD)
  if (messageType.startsWith('D')) {
    if (parts.length !== 5) {
      errors.push(`Device messages must have exactly 5 parts, got ${parts.length}`);
    }

    return {
      namespace,
      groupId: groupIdOrState,
      messageType: messageType as MessageType,
      edgeNodeId,
      deviceId,
      isValid: errors.length === 0 && validateNamespace(namespace, errors),
      raw: topic,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  errors.push('Message type must start with N, D, or be STATE');

  return {
    namespace,
    groupId: groupIdOrState,
    messageType: messageType as MessageType,
    edgeNodeId,
    deviceId,
    isValid: false,
    raw: topic,
    errors,
  };
}

function parseCertificateTopic(topic: string): ParsedTopic {
  const errors: string[] = [];
  const parts = topic.split('/');

  // $sparkplug/certificates/{namespace}/{group_id}/NBIRTH/{edge_node_id}
  // $sparkplug/certificates/{namespace}/{group_id}/DBIRTH/{edge_node_id}/{device_id}

  if (parts.length < 6) {
    errors.push('Certificate topic must have at least 6 parts');
    return {
      namespace: parts[2] || '',
      groupId: parts[3],
      messageType: MessageType.NBIRTH,
      edgeNodeId: undefined,
      deviceId: undefined,
      isValid: false,
      raw: topic,
      errors,
    };
  }

  const [, , namespace, groupId, messageType, edgeNodeId, deviceId] = parts;

  if (messageType !== 'NBIRTH' && messageType !== 'DBIRTH') {
    errors.push(`Certificate topics only support NBIRTH and DBIRTH, got ${messageType}`);
  }

  return {
    namespace,
    groupId,
    messageType: messageType as MessageType,
    edgeNodeId,
    deviceId: messageType === 'DBIRTH' ? deviceId : undefined,
    isValid: errors.length === 0,
    raw: topic,
    errors: errors.length > 0 ? errors : undefined,
  };
}

function validateNamespace(namespace: string, errors: string[]): boolean {
  if (!namespace || namespace.trim() === '') {
    errors.push('Namespace cannot be empty');
    return false;
  }

  // Common namespace format: spBv1.0
  if (!/^spB?v\d+\.\d+$/.test(namespace)) {
    errors.push(`Namespace format should be spBvX.Y, got ${namespace}`);
    return false;
  }

  return true;
}

export function isNodeMessage(messageType: MessageType): boolean {
  return messageType.startsWith('N');
}

export function isDeviceMessage(messageType: MessageType): boolean {
  return messageType.startsWith('D');
}

export function isBirthMessage(messageType: MessageType): boolean {
  return messageType === MessageType.NBIRTH || messageType === MessageType.DBIRTH;
}

export function isDeathMessage(messageType: MessageType): boolean {
  return messageType === MessageType.NDEATH || messageType === MessageType.DDEATH;
}

export function isDataMessage(messageType: MessageType): boolean {
  return messageType === MessageType.NDATA || messageType === MessageType.DDATA;
}

export function isCommandMessage(messageType: MessageType): boolean {
  return messageType === MessageType.NCMD || messageType === MessageType.DCMD;
}
