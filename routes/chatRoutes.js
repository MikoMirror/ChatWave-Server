import express from 'express';
const router = express.Router();

router.get('/chats', (req, res) => {
    res.json({ message: 'List of chats' });
});

export default router;