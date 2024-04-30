import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import Chat from '../models/chat.js';

const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);
        socket.on('deleteChat', async (data) => handleDeleteChat(socket, data));
        socket.on('joinChat', async (data) => handleJoinChat(socket, data));
        socket.on('createChat', async ({ chatName, anotherUsername, token }) => {
            console.log('Received createChat event:', { chatName, anotherUsername });

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const newChat = await createChatInDatabase({
                    chatName,
                    anotherUsername,
                    userId: decoded.userId
                });

                console.log('Chat created successfully:', newChat);
                socket.emit('chat_created', { message: 'Chat created successfully!', chatId: newChat._id });
               

            } catch (error) {
                console.error('Error creating chat:', error);
                socket.emit('error', 'Failed to create chat.');
            }
        });
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

const createChatInDatabase = async ({ chatName, anotherUsername, userId }) => {
    const user2 = await User.findOne({ username: anotherUsername });

    if (!user2) {
        throw new Error('The specified user does not exist.');
    }

    const newChat = new Chat({
        name: chatName,
        participants: [userId, user2._id]
    });

    await newChat.save();
    return newChat;
};

export default socketHandler;