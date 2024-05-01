import express from 'express';
import { register, login as loginControllerMethod , getUserChats, logout } from '../controllers/userController.js'; 
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', loginControllerMethod);
router.get('/chats', verifyToken, getUserChats);
router.post('/logout', logout); 

export default router;