/**
 * Helper functions for storage management
 */

/**
 * Calculate the size of a string in bytes
 */
export const getStringSize = (str: string): number => {
  return new Blob([str]).size;
};

/**
 * Get the total size of localStorage in bytes
 */
export const getTotalStorageSize = (): number => {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      total += getStringSize(key);
      total += getStringSize(localStorage.getItem(key) || '');
    }
  }
  return total;
};

/**
 * Parse stored item with error handling
 */
export const parseStoredItem = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

/**
 * Check if localStorage is available
 */
export const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get storage remaining space (approximate)
 */
export const getRemainingStorage = (): number => {
  const quota = 5 * 1024 * 1024; // Assume 5MB quota
  const used = getTotalStorageSize();
  return Math.max(0, quota - used);
};

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
