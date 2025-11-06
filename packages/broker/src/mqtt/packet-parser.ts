/**
 * MQTT Packet Parser
 * Extracts detailed MQTT packet structure for deep inspection
 */

export interface MQTTFixedHeader {
  messageType: number;
  messageTypeName: string;
  dup: boolean;
  qos: 0 | 1 | 2;
  retain: boolean;
  remainingLength: number;
}

export interface MQTTVariableHeader {
  topicName?: string;
  packetIdentifier?: number;
  properties?: Record<string, any>;
  protocolName?: string;
  protocolLevel?: number;
  connectFlags?: {
    cleanSession?: boolean;
    willFlag?: boolean;
    willQoS?: number;
    willRetain?: boolean;
    passwordFlag?: boolean;
    usernameFlag?: boolean;
  };
  keepAlive?: number;
  sessionPresent?: boolean;
  returnCode?: number;
}

export interface MQTTPacketDetails {
  fixedHeader: MQTTFixedHeader;
  variableHeader: MQTTVariableHeader;
  payloadLength: number;
  totalPacketSize: number;
  raw: Uint8Array;
}

const PACKET_TYPES: Record<number, string> = {
  1: 'CONNECT',
  2: 'CONNACK',
  3: 'PUBLISH',
  4: 'PUBACK',
  5: 'PUBREC',
  6: 'PUBREL',
  7: 'PUBCOMP',
  8: 'SUBSCRIBE',
  9: 'SUBACK',
  10: 'UNSUBSCRIBE',
  11: 'UNSUBACK',
  12: 'PINGREQ',
  13: 'PINGRESP',
  14: 'DISCONNECT',
  15: 'AUTH',
};

/**
 * Parse MQTT packet from Aedes packet object
 */
export function parseMQTTPacket(aedesPacket: any): MQTTPacketDetails | null {
  try {
    // Extract command byte (MQTT fixed header first byte)
    const cmd = aedesPacket.cmd || 'publish';
    const messageType = getMessageTypeFromCmd(cmd);
    const messageTypeName = PACKET_TYPES[messageType] || 'UNKNOWN';

    // Build fixed header
    const fixedHeader: MQTTFixedHeader = {
      messageType,
      messageTypeName,
      dup: aedesPacket.dup || false,
      qos: (aedesPacket.qos || 0) as 0 | 1 | 2,
      retain: aedesPacket.retain || false,
      remainingLength: 0, // Will calculate below
    };

    // Build variable header
    const variableHeader: MQTTVariableHeader = {};

    if (cmd === 'publish' && aedesPacket.topic) {
      variableHeader.topicName = aedesPacket.topic;
      if (aedesPacket.qos > 0 && aedesPacket.messageId) {
        variableHeader.packetIdentifier = aedesPacket.messageId;
      }

      // MQTT 5.0 properties
      if (aedesPacket.properties) {
        variableHeader.properties = { ...aedesPacket.properties };
      }
    }

    if (cmd === 'connect') {
      variableHeader.protocolName = aedesPacket.protocolId || 'MQTT';
      variableHeader.protocolLevel = aedesPacket.protocolVersion || 4;
      variableHeader.keepAlive = aedesPacket.keepalive || 0;
      variableHeader.connectFlags = {
        cleanSession: aedesPacket.clean !== false,
        willFlag: !!aedesPacket.will,
        willQoS: aedesPacket.will?.qos || 0,
        willRetain: aedesPacket.will?.retain || false,
        passwordFlag: !!aedesPacket.password,
        usernameFlag: !!aedesPacket.username,
      };
    }

    // Calculate payload length
    const payloadLength = aedesPacket.payload?.length || 0;

    // Estimate total packet size
    const topicLength = variableHeader.topicName?.length || 0;
    const variableHeaderSize = topicLength + (variableHeader.packetIdentifier ? 2 : 0);
    const totalPacketSize = 1 + getLengthBytes(variableHeaderSize + payloadLength) + variableHeaderSize + payloadLength;
    fixedHeader.remainingLength = variableHeaderSize + payloadLength;

    // Get raw bytes if available
    const raw = aedesPacket.payload ? new Uint8Array(aedesPacket.payload) : new Uint8Array(0);

    return {
      fixedHeader,
      variableHeader,
      payloadLength,
      totalPacketSize,
      raw,
    };
  } catch (error) {
    console.error('Error parsing MQTT packet:', error);
    return null;
  }
}

