import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ConnectionStatus } from '../../services/websocket/types';

interface WebSocketState {
  status: ConnectionStatus;
  error: string | null;
  initialized: boolean;
  lastConnected: string | null;
  reconnectAttempts: number;
}

const initialState: WebSocketState = {
  status: ConnectionStatus.DISCONNECTED,
  error: null,
  initialized: false,
  lastConnected: null,
  reconnectAttempts: 0
};

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    initialized(state) {
      state.initialized = true;
    },
    connected(state) {
      state.status = ConnectionStatus.CONNECTED;
      state.error = null;
      state.lastConnected = new Date().toISOString();
      state.reconnectAttempts = 0;
    },
    disconnected(state) {
      state.status = ConnectionStatus.DISCONNECTED;
    },
    reconnecting(state) {
      state.status = ConnectionStatus.RECONNECTING;
      state.reconnectAttempts += 1;
    },
    error(state, action: PayloadAction<string>) {
      state.status = ConnectionStatus.ERROR;
      state.error = action.payload;
    },
    statusChanged(state, action: PayloadAction<ConnectionStatus>) {
      state.status = action.payload;
      if (action.payload === ConnectionStatus.CONNECTED) {
        state.error = null;
      }
    },
    reset(state) {
      return initialState;
    }
  }
});

export const {
  initialized,
  connected,
  disconnected,
  reconnecting,
  error,
  statusChanged,
  reset
} = websocketSlice.actions;

export default websocketSlice.reducer;

// Selectors
export const selectWebSocketStatus = (state: { websocket: WebSocketState }) =>
  state.websocket.status;
export const selectWebSocketError = (state: { websocket: WebSocketState }) =>
  state.websocket.error;
export const selectWebSocketInitialized = (state: { websocket: WebSocketState }) =>
  state.websocket.initialized;
export const selectWebSocketReconnectAttempts = (
  state: { websocket: WebSocketState }
) => state.websocket.reconnectAttempts;
