import { Middleware } from '@reduxjs/toolkit';
import { websocketService } from '../../services/websocket/WebSocketService';
import { ConnectionStatus, WebSocketMessage } from '../../services/websocket/types';

// Action types that will use WebSocket
const WEBSOCKET_ACTIONS = [
  'chat/sendMessage',
  'chat/joinRoom',
  'chat/leaveRoom',
  'presence/update',
  'workspace/join',
  'workspace/leave'
] as const;

type WebSocketAction = {
  type: typeof WEBSOCKET_ACTIONS[number];
  payload: any;
  meta?: {
    room?: string;
    skipWebSocket?: boolean;
  };
};

export const socketMiddleware: Middleware = (store) => (next) => (action: any) => {
  if (!action) return next(action);

  // Set up WebSocket event listeners once
  if (!store.getState().websocket?.initialized) {
    websocketService.on('connect', () => {
      store.dispatch({ type: 'websocket/connected' });
      store.dispatch({ type: 'websocket/initialized' });
    });

    websocketService.on('disconnect', () => {
      store.dispatch({ type: 'websocket/disconnected' });
    });

    websocketService.on('error', (error) => {
      store.dispatch({
        type: 'websocket/error',
        payload: error.message
      });
    });

    websocketService.on('statusChange', (status) => {
      store.dispatch({
        type: 'websocket/statusChanged',
        payload: status
      });

      // Handle reconnection status
      if (status === ConnectionStatus.RECONNECTING) {
        store.dispatch({ type: 'websocket/reconnecting' });
      }
    });

    websocketService.on('message', (message) => {
      // Handle different message types
      switch (message.type) {
        case 'chat/message':
          store.dispatch({
            type: 'chat/messageReceived',
            payload: message.payload,
            meta: { skipWebSocket: true }
          });
          break;

        case 'presence/update':
          store.dispatch({
            type: 'presence/userUpdated',
            payload: message.payload,
            meta: { skipWebSocket: true }
          });
          break;

        // Add more message type handlers as needed
        default:
          // For unknown message types, dispatch a generic action
          store.dispatch({
            type: `websocket/${message.type}`,
            payload: message.payload,
            meta: { skipWebSocket: true }
          });
      }
    });
  }

  // Skip if the action is marked to skip WebSocket
  if (action.meta?.skipWebSocket) {
    return next(action);
  }

  // Check if this is a WebSocket action
  if (WEBSOCKET_ACTIONS.includes(action.type)) {
    const message: WebSocketMessage = {
      type: action.type,
      payload: action.payload,
      room: action.meta?.room,
      timestamp: Date.now()
    };

    websocketService.sendMessage(message);
  }

  // Special handling for workspace actions
  if (action.type === 'workspace/join') {
    const { workspaceId } = action.payload;
    websocketService.updateWorkspace(workspaceId);
  }

  // Always pass the action to the next middleware
  return next(action);
};

// Export the service for direct usage
export { websocketService };