/**
 * Get MQTT message type number from command string
 */
function getMessageTypeFromCmd(cmd: string): number {
  const cmdMap: Record<string, number> = {
    connect: 1,
    connack: 2,
    publish: 3,
    puback: 4,
    pubrec: 5,
    pubrel: 6,
    pubcomp: 7,
    subscribe: 8,
    suback: 9,
    unsubscribe: 10,
    unsuback: 11,
    pingreq: 12,
    pingresp: 13,
    disconnect: 14,
    auth: 15,
  };
  return cmdMap[cmd.toLowerCase()] || 3;
}

/**
 * Calculate number of bytes needed for remaining length encoding
 */
function getLengthBytes(length: number): number {
  if (length < 128) return 1;
  if (length < 16384) return 2;
  if (length < 2097152) return 3;
  return 4;
}

/**
 * Format bytes as hex dump for display
 */
export function formatHexDump(bytes: Uint8Array, bytesPerLine = 16): string {
  const lines: string[] = [];

  for (let i = 0; i < bytes.length; i += bytesPerLine) {
    const chunk = bytes.slice(i, i + bytesPerLine);
    const offset = i.toString(16).padStart(8, '0');
    const hex = Array.from(chunk)
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
    const ascii = Array.from(chunk)
      .map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
      .join('');

    const hexPadded = hex.padEnd(bytesPerLine * 3 - 1, ' ');
    lines.push(`${offset}  ${hexPadded}  |${ascii}|`);
  }

  return lines.join('\n');
}

/**
 * Decode MQTT remaining length from buffer
 */
export function decodeRemainingLength(buffer: Uint8Array, offset: number): { value: number; bytes: number } {
  let multiplier = 1;
  let value = 0;
  let bytes = 0;
  let byte: number;

  do {
    if (offset + bytes >= buffer.length) {
      throw new Error('Malformed remaining length');
    }
    byte = buffer[offset + bytes];
    value += (byte & 0x7f) * multiplier;
    multiplier *= 128;
    bytes++;
  } while ((byte & 0x80) !== 0 && bytes < 4);

  if ((byte & 0x80) !== 0) {
    throw new Error('Remaining length exceeds 4 bytes');
  }

  return { value, bytes };
}

/**
 * Parse complete MQTT packet from raw buffer
 */
export function parseRawMQTTPacket(buffer: Uint8Array): MQTTPacketDetails | null {
  try {
    if (buffer.length < 2) return null;

    // Parse fixed header
    const firstByte = buffer[0];
    const messageType = (firstByte >> 4) & 0x0f;
    const messageTypeName = PACKET_TYPES[messageType] || 'UNKNOWN';
    const dup = (firstByte & 0x08) !== 0;
    const qos = ((firstByte & 0x06) >> 1) as 0 | 1 | 2;
    const retain = (firstByte & 0x01) !== 0;

    // Parse remaining length
    const { value: remainingLength, bytes: lengthBytes } = decodeRemainingLength(buffer, 1);

    const fixedHeader: MQTTFixedHeader = {
      messageType,
      messageTypeName,
      dup,
      qos,
      retain,
      remainingLength,
    };

    // Parse variable header (simplified - only for PUBLISH)
    const variableHeader: MQTTVariableHeader = {};
    let payloadOffset = 1 + lengthBytes;

    if (messageType === 3) { // PUBLISH
      // Topic length (2 bytes)
      const topicLength = (buffer[payloadOffset] << 8) | buffer[payloadOffset + 1];
      payloadOffset += 2;

      // Topic name
      const topicBytes = buffer.slice(payloadOffset, payloadOffset + topicLength);
      variableHeader.topicName = new TextDecoder().decode(topicBytes);
      payloadOffset += topicLength;

      // Packet identifier (if QoS > 0)
      if (qos > 0) {
        variableHeader.packetIdentifier = (buffer[payloadOffset] << 8) | buffer[payloadOffset + 1];
        payloadOffset += 2;
      }
    }

    const payloadLength = remainingLength - (payloadOffset - 1 - lengthBytes);

    return {
      fixedHeader,
      variableHeader,
      payloadLength,
      totalPacketSize: buffer.length,
      raw: buffer,
    };
  } catch (error) {
    console.error('Error parsing raw MQTT packet:', error);
    return null;
  }
}
