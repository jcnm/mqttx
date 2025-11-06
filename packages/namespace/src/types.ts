// Sparkplug Topic Namespace Types

export enum MessageType {
  NBIRTH = 'NBIRTH',
  NDEATH = 'NDEATH',
  DBIRTH = 'DBIRTH',
  DDEATH = 'DDEATH',
  NDATA = 'NDATA',
  DDATA = 'DDATA',
  NCMD = 'NCMD',
  DCMD = 'DCMD',
  STATE = 'STATE',
}

export interface SparkplugTopic {
  namespace: string;
  groupId?: string;
  messageType: MessageType;
  edgeNodeId?: string;
  deviceId?: string;
}

export interface ParsedTopic extends SparkplugTopic {
  isValid: boolean;
  raw: string;
  errors?: string[];
}

export const VALID_MESSAGE_TYPES = new Set([
  'NBIRTH',
  'NDEATH',
  'DBIRTH',
  'DDEATH',
  'NDATA',
  'DDATA',
  'NCMD',
  'DCMD',
  'STATE',
]);
