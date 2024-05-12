import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/dbсonnection.js';
import userRoutes from './routes/UserRoutes.js'; 
import jwt from 'jsonwebtoken';


const app = express();
app.use(express.json()); 
const server = http.createServer(app);
const io = new Server(server);
connectDB();

app.get('/', (req, res) => {
  res.send('Welcome to the server!'); // Simple response
});

app.use('/api/user', userRoutes); 

io.on('connection', (socket) => {
  console.log('A user connected'); 

  socket.on('authenticate', (token) => {
      try {
          const decoded = jwt.verify(token, 'your-secret-key');
          socket.user = decoded.userId; 
          console.log('User authenticated:', socket.user);
      } catch (error) {
          console.error('Invalid token:', error);
          socket.disconnect(true); 
      }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
export default app;

