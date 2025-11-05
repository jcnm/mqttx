// Sparkplug B TypeScript Type Definitions
// Based on ISO/IEC 20237:2023

export enum DataType {
  // Basic Types
  Int8 = 1,
  Int16 = 2,
  Int32 = 3,
  Int64 = 4,
  UInt8 = 5,
  UInt16 = 6,
  UInt32 = 7,
  UInt64 = 8,
  Float = 9,
  Double = 10,
  Boolean = 11,
  String = 12,
  DateTime = 13,
  Text = 14,

  // Additional Types
  UUID = 15,
  DataSet = 16,
  Bytes = 17,
  File = 18,
  Template = 19,

  // Property Set
  PropertySet = 20,
  PropertySetList = 21,

  // Array Types (optional)
  Int8Array = 22,
  Int16Array = 23,
  Int32Array = 24,
  Int64Array = 25,
  UInt8Array = 26,
  UInt16Array = 27,
  UInt32Array = 28,
  UInt64Array = 29,
  FloatArray = 30,
  DoubleArray = 31,
  BooleanArray = 32,
  StringArray = 33,
  DateTimeArray = 34,
}

export enum QualityCode {
  BAD = 0,
  STALE = 1,
  UNCERTAIN = 64,
  GOOD = 192,
}

export interface MetaData {
  isMultiPart?: boolean;
  contentType?: string;
  size?: bigint;
  seq?: bigint;
  fileName?: string;
  fileType?: string;
  md5?: string;
  description?: string;
}

export interface PropertyValue {
  type: number;
  isNull?: boolean;
  value?: number | bigint | boolean | string | PropertySet | PropertySet[] | Uint8Array;
}

export interface PropertySet {
  keys: string[];
  values: PropertyValue[];
}

export interface DataSetValue {
  value: number | bigint | boolean | string | DataSetValue;
}

export interface DataSetRow {
  elements: DataSetValue[];
}

export interface DataSet {
  numOfColumns: bigint;
  columns: string[];
  types: number[];
  rows: DataSetRow[];
}

export interface Template {
  version?: string;
  metrics: Metric[];
  parameters?: ParameterSet;
  templateRef?: string;
  isDefinition?: boolean;
}

export interface ParameterValue {
  type: number;
  value: number | bigint | boolean | string | PropertySet;
}

export interface ParameterSet {
  keys: string[];
  values: ParameterValue[];
}

export interface Metric {
  name?: string;
  alias?: bigint;
  timestamp?: bigint;
  datatype?: DataType;
  isHistorical?: boolean;
  isTransient?: boolean;
  isNull?: boolean;
  metadata?: MetaData;
  properties?: PropertySet;
  value?: number | bigint | boolean | string | Uint8Array | DataSet | Template | PropertySet;
}

export interface Payload {
  timestamp?: bigint;
  metrics?: Metric[];
  seq?: bigint;
  uuid?: string;
  body?: Uint8Array;
}

export interface DecodedPayload extends Payload {
  _raw?: Uint8Array;
}

export interface EncoderOptions {
  compress?: boolean;
  compressionLevel?: number;
}

export interface DecoderOptions {
  decompress?: boolean;
}

export const SPARKPLUG_NAMESPACE = 'spBv1.0';

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
