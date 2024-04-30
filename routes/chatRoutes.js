import express from 'express';
import Chat from '../models/chat.js';
import mongoose from 'mongoose';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Get list of all chats for the authenticated user
router.get('/', verifyToken, async (req, res) => {
    console.log(`Fetching chats for user ID: ${req.user.userId}`);
    try {
        // Convert the user ID string to a MongoDB ObjectId
        const userId = new mongoose.Types.ObjectId(req.user.userId);
        const chats = await Chat.find({ participants: { $in: [userId] } }).populate('participants messages');

        console.log(`Chats found:`, chats);
        res.json(chats);
    } catch (error) {
        console.error(`Failed to retrieve chats: ${error}`);
        res.status(500).json({ message: "Failed to retrieve chats: " + error.message });
    }
});
// Create a new chat
router.post('/', async (req, res) => {
    const { name, participants } = req.body;
    try {
        const newChat = new Chat({ name, participants });
        const savedChat = await newChat.save();
        res.status(201).json(savedChat);
    } catch (error) {
        console.log(req.body); // Log the body to see what you are receiving
        res.status(400).json({ message: "Failed to create chat: " + error.message });
    }
});

// Get a specific chat by ID
router.get('/:chatId', async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId).populate('participants messages');
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve chat: " + error.message });
    }
});

// Post a message to a specific chat
router.post('/:chatId/messages', async (req, res) => {
    const { message } = req.body;
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        chat.messages.push({
            sender: req.user._id,  // Assuming req.user is populated from the authentication middleware
            message: message,
            timestamp: new Date()
        });
        await chat.save();
        res.status(201).json(chat);
    } catch (error) {
        res.status(400).json({ message: "Failed to post message: " + error.message });
    }
});

router.post('/chats', async (req, res) => {
    try {
        const { name, participants } = req.body;
        const newChat = new Chat({
            name,
            participants
        });
        const savedChat = await newChat.save();
        res.status(201).json(savedChat);
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ message: 'Failed to create chat' });
    }
});

export default router;