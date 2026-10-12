/**
 * Recursively cleans an object or array to remove any `undefined`, empty strings,
 * temporary UI flags, or heavy redundant keys before sending to Cloud Firestore and PostgreSQL.
 * Keeps Firestore and database document sizes ultra-lightweight and avoids filling database storage.
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }

  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined && item !== null)
      .map((item) => cleanForFirestore(item)) as any;
  }

  if (typeof data === 'object') {
    // Avoid cleaning special Firestore objects like Timestamps
    if ((data as any).toDate && typeof (data as any).toDate === 'function') {
      return data;
    }

    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      // Omit internal UI state flags or undefined to keep document sizes small
      if (
        value === undefined ||
        key.startsWith('_') ||
        key === 'isExpanded' ||
        key === 'isSelected' ||
        key === 'tempId' ||
        key === 'loading' ||
        key === 'error'
      ) {
        continue;
      }

      // Drop huge redundant string fields if they are purely empty
      if (typeof value === 'string' && value.trim() === '') {
        continue;
      }

      // Truncate excessively large strings (> 8000 chars) to prevent DB bloat
      if (typeof value === 'string' && value.length > 8000) {
        cleaned[key] = value.substring(0, 8000) + '...[truncated]';
        continue;
      }

      const cleanedVal = cleanForFirestore(value);
      if (cleanedVal !== undefined) {
        cleaned[key] = cleanedVal;
      }
    }
    return cleaned as T;
  }

  return data;
}
