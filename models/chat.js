import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  name: { type: String, required: true },  // This is the new field for the chat name
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  created_at: { type: Date, default: Date.now },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }]
});

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;