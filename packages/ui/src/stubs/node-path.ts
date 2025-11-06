// Browser stub for node:path
export function dirname(path: string): string {
  return path.substring(0, path.lastIndexOf('/'));
}

export function join(...paths: string[]): string {
  return paths.join('/').replace(/\/+/g, '/');
}
