// GZIP Compression Utilities for Sparkplug B

import { gzip as pakoGzip, ungzip as pakoUngzip } from 'pako';

export function compress(data: Uint8Array, level = 6): Uint8Array {
  return pakoGzip(data, { level });
}

export function decompress(data: Uint8Array): Uint8Array {
  return pakoUngzip(data);
}

export function isCompressed(data: Uint8Array): boolean {
  // Check for GZIP magic number (0x1F 0x8B)
  return data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b;
}

export function maybeDecompress(data: Uint8Array): Uint8Array {
  if (isCompressed(data)) {
    return decompress(data);
  }
  return data;
}
