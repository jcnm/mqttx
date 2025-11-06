// Browser stub for node:url
export function fileURLToPath(url: string): string {
  return url.replace(/^file:\/\//, '');
}
