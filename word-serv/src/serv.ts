// src/server.ts
import WebSocket, { WebSocketServer } from 'ws';

interface Client {
  ws: WebSocket;
  type: string;
}

const clients: Client[] = [];

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log(`SERV Received message: ${message}`);

    try {
      const parsedMessage = JSON.parse(message.toString());

      if (parsedMessage.type === 'register') {
        // Register the client based on the type
        clients.push({ ws, type: parsedMessage.as });
        console.log(`Registered client as: ${parsedMessage.as}`);
      } else {
        // Handle other types of messages, e.g., routing to specific clients
        routeMessage(parsedMessage);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Remove the disconnected client from the list
    const index = clients.findIndex((client) => client.ws === ws);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.send('{"type": "hello", "message": "hello from the server"}');
});

const routeMessage = (message: any) => {
  // console.log(typeof message, { message });
  // Example routing logic based on message content
  if (message.target === 'game') {
    // Find the client registered as 'game'
    const gameClient = clients.find((client) => client.type === 'game');
    const relay = { ...message };
    delete relay.target;
    if (gameClient) {
      gameClient.ws.send(JSON.stringify(relay));
    }
  }
};

console.log('WebSocket server is running on ws://localhost:8080');
