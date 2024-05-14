import express from 'express';
import Chat from '../models/Chat.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/create', async (req, res) => {
    try {
        const { name, participantIds } = req.body;

        const validParticipants = await User.find({ _id: { $in: participantIds } });
        if (validParticipants.length !== participantIds.length) {
            return res.status(400).json({ message: 'Invalid participant IDs' });
        }

        const newChat = new Chat({
            name,
            participants: validParticipants.map(user => user._id) 
        });
        await newChat.save();
        res.status(201).json({ message: 'Chat created successfully', chat: newChat }); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message }); 
    }
});
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'username'); 
    res.status(200).json({ chats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;