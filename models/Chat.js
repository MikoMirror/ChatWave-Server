import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages: [{ 
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    timestamp: { type: Date, default: Date.now } 
  }]
});

const Chat = mongoose.model('Chat', chatSchema, 'chats');
export default Chat;