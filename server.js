import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/dbсonnection.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

connectDB();

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});