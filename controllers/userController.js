import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';  

export const register = async (req, res) => {
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
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send('Login failed. User not found.');
        }

        const isMatch = await bcrypt.compare(password, user.hashed_password);
        if (!isMatch) {
            return res.status(401).send('Login failed. Incorrect password.');
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).send({
            token,
            username: user.username,
            message: 'Login successful.'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('An error occurred during login.');
    }
};