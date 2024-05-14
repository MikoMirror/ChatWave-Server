import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/dbConnection.js';
import userRoutes from './routes/UserRoutes.js';
import jwt from 'jsonwebtoken';
import chatRoutes from './routes/ChatRoutes.js';
import Chat from './models/Chat.js';
import moment from 'moment';

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
  
    socket.on('join-chat', async (chatId) => {
      try {
        const chat = await Chat.findById(chatId).populate('participants', 'username');
        if (!chat) {
          return socket.emit('error', { message: 'Chat not found' });
        }
  
        socket.join(chatId);
  
        const chatHistory = chat.messages.map(message => {
          const timestamp = moment(message.timestamp).format('HH:mm');
          const username = chat.participants.find(p => p._id.toString() === message.sender.toString())?.username;
          return `[${timestamp}]<${username}> ${message.message}`;
        });
  
        socket.emit('chat-history', chatHistory);
  
      } catch (error) {
        console.error('Error joining chat:', error);
        socket.emit('error', { message: 'Error joining chat' });
      }
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