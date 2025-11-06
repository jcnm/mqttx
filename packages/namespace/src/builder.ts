// Sparkplug Topic Builder
// Constructs valid Sparkplug topic strings

import { MessageType, type SparkplugTopic } from './types.js';

export interface BuildOptions {
  namespace?: string;
  groupId: string;
  edgeNodeId: string;
  deviceId?: string;
}

export function buildNodeBirthTopic(options: BuildOptions): string {
  const namespace = options.namespace || 'spBv1.0';
  return `${namespace}/${options.groupId}/NBIRTH/${options.edgeNodeId}`;
}

export function buildNodeDeathTopic(options: BuildOptions): string {
  const namespace = options.namespace || 'spBv1.0';
  return `${namespace}/${options.groupId}/NDEATH/${options.edgeNodeId}`;
}

export function buildNodeDataTopic(options: BuildOptions): string {
  const namespace = options.namespace || 'spBv1.0';
  return `${namespace}/${options.groupId}/NDATA/${options.edgeNodeId}`;
}

export function buildNodeCommandTopic(options: BuildOptions): string {
  const namespace = options.namespace || 'spBv1.0';
  return `${namespace}/${options.groupId}/NCMD/${options.edgeNodeId}`;
}

export function buildDeviceBirthTopic(options: BuildOptions): string {
  if (!options.deviceId) {
    throw new Error('deviceId is required for device topics');
  }
  const namespace = options.namespace || 'spBv1.0';
  return `${namespace}/${options.groupId}/DBIRTH/${options.edgeNodeId}/${options.deviceId}`;
}

export function buildDeviceDeathTopic(options: BuildOptions): string {
  if (!options.deviceId) {
    throw new Error('deviceId is required for device topics');
  }
  const namespace = options.namespace || 'spBv1.0';
  return `${namespace}/${options.groupId}/DDEATH/${options.edgeNodeId}/${options.deviceId}`;
}

export function buildDeviceDataTopic(options: BuildOptions): string {
  if (!options.deviceId) {
    throw new Error('deviceId is required for device topics');
  }
  const namespace = options.namespace || 'spBv1.0';
  return `${namespace}/${options.groupId}/DDATA/${options.edgeNodeId}/${options.deviceId}`;
}

export function buildDeviceCommandTopic(options: BuildOptions): string {
  if (!options.deviceId) {
    throw new Error('deviceId is required for device topics');
  }
  const namespace = options.namespace || 'spBv1.0';
  return `${namespace}/${options.groupId}/DCMD/${options.edgeNodeId}/${options.deviceId}`;
}

export function buildStateTopic(hostId: string, namespace = 'spBv1.0'): string {
  return `${namespace}/STATE/${hostId}`;
}

export function buildCertificateTopicNBirth(options: BuildOptions): string {
  const namespace = options.namespace || 'spBv1.0';
  return `$sparkplug/certificates/${namespace}/${options.groupId}/NBIRTH/${options.edgeNodeId}`;
}

export function buildCertificateTopicDBirth(options: BuildOptions): string {
  if (!options.deviceId) {
    throw new Error('deviceId is required for device certificate topics');
  }
  const namespace = options.namespace || 'spBv1.0';
  return `$sparkplug/certificates/${namespace}/${options.groupId}/DBIRTH/${options.edgeNodeId}/${options.deviceId}`;
}

export function buildTopic(
  messageType: MessageType,
  options: BuildOptions
): string {
  switch (messageType) {
    case MessageType.NBIRTH:
      return buildNodeBirthTopic(options);
    case MessageType.NDEATH:
      return buildNodeDeathTopic(options);
    case MessageType.NDATA:
      return buildNodeDataTopic(options);
    case MessageType.NCMD:
      return buildNodeCommandTopic(options);
    case MessageType.DBIRTH:
      return buildDeviceBirthTopic(options);
    case MessageType.DDEATH:
      return buildDeviceDeathTopic(options);
    case MessageType.DDATA:
      return buildDeviceDataTopic(options);
    case MessageType.DCMD:
      return buildDeviceCommandTopic(options);
    case MessageType.STATE:
      return buildStateTopic(options.edgeNodeId, options.namespace);
    default:
      throw new Error(`Unknown message type: ${messageType}`);
  }
}

export function buildWildcardSubscription(
  namespace = 'spBv1.0',
  groupId = '+',
  messageType = '+',
  edgeNodeId = '+',
  deviceId?: string
): string {
  if (deviceId !== undefined) {
    return `${namespace}/${groupId}/${messageType}/${edgeNodeId}/${deviceId}`;
  }
  return `${namespace}/${groupId}/${messageType}/${edgeNodeId}`;
}

export function buildAllNodeBirthsSubscription(namespace = 'spBv1.0'): string {
  return `${namespace}/+/NBIRTH/+`;
}

export function buildAllDeviceBirthsSubscription(namespace = 'spBv1.0'): string {
  return `${namespace}/+/DBIRTH/+/+`;
}

export function buildAllDataSubscription(namespace = 'spBv1.0'): string {
  return `${namespace}/+/+DATA/+/#`;
}

export function buildGroupSubscription(
  groupId: string,
  namespace = 'spBv1.0'
): string {
  return `${namespace}/${groupId}/#`;
}
