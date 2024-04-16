import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import app from './app.js';

const httpServer = createServer(app);
const io = new SocketIO(httpServer);

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
