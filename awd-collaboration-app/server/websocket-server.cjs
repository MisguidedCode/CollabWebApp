/**
 * Simple WebSocket server for document collaboration
 * 
 * This server passes messages between clients without trying to interpret them
 * 
 * To run: node server/websocket-server.cjs
 */

const WebSocket = require('ws');
const http = require('http');

// Map to store connections by document ID
const rooms = new Map();

const PORT = process.env.PORT || 4444;

// Configure HTTP server
const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('WebSocket collaboration server running');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Handle new WebSocket connections
wss.on('connection', (ws, req) => {
  // Extract document ID from URL path
  const urlPath = req.url || '/';
  const documentId = urlPath.substring(1); // Remove leading slash
  
  console.log(`Client connected to document: ${documentId}`);

  // Initialize room if it doesn't exist
  if (!rooms.has(documentId)) {
    rooms.set(documentId, new Set());
  }

  // Add this connection to the room
  rooms.get(documentId).add(ws);

  // Connection metadata
  ws.documentId = documentId;
  ws.isAlive = true;

  // Handle pings to keep connection alive
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Handle messages from client
  ws.on('message', (message) => {
    // Simply relay all messages to other clients in the same room
    broadcastToRoom(documentId, message, ws);
  });

  // Handle disconnection
  ws.on('close', () => {
    console.log(`Client disconnected from document: ${documentId}`);
    
    // Remove connection from room
    if (rooms.has(documentId)) {
      rooms.get(documentId).delete(ws);
      
      // Clean up empty rooms
      if (rooms.get(documentId).size === 0) {
        console.log(`No more connections to document: ${documentId}. Cleaning up.`);
        rooms.delete(documentId);
      }
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for document ${documentId}:`, error.message);
  });
});

// Broadcast message to all clients in a room except the sender
function broadcastToRoom(roomId, message, senderWs) {
  if (!rooms.has(roomId)) return;
  
  rooms.get(roomId).forEach(ws => {
    if (ws !== senderWs && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
      } catch (err) {
        console.error('Error broadcasting message:', err.message);
      }
    }
  });
}

// Setup a heartbeat to detect and close dead connections
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log(`Terminating inactive connection to document: ${ws.documentId}`);
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// Clean up on server close
wss.on('close', () => {
  clearInterval(interval);
});

// Start the server
server.listen(PORT, () => {
  console.log(`WebSocket collaboration server running on port ${PORT}`);
  console.log(`Connect using: ws://localhost:${PORT}/{documentId}`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server');
  clearInterval(interval);
  wss.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});