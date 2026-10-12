/**
 * Generates a short, simple, human-friendly numeric or alphanumeric ID.
 * Avoids long millisecond timestamps (e.g. 1775945892341) in favor of short clean IDs.
 */
export function generateShortId(prefix = ''): string | number {
  const num = Math.floor(100 + Math.random() * 9000); // 3 to 4 digit number (100 - 9100)
  if (prefix) {
    return `${prefix}-${num}`;
  }
  return num;
}

export function generateShortNumericId(): number {
  return Math.floor(100 + Math.random() * 9000);
}
