import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import connectDB from './config.js';
import User from './models/user.js';
import Chat from './models/chat.js';
import Message from './models/message.js';

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// Middleware to authenticate JWT Tokens
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401); // If there's no token, return an unauthorized status
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // If the token is invalid, return a forbidden status
    }
    req.user = user; // Set the user in the request object
    next(); // If the token is valid, proceed to the next middleware/route handler
  });
}

// Home route
app.get('/', (req, res) => {
  res.send('Hello from Chat App Server');
});

// User Registration Route
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body; // Remove profile_pic from here
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user without profile_pic
    const newUser = new User({
      username,
      email,
      hashed_password: hashedPassword
    });

    // Save the new user
    const savedUser = await newUser.save();
    
    // Optionally, retrieve the user to confirm they are in the database
    const userCheck = await User.findById(savedUser._id);
    if (!userCheck) {
      throw new Error('User registration failed');
    }

    // Respond successfully
    res.status(201).json({ message: 'User registered successfully', user: userCheck });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
});


// User Login Route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && await bcrypt.compare(password, user.hashed_password)) {
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Include the username in the response
      res.json({ message: 'Auth successful', token, username: user.username });
    } else {
      res.status(401).send('Invalid credentials');
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/createChat', authenticateToken, async (req, res) => {
  const { name, users } = req.body;
  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ message: "You must provide an array of user names." });
  }
  
  try {
    const userEntities = await User.find({ username: { $in: users } });
    if (userEntities.length !== users.length) {
      return res.status(404).json({ message: "One or more users not found." });
    }

    const chat = new Chat({
      name,
      participants: userEntities.map(user => user._id),
      messages: []
    });

    await chat.save();
    res.status(201).json({ message: "Chat created successfully.", chat });
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ message: "Internal server error while creating chat", error: error.message });
  }
});

app.post('/joinChat', authenticateToken, async (req, res) => {
  const { name } = req.body;
  try {
    const chat = await Chat.findOne({ name });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found." });
    }

    if (chat.participants.includes(req.user.userId)) {
      return res.status(200).json({ message: "User already in chat." }); // Notice the 200 OK status
    }

    // Otherwise, add the user to the chat and save it
    chat.participants.push(req.user.userId);
    await chat.save();
    res.status(200).json({ message: `Joined chat: ${chat.name}` });
  } catch (error) {
    console.error(`Error joining chat: ${name}`, error);
    res.status(500).json({ message: "Internal server error while joining chat", error: error.message });
  }
});

// Protected Route Example
app.get('/protected', authenticateToken, (req, res) => {
  res.send('Access to protected data');
});

app.get('/user/chats', authenticateToken, async (req, res) => {
  try {
    // Retrieve the user ID from the authenticated token
    const userId = req.user.userId;
    // Check if the user ID is present (optional safety check)
    if (!userId) {
      console.log("No user ID found in the token.");
      return res.status(400).json({ message: "No user ID provided in token." });
    }

    // Fetch chats that include the user as a participant and populate messages
    const chats = await Chat.find({ participants: userId }).populate('messages');
    
    // If no chats are found, return a friendly message
    if (!chats || chats.length === 0) {
      console.log(`No chats found for user ID ${userId}.`);
      return res.status(404).json({ message: "No chats found." });
    }

    // Return the found chats
    res.json(chats);
  } catch (error) {
    console.error(`Error fetching chats for user ID ${req.user.userId}:`, error);
    res.status(500).json({ message: "Internal server error while fetching chats.", error: error.message });
  }
});

app.get('/chats/name/:chatName', authenticateToken, async (req, res) => {
  const chatName = req.params.chatName;
  try {
    const chat = await Chat.findOne({ name: chatName });
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    res.json({ chatId: chat._id });
  } catch (error) {
    res.status(500).json({ message: "Error finding chat by name", error: error.message });
  }
});

app.get('/chats/:chatId/messages', authenticateToken, async (req, res) => {
  const chatId = req.params.chatId;
  try {
    const chat = await Chat.findById(chatId)
      .populate({
        path: 'messages',
        populate: {
          path: 'sender',
          select: 'username'  // Select only the username of the sender
        }
      });
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    res.json(chat.messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching chat messages", error: error.message });
  }
});

app.post('/chats/:chatId/messages', authenticateToken, async (req, res) => {
  // Get 'chatId' from the URL parameter and store it in a variable that's available in the entire scope of the route handler.
  const chatId = req.params.chatId; 

  try {
    const { content } = req.body;
    const senderId = req.user.userId;

    // Find the chat by its ID using chatId, which is now properly scoped.
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).send({ message: "Chat not found" });
    }

    // Make sure the sender is part of the chat's participants.
    if (!chat.participants.includes(senderId)) {
      return res.status(403).send({ message: "User not a participant of the chat" });
    }

    // Create and save the new message.
    const message = new Message({
      sender: senderId,
      content,
      // timestamp is set by default in schema
    });
    await message.save();

    // Push the message to the chat's messages array and save the chat.
    chat.messages.push(message._id);
    await chat.save();

    // Send a success response.
    res.status(201).send({ message: "Message added to chat", message });
  } catch (error) {
    // 'chatId' is now available here because it was declared at the function scope level.
    console.error(`Error adding message to chat ${chatId}:`, error);
    res.status(500).send({ message: "Error adding message", error: error.toString() });
  }
});

export default app;