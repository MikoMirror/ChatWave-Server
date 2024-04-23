import jwt from 'jsonwebtoken';
import Chat from './models/chat.js';
import User from './models/user.js';

const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('createChat', async (data) => handleCreateChat(socket, data));
        socket.on('deleteChat', async (data) => handleDeleteChat(socket, data));
        socket.on('joinChat', async (data) => handleJoinChat(socket, data));

        socket.use((packet, next) => authenticateSocket(socket, next));
    });
};

const authenticateSocket = (socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            next();
        } catch (error) {
            next(new Error("Authentication error"));
        }
    } else {
        next(new Error("No token provided"));
    }
};

const handleCreateChat = async (socket, data) => {
    const { name, token, otherUsername } = data;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        const otherUser = await User.findOne({ username: otherUsername });

        if (!otherUser) {
            socket.emit('error', `No user found with username: ${otherUsername}`);
            return;
        }

        const newChat = new Chat({
            name,
            participants: [userId, otherUser._id],
            messages: []
        });
        await newChat.save();
        socket.join(newChat._id.toString());
        socket.to(otherUser._id.toString()).join(newChat._id.toString());
        io.to(newChat._id.toString()).emit('chatCreated', { chat: newChat });
    } catch (error) {
        console.log(error);
        socket.emit('error', 'Failed to create chat due to unexpected error.');
    }
};

const handleDeleteChat = async (socket, data) => {
    const { chatName, token } = data;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        const chat = await Chat.findOne({ name: chatName });

        if (!chat) {
            socket.emit('error', 'Chat not found.');
            return;
        }

        await Chat.deleteOne({ _id: chat._id });
        io.emit('chatDeleted', { chatId: chat._id, message: 'Chat deleted successfully.' });
    } catch (error) {
        console.log(error);
        socket.emit('error', 'Failed to delete chat due to an unexpected error.');
    }
};

const handleJoinChat = async (socket, data) => {
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
};

export default socketHandler;