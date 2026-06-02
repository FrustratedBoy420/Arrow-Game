import appJson from '../../app.json';

export const CURRENT_APP_VERSION = appJson.expo.version;

/**
 * Checks if current version is older than target version.
 * e.g. isVersionOlder('1.1.3', '1.1.4') -> true
 * e.g. isVersionOlder('1.1.4', '1.1.4') -> false
 * e.g. isVersionOlder('1.1.5', '1.1.4') -> false
 */
export function isVersionOlder(current: string, target: string): boolean {
  if (!current || !target) return false;
  
  const parse = (v: string) => v.replace(/^v/i, '').split('.').map(Number);
  const currentParts = parse(current);
  const targetParts = parse(target);
  
  // Pad with zeros if parts length are less than 3
  while (currentParts.length < 3) currentParts.push(0);
  while (targetParts.length < 3) targetParts.push(0);
  
  for (let i = 0; i < 3; i++) {
    const cVal = currentParts[i]!;
    const tVal = targetParts[i]!;
    if (cVal !== tVal) {
      return cVal < tVal;
    }
  }
  return false;
}
