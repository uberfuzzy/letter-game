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
  const parsedMessage = JSON.parse(data.toString());
  if (parsedMessage !== false) {
    switch (parsedMessage?.type) {
      case "hello":
        // do nothing;
        break;
      default:
        console.log(`unknown type: ${parsedMessage?.type}`, typeof parsedMessage?.type);
    }
  } else {
    console.log(`Received from server: ${data}`);
  }

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
    const messageLow = message.toLowerCase();

    if (messageLow === 'exit') {
      ws.close();
    } else if (messageLow.startsWith("!guess") || messageLow.startsWith("!g")) {
      const [junk, guess] = messageLow.split(" ");

      ws.send(JSON.stringify({ "target": "game", "type": "guess", "guess": guess }));
      promptUser(); // Prompt again for the next message

    } else {
      // other, send raw
      ws.send(message);
      promptUser(); // Prompt again for the next message
    }
  });
}
