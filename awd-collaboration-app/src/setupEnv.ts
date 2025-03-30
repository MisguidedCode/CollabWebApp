import envMock from './__mocks__/envMock';

// Extend global for custom types
declare global {
  var TextEncoder: typeof globalThis.TextEncoder;
  var TextDecoder: typeof globalThis.TextDecoder;
  var WebSocket: typeof globalThis.WebSocket;
}

// Set up text encoder/decoder for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}

// Jest doesn't support import.meta, so we need to set up a mock
const importMeta = {
  env: envMock
};

// Define import.meta globally for tests
Object.defineProperty(global, 'import', {
  value: { meta: importMeta },
  writable: true,
  configurable: true
});

// Set up Jest environment for Firebase
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Assign environment variables
process.env = {
  ...process.env,
  ...envMock.processEnv
};

// Mock WebSocket with proper constant types
const mockWebSocket = {
  CONNECTING: 0 as const,
  OPEN: 1 as const,
  CLOSING: 2 as const,
  CLOSED: 3 as const,
  prototype: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    send: jest.fn(),
    close: jest.fn(),
    binaryType: 'blob' as BinaryType,
    bufferedAmount: 0,
    extensions: '',
    protocol: '',
    readyState: 3,
    url: '',
    onclose: null,
    onerror: null,
    onmessage: null,
    onopen: null
  }
};

const MockWebSocketClass = jest.fn().mockImplementation((url: string | URL, protocols?: string | string[]) => {
  return {
    ...mockWebSocket.prototype,
    url: url.toString(),
    protocol: Array.isArray(protocols) ? protocols[0] : protocols || '',
    CONNECTING: mockWebSocket.CONNECTING,
    OPEN: mockWebSocket.OPEN,
    CLOSING: mockWebSocket.CLOSING,
    CLOSED: mockWebSocket.CLOSED
  };
});

Object.assign(MockWebSocketClass, mockWebSocket);

// @ts-ignore - override WebSocket global with mock
global.WebSocket = MockWebSocketClass;
