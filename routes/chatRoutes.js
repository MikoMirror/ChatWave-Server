import express from 'express';
import Chat from '../models/chat.js';
import { getChats, createChat, getChatById, checkChatExists, sendMessage } from '../controllers/chatController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();
router.use(express.json());

router.get('/', verifyToken, getChats);
router.post('/', verifyToken, createChat);
router.get('/:chatId', verifyToken, getChatById);
router.get('/exists/:chatName', verifyToken, checkChatExists);
router.post('/messages', verifyToken, sendMessage);
router.post('/create', verifyToken, createChat);

export default router;