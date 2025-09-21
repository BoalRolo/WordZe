/**
 * Utility functions for Firestore operations
 */

/**
 * Removes undefined values from an object before sending to Firestore
 * Firestore doesn't support undefined values, so we need to filter them out
 */
export function cleanFirestoreData<T extends Record<string, any>>(
  data: T
): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== undefined)
  ) as Partial<T>;
}

/**
 * Safely updates a Firestore document with only defined values
 */
export function prepareFirestoreUpdate<T extends Record<string, any>>(
  data: T
): Partial<T> {
  return cleanFirestoreData(data);
}

