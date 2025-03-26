/**
 * Utility to save and retrieve Redux state from localStorage
 * This adds an extra layer of persistence for workspace data
 */

// Save state to localStorage with validation
export const saveState = (key: string, state: any): boolean => {
    if (!key || state === undefined) {
      console.error('Invalid key or state provided to saveState');
      return false;
    }

    try {
      const serializedState = JSON.stringify(state);
      localStorage.setItem(key, serializedState);
      
      // Verify the save was successful
      const savedState = localStorage.getItem(key);
      if (savedState !== serializedState) {
        throw new Error('Storage verification failed');
      }
      
      return true;
    } catch (err) {
      console.error('Could not save state to localStorage:', err);
      return false;
    }
  };
  
  // Load state from localStorage with validation
  export const loadState = <T>(key: string, defaultState: T): T => {
    if (!key) {
      console.error('Invalid key provided to loadState');
      return defaultState;
    }

    try {
      const serializedState = localStorage.getItem(key);
      if (serializedState === null) {
        return defaultState;
      }

      // Validate JSON structure before returning
      const parsedState = JSON.parse(serializedState);
      if (typeof parsedState !== typeof defaultState) {
        console.warn('Loaded state type mismatch, using default state');
        return defaultState;
      }

      return parsedState;
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
