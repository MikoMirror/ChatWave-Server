import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config.js';
import User from './models/user.js';
import Message from './models/message.js';
import Chat from './models/chat.js'; // Make sure this is correctly imported
import bodyParser from 'body-parser';

dotenv.config();
connectDB();
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));
const app = express();
app.use(bodyParser.json());
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});


// Middleware for socket authentication
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId; // Attach userId to socket session
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  } else {
    next(new Error("No token provided"));
  }
});

io.on('connection', socket => {
    // Handling registration
    socket.on('sendMessage', async data => {
        const { message } = data;
        try {
            const newMessage = new Message({ sender: socket.userId, content: message });
            await newMessage.save();
            io.emit('message', { sender: socket.userId, message });
        } catch (error) {
            socket.emit('error', 'Failed to send message.');
        }
    });

    socket.on('createChat', async data => {
        const { name } = data;
        try {
            const newChat = new Chat({
                name,
                participants: [socket.userId],
                messages: []
            });
            await newChat.save();
            socket.join(newChat._id.toString());
            io.to(newChat._id.toString()).emit('chatCreated', { chat: newChat });
        } catch (error) {
            socket.emit('error', 'Failed to create chat due to unexpected error.');
        }
    });

    socket.on('joinChat', async data => {
        const { chatName } = data;
        try {
            const chat = await Chat.findOne({ name: chatName });
            if (!chat) {
                socket.emit('error', 'Chat not found.');
                return;
            }
            if (chat.participants.includes(socket.userId)) {
                socket.emit('error', 'Already in the chat.');
                return;
            }
            chat.participants.push(socket.userId);
            await chat.save();
            socket.join(chat._id.toString());
            socket.emit('chatJoined', { chatName });
        } catch (error) {
            socket.emit('error', 'Failed to join chat.');
        }
    });
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).send('User already exists with that email or username.');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, hashed_password: hashedPassword });
        await newUser.save();
        res.status(201).send({ message: 'Registration successful.' });
    } catch (error) {
        res.status(500).send('Registration failed due to unexpected error.');
    }
});

// REST API endpoint for login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send('Login failed. User not found.');
        }
        if (!await bcrypt.compare(password, user.hashed_password)) {
            return res.status(401).send('Login failed. Incorrect password.');
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).send({ token, message: 'Login successful.' });
    } catch (error) {
        res.status(500).send('An error occurred during login.');
    }
});



async function fetchUserChats(userId) {
    return await Chat.find({ participants: userId }).populate('participants', 'username');
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});