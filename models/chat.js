import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    name: { type: String, required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: String,
        timestamp: Date
    }]
});

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;  