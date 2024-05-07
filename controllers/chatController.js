import Chat from '../models/chat.js';
import mongoose from 'mongoose';
import User from '../models/user.js';

export const getChats = async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    try {
        const chats = await Chat.find({ participants: userId }).populate('participants messages');
        res.json(chats);
    } catch (error) {
        console.error(`Failed to retrieve chats: ${error}`);
        res.status(500).json({ message: `Failed to retrieve chats: ${error.message}` });
    }
};


export const createChat = async (req, res) => {
    // Check if body is undefined
    if (!req.body) {
        return res.status(400).json({ message: "Request body is missing." });
    }

    const { name, participantsUsernames } = req.body;

    // Check for missing fields
    if (!name || !participantsUsernames) {
        return res.status(400).json({ message: 'Both name and participants are required.' });
    }

    try {
        const participants = await Promise.all(
            participantsUsernames.map(async username => {
                const user = await User.findOne({ username });
                if (!user) {
                    throw new Error(`User not found: ${username}`);
                }
                return user._id;
            })
        );

        const newChat = new Chat({ name, participants });
        const savedChat = await newChat.save();
        res.status(201).json(savedChat);
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({
            message: 'Failed to create chat',
            error: error.toString(),
            details: error.stack
        });
    }
};

export const getChatById = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId).populate('participants messages');
        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: `Failed to retrieve chat: ${error.message}` });
    }
};

export const checkChatExists = async (req, res) => {
    try {
        const chat = await Chat.findOne({ name: req.params.chatName });
        if (!chat) {
            res.status(404).json({ exists: false, message: "Chat not found" });
        } else {
            res.json({ exists: true, chatId: chat._id, message: "Chat exists" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const sendMessage = async (req, res) => {
    const { chatName, message } = req.body;
    const senderId = req.user._id;

    try {
        let chat = await Chat.findOne({ name: chatName });
        if (!chat) {
            console.log(`Chat not found with name: ${chatName}`);
            return res.status(404).json({ message: 'Chat not found' });
        }

        if (!chat.participants.includes(senderId)) {
            chat.participants.push(senderId);
            await chat.save();
        }

        chat.messages.push({
            sender: senderId,
            message: message,
            timestamp: new Date()
        });

        await chat.save();
        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error(`Error sending message: ${error}`);
        res.status(500).json({ message: 'Error sending message', error: error.message });
    }
};