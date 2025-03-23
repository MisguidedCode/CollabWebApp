/**
 * Utility to save and retrieve Redux state from localStorage
 * This adds an extra layer of persistence for workspace data
 */

// Save state to localStorage
export const saveState = (key: string, state: any): void => {
    try {
      const serializedState = JSON.stringify(state);
      localStorage.setItem(key, serializedState);
    } catch (err) {
      console.error('Could not save state to localStorage:', err);
    }
  };
  
  // Load state from localStorage
  export const loadState = <T>(key: string, defaultState: T): T => {
    try {
      const serializedState = localStorage.getItem(key);
      if (serializedState === null) {
        return defaultState;
      }
      return JSON.parse(serializedState);
    } catch (err) {
      console.error('Could not load state from localStorage:', err);
      return defaultState;
    }
  };
  
  // Clear state from localStorage
  export const clearState = (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error('Could not clear state from localStorage:', err);
    }
  };