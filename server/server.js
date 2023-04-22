const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, host: '0.0.0.0' });

const clients = {};

app.use(express.static('public'));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/stream/:id', (req, res) => {
  const id = req.params.id;
  if (!clients[id]) {
    res.status(404).send('Stream not found');
  } else {
    res.sendFile(__dirname + '/public/viewer.html');
  }
});

wss.on('connection', (ws, req) => {
  const id = generateUniqueId();
  const viewer = req.url.startsWith('/viewer');

  if (viewer) {
    console.log(`Viewer connected with id ${id}`);
  } else {
    clients[id] = ws;
    console.log(`Streamer connected with id ${id}`);
  }

  ws.on('message', (message) => {
    if (!viewer) {
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  });

  ws.on('close', () => {
    if (viewer) {
      console.log(`Viewer with id ${id} disconnected`);
    } else {
      console.log(`Streamer with id ${id} disconnected`);
      delete clients[id];
    }
  });
});

function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
