import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const app = express();
app.use(cors());

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body; 

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("Hashed password:", hashedPassword); 

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
      const { username, password } = req.body;
      const user = await User.findOne({ username }); 
      if (!user) {
          return res.status(401).json({ message: 'Invalid username or password' });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
          return res.status(401).json({ message: 'Invalid username or password' });
      }
      // Create a JWT (JSON Web Token)
      const token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '1h' }); 

       res.status(200).json({ token, message: 'Login successful!' }); 
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
  }
});

router.post('/findByUsername', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;