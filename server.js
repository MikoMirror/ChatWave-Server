import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/dbConnection.js';
import userRoutes from './routes/UserRoutes.js';
import jwt from 'jsonwebtoken';
import chatRoutes from './routes/ChatRoutes.js';

const app = express();
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server);

connectDB();

app.get('/', (req, res) => {
  res.send('Welcome to the server!');
});

  app.use('/api/user', userRoutes);
  app.use('/api/chat', chatRoutes);
  
  const activeUsers = {};
  
  io.on('connection', (socket) => {
    console.log('A user connected');
  
    socket.on('authenticate', (token) => {
      try {
        const decoded = jwt.verify(token, 'your-secret-key');
        socket.user = decoded.userId; 
        activeUsers[socket.user] = socket.id;
        console.log('User authenticated:', socket.user);
        socket.emit('private-message', {
          from: "System",
          message: "Welcome to the chat!"
        });
      } catch (error) {
        console.error('Invalid token:', error);
        socket.disconnect(true);
      }
    });
  
    socket.on('join-chat', (chatId) => {
      socket.join(chatId);
    });
  
    socket.on('chat-message', ({ chatId, message, sender }) => {
      const userId = socket.user; 
      io.to(chatId).emit('chat-message', { sender, message });
    });
  
    socket.on('private-message', async ({ to, message }) => {
      try {
        const recipientSocketId = activeUsers[to];
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('private-message', {
            from: socket.user,
            message
          });
        } else {
          console.log("Recipient not online");
        }
      } catch (error) {
        console.error('Error sending private message:', error);
      }
    });
  
    socket.on('disconnect', () => {
      delete activeUsers[socket.user];
      console.log('User disconnected');
    });
  });
  
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
  
  export default app;