import WebSocket from 'ws';
import * as readline from 'readline';

const ws = new WebSocket('ws://localhost:8080');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

ws.on('open', () => {
  console.log('Connected to server');
  promptUser();
});

ws.on('message', (data) => {
  console.log(`Received from server: ${data}`);
});

ws.on('close', () => {
  console.log('Disconnected from server');
  rl.close();
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
  rl.close();
});

function promptUser() {
  rl.question('Enter message: ', (message) => {
    if (message.toLowerCase() === 'exit') {
      ws.close();
    } else {
      ws.send(message);
      promptUser(); // Prompt again for the next message
    }
  });
}
