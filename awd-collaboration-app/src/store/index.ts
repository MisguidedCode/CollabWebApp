import { configureStore, isPlainObject } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';

// Import reducers and middleware
import taskReducer from './slices/taskSlice';
import websocketReducer from './slices/websocketSlice';
import { socketMiddleware } from './middleware/socketMiddleware';
import chatReducer from './slices/chatSlice';
import authReducer from './slices/authSlice';
import calendarReducer from './slices/calendarSlice';
import workspaceReducer from './slices/workspaceSlice';
import documentReducer from './slices/documentSlice';

// Helper function for Firestore timestamp serialization
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

// Configure Redux store with Firestore-aware serialization
export const store = configureStore({
  reducer: {
    tasks: taskReducer,
    chat: chatReducer,
    auth: authReducer,
    calendar: calendarReducer,
    workspace: workspaceReducer,
    documents: documentReducer,
    websocket: websocketReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these specific action types
        ignoredActions: [
          // WebSocket-related actions that may contain non-serializable content
          'websocket/error',
          'websocket/statusChanged',
          'websocket/messageReceived',
          // Chat-related actions that may have real-time updates
          'chat/updateMessages',
          'chat/sendMessage',
          'chat/fetchMessages'
        ],
        // Ignore these field paths in the state
        ignoredPaths: [
          'chat.processedMessageIds'
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
    }).concat(socketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
