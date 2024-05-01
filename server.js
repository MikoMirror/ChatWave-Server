import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { verifyToken } from './middleware/verifyToken.js';
import dotenv from 'dotenv';
import connectDB from './config.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import socketHandler from './sockets/socketHandler.js';


dotenv.config();


connectDB();

const app = express();
app.use(express.json()); 
app.use('/users', userRoutes);

app.use('/chat', chatRoutes);
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!' });
});

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: ['https://example.com'], 
    methods: ['GET', 'POST']
  }
});

socketHandler(io); 

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

console.log("Environment:", process.env.NODE_ENV);

export default app;