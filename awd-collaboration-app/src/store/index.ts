import { configureStore } from '@reduxjs/toolkit';
import taskReducer from './slices/taskSlice';
import chatReducer from './slices/chatSlice';
import authReducer from './slices/authSlice';
import calendarReducer from './slices/calendarSlice';
import workspaceReducer from './slices/workspaceSlice';
import { useDispatch } from 'react-redux';
import { isPlainObject } from '@reduxjs/toolkit';
import { saveState, loadState } from '../utils/storagePersistence';

// Custom serializable check function to handle Firestore timestamps
const isFirestoreTimestamp = (value: any): boolean => {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.seconds === 'number' &&
    typeof value.nanoseconds === 'number' &&
    value.toDate &&
    typeof value.toDate === 'function'
  );
};

// Load workspace state from localStorage if available
const persistedWorkspaceState = loadState('workspaceState', {
  workspaces: [],
  currentWorkspaceId: null,
  invitations: [],
  loading: false,
  error: null
});

export const store = configureStore({
  reducer: {
    tasks: taskReducer,
    chat: chatReducer,
    auth: authReducer,
    calendar: calendarReducer,
    workspace: workspaceReducer, // This will use the initial state defined in the slice
  },
  preloadedState: {
    // Preload the workspace state from localStorage
    workspace: persistedWorkspaceState
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these specific action types
        ignoredActions: [
          // Add any action types to ignore here
        ],
        
        // Function to check if a value is serializable
        isSerializable: (value: any) => {
          // Allow Firebase timestamps to pass through
          if (isFirestoreTimestamp(value)) {
            return true;
          }
          
          // Use the default serializable checks for other values
          if (typeof value === 'function' || value instanceof Promise || value instanceof RegExp) {
            return false;
          }
          
          if (value instanceof Date) {
            return true;
          }
          
          if (value instanceof Error) {
            return true;
          }
          
          if (value instanceof Map || value instanceof Set) {
            return false;
          }
          
          if (isPlainObject(value) || Array.isArray(value)) {
            return true;
          }
          
          return typeof value === 'boolean' || 
                typeof value === 'number' || 
                typeof value === 'string' || 
                value === null || 
                value === undefined;
        },
      },
    }),
});

// Subscribe to store changes to save workspace state to localStorage
store.subscribe(() => {
  const state = store.getState();
  saveState('workspaceState', state.workspace);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();