import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import connectDB from './config.js';
import User from './models/user.js'; // Assuming you have a User model

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

app.use(cors());
app.use(bodyParser.json());

// Home route
app.get('/', (req, res) => {
  res.send('Hello from Chat App Server');
});

// User Registration Route
app.post('/register', async (req, res) => {
  const { username, email, password, profile_pic } = req.body;
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      username,
      email,
      hashed_password: hashedPassword,
      profile_pic
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

      res.json({ message: 'Auth successful', token });
    } else {
      res.status(401).send('Invalid credentials');
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Middleware to authenticate JWT Tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Protected Route Example
app.get('/protected', authenticateToken, (req, res) => {
  res.send('Access to protected data');
});

export default app;