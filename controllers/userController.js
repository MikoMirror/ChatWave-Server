import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import Chat from '../models/chat.js';

export const register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) return res.status(400).json({ message: 'User already exists.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, hashed_password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'Registration successful.' });
    } catch (error) {
        res.status(500).json({ message: 'Registration failed.' });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const isMatch = bcrypt.compareSync(password, user.hashed_password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid password.' });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username: user.username, message: 'Login successful.' });
    } catch (error) {
        res.status(500).json({ message: 'Login failed.' });
    }
};

export const getUserChats = async (req, res) => {
    try {
        const userId = req.user._id;  

        const chats = await Chat.find({ participants: userId });
        res.json({
            message: 'Your chats:',
            chats: chats.map(chat => ({ id: chat._id, name: chat.name }))
        });
    } catch (error) {
        res.status(500).send('Server error');
    }
};